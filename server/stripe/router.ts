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
