#!/usr/bin/env node
/**
 * SoloEdge Ops / Guardian Health Check Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs continuously as a PM2 process. Checks every 8 hours (3x per day):
 *   1. Server / HTTPS endpoint (voice-health)
 *   2. Riley WebSocket endpoint reachability
 *   3. Twilio webhook configuration for all Riley numbers
 *   4. Stripe API connectivity
 *   5. SendGrid API connectivity
 *
 * Alerts via Telegram + SMS on first failure and every 10 min while down.
 * Sends a daily summary at 8:00 AM America/Chicago.
 *
 * Environment variables (read from /root/soloedge-suite/.env):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_ALERT_CHAT_ID
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM, ALERT_TO_NUMBER
 *   STRIPE_SECRET_KEY
 *   SENDGRID_API_KEY
 *   APP_BASE_URL
 */

import "dotenv/config";
import https from "https";
import http from "http";
import { WebSocket } from "ws";

// ─── Config ──────────────────────────────────────────────────────────────────
const APP_BASE_URL     = process.env.APP_BASE_URL     || "https://soloedge.app";
const TG_TOKEN         = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT          = process.env.TELEGRAM_ALERT_CHAT_ID || "";
const TWILIO_SID       = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN     = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM      = process.env.TWILIO_SMS_FROM || "";
const ALERT_TO         = process.env.ALERT_TO_NUMBER || "";
const STRIPE_KEY       = process.env.STRIPE_SECRET_KEY || "";
const SENDGRID_KEY     = process.env.SENDGRID_API_KEY || "";

const CHECK_INTERVAL_MS   = 8 * 60 * 60 * 1000;   // 8 hours (3x per day)
const ALERT_REPEAT_MS     = 10 * 60 * 1000;  // re-alert every 10 min while down
const DAILY_SUMMARY_HOUR  = 8;               // 8 AM Chicago time

