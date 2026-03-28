/**
 * Tests for Riley Voice Handler (server/voice.ts)
 *
 * Validates TwiML XML output for each endpoint without making real Twilio or LLM calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the LLM so tests don't make real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Thanks for calling! What type of business are you running?",
        },
      },
    ],
  }),
}));

// Import after mocking
const { voiceRouter } = await import("./voice");

function buildApp() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/api/voice", voiceRouter);
  return app;
}

describe("Riley Voice Handler", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  // ── POST /api/voice — Initial greeting ──────────────────────────────────────

  it("returns valid TwiML XML for initial greeting", async () => {
    const res = await request(app).post("/api/voice").send({});
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/xml/);
    expect(res.text).toContain('<?xml version="1.0"');
    expect(res.text).toContain("<Response>");
    expect(res.text).toContain("<Say");
    expect(res.text).toContain("<Gather");
    expect(res.text).toContain("Riley");
  });

  it("greeting TwiML contains action pointing to /api/voice/gather", async () => {
    const res = await request(app).post("/api/voice").send({});
    expect(res.text).toContain("/api/voice/gather");
  });

  it("greeting uses Polly neural voice", async () => {
    const res = await request(app).post("/api/voice").send({});
    expect(res.text).toContain("Polly.Joanna-Neural");
  });

  // ── POST /api/voice/gather — Speech processing ──────────────────────────────

  it("returns TwiML with Riley LLM response when speech is provided", async () => {
    const res = await request(app)
      .post("/api/voice/gather")
      .send({ SpeechResult: "I want to learn about your services" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Response>");
    expect(res.text).toContain("<Say");
    expect(res.text).toContain("Thanks for calling");
  });

  it("forwards call when caller says they want a human", async () => {
    const res = await request(app)
      .post("/api/voice/gather")
      .send({ SpeechResult: "I want to speak to a real person" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Dial>");
  });

  it("forwards call when caller says agent", async () => {
    const res = await request(app)
      .post("/api/voice/gather")
      .send({ SpeechResult: "Can I talk to an agent please" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Dial>");
  });

  it("prompts again when no speech result and not fallback", async () => {
    const res = await request(app).post("/api/voice/gather").send({});
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Gather");
    expect(res.text).not.toContain("<Hangup");
  });

  it("hangs up gracefully when no speech on fallback attempt", async () => {
    const res = await request(app)
      .post("/api/voice/gather?fallback=1")
      .send({});
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Hangup");
    expect(res.text).not.toContain("<Gather");
  });

  // ── POST /api/voice/forward — Direct forward ────────────────────────────────

  it("returns TwiML with Dial for direct forward endpoint", async () => {
    const res = await request(app).post("/api/voice/forward").send({});
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Dial>");
    expect(res.text).toContain("<Say");
  });

  // ── XML safety ──────────────────────────────────────────────────────────────

  it("escapes XML special characters in LLM response", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "We help businesses & owners <grow> their revenue." } }],
    } as any);

    const res = await request(app)
      .post("/api/voice/gather")
      .send({ SpeechResult: "Tell me about pricing" });

    expect(res.text).not.toContain("&grow>");
    expect(res.text).toContain("&amp;");
    expect(res.text).toContain("&lt;");
  });
});
