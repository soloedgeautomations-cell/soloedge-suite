/**
 * Riley Voice Handler — OpenAI Realtime API (WebSocket)
 *
 * Architecture:
 *   POST /api/incoming-call   — Twilio webhook, returns TwiML to open a media stream
 *   GET  /api/voice-health    — Health check: verifies env vars, WSS URL, OpenAI key
 *   WS   /api/media-stream    — Twilio media stream ↔ OpenAI Realtime bridge
 *
 * Riley speaks live audio via OpenAI Realtime API (gpt-4o-realtime-preview).
 * No text-to-speech. No TwiML Say. Real-time bidirectional audio.
 *
 * Post-call: transcript is accumulated, LLM generates a structured lead summary,
 * and the report is sent to Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID).
 *
 * ── DIAGNOSTIC LOGGING ──────────────────────────────────────────────────────────
 * Every stage of the pipeline emits a [VOICE:STAGE] log line so you can pinpoint
 * exactly where a failure occurs in production logs:
 *
 *   [VOICE:1-WEBHOOK]   — /api/incoming-call was hit by Twilio
 *   [VOICE:2-TWIML]     — TwiML returned to Twilio (includes the WSS URL)
 *   [VOICE:3-WS-CONN]   — Twilio WebSocket connected to /api/media-stream
 *   [VOICE:4-OPENAI]    — OpenAI Realtime WebSocket opened / failed
 *   [VOICE:5-SESSION]   — OpenAI session configured
 *   [VOICE:6-STREAM]    — Twilio stream started (streamSid received)
 *   [VOICE:7-GREETING]  — Initial greeting sent to OpenAI
 *   [VOICE:8-AUDIO]     — First audio delta received from OpenAI → sent to Twilio
 *   [VOICE:ERR]         — Any error at any stage
 */

import { Router, Request, Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { RILEY_VOICE_PROMPT } from "./prompts/riley";
import { invokeLLM } from "./_core/llm";
import { claudeReason } from "./_core/claudeReason";

export const voiceRouter = Router();

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
const REALTIME_URL = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`;

// ─── Resolve the public WSS base URL once at startup ─────────────────────────
// This is the URL Twilio will connect to for the media stream.
// It MUST be the public hostname — never localhost.
function resolveWssBase(req?: Request): string {
  // 1. APP_BASE_URL is the most reliable — set explicitly in deployment secrets
  const appBase = (process.env.APP_BASE_URL ?? "").replace(/\/+$/, "");
  if (appBase) {
    return appBase
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://");
  }

  // 2. x-forwarded-host set by reverse proxies (Railway, Render, Nginx, etc.)
  if (req) {
    const fwdHost = req.headers["x-forwarded-host"] as string | undefined;
    const fwdProto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
    if (fwdHost) {
      return `${fwdProto === "https" ? "wss" : "ws"}://${fwdHost}`;
    }

    // 3. req.headers.host — last resort (may be internal behind a proxy)
    const host = req.headers.host ?? "";
    return `wss://${host}`;
  }

  return "wss://soloedge.app"; // absolute fallback
}

// ─── Resolve OpenAI API key ───────────────────────────────────────────────────
function resolveOpenAiKey(): string {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.BUILT_IN_FORGE_API_KEY ||
    ""
  );
}

// ─── Startup diagnostics ─────────────────────────────────────────────────────
const startupWssBase = resolveWssBase();
const startupOpenAiKey = resolveOpenAiKey();

console.log("[VOICE:STARTUP] ─────────────────────────────────────────────");
console.log(`[VOICE:STARTUP] APP_BASE_URL         = ${process.env.APP_BASE_URL ?? "(not set)"}`);
console.log(`[VOICE:STARTUP] Resolved WSS base    = ${startupWssBase}`);
console.log(`[VOICE:STARTUP] Media stream URL     = ${startupWssBase}/api/media-stream`);
console.log(`[VOICE:STARTUP] OpenAI key source    = ${
  process.env.OPENAI_API_KEY
    ? "OPENAI_API_KEY"
    : process.env.BUILT_IN_FORGE_API_KEY
    ? "BUILT_IN_FORGE_API_KEY"
    : "MISSING — Riley CANNOT answer calls"
}`);
console.log(`[VOICE:STARTUP] OpenAI key prefix    = ${startupOpenAiKey ? startupOpenAiKey.slice(0, 8) + "..." : "(none)"}`);
console.log(`[VOICE:STARTUP] Realtime model       = ${REALTIME_MODEL}`);
console.log("[VOICE:STARTUP] ─────────────────────────────────────────────");

