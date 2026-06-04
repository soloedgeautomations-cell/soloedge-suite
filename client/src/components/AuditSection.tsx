import { Check, Phone, Zap, Users, Building, Briefcase, Crown, FileText } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

// SoloAudit pricing tiers. Bullet content rewritten 2026-06-05 to show visible value escalation per tier.
// Each tier shows its FULL deliverable set (cumulative), not a delta — so prospects scanning the cards
// see obvious value growth from $500 → $5,000+. AI Playbook = the deliverable name (replaces "written report").
const AUDIT_TIERS = [
  {
    id: "single",
    name: "Single System Audit",
    subtitle: "1 to 3 people",
    price: "$500",
    icon: Zap,
    color: "from-blue-500 to-blue-400",
    popular: false,
    badge: null,
    bullets: [
      "60-min structured discovery covering 60+ targeted questions across 6 operational areas",
      "Industry-tuned for your vertical (Roofing, Auto, HVAC, Plumbing, or General)",
      "AI Playbook: 3-page action document, delivered within 3-5 business days",
      "Tech stack inventory + per-tool risk flags (what's broken, what to replace)",
      "Top 3 AI opportunities, ranked by ROI and time-to-impact",
      "Bilingual customer-loss estimate (revenue your phone is losing right now)",
      "Audit fee credits 100% toward your install if signed within 30 days*",
    ],
  },
  {
    id: "team",
    name: "Team Audit",
    subtitle: "4 to 10 people",
    price: "$750",
    icon: Users,
    color: "from-sky-600 to-cyan-500",
    popular: true,
    badge: "Most Common",
    bullets: [
      "90-min discovery session, 60+ questions tuned to small-team operations",
      "15-min pre-call to map your tools before the session",
      "Industry-tuned for your vertical (Roofing, Auto, HVAC, Plumbing, or General)",
      "AI Playbook: 5-page action document with phased 90-day roadmap, delivered 3-5 business days after",
      "Tech stack inventory + per-tool risk flags + vendor consolidation hints",
      "Top 5 AI opportunities, ranked by ROI and team-readiness",
      "Bilingual customer-loss estimate",
      "Audit fee credits 100% toward your install if signed within 30 days*",
    ],
  },
  {
    id: "enterprise",
    name: "Full Enterprise Audit",
    subtitle: "11 to 25 people",
    price: "$1,500",
    icon: Building,
    color: "from-emerald-600 to-emerald-500",
    popular: false,
    badge: null,
    bullets: [
      "2-hour discovery session, 60+ questions tuned for multi-role teams",
      "30-min pre-call to map your stack + identify key staff to interview",
      "1 employee deep-dive sub-interview (office manager, front desk, or dispatcher)",
      "Industry-tuned for your vertical (Roofing, Auto, HVAC, Plumbing, or General)",
      "AI Playbook: 7-page action document with phased 90-day roadmap + ROI model, delivered 3-5 business days after",
      "Tech stack inventory + per-tool risk flags + vendor consolidation review",
      "Top 5 AI opportunities, ranked by ROI, ease, and team-readiness",
      "Bilingual customer-loss estimate",
      "ROI calculator customized to YOUR numbers (calls, close rate, ticket size)",
      "30-min follow-up clarification call after delivery",
      "Audit fee credits 100% toward your install if signed within 30 days*",
    ],
  },
  {
    id: "contractor",
    name: "ContractorAudit",
    subtitle: "26 to 50 people",
    price: "$2,500",
    icon: Briefcase,
    color: "from-violet-600 to-purple-500",
    popular: false,
    badge: null,
    bullets: [
      "2-3 hour deep discovery covering 60+ questions tuned for multi-department ops",
      "30-min pre-call with owner to identify staff + map key workflows",
      "2-3 sub-interviews with frontline staff (office, dispatch, field)",
      "Industry-tuned for your vertical (Roofing, Auto, HVAC, Plumbing, or General)",
      "AI Playbook: 10-page action document with phased 90-day roadmap, delivered 3-5 business days after",
      "Tech stack inventory + per-tool risk flags + vendor consolidation review",
      "AI opportunities ranked across all departments",
      "Bilingual customer-loss estimate + multilingual workflow review",
      "ROI calculator customized to YOUR numbers",
      "Compliance + data-sovereignty scan (where your data lives, where it's at risk)",
      "30-min summary delivery call walking through findings",
      "30-day check-in call after install (included)",
      "Audit fee credits 100% toward your install if signed within 30 days*",
    ],
  },
  {
    id: "corporate",
    name: "CorporateAudit",
    subtitle: "50+ people",
    price: "Starts at $5,000",
    icon: Crown,
    color: "from-amber-600 to-orange-500",
    popular: false,
    badge: null,
    bullets: [
      "Multi-day on-site discovery engagement (typically 2-3 days)",
      "Stakeholder mapping (owner, GM, dept heads) + custom-scoped sub-interviews",
      "60+ question framework expanded to cover department-level operations",
      "Industry-tuned for your vertical + cross-department coordination layer",
      "AI Playbook: executive-ready document, typically 15-25 pages, delivered within 7 business days",
      "Tech stack inventory across all departments + vendor consolidation strategy",
      "AI opportunities ranked across the entire org with multi-phase implementation plan",
      "Custom ROI model with department-level breakdown",
      "Multilingual customer coverage analysis",
      "Compliance + data-sovereignty scan (state, federal, industry-specific)",
      "In-person or video executive presentation to your leadership team",
      "60-day implementation check-in + quarterly performance review (first year)",
      "Priority direct access to Murphy (text, call, no gatekeeper)",
      "Audit fee credits 100% toward your install if signed within 30 days*",
    ],
  },
];

