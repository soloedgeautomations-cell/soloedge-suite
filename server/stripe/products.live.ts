/**
 * server/stripe/products.live.ts
 *
 * ─── STRIPE LIVE MODE PRICE IDs ──────────────────────────────────────────────
 *
 * This file contains the LIVE mode Stripe Price IDs for all 6 SoloEdge tiers.
 * It is used when NODE_ENV=production and STRIPE_SECRET_KEY starts with "sk_live_".
 *
 * ─── HOW TO POPULATE THESE IDs ───────────────────────────────────────────────
 *
 * 1. Log into Stripe Dashboard → https://dashboard.stripe.com
 * 2. Switch to LIVE mode (toggle in top-left)
 * 3. Go to Products → Create each product below
 * 4. For each product, create TWO prices:
 *    - One-time setup fee (the setupAmount)
 *    - Recurring monthly subscription (the monthlyAmount)
 * 5. Copy the Price IDs (price_live_xxx) into this file
 * 6. Set STRIPE_MODE=live in your deployment environment
 *
 * ─── PRODUCT SETUP GUIDE ─────────────────────────────────────────────────────
 *
 * | Tier             | Setup Fee | Monthly | Suite         |
 * |------------------|-----------|---------|---------------|
 * | Field Starter    | $199      | $59     | Communication |
 * | Field Pro        | $299      | $99     | Communication |
 * | Field Team       | $599      | $349    | Communication |
 * | Sched Starter    | $149      | $49     | Scheduling    |
 * | Sched Pro        | $249      | $89     | Scheduling    |
 * | Sched Plus       | $349      | $149    | Scheduling    |
 *
 * ─── WEBHOOK SETUP ───────────────────────────────────────────────────────────
 *
 * In Stripe Dashboard → Webhooks → Add endpoint:
 *   URL: https://soloedgeautomations.com/api/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.updated,
 *           customer.subscription.deleted, invoice.payment_failed
 *
 * Copy the webhook signing secret (whsec_live_xxx) and set:
 *   STRIPE_WEBHOOK_SECRET=whsec_live_xxx
 *
 * ─── ENV VARS NEEDED FOR LIVE MODE ───────────────────────────────────────────
 *
 *   STRIPE_SECRET_KEY=sk_live_xxx
 *   STRIPE_WEBHOOK_SECRET=whsec_live_xxx
 *   STRIPE_MODE=live
 *
 */

import type { TierDefinition } from "./products";

/**
 * Live mode Price IDs — replace placeholders with real IDs from Stripe Dashboard.
 * Format: { tierId: { setupPriceId, monthlyPriceId, productId } }
 */
export const LIVE_PRICE_IDS: Record<string, {
  productId: string;
  setupPriceId: string;
  monthlyPriceId: string;
}> = {
  "field-starter": {
    productId:      "prod_LIVE_REPLACE_field_starter",
    setupPriceId:   "price_LIVE_REPLACE_field_starter_setup",
    monthlyPriceId: "price_LIVE_REPLACE_field_starter_monthly",
  },
  "field-pro": {
    productId:      "prod_LIVE_REPLACE_field_pro",
    setupPriceId:   "price_LIVE_REPLACE_field_pro_setup",
    monthlyPriceId: "price_LIVE_REPLACE_field_pro_monthly",
  },
  "field-team": {
    productId:      "prod_LIVE_REPLACE_field_team",
    setupPriceId:   "price_LIVE_REPLACE_field_team_setup",
    monthlyPriceId: "price_LIVE_REPLACE_field_team_monthly",
  },
  "sched-starter": {
    productId:      "prod_LIVE_REPLACE_sched_starter",
    setupPriceId:   "price_LIVE_REPLACE_sched_starter_setup",
    monthlyPriceId: "price_LIVE_REPLACE_sched_starter_monthly",
  },
  "sched-pro": {
    productId:      "prod_LIVE_REPLACE_sched_pro",
    setupPriceId:   "price_LIVE_REPLACE_sched_pro_setup",
    monthlyPriceId: "price_LIVE_REPLACE_sched_pro_monthly",
  },
  "sched-plus": {
    productId:      "prod_LIVE_REPLACE_sched_plus",
    setupPriceId:   "price_LIVE_REPLACE_sched_plus_setup",
    monthlyPriceId: "price_LIVE_REPLACE_sched_plus_monthly",
  },
};

/**
 * Returns true if the app is configured to use Stripe live mode.
 * Checks both the STRIPE_MODE env var and the key prefix.
 */
export function isLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = process.env.STRIPE_MODE ?? "";
  return key.startsWith("sk_live_") || mode === "live";
}

/**
 * Returns true if all live Price IDs have been populated (no placeholders).
 * Call this at startup to warn if live mode is enabled but IDs are missing.
 */
export function validateLivePriceIds(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const [tierId, ids] of Object.entries(LIVE_PRICE_IDS)) {
    if (ids.setupPriceId.includes("REPLACE"))   missing.push(`${tierId}.setupPriceId`);
    if (ids.monthlyPriceId.includes("REPLACE")) missing.push(`${tierId}.monthlyPriceId`);
    if (ids.productId.includes("REPLACE"))      missing.push(`${tierId}.productId`);
  }
  return { valid: missing.length === 0, missing };
}
