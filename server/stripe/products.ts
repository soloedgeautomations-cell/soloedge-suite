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
  // ─── Communication Suite ─────────────────────────────────────────────────────
  {
    id: "field-starter",
    name: "Field Starter",
    subtitle: "AI Helper",
    description: "AI call answering for solo operators — business hours, EN/ES, lead capture.",
    suite: "communication",
    setupAmount: 19900,
    monthlyAmount: 5900,
    productId: "prod_UFDRxDBuSggq4T",
    setupPriceId: "price_1TGj0FFNmcLDjZlEvDzisAEw",
    monthlyPriceId: "price_1TGj0GFNmcLDjZlEih6iVkwP",
    popular: false,
    features: [
      "AI call answering (business hours)",
      "Basic lead capture & text alerts",
      "English + Spanish support",
      "Voicemail transcription",
      "Monthly call summary",
      "Email support",
    ],
  },
  {
    id: "field-pro",
    name: "Field Pro",
    subtitle: "AI Specialist",
    description: "24/7 AI answering with full trilingual support and live interpreter desk.",
    suite: "communication",
    setupAmount: 29900,
    monthlyAmount: 9900,
    productId: "prod_UFDRtIVAPkL1DU",
    setupPriceId: "price_1TGj0HFNmcLDjZlEddim86QN",
    monthlyPriceId: "price_1TGj0IFNmcLDjZlEvT7EA188",
    popular: true,
    features: [
      "Everything in Field Starter",
      "24/7 AI call answering",
      "Full EN/ES/ZH trilingual support",
      "Live interpreter desk mode",
      "CRM lead capture & follow-up",
      "Weekly performance reports",
      "Priority support",
    ],
  },
  {
    id: "field-team",
    name: "Field Team",
    subtitle: "Crew System",
    description: "Full crew system with Riley SR Ops Manager, sub coordinator, and admin panel.",
    suite: "communication",
    setupAmount: 59900,
    monthlyAmount: 34900,
    productId: "prod_UFDR5d8ideund7",
    setupPriceId: "price_1TGj0JFNmcLDjZlEN4eNhxiz",
    monthlyPriceId: "price_1TGj0KFNmcLDjZlETPomi7Li",
    popular: false,
    features: [
      "Everything in Field Pro",
      "Riley SR Ops Manager mode",
      "Sub coordinator & task routing",
      "Field voice check-in agent",
      "Safety alert broadcast",
      "Bilingual daily summaries",
      "Admin panel access",
      "Dedicated onboarding",
    ],
  },
  // ─── Scheduling Suite ─────────────────────────────────────────────────────────
  {
    id: "sched-starter",
    name: "Scheduling Starter",
    subtitle: "Never Miss a Call",
    description: "AI appointment booking with confirmation & reminder texts, up to 50/month.",
    suite: "scheduling",
    setupAmount: 14900,
    monthlyAmount: 4900,
    productId: "prod_UFDR225X1q8xaR",
    setupPriceId: "price_1TGj0LFNmcLDjZlERIkUGxJl",
    monthlyPriceId: "price_1TGj0MFNmcLDjZlEJyyrdF7q",
    popular: false,
    features: [
      "AI appointment booking",
      "Confirmation & reminder texts",
      "Basic calendar integration",
      "Up to 50 bookings/month",
      "English support",
    ],
  },
  {
    id: "sched-pro",
    name: "Scheduling Pro",
    subtitle: "Front Desk Assist",
    description: "Unlimited bookings with trilingual support and no-show follow-up automation.",
    suite: "scheduling",
    setupAmount: 24900,
    monthlyAmount: 8900,
    productId: "prod_UFDR0AvhqFcbN4",
    setupPriceId: "price_1TGj0OFNmcLDjZlEm3wnlm5l",
    monthlyPriceId: "price_1TGj0OFNmcLDjZlEwsSWEPGk",
    popular: true,
    features: [
      "Everything in Starter",
      "Unlimited bookings",
      "EN/ES/ZH trilingual booking",
      "Reschedule & cancellation handling",
      "No-show follow-up automation",
      "Weekly booking reports",
    ],
  },
  {
    id: "sched-plus",
    name: "Scheduling Plus",
    subtitle: "Revenue Engine",
    description: "Revenue engine with upsell conversations, multi-location, and VIP recognition.",
    suite: "scheduling",
    setupAmount: 34900,
    monthlyAmount: 14900,
    productId: "prod_UFDR1FBcAryOsy",
    setupPriceId: "price_1TGj0QFNmcLDjZlE6og7bna4",
    monthlyPriceId: "price_1TGj0QFNmcLDjZlEY9azFEY5",
    popular: false,
    features: [
      "Everything in Pro",
      "Upsell & package conversations",
      "Multi-location support",
      "VIP client recognition",
      "Revenue tracking dashboard",
      "Custom booking flows",
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
