/**
 * Voice handler tests — OpenAI Realtime WebSocket architecture
 *
 * Tests the HTTP endpoint POST /api/incoming-call which returns TwiML
 * that opens a Twilio <Connect><Stream> to /api/media-stream.
 * The WebSocket bridge itself (OpenAI Realtime) is not tested here
 * because it requires live credentials; we verify the export shape instead.
 */

import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { voiceRouter, mediaStreamWss } from "./voice";
import { WebSocketServer } from "ws";

function buildApp() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/api", voiceRouter);
  return app;
}

describe("Riley Voice Handler (OpenAI Realtime)", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  // ─── POST /api/incoming-call TwiML shape ─────────────────────────────────────

  it("returns 200 with XML content-type", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/xml/);
  });

  it("TwiML contains XML declaration", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.text).toContain('<?xml version="1.0"');
  });

  it("TwiML contains <Response> root element", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.text).toContain("<Response>");
    expect(res.text).toContain("</Response>");
  });

  it("TwiML contains <Connect> and <Stream> for media stream", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.text).toContain("<Connect>");
    expect(res.text).toContain("<Stream");
  });

  it("TwiML Stream url points to /api/media-stream", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.text).toContain("/api/media-stream");
  });

  it("TwiML Stream url uses wss:// protocol", async () => {
    const res = await request(app).post("/api/incoming-call").send({});
    expect(res.text).toContain("wss://");
  });

  it("TwiML includes a <Parameter name='from'> element", async () => {
    const res = await request(app)
      .post("/api/incoming-call")
      .send({ From: "+15125551234" });
    expect(res.text).toContain('name="from"');
  });

  it("caller number is included in the <Parameter> value", async () => {
    const res = await request(app)
      .post("/api/incoming-call")
      .send({ From: "+15125551234" });
    expect(res.text).toContain("15125551234");
  });

  it("GET /api/incoming-call also returns TwiML (Twilio may use GET)", async () => {
    const res = await request(app).get("/api/incoming-call").query({ From: "+15125551234" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("<Response>");
  });

  // ─── WebSocket server export ────────────────────────────────────────────────

  it("mediaStreamWss is a WebSocketServer instance", () => {
    expect(mediaStreamWss).toBeInstanceOf(WebSocketServer);
  });
});
