/**
 * Riley Voice Handler — OpenAI Realtime API (WebSocket)
 *
 * Architecture matches the original Replit server.js exactly:
 *   POST /api/incoming-call  — Twilio webhook, returns TwiML to open a media stream
 *   WS   /api/media-stream   — Twilio media stream ↔ OpenAI Realtime bridge
 *
 * Riley speaks live audio via OpenAI Realtime API (gpt-4o-realtime-preview).
 * No text-to-speech. No TwiML Say. Real-time bidirectional audio.
 *
 * Post-call: transcript is accumulated, LLM generates a structured lead summary,
 * and the report is sent to Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID).
 */

import { Router, Request, Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { RILEY_VOICE_PROMPT } from "./prompts/riley";
import { invokeLLM } from "./_core/llm";

export const voiceRouter = Router();

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
const REALTIME_URL = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`;

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
  "english_summary": string,
  "spanish_summary": string
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
- "spanish_summary" must be the Spanish equivalent of the english_summary.
- Always return valid JSON only. No markdown.`;

  const userContent = `Caller phone from Twilio: ${safeText(callerNumber)}
Detected language: ${safeText(language)}

Caller transcript lines:
${transcriptText || "No transcript captured."}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              job_type: { type: "string" },
              location: { type: "string" },
              customer_phone: { type: "string" },
              description: { type: "string" },
              suggested_action: { type: "string" },
              language_detected: { type: "string" },
              english_summary: { type: "string" },
              spanish_summary: { type: "string" },
            },
            required: ["job_type", "location", "customer_phone", "description", "suggested_action", "language_detected", "english_summary", "spanish_summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    return {
      jobType: safeText(parsed.job_type),
      location: safeText(parsed.location),
      customerPhone: safeText(parsed.customer_phone, safeText(callerNumber)),
      description: safeText(parsed.description),
      suggestedAction: safeText(parsed.suggested_action),
      languageDetected: safeText(parsed.language_detected, safeText(language)),
      englishSummary: safeText(parsed.english_summary),
      spanishSummary: safeText(parsed.spanish_summary),
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
      spanishSummary: "La persona llamó al demo de recepcionista con IA de SoloEdge. Se necesita seguimiento.",
      rawTranscript: transcriptLines.join("\n") || "No transcript captured.",
    };
  }
}

function formatTelegramReport(lead: LeadSummary, callerNumber: string): string {
  const rawSection = lead.rawTranscript && lead.rawTranscript !== "No transcript captured."
    ? `\n\n<b>📝 Raw Transcript:</b>\n${lead.rawTranscript.slice(0, 2000)}`
    : "\n\n<i>No transcript captured — caller may have hung up quickly.</i>";

  return [
    "📞 <b>NEW CALL SUMMARY</b>",
    "Source: SoloEdge AI Receptionist",
    "",
    `<b>Type:</b> ${lead.jobType}`,
    `<b>Location:</b> ${lead.location}`,
    `<b>Caller Phone:</b> ${lead.customerPhone || callerNumber}`,
    `<b>Language:</b> ${lead.languageDetected}`,
    "",
    "<b>Description:</b>",
    lead.description,
    "",
    "<b>Suggested Action:</b>",
    lead.suggestedAction,
    "",
    "<b>English Summary:</b>",
    lead.englishSummary,
    "",
    "<b>Spanish Summary:</b>",
    lead.spanishSummary,
    rawSection,
  ].join("\n");
}

// ─── /api/incoming-call ───────────────────────────────────────────────────────
// Twilio calls this when someone dials (737) 259-5692.
// We return TwiML that opens a media stream back to /api/media-stream.

voiceRouter.all("/incoming-call", (req: Request, res: Response) => {
  const callerNumber = (req.body?.From || req.query?.From || "") as string;
  const streamCallerValue = callerNumber.replace(/[^+\d]/g, "");

  // Build the WebSocket base URL.
  // Priority order:
  //   1. APP_BASE_URL env var (most reliable — set explicitly in deployment)
  //   2. x-forwarded-host header (set by reverse proxies like Nginx/Railway/Render)
  //   3. req.headers.host (fallback — may be internal hostname behind a proxy)
  //
  // We MUST use the public hostname here because Twilio connects to this URL
  // from the public internet. Using localhost or an internal IP will cause
  // the media stream to fail silently (Riley connects but never speaks).
  const appBaseUrl = (process.env.APP_BASE_URL ?? "").replace(/\/+$/, "");
  let wsBase: string;
  if (appBaseUrl) {
    // Convert https:// → wss://, http:// → ws://
    wsBase = appBaseUrl.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
  } else {
    const forwardedHost = req.headers["x-forwarded-host"] as string | undefined;
    const host = forwardedHost || req.headers.host || "";
    const proto = (req.headers["x-forwarded-proto"] as string | undefined) || "https";
    wsBase = `${proto === "https" ? "wss" : "ws"}://${host}`;
  }

  console.log(`[voice] /incoming-call from ${callerNumber} — stream URL: ${wsBase}/api/media-stream`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <Stream url="${wsBase}/api/media-stream">
      <Parameter name="from" value="${streamCallerValue}" />
    </Stream>
  </Connect>
</Response>`;

  res.setHeader("Content-Type", "text/xml");
  res.send(twiml);
});

// ─── WebSocket Server for /api/media-stream ───────────────────────────────────

export const mediaStreamWss = new WebSocketServer({ noServer: true });

mediaStreamWss.on("connection", (twilioSocket: WebSocket) => {
  const log = (msg: string, data?: unknown) => {
    if (data !== undefined) {
      console.log(`[voice] ${msg}`, JSON.stringify(data));
    } else {
      console.log(`[voice] ${msg}`);
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

  // Transcript accumulation — captures everything the caller says
  const transcriptLines: string[] = [];

  // ─── OpenAI Realtime connection ─────────────────────────────────────────────
  // Use OPENAI_API_KEY if set directly; otherwise fall back to BUILT_IN_FORGE_API_KEY
  // (the platform-injected key used by the rest of the server).
  const openAiKey = process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY || "";
  if (!openAiKey) {
    console.error("[voice] CRITICAL: No OpenAI API key found — OPENAI_API_KEY and BUILT_IN_FORGE_API_KEY are both unset. Riley cannot answer calls.");
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
    if (openAiWs.readyState !== WebSocket.OPEN) return;
    log(`→ OpenAI [${label}]`, { type: (event as { type: string }).type });
    openAiWs.send(JSON.stringify(event));
  }

  function sendTwilioAudio(base64Audio: string) {
    if (!streamSid || !base64Audio) return;
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
    if (!openAiReady || !sessionReady || !streamSid || greetingSent) return;
    greetingSent = true;
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

    log("Finalizing post-call notifications", { reason, transcriptLines: transcriptLines.length, callerNumber });

    try {
      const lead = await buildLeadSummary(transcriptLines, callerNumber, detectedLanguage);
      const message = formatTelegramReport(lead, callerNumber);
      await sendTelegram(message);
    } catch (err) {
      log("Post-call notification failed", err);
    }
  }

  // ─── OpenAI events ───────────────────────────────────────────────────────────

  openAiWs.on("open", () => {
    log("Connected to OpenAI Realtime", { model: REALTIME_MODEL });
    openAiReady = true;
    sendSessionUpdate();
  });

  openAiWs.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "session.updated") {
        sessionReady = true;
        log("OpenAI session ready");
        maybeSendInitialGreeting();
      }

      if (msg.type === "response.created") {
        responseInProgress = true;
      }

      if (msg.type === "input_audio_buffer.speech_started") {
        clearLanguageFollowupTimer();
        if (responseInProgress) {
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
        log("Transcript line captured", { line: msg.transcript });

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
        log("OpenAI error", msg);
      }
    } catch (err) {
      log("Error parsing OpenAI message", err);
    }
  });

  openAiWs.on("close", (code: number) => {
    log("Disconnected from OpenAI Realtime", { code });
    finalizeNotifications("openai closed");
  });

  openAiWs.on("error", (err: Error) => {
    log("OpenAI WebSocket error", { message: err.message });
  });

  // ─── Twilio media stream events ──────────────────────────────────────────────

  twilioSocket.on("message", (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.event) {
        case "connected":
          log("Twilio media stream connected");
          break;

        case "start":
          streamSid = data.start?.streamSid || null;
          callerNumber =
            data.start?.customParameters?.from ||
            data.start?.from ||
            callerNumber;
          log("Twilio stream started", { streamSid, callerNumber });
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
          log("Twilio stream stopped", { streamSid });
          finalizeNotifications("twilio stop");
          if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
          break;

        default:
          break;
      }
    } catch (err) {
      log("Error parsing Twilio message", err);
    }
  });

  twilioSocket.on("close", () => {
    log("Twilio WebSocket closed", { streamSid });
    finalizeNotifications("twilio disconnected");
    if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
  });

  twilioSocket.on("error", (err: Error) => {
    log("Twilio WebSocket error", { message: err.message });
  });
});
