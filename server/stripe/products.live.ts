/**
 * server/stripe/products.live.ts
 *
 * ─── STRIPE LIVE MODE PRICE IDs ──────────────────────────────────────────────
 *
 * This file contains the LIVE mode Stripe Price IDs for all 3 SoloEdge tiers.
 * It is used when STRIPE_MODE=live and STRIPE_SECRET_KEY starts with "sk_live_".
 *
 * ─── PRODUCT SETUP ───────────────────────────────────────────────────────────
 *
 * | Tier     | Setup Fee | Monthly | Notes                         |
 * |----------|-----------|---------|-------------------------------|
 * | Starter  | $149      | $59     | Basic Riley                   |
 * | Pro      | $249      | $99     | Focused Riley — Most Popular  |
 * | Premium  | $499      | $179    | Advanced Riley + Slack        |
 *
 * ─── WEBHOOK ─────────────────────────────────────────────────────────────────
 *
 * Endpoint: https://soloedge.app/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.updated,
 *         customer.subscription.deleted, invoice.payment_failed
 *
 */

/**
 * Live mode Price IDs — populated from Stripe Dashboard on 2026-03-31.
 */
export const LIVE_PRICE_IDS: Record<string, {
  productId: string;
  setupPriceId: string;
  monthlyPriceId: string;
}> = {
  "starter": {
    productId:      "prod_UFiKRwX1KTI28J",
    setupPriceId:   "price_1THCtsFFvpsf1OXSMfxzp1FS",
    monthlyPriceId: "price_1THCtuFFvpsf1OXSVob72B7h",
  },
  "pro": {
    productId:      "prod_UFiKVyyiwk6lCB",
    setupPriceId:   "price_1THCtxFFvpsf1OXSY31tM10q",
    monthlyPriceId: "price_1THCtzFFvpsf1OXSGmJIIagA",
  },
  "premium": {
    productId:      "prod_UFiKJMaO0IT2c8",
    setupPriceId:   "price_1THCu2FFvpsf1OXSDa5hMeWk",
    monthlyPriceId: "price_1THCu3FFvpsf1OXSC037wkec",
  },
};

/**
 * Returns true if the app is configured to use Stripe live mode.
 */
export function isLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = process.env.STRIPE_MODE ?? "";
  return key.startsWith("sk_live_") || mode === "live";
}

/**
 * Returns true if all live Price IDs have been populated (no placeholders).
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
