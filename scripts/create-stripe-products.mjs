/**
 * scripts/create-stripe-products.mjs
 * Run once to create Stripe products and prices for all 6 SoloEdge tiers.
 * Usage: STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.mjs
 */

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY env var not set");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

const TIERS = [
  // Communication Suite
  {
    id: "field-starter",
    name: "Field Starter",
    description: "AI call answering for solo operators — business hours, EN/ES, lead capture.",
    setupAmount: 19900,   // $199.00
    monthlyAmount: 5900,  // $59.00
    metadata: { suite: "communication", tier: "starter" },
  },
  {
    id: "field-pro",
    name: "Field Pro",
    description: "24/7 AI answering with full trilingual support and live interpreter desk.",
    setupAmount: 29900,   // $299.00
    monthlyAmount: 9900,  // $99.00
    metadata: { suite: "communication", tier: "pro" },
  },
  {
    id: "field-team",
    name: "Field Team",
    description: "Full crew system with Riley SR Ops Manager, sub coordinator, and admin panel.",
    setupAmount: 59900,   // $599.00
    monthlyAmount: 34900, // $349.00
    metadata: { suite: "communication", tier: "team" },
  },
  // Scheduling Suite
  {
    id: "sched-starter",
    name: "Scheduling Starter",
    description: "AI appointment booking with confirmation & reminder texts, up to 50/month.",
    setupAmount: 14900,   // $149.00
    monthlyAmount: 4900,  // $49.00
    metadata: { suite: "scheduling", tier: "starter" },
  },
  {
    id: "sched-pro",
    name: "Scheduling Pro",
    description: "Unlimited bookings with trilingual support and no-show follow-up automation.",
    setupAmount: 24900,   // $249.00
    monthlyAmount: 8900,  // $89.00
    metadata: { suite: "scheduling", tier: "pro" },
  },
  {
    id: "sched-plus",
    name: "Scheduling Plus",
    description: "Revenue engine with upsell conversations, multi-location, and VIP recognition.",
    setupAmount: 34900,   // $349.00
    monthlyAmount: 14900, // $149.00
    metadata: { suite: "scheduling", tier: "plus" },
  },
];

const results = {};

for (const tier of TIERS) {
  console.log(`\nCreating product: ${tier.name}...`);

  // Create product
  const product = await stripe.products.create({
    name: `SoloEdge ${tier.name}`,
    description: tier.description,
    metadata: { ...tier.metadata, soloedge_tier_id: tier.id },
  });
  console.log(`  Product created: ${product.id}`);

  // Create one-time setup fee price
  const setupPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: tier.setupAmount,
    currency: "usd",
    nickname: `${tier.name} Setup Fee`,
    metadata: { type: "setup_fee", soloedge_tier_id: tier.id },
  });
  console.log(`  Setup price created: ${setupPrice.id} ($${tier.setupAmount / 100})`);

  // Create recurring monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: tier.monthlyAmount,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: `${tier.name} Monthly`,
    metadata: { type: "monthly_subscription", soloedge_tier_id: tier.id },
  });
  console.log(`  Monthly price created: ${monthlyPrice.id} ($${tier.monthlyAmount / 100}/mo)`);

  results[tier.id] = {
    productId: product.id,
    setupPriceId: setupPrice.id,
    monthlyPriceId: monthlyPrice.id,
    name: tier.name,
    setupAmount: tier.setupAmount,
    monthlyAmount: tier.monthlyAmount,
    metadata: tier.metadata,
  };
}

console.log("\n\n=== PRICE IDs (copy into server/stripe/products.ts) ===\n");
console.log(JSON.stringify(results, null, 2));
console.log("\n=== Done ===");
