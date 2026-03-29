/**
 * Riley Voice Handler — OpenAI Realtime API (WebSocket)
 *
 * Architecture matches the original Replit server.js exactly:
 *   POST /api/incoming-call  — Twilio webhook, returns TwiML to open a media stream
 *   WS   /api/media-stream   — Twilio media stream ↔ OpenAI Realtime bridge
 *
 * Riley speaks live audio via OpenAI Realtime API (gpt-4o-realtime-preview).
 * No text-to-speech. No TwiML Say. Real-time bidirectional audio.
 */

import { Router, Request, Response } from "express";
import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { RILEY_VOICE_PROMPT } from "./prompts/riley";

export const voiceRouter = Router();

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
const REALTIME_URL = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`;

// ─── /api/incoming-call ───────────────────────────────────────────────────────
// Twilio calls this when someone dials (737) 259-5692.
// We return TwiML that opens a media stream back to /api/media-stream.

voiceRouter.all("/incoming-call", (req: Request, res: Response) => {
  const callerNumber = (req.body?.From || req.query?.From || "") as string;
  const streamCallerValue = callerNumber.replace(/[^+\d]/g, "");

  // Determine the public WSS base URL for the media stream
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
// Created once and attached to the HTTP server in index.ts via handleUpgrade.

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
              instructions:
                'Speak naturally in the same calm receptionist voice. Say exactly: "Take your time. Would you like English, Spanish, or Chinese?" Then stop and wait for the caller to answer.',
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
          temperature: 0.8,
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
            'Speak naturally in a calm, warm, professional receptionist voice. Say exactly: "Thanks for calling SoloEdge AI Automations. Would you like English, Spanish, or Chinese?" Then stop and wait for the caller to answer. Do not continue speaking. Do not explain the demo yet. Do not sound like a recording.',
        },
      },
      "initial greeting"
    );
    scheduleLanguageFollowup();
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

      if (
        msg.type === "conversation.item.input_audio_transcription.completed" &&
        msg.transcript
      ) {
        const t = msg.transcript.toLowerCase();
        if (
          t.includes("english") || t.includes("hello") || t.includes("help") ||
          t.includes("service") || t.includes("roof") || t.includes("plumbing")
        ) {
          languageChoiceResolved = true;
          clearLanguageFollowupTimer();
        } else if (
          t.includes("español") || t.includes("hola") || t.includes("gracias") ||
          t.includes("necesito") || t.includes("ayuda")
        ) {
          languageChoiceResolved = true;
          clearLanguageFollowupTimer();
        } else if (/[\u4e00-\u9fff]/.test(msg.transcript)) {
          languageChoiceResolved = true;
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
    clearLanguageFollowupTimer();
    log("Disconnected from OpenAI Realtime", { code });
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
    clearLanguageFollowupTimer();
    log("Twilio WebSocket closed", { streamSid });
    if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
  });

  twilioSocket.on("error", (err: Error) => {
    log("Twilio WebSocket error", { message: err.message });
  });
});
