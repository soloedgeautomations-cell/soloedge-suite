/**
 * server/stripe/webhook.ts
 * Stripe webhook handler for SoloEdge Suite.
 *
 * Registered at: POST /api/stripe/webhook
 *
 * Handles:
 *   - checkout.session.completed  → Zero-Touch Automation (see below)
 *   - customer.subscription.updated / deleted → sync subscription status
 *   - invoice.payment_failed → log + (future) notify customer
 *
 * ─── Zero-Touch Automation (checkout.session.completed) ─────────────────────
 * After a successful payment this handler automatically:
 *   1. Looks up the user by user_id metadata OR by email (guest checkout).
 *   2. If no user exists, creates a new account with a temp password.
 *   3. Activates the subscription on the user record.
 *   4. Provisions a new Twilio phone number (searches, purchases, configures webhook).
 *   5. Saves the provisioned number to the user record.
 *   6. Sends a welcome SMS to the customer's mobile number.
 *   7. Sends a welcome email with the new number, dashboard link, and login info.
 *   8. Notifies Murphy via Telegram.
 *
 * All steps are wrapped in try/catch so a failure in one step (e.g. Twilio
 * unavailable) never prevents the others from completing.
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TIER_MAP } from "./products";
import { provisionTwilioNumber, savePhoneToUser } from "./provision";
import { sendWelcomeSms, sendWelcomeEmail } from "./notify";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — log the error instead
  }

  res.json({ received: true });
}

// ─── checkout.session.completed ──────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log("[Webhook] Starting Zero-Touch Automation for checkout.session.completed");

  // ── Extract key fields from the Stripe session ──────────────────────────────
  const metaUserId = session.metadata?.user_id
    ? parseInt(session.metadata.user_id, 10)
    : session.client_reference_id
      ? parseInt(session.client_reference_id, 10)
      : null;

  const tierId        = session.metadata?.tier_id ?? null;
  const customerEmail = session.metadata?.customer_email || session.customer_details?.email || null;
  const customerName  = session.metadata?.customer_name  || session.customer_details?.name  || "Customer";
  const customerPhone = session.customer_details?.phone ?? null;

  const stripeCustomerId   = typeof session.customer === "string"
    ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId = typeof session.subscription === "string"
    ? session.subscription : session.subscription?.id ?? null;

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable — aborting Zero-Touch Automation");
    return;
  }

  // ── Step 1: Resolve or create the user account ───────────────────────────────
  let userId: number | null = null;
  let tempPassword: string | undefined;
  let isNewAccount = false;

  // 1a. Try to find by user_id from metadata (logged-in checkout)
  if (metaUserId && !isNaN(metaUserId)) {
    const [existing] = await db.select({ id: users.id })
      .from(users).where(eq(users.id, metaUserId)).limit(1);
    if (existing) {
      userId = existing.id;
      console.log(`[Webhook] Found existing user by ID: ${userId}`);
    }
  }

  // 1b. Try to find by email (guest checkout where user_id may be missing)
  if (!userId && customerEmail) {
    const [byEmail] = await db.select({ id: users.id })
      .from(users).where(eq(users.email, customerEmail)).limit(1);
    if (byEmail) {
      userId = byEmail.id;
      console.log(`[Webhook] Found existing user by email: ${userId}`);
    }
  }

  // 1c. Auto-create a new account for guest buyers
  if (!userId && customerEmail) {
    console.log(`[Webhook] No existing user found — auto-creating account for ${customerEmail}`);
    isNewAccount = true;
    tempPassword = nanoid(12); // e.g. "V3kQp8mNxR2w"

    // openId for auto-created accounts uses a deterministic prefix so it never
    // collides with OAuth-issued openIds (which come from the Manus auth server).
    const openId = `stripe_${stripeCustomerId ?? nanoid(16)}`;

    await db.insert(users).values({
      openId,
      name: customerName,
      email: customerEmail,
      loginMethod: "stripe",
      role: "user",
      lastSignedIn: new Date(),
      tempPassword,
    });

    const [created] = await db.select({ id: users.id })
      .from(users).where(eq(users.email, customerEmail)).limit(1);
    userId = created?.id ?? null;
    console.log(`[Webhook] Auto-created user ${userId} (${customerEmail})`);
  }

  if (!userId) {
    console.error("[Webhook] Could not resolve or create a user — aborting automation");
    return;
  }

  // ── Step 2: Activate the subscription ────────────────────────────────────────
  const updateData: Record<string, string | null> = {};
  if (stripeCustomerId)    updateData.stripeCustomerId    = stripeCustomerId;
  if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
  if (tierId)              updateData.stripePlanId        = tierId;
  updateData.stripeSubscriptionStatus = "active";

  await db.update(users).set(updateData).where(eq(users.id, userId));
  console.log(`[Webhook] Subscription activated for user ${userId}: plan=${tierId}`);

  // ── Step 3 & 4: Provision Twilio number + configure webhook ──────────────────
  let assignedPhone: string | null = null;
  try {
    assignedPhone = await provisionTwilioNumber("512"); // default to Austin, TX area code
    if (assignedPhone) {
      await savePhoneToUser(userId, assignedPhone);
      console.log(`[Webhook] Twilio number ${assignedPhone} provisioned and saved for user ${userId}`);
    } else {
      console.warn("[Webhook] Twilio provisioning returned null — no number assigned");
    }
  } catch (err) {
    console.error("[Webhook] Twilio provisioning failed (non-fatal):", err);
  }

  // ── Step 5 & 6: Send welcome notifications ───────────────────────────────────
  const dashboardUrl = `${(process.env.APP_BASE_URL ?? "https://soloedgeautomations.com").replace(/\/+$/, "")}/app`;
  const planName = TIER_MAP[tierId ?? ""]?.name ?? tierId ?? "SoloEdge Plan";

  if (assignedPhone) {
    // Welcome SMS — only if we have the customer's personal mobile number
    if (customerPhone) {
      try {
        await sendWelcomeSms(customerPhone, assignedPhone, planName, dashboardUrl);
      } catch (err) {
        console.error("[Webhook] Welcome SMS failed (non-fatal):", err);
      }
    } else {
      console.warn("[Webhook] No customer phone number in session — skipping welcome SMS");
    }

    // Welcome Email
    if (customerEmail) {
      try {
        await sendWelcomeEmail(
          customerEmail,
          customerName,
          planName,
          assignedPhone,
          dashboardUrl,
          isNewAccount ? tempPassword : undefined
        );
      } catch (err) {
        console.error("[Webhook] Welcome email failed (non-fatal):", err);
      }
    }
  } else {
    // Even without a phone number, send a partial welcome email so the customer
    // knows their account is active and can log in.
    if (customerEmail) {
      try {
        await sendWelcomeEmail(
          customerEmail,
          customerName,
          planName,
          "(being assigned — check back shortly)",
          dashboardUrl,
          isNewAccount ? tempPassword : undefined
        );
      } catch (err) {
        console.error("[Webhook] Fallback welcome email failed (non-fatal):", err);
      }
    }
  }

  // ── Step 7: Notify Murphy via Telegram ───────────────────────────────────────
  await notifyOwner(
    `🎉 New SoloEdge Customer — Zero-Touch Complete!\n` +
    `User ID: ${userId}${isNewAccount ? " (auto-created)" : ""}\n` +
    `Plan: ${planName}\n` +
    `Customer: ${customerName}\n` +
    `Email: ${customerEmail ?? "Unknown"}\n` +
    `Riley Number: ${assignedPhone ?? "⚠️ provisioning failed"}\n` +
    `Dashboard: ${dashboardUrl}`
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;

  if (!customerId) return;

  const db = await getDb();
  if (!db) return;

  // Find user by stripeCustomerId
  const [userRow] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!userRow) {
    console.warn(`[Webhook] subscription.updated: no user found for customer ${customerId}`);
    return;
  }

  const tierId = (subscription.metadata?.tier_id as string | undefined) ?? null;
  const status = subscription.status;

  await db.update(users).set({
    stripeSubscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    ...(tierId ? { stripePlanId: tierId } : {}),
  }).where(eq(users.id, userRow.id));

  console.log(`[Webhook] User ${userRow.id} subscription updated: status=${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;

  if (!customerId) return;

  const db = await getDb();
  if (!db) return;

  const [userRow] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!userRow) return;

  await db.update(users).set({
    stripeSubscriptionStatus: "canceled",
  }).where(eq(users.id, userRow.id));

  console.log(`[Webhook] User ${userRow.id} subscription canceled`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id ?? null;

  console.warn(`[Webhook] Payment failed for customer ${customerId}, invoice ${invoice.id}`);

  // Future: send owner notification or email to customer
}

// ─── Telegram helper ──────────────────────────────────────────────────────────

async function notifyOwner(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch (e) {
    console.error("[Webhook] Telegram notification failed:", e);
  }
}
