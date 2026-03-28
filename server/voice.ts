/**
 * Riley Voice Handler — Twilio Inbound Call Webhook
 *
 * Endpoints:
 *   POST /api/voice          — Initial greeting + Gather (speech input)
 *   POST /api/voice/gather   — Process caller's speech, respond with Riley AI
 *   POST /api/voice/forward  — Forward call to Murphy's personal number
 */

import { Router, Request, Response } from "express";
import { invokeLLM } from "./_core/llm";

const voiceRouter = Router();

// Murphy's personal number for human escalation (never shown publicly)
const MURPHY_PERSONAL_NUMBER = process.env.MURPHY_PERSONAL_NUMBER || "+15127029685";

// Riley voice system prompt — optimised for short spoken TTS responses
const RILEY_VOICE_PROMPT = `
You are Riley, the SoloEdge AI Receptionist answering an inbound phone call.

ROLE: Greet callers warmly, understand their need, and help them:
1. Learn about SoloEdge services (AI communication + scheduling automation)
2. Book a demo or consultation
3. Get a quick answer about pricing or setup
4. Reach a human if needed

SERVICES (brief):
- Communication Suite: AI handles calls, texts, and lead capture — $59–$149/mo
- Scheduling Suite: AI books, confirms, and follows up appointments — $49–$149/mo
- Setup is fast: 24–48 hours

BEHAVIOR FOR VOICE:
- Keep every response under 3 sentences — this is spoken audio, not text
- Speak naturally and warmly, like a real receptionist
- Ask ONE question at a time to gather: name, business type, what they need
- If they want to book a demo, tell them you'll connect them or take their info
- If they want to speak with a person, say "Let me connect you with our team" and end with [FORWARD]
- Never read out URLs or email addresses
- Do not say "as an AI" — you are Riley, the SoloEdge receptionist

LANGUAGE: Respond in the same language the caller uses (English, Spanish, or Chinese).
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function twimlResponse(twiml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${twiml}\n</Response>`;
}

function sayAndGather(text: string, actionPath: string, hints?: string): string {
  const hintsAttr = hints ? ` hints="${hints}"` : "";
  return twimlResponse(`
  <Say voice="Polly.Joanna-Neural">${escapeXml(text)}</Say>
  <Gather input="speech" action="${actionPath}" method="POST" speechTimeout="3" language="en-US"${hintsAttr}>
    <Say voice="Polly.Joanna-Neural"> </Say>
  </Gather>
  <Redirect method="POST">${actionPath}?fallback=1</Redirect>`);
}

function sayAndHangup(text: string): string {
  return twimlResponse(`
  <Say voice="Polly.Joanna-Neural">${escapeXml(text)}</Say>
  <Hangup/>`);
}

function forwardCall(to: string, callerMessage: string): string {
  return twimlResponse(`
  <Say voice="Polly.Joanna-Neural">${escapeXml(callerMessage)}</Say>
  <Dial>${to}</Dial>`);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Build the base URL for action callbacks from the incoming request
function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  return `${proto}://${host}`;
}

// ─── POST /api/voice — Initial greeting ──────────────────────────────────────

voiceRouter.post("/", (req: Request, res: Response) => {
  const base = getBaseUrl(req);
  const gatherUrl = `${base}/api/voice/gather`;

  const greeting =
    "Hi, thank you for calling SoloEdge Automations. I'm Riley, your AI receptionist. " +
    "How can I help you today? You can ask about our services, pricing, or book a demo.";

  res.set("Content-Type", "text/xml");
  res.send(sayAndGather(greeting, gatherUrl, "book,demo,pricing,services,schedule,appointment,human,person,help"));
});

// ─── POST /api/voice/gather — Process speech + Riley AI response ──────────────

voiceRouter.post("/gather", async (req: Request, res: Response) => {
  const base = getBaseUrl(req);
  const gatherUrl = `${base}/api/voice/gather`;
  const forwardUrl = `${base}/api/voice/forward`;

  const speechResult: string = req.body?.SpeechResult || "";
  const isFallback = req.query.fallback === "1";

  // If no speech detected, prompt again or give up after fallback
  if (!speechResult && isFallback) {
    res.set("Content-Type", "text/xml");
    res.send(
      sayAndHangup(
        "I'm sorry, I didn't catch that. Please call back or visit soloedgeautomations.com to reach our team. Have a great day!"
      )
    );
    return;
  }

  if (!speechResult) {
    res.set("Content-Type", "text/xml");
    res.send(
      sayAndGather(
        "I didn't quite catch that. Could you repeat what you're looking for?",
        gatherUrl
      )
    );
    return;
  }

  // Check if caller wants a human
  const wantsHuman =
    /\b(human|person|someone|agent|representative|rep|real person|talk to|speak to|connect me|transfer)\b/i.test(
      speechResult
    );

  if (wantsHuman) {
    res.set("Content-Type", "text/xml");
    res.send(
      forwardCall(
        MURPHY_PERSONAL_NUMBER,
        "Of course! Let me connect you with our team right now. One moment please."
      )
    );
    return;
  }

  // Call Riley LLM for a voice-optimised response
  try {
    const llmRes = await invokeLLM({
      messages: [
        { role: "system", content: RILEY_VOICE_PROMPT },
        { role: "user", content: speechResult },
      ],
    });

    const rawContent = llmRes?.choices?.[0]?.message?.content;
    const rileyText: string =
      (typeof rawContent === "string" ? rawContent.trim() : "") ||
      "Thanks for that. We'd love to help you set up AI automation for your business. Can I get your name and the best way to reach you?";

    // Check if Riley decided to forward
    if (rileyText.includes("[FORWARD]")) {
      const cleanText = rileyText.replace("[FORWARD]", "").trim();
      res.set("Content-Type", "text/xml");
      res.send(forwardCall(MURPHY_PERSONAL_NUMBER, cleanText || "Let me connect you with our team."));
      return;
    }

    // Continue the conversation with another Gather
    res.set("Content-Type", "text/xml");
    res.send(sayAndGather(rileyText, gatherUrl));
  } catch (err) {
    console.error("Riley voice LLM error:", err);
    res.set("Content-Type", "text/xml");
    res.send(
      sayAndGather(
        "I appreciate your patience. We help businesses automate calls, texts, and scheduling. What type of business are you running?",
        gatherUrl
      )
    );
  }
});

// ─── POST /api/voice/forward — Direct forward to Murphy ──────────────────────

voiceRouter.post("/forward", (req: Request, res: Response) => {
  res.set("Content-Type", "text/xml");
  res.send(
    forwardCall(
      MURPHY_PERSONAL_NUMBER,
      "Connecting you with our team now. Please hold."
    )
  );
});

export { voiceRouter };