export default function AuditSection() {
  return (
    <section id="audit" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/72" offset={2} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            AI Adoption Audit
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Get Your Custom AI Readiness Audit
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            I come to you. I write you a real plan. The plan is yours whether you build with me or not.
          </p>
        </div>

        {/* Tier cards — top 3 on row 1, larger 4 + 5 on row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start mb-6">
          {AUDIT_TIERS.slice(0, 3).map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-7 flex flex-col transition-all duration-200 ${
                  tier.popular
                    ? "glass border-2 border-blue-500/70 shadow-2xl shadow-blue-400/20 ring-1 ring-blue-400/10 md:-mt-3 md:pb-10"
                    : "glass shadow-md border border-gray-100/60 hover:shadow-xl hover:border-gray-200/80"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-md border whitespace-nowrap bg-blue-600 text-white border-blue-500">
                    {tier.badge}
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${tier.color}`}>
                  <Icon size={20} className="text-white" />
                </div>

                <div className="mb-1">
                  <h3 className={`font-display text-xl font-bold ${tier.popular ? "text-blue-700" : "text-gray-900"}`}>
                    {tier.name}
                  </h3>
                  <p className={`text-sm font-medium ${tier.popular ? "text-blue-500" : "text-gray-500"}`}>
                    {tier.subtitle}
                  </p>
                </div>

                <div className={`py-5 mb-5 border-y ${tier.popular ? "border-blue-100" : "border-gray-100"}`}>
                  <div className="text-3xl font-bold text-gray-900">{tier.price}</div>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1 text-sm text-gray-600">
                  {tier.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={14} className={`flex-shrink-0 mt-0.5 ${tier.popular ? "text-blue-600" : "text-green-500"}`} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="tel:+15127029685"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    tier.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                      : "bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
                  }`}
                >
                  Start Your Audit
                </a>
              </div>
            );
          })}
        </div>

        {/* Tier cards row 2 — Contractor + Corporate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start mb-8">
          {AUDIT_TIERS.slice(3).map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className="glass shadow-md border border-gray-100/60 hover:shadow-xl hover:border-gray-200/80 rounded-2xl p-7 flex flex-col transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${tier.color}`}>
                  <Icon size={20} className="text-white" />
                </div>

                <div className="mb-1">
                  <h3 className="font-display text-xl font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{tier.subtitle}</p>
                </div>

                <div className="py-5 mb-5 border-y border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{tier.price}</div>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1 text-sm text-gray-600">
                  {tier.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={14} className="flex-shrink-0 mt-0.5 text-green-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="tel:+15127029685"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
                >
                  Start Your Audit
                </a>
              </div>
            );
          })}
        </div>

        {/* Audit credit disclaimer */}
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <p className="text-xs text-gray-500">
            *Audit fee credits toward your install if you sign within 30 days.
          </p>
        </div>

        {/* Privacy / Data Sovereignty trust band */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="rounded-2xl p-5 border border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-400 shadow-md">
                <FileText size={16} className="text-white" />
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <div className="font-semibold text-gray-900 mb-1">Your data stays YOURS.</div>
                We don't custody your customer info. Your AI runs on YOUR hardware. Your context lives on YOUR machine. Your data stays in YOUR accounts (your Google Sheet, your Calendar, your Gmail). No SoloEdge cloud database. Nothing for us to leak. Nothing for us to lose. If you ever walk away from SoloEdge, you take everything with you because it was already yours.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <a
            href="tel:+15127029685"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-all shadow-lg active:scale-95"
          >
            <Phone size={14} />
            Start Your Audit. (512) 702-9685
          </a>
          <p className="text-xs text-gray-400 mt-2">
            No long calls. No committee. Murphy answers.
          </p>
        </div>
      </div>
    </section>
  );
}
