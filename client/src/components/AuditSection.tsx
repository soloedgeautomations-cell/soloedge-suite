import { Check, Phone, Zap, Users, Building, Briefcase, Crown, FileText } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

// SoloAudit pricing tiers. Locked 2026-06-02. Foot-in-door product line for SoloCommand.
const AUDIT_TIERS = [
  {
    id: "solo",
    name: "Single User Audit",
    subtitle: "1 to 3 people",
    price: "$500",
    sessionTime: "60-minute sit-down",
    deliverable: "2 to 3 page written report",
    icon: Zap,
    color: "from-blue-500 to-blue-400",
    popular: false,
    badge: null,
  },
  {
    id: "crew",
    name: "Team Audit",
    subtitle: "4 to 10 people",
    price: "$750",
    sessionTime: "90-minute sit-down",
    deliverable: "4-page written report",
    icon: Users,
    color: "from-sky-600 to-cyan-500",
    popular: true,
    badge: "Most Common",
  },
  {
    id: "team",
    name: "Full Enterprise Audit",
    subtitle: "11 to 25 people",
    price: "$1,500",
    sessionTime: "2-hour sit-down + 1 sub-interview",
    deliverable: "6-page written report",
    icon: Building,
    color: "from-emerald-600 to-emerald-500",
    popular: false,
    badge: null,
  },
  {
    id: "contractor",
    name: "ContractorAudit",
    subtitle: "26 to 50 people",
    price: "$2,500",
    sessionTime: "2 to 3 hours + 2 to 3 sub-interviews",
    deliverable: "8-page report + 30-minute summary call",
    icon: Briefcase,
    color: "from-violet-600 to-purple-500",
    popular: false,
    badge: null,
  },
  {
    id: "corporate",
    name: "CorporateAudit",
    subtitle: "50+ people",
    price: "Starts at $5,000",
    sessionTime: "Multi-day",
    deliverable: "Custom scope, executive presentation",
    icon: Crown,
    color: "from-amber-600 to-orange-500",
    popular: false,
    badge: null,
  },
];

const INCLUDED_IN_EVERY_AUDIT = [
  "Industry-tuned discovery (Roofing, Auto, or your vertical)",
  "Bilingual coverage check (English and Spanish)",
  "Tech stack inventory and risk flags",
  "Top 3 AI opportunities ranked by ROI and ease",
  "Recommended sequence and next-step proposal",
  "Local-first data plan. Your data stays in YOUR accounts. Your AI runs on YOUR hardware.",
  "Pricing for the build phase (Starter, Full, or Retainer)",
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
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className={`flex-shrink-0 mt-0.5 ${tier.popular ? "text-blue-600" : "text-green-500"}`} />
                    {tier.sessionTime}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className={`flex-shrink-0 mt-0.5 ${tier.popular ? "text-blue-600" : "text-green-500"}`} />
                    {tier.deliverable}
                  </li>
                </ul>

                <a
                  href="tel:+15127029685"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    tier.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                      : "bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
                  }`}
                >
                  Request Audit
                </a>
              </div>
            );
          })}
        </div>

        {/* Tier cards row 2 — Contractor + Corporate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start mb-10">
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
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="flex-shrink-0 mt-0.5 text-green-500" />
                    {tier.sessionTime}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={14} className="flex-shrink-0 mt-0.5 text-green-500" />
                    {tier.deliverable}
                  </li>
                </ul>

                <a
                  href="tel:+15127029685"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
                >
                  {tier.id === "corporate" ? "Request a Custom Quote" : `Schedule ${tier.name}`}
                </a>
              </div>
            );
          })}
        </div>

        {/* Every Audit Includes callout */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass rounded-2xl p-6 border border-gray-100">
            <p className="text-center text-sm font-semibold text-gray-800 mb-4">
              Every Audit includes
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              {INCLUDED_IN_EVERY_AUDIT.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
            Schedule Your Audit. (512) 702-9685
          </a>
          <p className="text-xs text-gray-400 mt-2">
            No long calls. No committee. Murphy answers.
          </p>
        </div>
      </div>
    </section>
  );
}
