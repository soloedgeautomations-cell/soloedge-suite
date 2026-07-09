/**
 * shared/auditTiers.ts
 * Single source of truth for SoloAudit tier IDs, names, and pricing (in cents).
 *
 * Used by:
 *   - client/src/components/AuditSection.tsx (display — bullets/icons stay local to that file)
 *   - server/stripe/router.ts (createAuditCheckout — builds the Stripe line item from priceCents)
 *
 * Keeping this in one place is deliberate: the site previously had pricing
 * drift between what different pages/prompts said because there was no
 * single definition. Don't duplicate these numbers anywhere else.
 */

export interface AuditTierDefinition {
  id: string;
  name: string;
  subtitle: string;
  priceCents: number;
}

export const AUDIT_TIERS: AuditTierDefinition[] = [
  { id: "single", name: "Single System Audit", subtitle: "1 to 3 people", priceCents: 50000 },
  { id: "team", name: "Team Audit", subtitle: "4 to 10 people", priceCents: 75000 },
  { id: "enterprise", name: "Full Enterprise Audit", subtitle: "11 to 25 people", priceCents: 150000 },
  { id: "contractor", name: "ContractorAudit", subtitle: "26 to 50 people", priceCents: 250000 },
  { id: "corporate", name: "CorporateAudit", subtitle: "50+ people", priceCents: 500000 },
];

export const AUDIT_TIER_MAP: Record<string, AuditTierDefinition> = Object.fromEntries(
  AUDIT_TIERS.map((t) => [t.id, t])
);

export function formatAuditPrice(tier: AuditTierDefinition): string {
  const dollars = tier.priceCents / 100;
  const formatted = `$${dollars.toLocaleString("en-US")}`;
  return tier.id === "corporate" ? `Starts at ${formatted}` : formatted;
}
