import { useState } from "react";
import { Check, Zap, Shield, Crown, ArrowRight, Phone } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";
import { trpc } from "@/lib/trpc";

// ─── Static fallback (used if tRPC is unavailable) ────────────────────────────
const STATIC_PLANS = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Basic Riley",
    description: "Riley answers every call, captures leads, and handles basic inquiries — 24/7, no days off.",
    setupAmount: 14900,
    monthlyAmount: 5900,
    popular: false,
    icon: Zap,
    color: "from-blue-500 to-blue-400",
    badge: null,
    features: [
      "AI call answering 24/7",
      "Lead capture & instant text alerts",
      "English + Spanish support",
      "Voicemail transcription",
      "Basic email assistance",
      "Monthly call summary report",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Focused Riley",
    description: "Riley learns your industry, handles full scheduling, and follows up with leads automatically. The smart choice for growing businesses.",
    setupAmount: 24900,
    monthlyAmount: 9900,
    popular: true,
    icon: Shield,
    color: "from-sky-600 to-cyan-500",
    badge: "Most Popular",
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
    cta: "Start with Pro",
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Advanced Riley",
    description: "A fully customized Riley built around your business — with Slack integration, extra phone lines, deep analytics, and a dedicated support team.",
    setupAmount: 49900,
    monthlyAmount: 17900,
    popular: false,
    icon: Crown,
    color: "from-violet-600 to-purple-500",
    badge: "Best Value",
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
    cta: "Go Premium",
  },
];

function fmt(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

export default function PricingSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Attempt to load live tier data from server (falls back to static)
  const { data: serverTiers } = trpc.stripe.getTiers.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Merge server data with static icon/color/cta metadata
  const plans = STATIC_PLANS.map((sp) => {
    const server = serverTiers?.find((t) => t.id === sp.id);
    return server
      ? {
          ...sp,
          name: server.name,
          subtitle: server.subtitle,
          description: server.description,
          setupAmount: server.setupAmount,
          monthlyAmount: server.monthlyAmount,
          popular: server.popular,
          features: server.features,
        }
      : sp;
  });

  return (
    <section id="pricing" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/72" offset={6} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            Simple Pricing
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            One AI receptionist.<br className="hidden md:block" /> Three power levels.
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Every plan includes a dedicated phone number, 24/7 call answering, and zero-touch setup.
            No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHovered = hoveredId === plan.id;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredId(plan.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative rounded-2xl p-7 flex flex-col transition-all duration-200 ${
                  plan.popular
                    ? "glass border-2 border-blue-500/70 shadow-2xl shadow-blue-400/20 ring-1 ring-blue-400/10 md:-mt-3 md:pb-10"
                    : isHovered
                    ? "glass shadow-xl border border-gray-200/80"
                    : "glass shadow-md border border-gray-100/60"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-md border whitespace-nowrap ${
                    plan.popular
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-violet-600 text-white border-violet-500"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${plan.color}`}>
                  <Icon size={20} className="text-white" />
                </div>

                {/* Title */}
                <div className="mb-1">
                  <h3 className={`font-display text-xl font-bold ${plan.popular ? "text-blue-700" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm font-medium ${plan.popular ? "text-blue-500" : "text-gray-500"}`}>
                    {plan.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 mt-2 mb-5 leading-relaxed">
                  {plan.description}
                </p>

                {/* Pricing */}
                <div className={`py-5 mb-5 border-y ${plan.popular ? "border-blue-100" : "border-gray-100"}`}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{fmt(plan.monthlyAmount)}</span>
                    <span className="text-sm text-gray-400">/month</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    + {fmt(plan.setupAmount)} one-time setup
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${plan.popular ? "text-gray-700" : "text-gray-600"}`}>
                      <Check
                        size={14}
                        className={`flex-shrink-0 mt-0.5 ${plan.popular ? "text-blue-600" : "text-green-500"}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#contact"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                      : plan.id === "premium"
                      ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-100"
                      : "bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-200"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </a>

                <a
                  href="tel:+17372595692"
                  className={`flex items-center justify-center gap-1.5 w-full py-2 mt-2 rounded-xl text-xs font-medium transition-all ${
                    plan.popular
                      ? "text-blue-500 hover:text-blue-700"
                      : "text-gray-400 hover:text-blue-600"
                  }`}
                >
                  <Phone size={11} />
                  or call (737) 259-5692
                </a>
              </div>
            );
          })}
        </div>

        {/* Comparison note */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-6 border border-gray-100">
            <p className="text-center text-sm font-semibold text-gray-700 mb-4">
              Why most customers choose Pro
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center text-gray-500">
              <div>
                <div className="font-semibold text-gray-800 mb-1">Starter</div>
                Great for solo operators who just need calls answered and leads captured.
              </div>
              <div className="md:border-x border-gray-100 md:px-4">
                <div className="font-semibold text-blue-700 mb-1">Pro — Smart Choice</div>
                Scheduling + follow-up automation pays for itself with just 1–2 extra bookings per month.
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-1">Premium</div>
                Multi-location businesses and teams that need Slack alerts and dedicated support.
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 24–48 hour setup. No long-term contracts. Cancel anytime.{" "}
          Questions?{" "}
          <a href="tel:+17372595692" className="text-blue-600 hover:underline font-medium">
            (737) 259-5692
          </a>
        </p>
      </div>
    </section>
  );
}