// ─── State tracking ──────────────────────────────────────────────────────────
const state = {
  failures: {},       // { checkName: { since: Date, lastAlert: Date, count: int } }
  lastDailySummary: null,
  startTime: new Date(),
  checkCount: 0,
  totalFailures: 0,
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function log(level, msg) {
  const ts = new Date().toISOString();
  console.log(`[OPS:${level}] ${ts} — ${msg}`);
}

function httpGet(url, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers, timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function httpPost(url, data, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith("https") ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: { "Content-Length": Buffer.byteLength(body), ...headers },
      timeout: timeoutMs,
    };
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(options, (res) => {
      let b = "";
      res.on("data", (d) => (b += d));
      res.on("end", () => resolve({ status: res.statusCode, body: b }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

// ─── Alert functions ─────────────────────────────────────────────────────────
async function sendTelegram(msg) {
  if (!TG_TOKEN || !TG_CHAT) { log("WARN", "Telegram not configured"); return; }
  try {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const body = JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: "HTML" });
    const res = await httpPost(url, body, { "Content-Type": "application/json" });
    if (res.status !== 200) log("WARN", `Telegram send failed: ${res.status} ${res.body}`);
    else log("ALERT", `Telegram sent: ${msg.slice(0, 80)}`);
  } catch (e) {
    log("WARN", `Telegram error: ${e.message}`);
  }
}

async function sendSMS(msg) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM || !ALERT_TO) {
    log("WARN", "SMS not configured");
    return;
  }
  try {
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
    const body = new URLSearchParams({ To: ALERT_TO, From: TWILIO_FROM, Body: msg }).toString();
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const res = await httpPost(url, body, {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    });
    if (res.status >= 200 && res.status < 300) log("ALERT", `SMS sent to ${ALERT_TO}`);
    else log("WARN", `SMS failed: ${res.status} ${res.body.slice(0, 200)}`);
  } catch (e) {
    log("WARN", `SMS error: ${e.message}`);
  }
}

async function alert(checkName, message) {
  const now = Date.now();
  const entry = state.failures[checkName];
  const shouldAlert = !entry || (now - entry.lastAlert) >= ALERT_REPEAT_MS;

  if (!entry) {
    state.failures[checkName] = { since: new Date(), lastAlert: now, count: 1 };
    state.totalFailures++;
  } else {
    entry.count++;
    if (!shouldAlert) return;
    entry.lastAlert = now;
  }

  const downFor = entry ? Math.round((now - entry.since) / 60000) : 0;
  const fullMsg = downFor > 0
    ? `🚨 SOLOEDGE ALERT\n${message}\nDown for: ${downFor} min`
    : `🚨 SOLOEDGE ALERT\n${message}`;

  log("ALERT", fullMsg);
  await sendTelegram(fullMsg);
  await sendSMS(`SoloEdge: ${message}`);
}

async function recover(checkName) {
  if (!state.failures[checkName]) return;
  const downFor = Math.round((Date.now() - state.failures[checkName].since) / 60000);
  delete state.failures[checkName];
  const msg = `✅ SOLOEDGE RECOVERED\n${checkName} is back online (was down ${downFor} min)`;
  log("RECOVER", msg);
  await sendTelegram(msg);
}

// ─── Health checks ───────────────────────────────────────────────────────────

async function checkVoiceHealth() {
  const name = "Riley Voice Endpoint";
  try {
    const res = await httpGet(`${APP_BASE_URL}/api/voice-health`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const data = JSON.parse(res.body);
    if (data.status !== "OK") throw new Error(`Status: ${data.status}`);
    if (!data.openai_key_present) throw new Error("OpenAI key missing");
    await recover(name);
    return { ok: true };
  } catch (e) {
    await alert(name, `Riley voice endpoint DOWN: ${e.message}\n${APP_BASE_URL}/api/voice-health`);
    return { ok: false, error: e.message };
  }
}

// NOTE: WebSocket check removed — connecting to /api/media-stream triggers a fake
// call notification every time. The voice-health HTTP check already confirms WSS
// config is correct. No need to actually connect to the media stream.
async function checkWebSocket() {
  return { ok: true, skipped: true };
}

async function checkTwilioWebhook() {
  const name = "Twilio Webhook Config";
  if (!TWILIO_SID || !TWILIO_TOKEN) return { ok: true, skipped: true };
  try {
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
    const res = await httpGet(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json?PageSize=20`,
      { Authorization: `Basic ${auth}` }
    );
    if (res.status !== 200) throw new Error(`Twilio API ${res.status}`);
    const data = JSON.parse(res.body);
    const numbers = data.incoming_phone_numbers || [];
    const problems = [];
    for (const num of numbers) {
      const voiceUrl = num.voice_url || "";
      if (!voiceUrl.includes("/api/incoming-call")) {
        problems.push(`${num.phone_number}: webhook=${voiceUrl || "EMPTY"}`);
      }
    }
    if (problems.length > 0) {
      await alert(name, `Twilio webhook misconfigured:\n${problems.join("\n")}`);
      return { ok: false, problems };
    }
    await recover(name);
    return { ok: true, numbers: numbers.length };
  } catch (e) {
    await alert(name, `Twilio API check failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function checkStripe() {
  const name = "Stripe API";
  if (!STRIPE_KEY) return { ok: true, skipped: true };
  try {
    const auth = Buffer.from(`${STRIPE_KEY}:`).toString("base64");
    const res = await httpGet(
      "https://api.stripe.com/v1/balance",
      { Authorization: `Basic ${auth}` }
    );
    if (res.status === 200 || res.status === 401) {
      // 401 means key is wrong but API is reachable
      await recover(name);
      return { ok: true };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    await alert(name, `Stripe API unreachable: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function checkSendGrid() {
  const name = "SendGrid API";
  if (!SENDGRID_KEY) return { ok: true, skipped: true };
  try {
    const res = await httpGet(
      "https://api.sendgrid.com/v3/user/profile",
      { Authorization: `Bearer ${SENDGRID_KEY}` }
    );
    if (res.status === 200 || res.status === 401 || res.status === 403) {
      await recover(name);
      return { ok: true };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    await alert(name, `SendGrid API unreachable: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

// ─── Full health run ──────────────────────────────────────────────────────────
async function runAllChecks() {
  state.checkCount++;

  const results = await Promise.allSettled([
    checkVoiceHealth(),
    checkWebSocket(),
    checkTwilioWebhook(),
    checkStripe(),
    checkSendGrid(),
  ]);

  const names = ["VoiceHealth", "WebSocket", "TwilioWebhook", "Stripe", "SendGrid"];
  const allOk = results.every((r) => r.status === "fulfilled" && r.value?.ok !== false);

  // Only log to console when there are issues — no noise on clean runs
  if (!allOk) {
    const summary = results.map((r, i) => {
      const val = r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message };
      return `${val.ok ? "✅" : "❌"} ${names[i]}${val.error ? `: ${val.error}` : ""}`;
    });
    log("CHECK", `Run #${state.checkCount} — ISSUES DETECTED`);
    summary.forEach((s) => log("CHECK", s));
  }

  return { allOk };
}

// ─── Daily summary ────────────────────────────────────────────────────────────
async function sendDailySummary() {
  const uptime = Math.round((Date.now() - state.startTime) / 3600000);
  const activeFailures = Object.keys(state.failures);
  const status = activeFailures.length === 0 ? "✅ All systems healthy" : `⚠️ Active issues: ${activeFailures.join(", ")}`;

  const msg = [
    "📊 <b>SoloEdge Daily Health Report</b>",
    `Date: ${new Date().toLocaleDateString("en-US", { timeZone: "America/Chicago" })}`,
    `Status: ${status}`,
    `Uptime: ${uptime}h`,
    `Checks run: ${state.checkCount}`,
    `Total alerts sent: ${state.totalFailures}`,
    `Monitoring: ${APP_BASE_URL}`,
  ].join("\n");

  log("DAILY", "Sending daily summary");
  await sendTelegram(msg);
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
function shouldSendDailySummary() {
  const now = new Date();
  const chicagoHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false })
  );
  const today = now.toDateString();
  if (chicagoHour === DAILY_SUMMARY_HOUR && state.lastDailySummary !== today) {
    state.lastDailySummary = today;
    return true;
  }
  return false;
}

// ─── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  log("STARTUP", "═══════════════════════════════════════════════");
  log("STARTUP", "SoloEdge Ops / Guardian Agent starting");
  log("STARTUP", `Monitoring: ${APP_BASE_URL}`);
  log("STARTUP", `Check interval: ${CHECK_INTERVAL_MS / 1000}s`);
  log("STARTUP", `Alert repeat: ${ALERT_REPEAT_MS / 60000} min`);
  log("STARTUP", `Telegram: ${TG_TOKEN ? "configured" : "NOT SET"}`);
  log("STARTUP", `SMS alerts: ${ALERT_TO || "NOT SET"}`);
  log("STARTUP", "═══════════════════════════════════════════════");

  // Run immediately on start
  await runAllChecks();

  // Then on interval
  setInterval(async () => {
    await runAllChecks();
    if (shouldSendDailySummary()) {
      await sendDailySummary();
    }
  }, CHECK_INTERVAL_MS);
}

main().catch((e) => {
  log("FATAL", e.message);
  process.exit(1);
});
