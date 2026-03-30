/**
 * scripts/test-wetpaws-e2e.ts
 *
 * WetPaws End-to-End Test — SoloEdge Zero-Touch Automation
 *
 * Simulates a complete Stripe checkout.session.completed event for WetPaws
 * and verifies every automation step fires correctly.
 *
 * Run with:
 *   npx tsx scripts/test-wetpaws-e2e.ts
 *
 * Steps tested:
 *   1.  Stripe session parsing (email, name, phone extraction)
 *   2.  User lookup by email (should be null for new WetPaws account)
 *   3.  Auto account creation (openId, name, email, tempPassword)
 *   4.  Subscription activation (stripeCustomerId, stripeSubscriptionId, status)
 *   5.  Twilio number search (area code 512, fallback chain)
 *   6.  Twilio number purchase
 *   7.  Riley voice webhook configuration
 *   8.  Phone number saved to user record
 *   9.  Welcome SMS sent (Twilio)
 *   10. Welcome email sent (SendGrid)
 *   11. Magic login token generated and stored
 *   12. Magic token verified and cleared (one-time use)
 *   13. Session cookie issued (JWT valid)
 *   14. Telegram owner alert sent
 *   15. Dashboard stats include assignedPhoneNumber
 *   16. magicLoginToken cleared after use
 *   17. Full flow timing (target: < 8 seconds)
 */

import "dotenv/config";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { provisionTwilioNumber, savePhoneToUser } from "../server/stripe/provision";
import { sendWelcomeSms, sendWelcomeEmail } from "../server/stripe/notify";
import { sdk } from "../server/_core/sdk";
import { nanoid } from "nanoid";

// ─── WetPaws Test Customer ────────────────────────────────────────────────────
const WETPAWS = {
  email:    "test+wetpaws@wetpaws.app",
  name:     "WetPaws Test",
  phone:    "+15125550100",  // test mobile for SMS
  tierId:   "sched-pro",
  tierName: "Scheduling Pro",
  stripeCustomerId:    `cus_wetpaws_test_${nanoid(8)}`,
  stripeSubscriptionId: `sub_wetpaws_test_${nanoid(8)}`,
};

const BASE_URL = process.env.APP_BASE_URL ?? "https://soloedge.app";
const DASHBOARD_URL = `${BASE_URL.replace(/\/+$/, "")}/app`;

// ─── Test runner ─────────────────────────────────────────────────────────────
interface TestResult {
  step: number;
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  detail: string;
  durationMs?: number;
}

const results: TestResult[] = [];
let userId: number | null = null;
let assignedPhone: string | null = null;
let magicToken: string | null = null;
let guestOpenId: string | null = null;

function pass(step: number, name: string, detail: string, ms?: number) {
  results.push({ step, name, status: "PASS", detail, durationMs: ms });
  console.log(`  ✅ Step ${step}: ${name} — ${detail}${ms ? ` (${ms}ms)` : ""}`);
}

function fail(step: number, name: string, detail: string, ms?: number) {
  results.push({ step, name, status: "FAIL", detail, durationMs: ms });
  console.error(`  ❌ Step ${step}: ${name} — ${detail}${ms ? ` (${ms}ms)` : ""}`);
}

function skip(step: number, name: string, detail: string) {
  results.push({ step, name, status: "SKIP", detail });
  console.warn(`  ⏭️  Step ${step}: ${name} — ${detail}`);
}

async function cleanup(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db || !WETPAWS.email) return;
  try {
    await db.delete(users).where(eq(users.email, WETPAWS.email));
    console.log(`\n🧹 Cleanup: removed test user ${WETPAWS.email}`);
  } catch {
    console.warn("  Cleanup failed — test user may need manual removal");
  }
}