// ─── Health check endpoint ────────────────────────────────────────────────────
// GET /api/voice-health — call this from a browser to verify the pipeline config
voiceRouter.get("/voice-health", (_req: Request, res: Response) => {
  const openAiKey = resolveOpenAiKey();
  const wssBase = resolveWssBase(_req);
  const checks = {
    APP_BASE_URL: process.env.APP_BASE_URL ?? "(not set — will use x-forwarded-host or req.host)",
    resolved_wss_base: wssBase,
    media_stream_url: `${wssBase}/api/media-stream`,
    openai_key_present: !!openAiKey,
    openai_key_source: process.env.OPENAI_API_KEY
      ? "OPENAI_API_KEY"
      : process.env.BUILT_IN_FORGE_API_KEY
      ? "BUILT_IN_FORGE_API_KEY"
      : "MISSING",
    openai_key_prefix: openAiKey ? openAiKey.slice(0, 8) + "..." : "(none)",
    twilio_account_sid: process.env.TWILIO_ACCOUNT_SID
      ? process.env.TWILIO_ACCOUNT_SID.slice(0, 6) + "..."
      : "(not set)",
    twilio_auth_token_present: !!process.env.TWILIO_AUTH_TOKEN,
    realtime_model: REALTIME_MODEL,
    status: openAiKey ? "OK" : "ERROR: missing OpenAI key",
  };
  res.json(checks);
});

// ─── Telegram helper ──────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) {
    console.log("[voice] Telegram alert skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.log("[voice] Telegram send failed", err);
    } else {
      console.log("[voice] Telegram alert sent");
    }
  } catch (err) {
    console.log("[voice] Telegram send error", err);
  }
}

// ─── LLM call summary ─────────────────────────────────────────────────────────

interface LeadSummary {
  jobType: string;
  location: string;
  customerPhone: string;
  description: string;
  suggestedAction: string;
  languageDetected: string;
  englishSummary: string;
  spanishSummary: string;
  rawTranscript: string;
}

