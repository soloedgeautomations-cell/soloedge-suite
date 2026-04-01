/**
 * server/stripe/products.ts
 * Single source of truth for SoloEdge pricing tiers and Stripe Price IDs.
 * All prices are in USD cents.
 *
 * In TEST mode (default): uses the test Price IDs defined in TIERS below.
 * In LIVE mode: overlays the live Price IDs from products.live.ts.
 *
 * To enable live mode, set in your deployment:
 *   STRIPE_SECRET_KEY=sk_live_xxx
 *   STRIPE_MODE=live
 */

export interface TierDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  suite: "communication" | "scheduling";
  setupAmount: number;   // cents
  monthlyAmount: number; // cents
  productId: string;
  setupPriceId: string;
  monthlyPriceId: string;
  popular: boolean;
  features: string[];
}

export const TIERS: TierDefinition[] = [
  // ─── Starter ─────────────────────────────────────────────────────────────────
  {
    id: "starter",
    name: "Starter",
    subtitle: "Basic Riley",
    description: "Riley answers your calls, handles basic inquiries, captures leads, and helps with email — 24/7, no days off.",
    suite: "communication",
    setupAmount: 14900,   // $149
    monthlyAmount: 5900,  // $59
    productId: "prod_starter_test",
    setupPriceId: "price_starter_setup_test",
    monthlyPriceId: "price_starter_monthly_test",
    popular: false,
    features: [
      "AI call answering 24/7",
      "Lead capture & instant text alerts",
      "English + Spanish support",
      "Voicemail transcription",
      "Basic email assistance",
      "Monthly call summary report",
      "Email support",
    ],
  },
  // ─── Pro ─────────────────────────────────────────────────────────────────────
  {
    id: "pro",
    name: "Pro",
    subtitle: "Focused Riley",
    description: "Riley learns your industry, handles full scheduling, and follows up with leads automatically. The smart choice for growing businesses.",
    suite: "communication",
    setupAmount: 24900,   // $249
    monthlyAmount: 9900,  // $99
    productId: "prod_pro_test",
    setupPriceId: "price_pro_setup_test",
    monthlyPriceId: "price_pro_monthly_test",
    popular: true,
    features: [
      "Everything in Starter",
      "Industry-tuned AI personality",
      "Full appointment scheduling",
      "EN / ES / ZH trilingual support",
      "Automated lead follow-up",
      "No-show reduction reminders",
      "Weekly performance reports",
      "Priority support",
    ],
  },
  // ─── Premium ─────────────────────────────────────────────────────────────────
  {
    id: "premium",
    name: "Premium",
    subtitle: "Advanced Riley",
    description: "A fully customized Riley built around your business — with Slack integration, extra phone lines, usage analytics, and a dedicated support team.",
    suite: "communication",
    setupAmount: 49900,   // $499
    monthlyAmount: 17900, // $179
    productId: "prod_premium_test",
    setupPriceId: "price_premium_setup_test",
    monthlyPriceId: "price_premium_monthly_test",
    popular: false,
    features: [
      "Everything in Pro",
      "Fully custom AI personality & scripts",
      "Slack integration",
      "Up to 3 additional phone numbers",
      "Advanced usage reports & ROI stats",
      "Multi-location support",
      "Dedicated onboarding specialist",
      "Priority phone & Slack support",
    ],
  },
];

export const TIER_MAP = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<string, TierDefinition>;

/**
 * Returns the active tier list with the correct Price IDs for the current mode.
 * In live mode, overlays the LIVE_PRICE_IDS from products.live.ts.
 * Falls back to test mode if live IDs are not yet populated.
 */
export function getActiveTiers(): TierDefinition[] {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const stripeMode = process.env.STRIPE_MODE ?? "";
  const isLive = stripeKey.startsWith("sk_live_") || stripeMode === "live";

  if (!isLive) return TIERS;

  // Dynamically import live IDs — avoids hard dependency in test environments
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LIVE_PRICE_IDS, validateLivePriceIds } = require("./products.live") as
      typeof import("./products.live");

    const { valid, missing } = validateLivePriceIds();
    if (!valid) {
      console.warn(
        `[Stripe] LIVE mode enabled but ${missing.length} Price IDs are still placeholders. ` +
        `Falling back to TEST mode. Missing: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`
      );
      return TIERS;
    }

    return TIERS.map((tier) => {
      const live = LIVE_PRICE_IDS[tier.id];
      if (!live) return tier;
      return {
        ...tier,
        productId:      live.productId,
        setupPriceId:   live.setupPriceId,
        monthlyPriceId: live.monthlyPriceId,
      };
    });
  } catch {
    console.warn("[Stripe] Could not load products.live.ts — using test mode Price IDs");
    return TIERS;
  }
}

/** Format cents as "$X" */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
