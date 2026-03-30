# Stripe Live Mode Go-Live Checklist

This document is the step-by-step guide to switch SoloEdge from Stripe **test mode** to **live mode** and start accepting real payments.

---

## Step 1 — Create Live Products in Stripe Dashboard

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to LIVE mode** (toggle in the top-left corner)
3. Go to **Products** → **Add Product** for each of the 6 tiers below:

| Tier | Setup Fee | Monthly | Product Name |
|---|---|---|---|
| Field Starter | $199 | $59/mo | SoloEdge Field Starter |
| Field Pro | $299 | $99/mo | SoloEdge Field Pro |
| Field Team | $599 | $349/mo | SoloEdge Field Team |
| Scheduling Starter | $149 | $49/mo | SoloEdge Scheduling Starter |
| Scheduling Pro | $249 | $89/mo | SoloEdge Scheduling Pro |
| Scheduling Plus | $349 | $149/mo | SoloEdge Scheduling Plus |

For each product, create **two prices**:
- **One-time** price for the setup fee
- **Recurring monthly** price for the subscription

---

## Step 2 — Copy Live Price IDs into `products.live.ts`

Open `server/stripe/products.live.ts` and replace every `price_LIVE_REPLACE_*` placeholder with the real Price IDs from Stripe.

```ts
"field-starter": {
  productId:      "prod_REAL_ID_HERE",
  setupPriceId:   "price_REAL_SETUP_ID_HERE",
  monthlyPriceId: "price_REAL_MONTHLY_ID_HERE",
},
```

---

## Step 3 — Set Up Live Webhook

1. In Stripe Dashboard (LIVE mode) → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://soloedgeautomations.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** (`whsec_live_xxx`)

---

## Step 4 — Update Deployment Environment Variables

Set these in your deployment platform (Manus / Railway / Render / etc.):

```bash
STRIPE_SECRET_KEY=sk_live_xxx        # Your live secret key
STRIPE_WEBHOOK_SECRET=whsec_live_xxx # Your live webhook signing secret
STRIPE_MODE=live                     # Activates live Price IDs in products.live.ts
```

> **Important:** The app will automatically detect `sk_live_` prefix and switch to live Price IDs. If `products.live.ts` still has placeholder IDs, it will log a warning and fall back to test mode safely.

---

## Step 5 — Verify Before First Real Sale

Run the live mode validation check:

```bash
node_modules/.bin/tsx scripts/test-wetpaws-mock.ts
```

Then do one final test with a real card (you can refund it immediately):
- Go to `https://soloedgeautomations.com/get-started`
- Pick any tier
- Use a real card (not a test card)
- Verify the full flow: account created → Twilio number provisioned → welcome SMS + email received → dashboard accessible

---

## Step 6 — Monitor First Sales

After going live, watch for:
- Telegram alerts from Riley (you'll get one per sale)
- Stripe Dashboard → Payments for successful charges
- TiDB Cloud → `users` table for new rows with `stripeSubscriptionStatus = 'active'`

---

## Rollback

To revert to test mode at any time:
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_MODE=test
```

No code changes needed — the switch is entirely environment-variable driven.
