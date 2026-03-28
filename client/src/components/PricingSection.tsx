import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Check, Zap, Shield, Crown } from "lucide-react";

const COMM_PLANS = [
  {
    id: "field-starter",
    name: "Field Starter",
    subtitle: "AI Helper",
    icon: Zap,
    setup: 149,
    monthly: 59,
    perLine: true,
    popular: false,
    color: "from-blue-600 to-blue-400",
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
    icon: Shield,
    setup: 249,
    monthly: 99,
    perLine: true,
    popular: true,
    color: "from-cyan-600 to-cyan-400",
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
    icon: Crown,
    setup: 349,
    monthly: 149,
    perLine: true,
    popular: false,
    color: "from-purple-600 to-purple-400",
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
];

const SCHED_PLANS = [
  {
    id: "sched-starter",
    name: "Scheduling Starter",
    subtitle: "Never Miss a Call",
    icon: Zap,
    setup: 149,
    monthly: 49,
    perLine: false,
    popular: false,
    color: "from-green-600 to-green-400",
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
    icon: Shield,
    setup: 249,
    monthly: 89,
    perLine: false,
    popular: true,
    color: "from-cyan-600 to-cyan-400",
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
    icon: Crown,
    setup: 349,
    monthly: 149,
    perLine: false,
    popular: false,
    color: "from-orange-600 to-orange-400",
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

export default function PricingSection() {
  const { t } = useLang();
  const [activeSuite, setActiveSuite] = useState<"comm" | "sched">("comm");

  const plans = activeSuite === "comm" ? COMM_PLANS : SCHED_PLANS;

  return (
    <section id="pricing" className="section-pad">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-600/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-4">
            PRICING
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto mb-8">
            {t.pricing.subtitle}
          </p>

          {/* Suite Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[oklch(0.13_0.015_240)] border border-white/10">
            <button
              onClick={() => setActiveSuite("comm")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSuite === "comm"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t.pricing.commSuite}
            </button>
            <button
              onClick={() => setActiveSuite("sched")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSuite === "sched"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t.pricing.schedSuite}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 border transition-all ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-600/15 to-[oklch(0.13_0.015_240)] border-blue-500/40 shadow-xl shadow-blue-900/20 scale-[1.02]"
                    : "bg-[oklch(0.13_0.015_240)] border-white/8 hover:border-white/15"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-lg">
                    {t.pricing.mostPopular}
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>

                <div className="mb-1">
                  <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-white/50">{plan.subtitle}</p>
                </div>

                {/* Pricing */}
                <div className="mt-5 mb-6 pb-6 border-b border-white/8">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-white">${plan.monthly}</span>
                    <span className="text-white/50 text-sm">{t.pricing.perMonth}{plan.perLine ? t.pricing.perLine : ""}</span>
                  </div>
                  <div className="text-sm text-white/40">
                    + ${plan.setup} {t.pricing.setupFee}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`block w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  {t.pricing.getStarted}
                </a>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-white/35 mt-10">
          All plans include a 24–48 hour setup. No long-term contracts. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
