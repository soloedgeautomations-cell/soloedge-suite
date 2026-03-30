/**
 * scripts/reconfigure-twilio-webhook.ts
 *
 * One-time utility to re-point an existing Twilio phone number's voice webhook
 * to the correct public URL. Run this whenever the app URL changes or if Riley
 * stops answering calls.
 *
 * Usage:
 *   TWILIO_ACCOUNT_SID=ACxxx TWILIO_AUTH_TOKEN=xxx APP_BASE_URL=https://soloedge.app \
 *   node_modules/.bin/tsx scripts/reconfigure-twilio-webhook.ts
 *
 * Or set the env vars in your .env file and run:
 *   node_modules/.bin/tsx scripts/reconfigure-twilio-webhook.ts
 *
 * Optional: pass a specific phone number to reconfigure (E.164 format):
 *   PHONE_NUMBER=+17372595692 node_modules/.bin/tsx scripts/reconfigure-twilio-webhook.ts
 */

import "dotenv/config";

const SID   = process.env.TWILIO_ACCOUNT_SID ?? "";
const TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const BASE  = (process.env.APP_BASE_URL ?? "https://soloedge.app").replace(/\/+$/, "");
const TARGET_NUMBER = process.env.PHONE_NUMBER ?? ""; // optional filter

if (!SID || !TOKEN) {
  console.error("❌  TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set.");
  process.exit(1);
}

const VOICE_WEBHOOK_URL = `${BASE}/api/incoming-call`;
const AUTH = "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");
const API  = `https://api.twilio.com/2010-04-01/Accounts/${SID}`;

interface TwilioNumber {
  sid: string;
  phone_number: string;
  friendly_name: string;
  voice_url: string | null;
}

async function listNumbers(): Promise<TwilioNumber[]> {
  const res = await fetch(`${API}/IncomingPhoneNumbers.json?PageSize=50`, {
    headers: { Authorization: AUTH },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list numbers: ${res.status} — ${err}`);
  }
  const data = await res.json() as { incoming_phone_numbers: TwilioNumber[] };
  return data.incoming_phone_numbers ?? [];
}

async function updateWebhook(numberSid: string, phoneNumber: string): Promise<void> {
  const params = new URLSearchParams({
    VoiceUrl:    VOICE_WEBHOOK_URL,
    VoiceMethod: "POST",
  });
  const res = await fetch(`${API}/IncomingPhoneNumbers/${numberSid}.json`, {
    method:  "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/x-www-form-urlencoded" },
    body:    params.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update ${phoneNumber}: ${res.status} — ${err}`);
  }
  console.log(`✅  ${phoneNumber} → voice webhook set to: ${VOICE_WEBHOOK_URL}`);
}

async function main() {
  console.log(`\n🔧  Twilio Webhook Reconfiguration`);
  console.log(`    Account SID : ${SID}`);
  console.log(`    Target URL  : ${VOICE_WEBHOOK_URL}`);
  if (TARGET_NUMBER) console.log(`    Filter      : ${TARGET_NUMBER}`);
  console.log("");

  const numbers = await listNumbers();

  if (numbers.length === 0) {
    console.log("⚠️  No phone numbers found on this Twilio account.");
    return;
  }

  const toUpdate = TARGET_NUMBER
    ? numbers.filter(n => n.phone_number === TARGET_NUMBER)
    : numbers;

  if (toUpdate.length === 0) {
    console.log(`⚠️  No numbers matched filter: ${TARGET_NUMBER}`);
    console.log("Available numbers:");
    numbers.forEach(n => console.log(`  ${n.phone_number}  (${n.friendly_name})`));
    return;
  }

  console.log(`Found ${toUpdate.length} number(s) to reconfigure:\n`);
  for (const n of toUpdate) {
    console.log(`  ${n.phone_number}  (${n.friendly_name})`);
    console.log(`    Current webhook: ${n.voice_url ?? "(none)"}`);
    await updateWebhook(n.sid, n.phone_number);
  }

  console.log(`\n🎉  Done. Riley should now answer calls on all reconfigured numbers.`);
  console.log(`    Test by calling ${toUpdate[0]?.phone_number ?? "your number"} — Riley should pick up within 2 rings.\n`);
}

main().catch(err => {
  console.error("❌  Script failed:", err.message);
  process.exit(1);
});
