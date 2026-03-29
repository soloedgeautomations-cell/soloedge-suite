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

  const systemPrompt = `You are extracting a concise call summary from a phone call to SoloEdge AI Automations.

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

Rules:
- Always return valid JSON only. No markdown.
- If a field is unknown, use "Unknown".
- "language_detected" must be "English", "Spanish", "Chinese", or "Unknown".
- The call may be a live product demo, a business inquiry, or a real work request.
- Do not force every call into a contractor job intake if it was clearly a demo.
- "job_type" may be: demo request, communication system inquiry, scheduling inquiry, email support inquiry, roofing, plumbing, HVAC, electrical, remodeling, general construction, quote request, or other.
- "suggested_action" should be practical: schedule demo, return call, follow up on pricing, or gather more details.
- "english_summary" must be concise and professional.
- "spanish_summary" must be the Spanish equivalent of the summary.`;

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
    };
  }
}

function formatTelegramReport(lead: LeadSummary, callerNumber: string): string {
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
  ].join("\n");
}

// ─── /api/incoming-call ───────────────────────────────────────────────────────
// Twilio calls this when someone dials (737) 259-5692.
// We return TwiML that opens a media stream back to /api/media-stream.

voiceRouter.all("/incoming-call", (req: Request, res: Response) => {
  const callerNumber = (req.body?.From || req.query?.From || "") as string;
  const streamCallerValue = callerNumber.replace(/[^+\d]/g, "");

  const host = req.headers.host || "";
  const wsBase = `wss://${host}`;

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
  const openAiWs = new WebSocket(REALTIME_URL, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
            'Speak at a natural, upbeat pace — warm, confident, and relaxed. Like a cool friend who runs a tight operation. Say exactly: "Hey, SoloEdge — this is Riley. English, Spanish, or Chinese?" Short. Fast. Friendly. Then stop and wait. Do not add anything else. Do not slow down. Do not sound like a recording or a phone tree.',
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

      // Accumulate caller transcript lines
      if (
        msg.type === "conversation.item.input_audio_transcription.completed" &&
        msg.transcript
      ) {
        transcriptLines.push(msg.transcript);
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

      if (msg.type === "response.done") {
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
