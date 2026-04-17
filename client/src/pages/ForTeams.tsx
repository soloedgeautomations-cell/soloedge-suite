import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, HardHat, Check } from "lucide-react";

const PILLARS = [
  "SoloHub — AI specialist center of operations (24/7 call answering)",
  "SoloBooking — Appointment setting & calendar sync",
  "Lead Follow-Up Automation",
  "EdgeMail — AI email agent & admin assistant",
  "Bilingual Communication (EN/ES/ZH)",
  "LiveDesk — Live meeting translator",
];

const SUITES = [
  {
    key: "corporate",
    icon: Building2,
    color: "from-blue-600 to-blue-400",
    bg: "bg-blue-50 border-blue-100",
    label: "Corporate Teams Suite",
    audience:
      "For offices, multi-department companies, and Project Managers who need reliable communication plus employee development.",
    extras: [
      "Slack integration for team alerts and summaries",
      "Custom new-hire onboarding companion (benefits, tools, policies, culture)",
      "Multi-department routing",
      "Advanced reporting and usage insights",
      "Optional assisted setup from our team",
    ],
  },
  {
    key: "gc",
    icon: HardHat,
    color: "from-orange-600 to-orange-400",
    bg: "bg-orange-50 border-orange-100",
    label: "GC Crew Companion Suite",
    audience:
      "For General Contractors, Superintendents, and field crews who need job-site productivity plus crew development.",
    extras: [
      "Crew mentorship and skill-building tools (trade tips, safety reminders)",
      "Custom onboarding for new crew members (safety checklists, equipment, site procedures)",
      "Daily progress summaries",
      "Multi-field-line management",
      "Strong Spanish support for crews",
      "Optional assisted setup from our team",
    ],
  },
];

export default function ForTeams() {
  const [active, setActive] = useState<"corporate" | "gc">("corporate");
  const suite = SUITES.find((s) => s.key === active)!;
  const SuiteIcon = suite.icon;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="section-pad bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            For Teams &amp; Enterprises
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            For Teams &amp; Enterprises
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            The same powerful automation you love — now scaled for larger teams
            and growing companies with options for self-service or assisted
            setup.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 mb-10">
            {SUITES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key as typeof active)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    active === s.key
                      ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Suite card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-left max-w-2xl mx-auto">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${suite.color}`}
            >
              <SuiteIcon size={22} className="text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              {suite.label}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {suite.audience}
            </p>

            {/* 6 Core Pillars */}
            <div className={`rounded-xl border p-4 mb-6 ${suite.bg}`}>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                Includes our 6 Core Pillars
              </p>
              <ul className="space-y-2">
                {PILLARS.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-600"
                  >
                    <Check
                      size={14}
                      className="text-blue-600 mt-0.5 shrink-0"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suite extras */}
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
              Plus
            </p>
            <ul className="space-y-2 mb-8">
              {suite.extras.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-gray-600"
                >
                  <Check
                    size={14}
                    className="text-blue-600 mt-0.5 shrink-0"
                  />
                  {e}
                </li>
              ))}
            </ul>

            <a
              href="/#pricing"
              className="inline-flex items-center justify-center w-full px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              See Pricing
            </a>
          </div>

          {/* How It Works */}
          <div className="mt-12 max-w-2xl mx-auto text-left">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: "Zero-Touch Automation",
                  desc: "Pay once and Riley is live with a dedicated number in minutes.",
                },
                {
                  title: "Assisted Option",
                  desc: "Our team can help with custom setup and onboarding (available as an add-on for both suites).",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              See Pricing
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
