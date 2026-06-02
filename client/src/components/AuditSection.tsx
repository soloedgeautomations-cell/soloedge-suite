import { useState } from "react";
import { Check, Zap, Users, Building, Briefcase, Crown, Phone, FileText } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const AUDIT_TIERS = [
  {
    id: "solo",
    name: "SoloAudit",
    subtitle: "1–3 people",
    price: 500,
    sessionTime: "60 min",
    deliverable: "2–3 page written report",
    cta: "Schedule SoloAudit",
    icon: Zap,
    color: "from-blue-500 to-blue-400",
    popular: false,
  },
  {
    id: "crew",
    name: "CrewAudit",
    subtitle: "4–10 people",
    price: 750,
    sessionTime: "90 min",
    deliverable: "4 page written report",
    cta: "Schedule CrewAudit",
    icon: Users,
    color: "from-sky-600 to-cyan-500",
    popular: true,
    badge: "Most Common",
  },
  {
    id: "team",
    name: "TeamAudit",
    subtitle: "11–25 people",
    price: 1500,
    sessionTime: "2 hr + sub-interview",
    deliverable: "6 page report",
    cta: "Schedule TeamAudit",
    icon: Building,
    color: "from-emerald-600 to-emerald-500",
    popular: false,
  },
  {
    id: "contractor",
    name: "ContractorAudit",
    subtitle: "26–50 people",
    price: 2500,
    sessionTime: "2-3 hr + 2-3 sub-interviews",
    deliverable: "8 page report + 30-min summary call",
    cta: "Schedule ContractorAudit",
    icon: Briefcase,
    color: "from-violet-600 to-purple-500",
    popular: false,
  },
  {
    id: "corporate",
    name: "CorporateAudit",
    subtitle: "50+ people",
    price: null,
    priceLabel: "Starts at $5,000",
    sessionTime: "Multi-day",
    deliverable: "Custom scope, executive presentation",
    cta: "Request a Custom Quote",
    icon: Crown,
    color: "from-amber-600 to-orange-500",
    popular: false,
  },
];

const INCLUSIONS = [
  "Industry-tuned discovery (Roofing, Auto, or your vertical)",
  "Bilingual coverage check (English + Spanish)",
  "Tech stack inventory + risk flags",
  "Top 3 AI opportunities ranked by ROI and ease",
  "Recommended sequence + next-step proposal",
  "Local-first data plan, your data stays in YOUR accounts, your AI runs on YOUR hardware",
  "Pricing for the build phase (Starter AIOS / Full AIOS / Retainer)",
];

export default function AuditSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleCTAClick = () => {
    window.location.href = "tel:+15123991605";
  };

  return (
    <section id="audit" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/72" offset={6} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            AI Adoption Audit
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Start with a 90-minute sit-down. $500.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            We come to you. We write you a real plan. The plan's yours whether you build with us or not.
          </p>
        </div>

        {/* First 3 Cards (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start mb-6">
          {AUDIT_TIERS.slice(0, 3).map((tier) => (
            <AuditCard
              key={tier.id}
              tier={tier}
              isHovered={hoveredId === tier.id}
              onMouseEnter={() => setHoveredId(tier.id)}
              onMouseLeave={() => setHoveredId(null)}
              onCTA={handleCTAClick}
            />
          ))}
        </div>

        {/* Last 2 Cards (Larger) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start mb-12">
          {AUDIT_TIERS.slice(3).map((tier) => (
            <AuditCard
              key={tier.id}
              tier={tier}
              isHovered={hoveredId === tier.id}
              onMouseEnter={() => setHoveredId(tier.id)}
              onMouseLeave={() => setHoveredId(null)}
              onCTA={handleCTAClick}
            />
          ))}
        </div>

        {/* Inclusions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="glass rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Check className="text-green-500" />
              Every Audit Includes:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {INCLUSIONS.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Data Sovereignty Trust Band */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-amber-50/50 border-2 border-amber-200/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <FileText className="text-amber-600" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-amber-900 mb-1">Your data stays YOURS</h4>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                We write to YOUR Google Sheet, YOUR calendar, YOUR Gmail. Nothing custodied by SoloEdge.
                You walk away with everything if you ever leave. That's the local-first promise.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <button
            onClick={handleCTAClick}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-200 active:scale-95 mb-4"
          >
            <Phone size={20} />
            Schedule Your Audit, (512) 399-1605
          </button>
          <p className="text-sm font-medium text-gray-500">
            No long calls, no committee. Murphy answers.
          </p>
        </div>
      </div>
    </section>
  );
}

function AuditCard({ tier, isHovered, onMouseEnter, onMouseLeave, onCTA }: any) {
  const Icon = tier.icon;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative rounded-2xl p-7 flex flex-col transition-all duration-200 ${
        tier.popular
          ? "glass border-2 border-blue-500/70 shadow-2xl shadow-blue-400/20 ring-1 ring-blue-400/10 md:-mt-3 md:pb-10"
          : isHovered
          ? "glass shadow-xl border border-gray-200/80"
          : "glass shadow-md border border-gray-100/60"
      }`}
    >
      {/* Badge */}
      {tier.badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-md border whitespace-nowrap ${
          tier.popular
            ? "bg-blue-600 text-white border-blue-500"
            : "bg-violet-600 text-white border-violet-500"
        }`}>
          {tier.badge}
        </div>
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${tier.color}`}>
        <Icon size={20} className="text-white" />
      </div>

      {/* Title */}
      <div className="mb-4">
        <h3 className={`font-display text-xl font-bold ${tier.popular ? "text-blue-700" : "text-gray-900"}`}>
          {tier.name}
        </h3>
        <p className={`text-sm font-medium ${tier.popular ? "text-blue-500" : "text-gray-500"}`}>
          {tier.subtitle}
        </p>
      </div>

      {/* Pricing */}
      <div className={`py-5 mb-5 border-y ${tier.popular ? "border-blue-100" : "border-gray-100"}`}>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {tier.price ? `$${tier.price}` : tier.priceLabel}
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {tier.sessionTime} session
        </div>
      </div>

      {/* Deliverable */}
      <div className="flex-1 mb-7">
        <p className="text-sm font-semibold text-gray-700 mb-2">Deliverable:</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          {tier.deliverable}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onCTA}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
          tier.popular
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
            : "bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
        }`}
      >
        {tier.cta}
      </button>
    </div>
  );
}