function safeText(value: unknown, fallback = "Unknown"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

async function buildLeadSummary(
  transcriptLines: string[],
  callerNumber: string,
  language: string
): Promise<LeadSummary> {
  const transcriptText = transcriptLines
    .map((line, i) => `${i + 1}. ${line}`)
    .join("\n");

  const systemPrompt = `You are extracting a call summary from a real phone call transcript to SoloEdge AI Automations.

Return only one valid JSON object with this exact schema:
{
  "job_type": string,
  "location": string,
  "customer_phone": string,
  "description": string,
  "suggested_action": string,
  "language_detected": string,
  "english_summary": string
}

CRITICAL RULES — FOLLOW EXACTLY:
- NEVER invent, fabricate, or guess any information not explicitly stated in the transcript.
- NEVER use example names like "John Smith", "Ashley", or placeholder numbers like "555-1234".
- If the caller did not say their name, use "Unknown" for name-related fields.
- If the caller did not give a phone number in the conversation, use the Twilio caller number provided, or "Unknown".
- If the caller did not state a location, use "Unknown" — never guess a city.
- Only extract what was ACTUALLY SAID in the transcript. Nothing else.
- If the transcript is empty or very short, say so honestly in the description.
- "language_detected" must be "English", "Spanish", "Chinese", or "Unknown".
- "job_type" may be: demo request, communication system inquiry, scheduling inquiry, email support inquiry, roofing, plumbing, HVAC, electrical, remodeling, general construction, quote request, or other.
- "suggested_action" should be practical based only on what was actually discussed.
- "english_summary" must summarize only what actually happened in the call.
- Always return valid JSON only. No markdown.`;

  const userContent = `Caller phone from Twilio: ${safeText(callerNumber)}
Detected language: ${safeText(language)}

Caller transcript lines:
${transcriptText || "No transcript captured."}`;

  try {
    // Use Claude for complex calls (10+ lines or non-English), GPT-4o-mini for simple ones
    const reasonResult = await claudeReason({
      systemPrompt,
      userContent,
      transcriptLineCount: transcriptLines.length,
      language,
    });
    console.log(`[voice] Lead summary via ${reasonResult.model} (claude: ${reasonResult.usedClaude})`);
    const parsed = JSON.parse(reasonResult.content);

    return {
      jobType: safeText(parsed.job_type),
      location: safeText(parsed.location),
      customerPhone: safeText(parsed.customer_phone, safeText(callerNumber)),
      description: safeText(parsed.description),
      suggestedAction: safeText(parsed.suggested_action),
      languageDetected: safeText(parsed.language_detected, safeText(language)),
      englishSummary: safeText(parsed.english_summary),
      spanishSummary: "",
      rawTranscript: transcriptText || "No transcript captured.",
    };
  } catch (err) {
    console.log("[voice] Lead summary generation failed", err);
    const fallback = transcriptLines.length > 0
      ? transcriptLines.join(" ").slice(0, 500)
      : "Caller contacted the SoloEdge AI receptionist.";

    return {
      jobType: "Demo or inquiry",
      location: "Unknown",
      customerPhone: safeText(callerNumber),
      description: fallback,
      suggestedAction: "Return call or follow up to schedule a demo.",
      languageDetected: safeText(language),
      englishSummary: fallback,
      spanishSummary: "",
      rawTranscript: transcriptLines.join("\n") || "No transcript captured.",
    };
  }
}

function formatTelegramReport(lead: LeadSummary, callerNumber: string): string {
  const hasTranscript = lead.rawTranscript && lead.rawTranscript !== "No transcript captured.";
  const transcriptSection = hasTranscript
    ? `\n\n📝 <b>Full Transcript:</b>\n<i>${lead.rawTranscript.slice(0, 2500)}</i>`
    : "\n\n<i>⚠️ No transcript captured — caller may have hung up before Riley could respond.</i>";

  return [
    "📞 <b>NEW CALL — SoloEdge Riley</b>",
    "",
    `🔧 <b>Type:</b> ${lead.jobType}`,
    `📍 <b>Location:</b> ${lead.location}`,
    `📱 <b>Caller:</b> ${lead.customerPhone || callerNumber}`,
    `🌐 <b>Language:</b> ${lead.languageDetected}`,
    "",
    `📋 <b>What Happened:</b>\n${lead.description}`,
    "",
    `✅ <b>Suggested Action:</b>\n${lead.suggestedAction}`,
    "",
    `💬 <b>Summary:</b>\n${lead.englishSummary}`,
    transcriptSection,
  ].join("\n");
}

// ─── /api/incoming-call ───────────────────────────────────────────────────────
// STAGE 1: Twilio hits this endpoint when someone calls the Riley number.
// We return TwiML that tells Twilio to open a bidirectional media stream.

voiceRouter.all("/incoming-call", (req: Request, res: Response) => {
  const callerNumber = (req.body?.From || req.query?.From || "unknown") as string;
  const callSid      = (req.body?.CallSid || req.query?.CallSid || "unknown") as string;
  const streamCallerValue = callerNumber.replace(/[^+\d]/g, "");

  // ── STAGE 1 LOG ──────────────────────────────────────────────────────────────
  console.log("[VOICE:1-WEBHOOK] ══════════════════════════════════════════");
  console.log(`[VOICE:1-WEBHOOK] Twilio hit /api/incoming-call`);
  console.log(`[VOICE:1-WEBHOOK] CallSid     = ${callSid}`);
  console.log(`[VOICE:1-WEBHOOK] From        = ${callerNumber}`);
  console.log(`[VOICE:1-WEBHOOK] To          = ${req.body?.To || req.query?.To || "unknown"}`);
  console.log(`[VOICE:1-WEBHOOK] req.host    = ${req.headers.host ?? "(none)"}`);
  console.log(`[VOICE:1-WEBHOOK] x-fwd-host  = ${req.headers["x-forwarded-host"] ?? "(none)"}`);
  console.log(`[VOICE:1-WEBHOOK] x-fwd-proto = ${req.headers["x-forwarded-proto"] ?? "(none)"}`);

  const wssBase = resolveWssBase(req);
  const streamUrl = `${wssBase}/api/media-stream`;

  console.log(`[VOICE:1-WEBHOOK] Resolved WSS base = ${wssBase}`);
  console.log(`[VOICE:1-WEBHOOK] Stream URL         = ${streamUrl}`);

  // ── STAGE 2: Build and return TwiML ─────────────────────────────────────────
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="from" value="${streamCallerValue}" />
    </Stream>
  </Connect>
</Response>`;

  console.log("[VOICE:2-TWIML] Returning TwiML:");
  console.log(twiml);
  console.log("[VOICE:2-TWIML] Content-Type: text/xml");

  res.setHeader("Content-Type", "text/xml");
  res.send(twiml);
});

// ─── WebSocket Server for /api/media-stream ───────────────────────────────────
// STAGE 3+: Twilio opens a WebSocket here after receiving the TwiML above.

export const mediaStreamWss = new WebSocketServer({ noServer: true });

mediaStreamWss.on("connection", (twilioSocket: WebSocket) => {
  const log = (stage: string, msg: string, data?: unknown) => {
    if (data !== undefined) {
      console.log(`[VOICE:${stage}] ${msg}`, JSON.stringify(data));
    } else {
      console.log(`[VOICE:${stage}] ${msg}`);
    }
  };

  let streamSid: string | null = null;
  let callerNumber = "Unknown";
  let openAiReady = false;
  let sessionReady = false;
  let greetingSent = false;
  let responseInProgress = false;
  let languageChoiceResolved = false;
  let languageFollowupSent = false;
  let languageFollowupTimer: ReturnType<typeof setTimeout> | null = null;
  let notificationsSent = false;
  let detectedLanguage = "Unknown";
  let firstAudioSent = false;

  // Transcript accumulation — captures everything the caller says
  const transcriptLines: string[] = [];

  log("3-WS-CONN", "══════════════════════════════════════════");
  log("3-WS-CONN", "Twilio WebSocket connected to /api/media-stream");
  log("3-WS-CONN", `Active connections: ${mediaStreamWss.clients.size}`);

  // ── STAGE 4: Connect to OpenAI Realtime ─────────────────────────────────────
  const openAiKey = resolveOpenAiKey();
  if (!openAiKey) {
    log("ERR", "CRITICAL — No OpenAI API key. OPENAI_API_KEY and BUILT_IN_FORGE_API_KEY are both unset. Riley cannot speak.");
  } else {
    log("4-OPENAI", `Connecting to OpenAI Realtime — model: ${REALTIME_MODEL}`);
    log("4-OPENAI", `Key prefix: ${openAiKey.slice(0, 8)}...`);
    log("4-OPENAI", `URL: ${REALTIME_URL}`);
  }

  const openAiWs = new WebSocket(REALTIME_URL, {
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function clearLanguageFollowupTimer() {
    if (languageFollowupTimer) {
      clearTimeout(languageFollowupTimer);
      languageFollowupTimer = null;
    }
  }

  function scheduleLanguageFollowup() {
    clearLanguageFollowupTimer();
    languageFollowupTimer = setTimeout(() => {
      if (!languageChoiceResolved && !languageFollowupSent && openAiWs.readyState === WebSocket.OPEN) {
        languageFollowupSent = true;
        sendToOpenAI(
          {
            type: "response.create",
            response: {
              instructions: 'Quick and warm. Say exactly: "Still there? English, Spanish, or Chinese?" Then stop and wait.',
            },
          },
          "language follow-up"
        );
      }
    }, 8000);
  }

  function sendToOpenAI(event: object, label = "event") {
    if (openAiWs.readyState !== WebSocket.OPEN) {
      log("ERR", `sendToOpenAI called but WS not open (state=${openAiWs.readyState}) — label: ${label}`);
      return;
    }
    log("4-OPENAI", `→ sending [${label}]`, { type: (event as { type: string }).type });
    openAiWs.send(JSON.stringify(event));
  }

  function sendTwilioAudio(base64Audio: string) {
    if (!streamSid || !base64Audio) return;
    if (!firstAudioSent) {
      firstAudioSent = true;
      log("8-AUDIO", "First audio delta from OpenAI → forwarding to Twilio ✓");
    }
    twilioSocket.send(
      JSON.stringify({
        event: "media",
        streamSid,
        media: { payload: base64Audio },
      })
    );
  }

  function clearTwilioBuffer() {
    if (!streamSid) return;
    twilioSocket.send(JSON.stringify({ event: "clear", streamSid }));
  }

  function sendSessionUpdate() {
    log("5-SESSION", "Sending session.update to OpenAI");
    sendToOpenAI(
      {
        type: "session.update",
        session: {
          instructions: RILEY_VOICE_PROMPT,
          input_audio_format: "g711_ulaw",
          output_audio_format: "g711_ulaw",
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 700,
            create_response: true,
          },
          voice: "shimmer",
          modalities: ["text", "audio"],
          temperature: 0.9,
          speed: 1.15,
        },
      },
      "session.update"
    );
  }

  function maybeSendInitialGreeting() {
    log("7-GREETING", `maybeSendInitialGreeting check — openAiReady=${openAiReady} sessionReady=${sessionReady} streamSid=${streamSid} greetingSent=${greetingSent}`);
    if (!openAiReady || !sessionReady || !streamSid || greetingSent) return;
    greetingSent = true;
    log("7-GREETING", "Sending initial greeting to OpenAI ✓");
    sendToOpenAI(
      {
        type: "response.create",
        response: {
          instructions:
            'Speak warm, natural, and Texan — like a real person who picked up the phone and is genuinely glad you called. Friendly but not fake. Cool but not cold. Say something like: "Hey, you\'ve reached SoloEdge — Riley here. How can I help ya?" or "SoloEdge Automations, this is Riley — what can I do for ya today?" Keep it short, warm, and real. Mention SoloEdge. Sound like a Texan who knows what they\'re doing. Then stop and listen. Do not sound like a recording. Do not say a long intro. Do not ask about language first — just greet them naturally and let them tell you what they need.',
        },
      },
      "initial greeting"
    );
    scheduleLanguageFollowup();
  }

  // ─── Post-call: send Telegram summary ────────────────────────────────────────

  async function finalizeNotifications(reason = "call ended") {
    if (notificationsSent) return;
    notificationsSent = true;
    clearLanguageFollowupTimer();

    log("POST-CALL", `Finalizing — reason: ${reason} | transcript lines: ${transcriptLines.length} | caller: ${callerNumber}`);

    try {
      const lead = await buildLeadSummary(transcriptLines, callerNumber, detectedLanguage);

      // ── Telegram is sent ONLY by n8n ("New Call Log — SoloEdge Riley").
      // Do NOT call sendTelegram() here — that creates a duplicate alert.
      // n8n handles: Telegram notification + Google Calendar + Google Sheets.

      // Fire n8n Agent Router — flat payload (no double-nesting)
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) {
        const n8nPayload = {
          caller_name: lead.customerPhone !== "Unknown" ? lead.customerPhone : callerNumber,
          caller_phone: lead.customerPhone || callerNumber,
          summary: lead.englishSummary,
          description: lead.description,
          suggested_action: lead.suggestedAction,
          language: lead.languageDetected,
          job_type: lead.jobType,
          timestamp: new Date().toISOString(),
          duration: transcriptLines.length,
          source: "riley_voice_call",
        };
        fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
        }).then(() => log("POST-CALL", "✓ n8n Agent Router notified"))
          .catch((e: Error) => log("ERR", `n8n notify failed: ${e.message}`));
      } else {
        // Fallback: if n8n is not configured, send Telegram directly
        const message = formatTelegramReport(lead, callerNumber);
        await sendTelegram(message);
        log("POST-CALL", "⚠️ n8n not configured — sent Telegram directly (fallback)");
      }
    } catch (err) {
      log("ERR", `Post-call notification failed: ${(err as Error).message}`);
    }
  }

  // ─── OpenAI events ───────────────────────────────────────────────────────────

  openAiWs.on("open", () => {
    log("4-OPENAI", "✓ Connected to OpenAI Realtime successfully");
    openAiReady = true;
    sendSessionUpdate();
  });

  openAiWs.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "session.created") {
        log("5-SESSION", "OpenAI session.created received");
      }

      if (msg.type === "session.updated") {
        sessionReady = true;
        log("5-SESSION", "✓ OpenAI session.updated — Riley is ready to speak");
        maybeSendInitialGreeting();
      }

      if (msg.type === "response.created") {
        responseInProgress = true;
        log("4-OPENAI", "response.created — Riley is generating a response");
      }

      if (msg.type === "input_audio_buffer.speech_started") {
        clearLanguageFollowupTimer();
        if (responseInProgress) {
          log("4-OPENAI", "Barge-in detected — cancelling current response");
          sendToOpenAI({ type: "response.cancel" }, "cancel on barge-in");
          clearTwilioBuffer();
        }
      }

      // Accumulate caller transcript lines (what the caller said)
      if (
        msg.type === "conversation.item.input_audio_transcription.completed" &&
        msg.transcript
      ) {
        transcriptLines.push(`Caller: ${msg.transcript}`);
        log("4-OPENAI", `Transcript captured: "${msg.transcript}"`);

        const t = msg.transcript.toLowerCase();

        // Detect language from transcript
        if (t.includes("english") || t.includes("hello") || t.includes("help") ||
            t.includes("service") || t.includes("roof") || t.includes("plumbing")) {
          languageChoiceResolved = true;
          detectedLanguage = "English";
          clearLanguageFollowupTimer();
        } else if (t.includes("español") || t.includes("hola") || t.includes("gracias") ||
                   t.includes("necesito") || t.includes("ayuda")) {
          languageChoiceResolved = true;
          detectedLanguage = "Spanish";
          clearLanguageFollowupTimer();
        } else if (/[\u4e00-\u9fff]/.test(msg.transcript)) {
          languageChoiceResolved = true;
          detectedLanguage = "Chinese";
          clearLanguageFollowupTimer();
        }
      }

      if (msg.type === "response.audio.delta" && msg.delta && streamSid) {
        sendTwilioAudio(msg.delta);
      }

      // Capture Riley's responses too so LLM has full conversation context
      if (msg.type === "response.done" && msg.response?.output) {
        responseInProgress = false;
        for (const item of msg.response.output) {
          if (item.type === "message" && item.role === "assistant") {
            for (const part of (item.content || [])) {
              if (part.type === "text" && part.text) {
                transcriptLines.push(`Riley: ${part.text}`);
              } else if (part.type === "audio" && part.transcript) {
                transcriptLines.push(`Riley: ${part.transcript}`);
              }
            }
          }
        }
      } else if (msg.type === "response.done") {
        responseInProgress = false;
      }

      if (msg.type === "error") {
        log("ERR", `OpenAI Realtime error: ${JSON.stringify(msg)}`);
      }
    } catch (err) {
      log("ERR", `Error parsing OpenAI message: ${(err as Error).message}`);
    }
  });

  openAiWs.on("close", (code: number, reason: Buffer) => {
    log("4-OPENAI", `Disconnected from OpenAI Realtime — code: ${code} reason: ${reason.toString() || "(none)"}`);
    finalizeNotifications("openai closed");
  });

  openAiWs.on("error", (err: Error) => {
    log("ERR", `OpenAI WebSocket error: ${err.message}`);
    // Common errors:
    // - 401 Unauthorized → OPENAI_API_KEY is wrong or missing
    // - ECONNREFUSED     → network issue
    // - 503              → OpenAI Realtime API is down
  });

  // ─── Twilio media stream events ──────────────────────────────────────────────

  twilioSocket.on("message", (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.event) {
        case "connected":
          log("3-WS-CONN", "Twilio 'connected' event received");
          break;

        case "start":
          streamSid = data.start?.streamSid || null;
          callerNumber =
            data.start?.customParameters?.from ||
            data.start?.from ||
            callerNumber;
          log("6-STREAM", "══════════════════════════════════════════");
          log("6-STREAM", `✓ Twilio stream started`);
          log("6-STREAM", `  streamSid    = ${streamSid}`);
          log("6-STREAM", `  callerNumber = ${callerNumber}`);
          log("6-STREAM", `  openAiReady  = ${openAiReady}`);
          log("6-STREAM", `  sessionReady = ${sessionReady}`);
          maybeSendInitialGreeting();
          break;

        case "media":
          if (openAiReady && sessionReady && openAiWs.readyState === WebSocket.OPEN) {
            sendToOpenAI({
              type: "input_audio_buffer.append",
              audio: data.media.payload,
            });
          }
          break;

        case "stop":
          log("6-STREAM", `Twilio stream stopped — streamSid: ${streamSid}`);
          finalizeNotifications("twilio stop");
          if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
          break;

        default:
          break;
      }
    } catch (err) {
      log("ERR", `Error parsing Twilio message: ${(err as Error).message}`);
    }
  });

  twilioSocket.on("close", () => {
    log("3-WS-CONN", `Twilio WebSocket closed — streamSid: ${streamSid}`);
    finalizeNotifications("twilio disconnected");
    if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
  });

  twilioSocket.on("error", (err: Error) => {
    log("ERR", `Twilio WebSocket error: ${err.message}`);
  });
});
