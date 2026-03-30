/**
 * server/stripe/provision.ts
 * Zero-Touch Automation — Twilio phone number provisioning.
 *
 * Called from the Stripe webhook after checkout.session.completed.
 * Responsibilities:
 *   1. Search Twilio for an available local number in the requested area code.
 *   2. Purchase (provision) the number on the SoloEdge Twilio account.
 *   3. Configure the number's voice webhook to point at our /api/incoming-call
 *      endpoint so Riley answers immediately — zero manual steps.
 *   4. Persist the provisioned number to the user record in the database.
 *
 * Environment variables required:
 *   TWILIO_ACCOUNT_SID   — Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token
 *   APP_BASE_URL         — Public base URL of the deployed app (e.g. https://soloedgeautomations.com)
 *                          Used to build the voice webhook URL.
 */

import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Twilio REST API helpers (no SDK dependency — uses fetch + Basic Auth) ────

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function twilioBase(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  return `https://api.twilio.com/2010-04-01/Accounts/${sid}`;
}

/** Build the voice webhook URL for a newly provisioned number. */
function buildVoiceWebhookUrl(): string {
  const base = (process.env.APP_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/api/incoming-call`;
}

// ─── Step 1: Search for an available local number ────────────────────────────

/**
 * Search Twilio for an available US local phone number.
 * Tries the requested area code first; falls back to 512 (Austin, TX) then
 * 737 (Austin, TX secondary) before giving up.
 */
async function searchAvailableNumber(preferredAreaCode = "512"): Promise<string | null> {
  const areaCodesToTry = [
    preferredAreaCode,
    "512",  // Austin, TX — SoloEdge home base
    "737",  // Austin, TX secondary
    "210",  // San Antonio, TX
    "214",  // Dallas, TX
    "713",  // Houston, TX
  ];

  // Deduplicate while preserving order
  const queue = [...new Set(areaCodesToTry)];

  for (const areaCode of queue) {
    try {
      const url = `${twilioBase()}/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&VoiceEnabled=true&SmsEnabled=true&Limit=1`;
      const res = await fetch(url, {
        headers: { Authorization: twilioAuth() },
      });
      if (!res.ok) {
        console.warn(`[Provision] Twilio search failed for area code ${areaCode}: ${res.status}`);
        continue;
      }
      const data = await res.json() as { available_phone_numbers?: Array<{ phone_number: string }> };
      const found = data.available_phone_numbers?.[0]?.phone_number;
      if (found) {
        console.log(`[Provision] Found available number ${found} (area code ${areaCode})`);
        return found;
      }
    } catch (err) {
      console.warn(`[Provision] Error searching area code ${areaCode}:`, err);
    }
  }

  console.error("[Provision] No available numbers found in any fallback area code");
  return null;
}

// ─── Step 2: Purchase (provision) the number ─────────────────────────────────

/**
 * Purchase a Twilio phone number and immediately configure its voice webhook.
 * Returns the purchased number in E.164 format, or null on failure.
 */
export async function provisionTwilioNumber(
  preferredAreaCode = "512"
): Promise<string | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    console.error("[Provision] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — skipping provisioning");
    return null;
  }

  // 1. Find an available number
  const phoneNumber = await searchAvailableNumber(preferredAreaCode);
  if (!phoneNumber) return null;

  // 2. Purchase it
  const voiceWebhookUrl = buildVoiceWebhookUrl();
  const purchaseUrl = `${twilioBase()}/IncomingPhoneNumbers.json`;
  const purchaseParams = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: voiceWebhookUrl,
    VoiceMethod: "POST",
    SmsMethod: "POST",
    FriendlyName: "SoloEdge Riley AI",
  });

  try {
    const res = await fetch(purchaseUrl, {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: purchaseParams.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Provision] Failed to purchase ${phoneNumber}: ${res.status} — ${errText}`);
      return null;
    }

    const purchased = await res.json() as { phone_number: string; sid: string };
    console.log(`[Provision] Successfully purchased ${purchased.phone_number} (SID: ${purchased.sid})`);
    console.log(`[Provision] Voice webhook configured → ${voiceWebhookUrl}`);
    return purchased.phone_number;
  } catch (err) {
    console.error("[Provision] Exception purchasing Twilio number:", err);
    return null;
  }
}

// ─── Step 3: Reconfigure an existing number's webhook ────────────────────────

/**
 * Update the voice webhook on an already-owned Twilio number.
 * Useful if the app URL changes or for re-pointing an existing number.
 */
export async function configureTwilioWebhook(
  phoneNumberSid: string,
  voiceUrl?: string
): Promise<boolean> {
  const url = `${twilioBase()}/IncomingPhoneNumbers/${phoneNumberSid}.json`;
  const targetUrl = voiceUrl ?? buildVoiceWebhookUrl();
  const params = new URLSearchParams({
    VoiceUrl: targetUrl,
    VoiceMethod: "POST",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Provision] Failed to update webhook for ${phoneNumberSid}: ${errText}`);
      return false;
    }
    console.log(`[Provision] Webhook updated for ${phoneNumberSid} → ${targetUrl}`);
    return true;
  } catch (err) {
    console.error("[Provision] Exception updating webhook:", err);
    return false;
  }
}

// ─── Step 4: Persist the number to the user record ───────────────────────────

/**
 * Save the provisioned Twilio phone number to the user's database record.
 */
export async function savePhoneToUser(userId: number, phoneNumber: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Provision] Database unavailable — cannot save phone number");
    return;
  }
  await db.update(users)
    .set({ assignedPhoneNumber: phoneNumber })
    .where(eq(users.id, userId));
  console.log(`[Provision] Saved ${phoneNumber} to user ${userId}`);
}