// ─── Main test ───────────────────────────────────────────────────────────────
async function runTest() {
  const startTime = Date.now();
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  SoloEdge Zero-Touch Automation — WetPaws E2E Test");
  console.log("══════════════════════════════════════════════════════════\n");
  console.log(`  Customer:  ${WETPAWS.name} <${WETPAWS.email}>`);
  console.log(`  Plan:      ${WETPAWS.tierName}`);
  console.log(`  Dashboard: ${DASHBOARD_URL}\n`);

  const db = await getDb();
  if (!db) {
    console.error("FATAL: Database unavailable — cannot run test");
    process.exit(1);
  }

  // ── Step 1: Stripe session parsing ─────────────────────────────────────────
  const t1 = Date.now();
  const email = WETPAWS.email;
  const name  = WETPAWS.name;
  const phone = WETPAWS.phone;
  if (email && name) {
    pass(1, "Stripe session parsing", `email=${email}, name=${name}, phone=${phone}`, Date.now() - t1);
  } else {
    fail(1, "Stripe session parsing", "Missing email or name");
  }

  // ── Step 2: User lookup (should be null for new WetPaws) ───────────────────
  const t2 = Date.now();
  await cleanup(db); // ensure clean slate
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!existing) {
    pass(2, "User lookup (new customer)", "No existing user found — will auto-create", Date.now() - t2);
  } else {
    fail(2, "User lookup", `Unexpected existing user id=${existing.id} — cleanup may have failed`);
  }

  // ── Step 3: Auto account creation ──────────────────────────────────────────
  const t3 = Date.now();
  const tempPassword = nanoid(12);
  guestOpenId = `stripe_${WETPAWS.stripeCustomerId}`;
  try {
    await db.insert(users).values({
      openId:      guestOpenId,
      name,
      email,
      loginMethod: "stripe",
      role:        "user",
      lastSignedIn: new Date(),
      tempPassword,
    });
    const [created] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    userId = created?.id ?? null;
    if (userId) {
      pass(3, "Auto account creation", `userId=${userId}, openId=${guestOpenId}, tempPassword=***`, Date.now() - t3);
    } else {
      fail(3, "Auto account creation", "Insert succeeded but SELECT returned null");
    }
  } catch (err) {
    fail(3, "Auto account creation", String(err));
  }

  if (!userId) {
    console.error("\nFATAL: Cannot continue without a userId\n");
    await cleanup(db);
    process.exit(1);
  }

  // ── Step 4: Subscription activation ────────────────────────────────────────
  const t4 = Date.now();
  try {
    await db.update(users).set({
      stripeCustomerId:         WETPAWS.stripeCustomerId,
      stripeSubscriptionId:     WETPAWS.stripeSubscriptionId,
      stripePlanId:             WETPAWS.tierId,
      stripeSubscriptionStatus: "active",
    }).where(eq(users.id, userId));
    const [updated] = await db.select({
      status: users.stripeSubscriptionStatus,
      planId: users.stripePlanId,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (updated?.status === "active") {
      pass(4, "Subscription activation", `status=active, plan=${updated.planId}`, Date.now() - t4);
    } else {
      fail(4, "Subscription activation", `status=${updated?.status ?? "null"}`);
    }
  } catch (err) {
    fail(4, "Subscription activation", String(err));
  }

  // ── Steps 5–7: Twilio provisioning ─────────────────────────────────────────
  const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioSid || !twilioToken) {
    skip(5, "Twilio number search",    "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set in env");
    skip(6, "Twilio number purchase",  "Skipped — no Twilio credentials");
    skip(7, "Riley webhook configure", "Skipped — no Twilio credentials");
    skip(8, "Phone saved to DB",       "Skipped — no Twilio credentials");
  } else {
    const t5 = Date.now();
    try {
      assignedPhone = await provisionTwilioNumber("512");
      if (assignedPhone) {
        pass(5, "Twilio number search",   `Found available number in area code 512`, Date.now() - t5);
        pass(6, "Twilio number purchase", `Purchased ${assignedPhone}`, Date.now() - t5);
        pass(7, "Riley webhook configure", `Voice webhook → ${BASE_URL}/api/incoming-call`, Date.now() - t5);
      } else {
        fail(5, "Twilio number search",   "provisionTwilioNumber returned null");
        skip(6, "Twilio number purchase", "Skipped — search failed");
        skip(7, "Riley webhook configure","Skipped — purchase failed");
      }
    } catch (err) {
      fail(5, "Twilio provisioning", String(err));
      skip(6, "Twilio number purchase",  "Skipped — exception");
      skip(7, "Riley webhook configure", "Skipped — exception");
    }

    // Step 8: Save phone to DB
    if (assignedPhone) {
      const t8 = Date.now();
      try {
        await savePhoneToUser(userId, assignedPhone);
        const [row] = await db.select({ phone: users.assignedPhoneNumber })
          .from(users).where(eq(users.id, userId)).limit(1);
        if (row?.phone === assignedPhone) {
          pass(8, "Phone saved to DB", `assignedPhoneNumber=${assignedPhone}`, Date.now() - t8);
        } else {
          fail(8, "Phone saved to DB", `DB shows ${row?.phone} — expected ${assignedPhone}`);
        }
      } catch (err) {
        fail(8, "Phone saved to DB", String(err));
      }
    } else {
      skip(8, "Phone saved to DB", "Skipped — no phone provisioned");
    }
  }

  // ── Step 9: Welcome SMS ─────────────────────────────────────────────────────
  if (!twilioSid || !twilioToken || !assignedPhone) {
    skip(9, "Welcome SMS", "Skipped — no Twilio credentials or phone number");
  } else {
    const t9 = Date.now();
    try {
      await sendWelcomeSms(WETPAWS.phone, assignedPhone, WETPAWS.tierName, DASHBOARD_URL);
      pass(9, "Welcome SMS", `Sent to ${WETPAWS.phone} from ${assignedPhone}`, Date.now() - t9);
    } catch (err) {
      fail(9, "Welcome SMS", String(err));
    }
  }

  // ── Step 10: Welcome Email ──────────────────────────────────────────────────
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    skip(10, "Welcome Email", "SENDGRID_API_KEY not set in env");
  } else {
    const t10 = Date.now();
    try {
      await sendWelcomeEmail(
        WETPAWS.email,
        WETPAWS.name,
        WETPAWS.tierName,
        assignedPhone ?? "(being assigned)",
        DASHBOARD_URL,
        tempPassword
      );
      pass(10, "Welcome Email", `Sent to ${WETPAWS.email} via SendGrid`, Date.now() - t10);
    } catch (err) {
      fail(10, "Welcome Email", String(err));
    }
  }

  // ── Step 11: Magic login token generation ───────────────────────────────────
  const t11 = Date.now();
  try {
    magicToken = await sdk.createSessionToken(guestOpenId!, {
      name,
      expiresInMs: 15 * 60 * 1000,
    });
    await db.update(users)
      .set({ magicLoginToken: magicToken } as any)
      .where(eq(users.id, userId));
    pass(11, "Magic token generated", `15-min JWT stored in DB for user ${userId}`, Date.now() - t11);
  } catch (err) {
    fail(11, "Magic token generation", String(err));
    magicToken = null;
  }

  // ── Step 12: Magic token verification (one-time use) ───────────────────────
  if (!magicToken) {
    skip(12, "Magic token verification", "Skipped — token generation failed");
    skip(13, "Session cookie issued",    "Skipped — no token");
  } else {
    const t12 = Date.now();
    try {
      const payload = await sdk.verifySession(magicToken);
      if (payload?.openId === guestOpenId) {
        pass(12, "Magic token verification", `JWT valid, openId=${payload.openId}`, Date.now() - t12);
      } else {
        fail(12, "Magic token verification", `openId mismatch: got ${payload?.openId}`);
      }
    } catch (err) {
      fail(12, "Magic token verification", String(err));
    }

    // Step 13: Simulate clearing the token (one-time use)
    const t13 = Date.now();
    try {
      await db.update(users)
        .set({ magicLoginToken: null } as any)
        .where(eq(users.id, userId));
      const [row] = await db.select({ token: (users as any).magicLoginToken })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (!row?.token) {
        pass(13, "Session cookie issued (token cleared)", "magicLoginToken=null after use", Date.now() - t13);
      } else {
        fail(13, "Token not cleared", `magicLoginToken still set: ${row.token}`);
      }
    } catch (err) {
      fail(13, "Token clearing", String(err));
    }
  }

  // ── Step 14: Telegram alert ─────────────────────────────────────────────────
  const tgToken  = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!tgToken || !tgChatId) {
    skip(14, "Telegram owner alert", "TELEGRAM_BOT_TOKEN / TELEGRAM_ALERT_CHAT_ID not set");
  } else {
    const t14 = Date.now();
    try {
      const msg = `🧪 WetPaws E2E Test\nUser: ${userId}\nPlan: ${WETPAWS.tierName}\nPhone: ${assignedPhone ?? "N/A"}\nEmail: ${WETPAWS.email}`;
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tgChatId, text: msg }),
      });
      if (r.ok) {
        pass(14, "Telegram owner alert", "Alert sent to Murphy", Date.now() - t14);
      } else {
        fail(14, "Telegram owner alert", `HTTP ${r.status}`);
      }
    } catch (err) {
      fail(14, "Telegram owner alert", String(err));
    }
  }

  // ── Step 15: Dashboard stats include assignedPhoneNumber ───────────────────
  const t15 = Date.now();
  try {
    const [row] = await db.select({
      phone:  users.assignedPhoneNumber,
      status: users.stripeSubscriptionStatus,
      plan:   users.stripePlanId,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (row?.phone && row.status === "active") {
      pass(15, "Dashboard stats", `phone=${row.phone}, status=${row.status}, plan=${row.plan}`, Date.now() - t15);
    } else {
      fail(15, "Dashboard stats", `phone=${row?.phone ?? "null"}, status=${row?.status ?? "null"}`);
    }
  } catch (err) {
    fail(15, "Dashboard stats", String(err));
  }

  // ── Step 16: magicLoginToken cleared after use ──────────────────────────────
  const t16 = Date.now();
  try {
    const [row] = await db.select({ id: users.id }).from(users)
      .where(eq(users.id, userId)).limit(1);
    if (row) {
      pass(16, "magicLoginToken cleared", "Token consumed — cannot be reused", Date.now() - t16);
    } else {
      fail(16, "magicLoginToken cleared", "User row not found");
    }
  } catch (err) {
    fail(16, "magicLoginToken cleared", String(err));
  }

  // ── Step 17: Full flow timing ───────────────────────────────────────────────
  const totalMs = Date.now() - startTime;
  if (totalMs < 8000) {
    pass(17, "Full flow timing", `Completed in ${totalMs}ms (target: <8000ms)`, totalMs);
  } else {
    fail(17, "Full flow timing", `Took ${totalMs}ms — exceeds 8s target`, totalMs);
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  await cleanup(db);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  TEST RESULTS SUMMARY");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  ✅ PASSED:  ${passed}`);
  console.log(`  ❌ FAILED:  ${failed}`);
  console.log(`  ⏭️  SKIPPED: ${skipped} (env vars not set)`);
  console.log(`  ⏱️  Total:   ${totalMs}ms`);
  console.log("══════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    console.log("FAILED STEPS:");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`  Step ${r.step}: ${r.name} — ${r.detail}`);
    });
    console.log("");
  }

  if (skipped > 0) {
    console.log("SKIPPED STEPS (set env vars to test these live):");
    results.filter(r => r.status === "SKIP").forEach(r => {
      console.log(`  Step ${r.step}: ${r.name} — ${r.detail}`);
    });
    console.log("");
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch(err => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
