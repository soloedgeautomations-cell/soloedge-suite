/**
 * server/stripe/router.ts
 * tRPC procedures for Stripe Checkout and subscription management.
 */

import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TIER_MAP, TIERS } from "./products";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const stripeRouter = router({
  /** Return all tier definitions for the pricing page */
  getTiers: publicProcedure.query(() => {
    return TIERS.map((t) => ({
      id: t.id,
      name: t.name,
      subtitle: t.subtitle,
      description: t.description,
      suite: t.suite,
      setupAmount: t.setupAmount,
      monthlyAmount: t.monthlyAmount,
      popular: t.popular,
      features: t.features,
    }));
  }),

  /** Create a Stripe Checkout Session for setup fee + subscription */
  createCheckout: protectedProcedure
    .input(z.object({
      tierId: z.string(),
      origin: z.string(), // window.location.origin from frontend
    }))
    .mutation(async ({ input, ctx }) => {
      const tier = TIER_MAP[input.tierId];
      if (!tier) throw new Error(`Unknown tier: ${input.tierId}`);

      const db = await getDb();

      // Reuse existing Stripe customer if available
      let customerId: string | undefined;
      if (db) {
        const [userRow] = await db.select({ stripeCustomerId: users.stripeCustomerId })
          .from(users).where(eq(users.id, ctx.user.id)).limit(1);
        customerId = userRow?.stripeCustomerId ?? undefined;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        customer_email: customerId ? undefined : (ctx.user.email ?? undefined),
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          tier_id: tier.id,
          tier_name: tier.name,
        },
        line_items: [
          // One-time setup fee (added as first invoice item)
          {
            price: tier.setupPriceId,
            quantity: 1,
          },
          // Recurring monthly subscription
          {
            price: tier.monthlyPriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            user_id: ctx.user.id.toString(),
            tier_id: tier.id,
            tier_name: tier.name,
          },
        },
        success_url: `${input.origin}/app/checkout-success?session_id={CHECKOUT_SESSION_ID}&tier=${tier.id}`,
        cancel_url: `${input.origin}/get-started?cancelled=1`,
      });

      return { url: session.url! };
    }),

  /**
   * Create a Stripe Checkout Session for a GUEST (unauthenticated) visitor.
   * No login required. The webhook will auto-create the account after payment.
   */
  createGuestCheckout: publicProcedure
    .input(z.object({
      tierId: z.string(),
      origin: z.string(),
    }))
    .mutation(async ({ input }) => {
      const tier = TIER_MAP[input.tierId];
      if (!tier) throw new Error(`Unknown tier: ${input.tierId}`);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        // No customer — Stripe will collect email at checkout
        customer_creation: "always",
        allow_promotion_codes: true,
        phone_number_collection: { enabled: true },
        metadata: {
          // No user_id — webhook will create the account from customer_details.email
          tier_id: tier.id,
          tier_name: tier.name,
          guest_checkout: "true",
        },
        line_items: [
          { price: tier.setupPriceId, quantity: 1 },
          { price: tier.monthlyPriceId, quantity: 1 },
        ],
        subscription_data: {
          metadata: {
            tier_id: tier.id,
            tier_name: tier.name,
          },
        },
        // success_url includes {CHECKOUT_SESSION_ID} so the success page can
        // poll the server for the magic auto-login token
        success_url: `${input.origin}/app/checkout-success?session_id={CHECKOUT_SESSION_ID}&tier=${tier.id}&guest=1`,
        cancel_url: `${input.origin}/get-started?cancelled=1`,
      });

      return { url: session.url! };
    }),

  /** Get current subscription status for the logged-in user */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { status: null, planId: null, planName: null, subscriptionId: null };

    const [userRow] = await db.select({
      stripeSubscriptionId: users.stripeSubscriptionId,
      stripePlanId: users.stripePlanId,
      stripeSubscriptionStatus: users.stripeSubscriptionStatus,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (!userRow?.stripeSubscriptionId) {
      return { status: null, planId: null, planName: null, subscriptionId: null };
    }

    const tier = userRow.stripePlanId ? TIER_MAP[userRow.stripePlanId] : null;

    // Optionally fetch live status from Stripe
    let currentPeriodEnd: number | null = null;
    try {
      const sub = await stripe.subscriptions.retrieve(userRow.stripeSubscriptionId);
        currentPeriodEnd = sub.billing_cycle_anchor ?? null;
    } catch {
      // Subscription may not exist yet in test mode
    }

    return {
      status: userRow.stripeSubscriptionStatus,
      planId: userRow.stripePlanId,
      planName: tier?.name ?? null,
      subscriptionId: userRow.stripeSubscriptionId,
      currentPeriodEnd,
    };
  }),

  /**
   * Poll for the magic auto-login token after a guest checkout.
   * Called by CheckoutSuccess.tsx every 3s until the webhook has created the
   * user account and stored the token. Returns null until it's ready.
   */
  getMagicToken: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      if (!input.sessionId) return { token: null };

      // Retrieve the Stripe checkout session to get the customer email
      let customerEmail: string | null = null;
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["customer_details"],
        });
        customerEmail = session.customer_details?.email ?? null;
      } catch {
        return { token: null };
      }

      if (!customerEmail) return { token: null };

      const db = await getDb();
      if (!db) return { token: null };

      const [userRow] = await db
        .select({ magicLoginToken: users.magicLoginToken })
        .from(users)
        .where(eq(users.email, customerEmail))
        .limit(1);

      return { token: userRow?.magicLoginToken ?? null };
    }),

  /** Get payment history from Stripe */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const [userRow] = await db.select({ stripeCustomerId: users.stripeCustomerId })
      .from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (!userRow?.stripeCustomerId) return [];

    try {
      const invoices = await stripe.invoices.list({
        customer: userRow.stripeCustomerId,
        limit: 24,
      });
      return invoices.data.map((inv) => ({
        id: inv.id,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        description: inv.lines.data[0]?.description ?? null,
      }));
    } catch {
      return [];
    }
  }),
});
