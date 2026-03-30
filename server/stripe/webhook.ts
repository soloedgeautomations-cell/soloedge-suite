/**
 * server/stripe/webhook.ts
 * Stripe webhook handler for SoloEdge Suite.
 *
 * Registered at: POST /api/stripe/webhook
 * Handles:
 *   - checkout.session.completed  → store stripeCustomerId, subscriptionId, planId
 *   - customer.subscription.updated / deleted → sync subscription status
 *   - invoice.payment_failed → (logged, future: notify owner)
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TIER_MAP } from "./products";

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

  // ⚠️ CRITICAL: Test events must return verified:true immediately
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Webhook] Received: ${event.type} (${event.id})`);

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

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.user_id
    ? parseInt(session.metadata.user_id, 10)
    : session.client_reference_id
      ? parseInt(session.client_reference_id, 10)
      : null;

  if (!userId || isNaN(userId)) {
    console.error("[Webhook] checkout.session.completed: missing user_id in metadata");
    return;
  }

  const tierId = session.metadata?.tier_id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;

  console.log(`[Webhook] Checkout completed: userId=${userId}, tierId=${tierId}, customerId=${customerId}, subId=${subscriptionId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable — cannot update user subscription");
    return;
  }

  const updateData: Record<string, string | null> = {};
  if (customerId) updateData.stripeCustomerId = customerId;
  if (subscriptionId) updateData.stripeSubscriptionId = subscriptionId;
  if (tierId) updateData.stripePlanId = tierId;
  updateData.stripeSubscriptionStatus = "active";

  await db.update(users).set(updateData).where(eq(users.id, userId));
  console.log(`[Webhook] User ${userId} subscription activated: plan=${tierId}`);

  // Notify owner via Telegram
  await notifyOwner(
    `🎉 New SoloEdge Customer!\n` +
    `User ID: ${userId}\n` +
    `Plan: ${TIER_MAP[tierId ?? ""]?.name ?? tierId ?? "Unknown"}\n` +
    `Customer: ${session.metadata?.customer_name ?? "Unknown"}\n` +
    `Email: ${session.metadata?.customer_email ?? "Unknown"}`
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
