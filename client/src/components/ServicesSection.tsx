import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Phone, Calendar, Zap, Mail, Globe, Mic, X } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const ICONS = [Phone, Calendar, Zap, Mail, Globe, Mic];
const COLORS = [
  "from-blue-600 to-blue-400",
  "from-cyan-600 to-cyan-400",
  "from-green-600 to-green-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-pink-600 to-pink-400",
];
const LIGHT_BG = [
  "bg-blue-50 border-blue-100",
  "bg-cyan-50 border-cyan-100",
  "bg-green-50 border-green-100",
  "bg-purple-50 border-purple-100",
  "bg-orange-50 border-orange-100",
  "bg-pink-50 border-pink-100",
];

// Static modal detail bullets for each service card
const SERVICE_DETAILS = [
  {
    title: "AI Receptionist",
    bullets: [
      "Answers every inbound call 24/7 — no voicemail, no missed leads.",
      "Qualifies callers and captures name, number, and reason for calling.",
      "Sends you an instant text summary after every call.",
      "Handles FAQs, hours, pricing, and directions automatically.",
      "Escalates urgent calls to you immediately via SMS alert.",
    ],
  },
  {
    title: "Appointment Setting",
    bullets: [
      "Books appointments directly into your calendar in real time.",
      "Sends automated confirmation texts and email reminders to clients.",
      "Handles reschedules and cancellations without you lifting a finger.",
      "Follows up with no-shows to rebook and recover lost revenue.",
      "Syncs with Google Calendar — no double-bookings, ever.",
    ],
  },
  {
    title: "Lead Follow-Up",
    bullets: [
      "Responds to new leads within seconds — before they call a competitor.",
      "Sends a personalized follow-up sequence over 3–5 days automatically.",
      "Tracks which leads opened messages and flags hot prospects for you.",
      "Handles objections and FAQs via text so you only talk to ready buyers.",
      "Notifies you the moment a lead is ready to book or buy.",
    ],
  },
  {
    title: "Email & Admin",
    bullets: [
      "Surfaces your most important emails so you see what matters first.",
      "Drafts routine replies — estimates, confirmations, follow-ups — for one-click send.",
      "Flags urgent items and filters out noise and spam automatically.",
      "Organizes your inbox by category: leads, clients, vendors, billing.",
      "Saves 1–2 hours per day on email alone for most customers.",
    ],
  },
  {
    title: "Bilingual Communication",
    bullets: [
      "Handles calls, texts, and emails in English, Spanish, and Chinese.",
      "Switches languages automatically based on the caller or client.",
      "Translates field notes and crew updates into clean English reports.",
      "Sends client-facing messages in their preferred language.",
      "No interpreter needed — Riley bridges the gap in real time.",
    ],
  },
  {
    title: "Live Interpreter Mode",
    bullets: [
      "Real-time spoken translation between English and Spanish on any call.",
      "Works on job sites, front desks, and client meetings.",
      "No app download required — works via your existing phone.",
      "Supports 1-on-1 conversations and broadcast mode for crew briefings.",
      "Logs translated conversations for your records automatically.",
    ],
  },
];

export default function ServicesSection() {
  const { t } = useLang();
  const [activeModal, setActiveModal] = useState<number | null>(null);

  return (
    <section id="services" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/72" offset={0} />
      <div className="container relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            WHAT WE DO
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.services.title}
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.services.items.map((item, idx) => {
            const Icon = ICONS[idx];
            return (
              <button
                key={idx}
                onClick={() => setActiveModal(idx)}
                className="group relative p-6 rounded-2xl glass hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer w-full"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${COLORS[idx]} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                <p className="text-xs text-blue-600 font-semibold mt-3 group-hover:underline">Learn more →</p>
                {/* Subtle color tint on hover */}
                <div className={`absolute inset-0 rounded-2xl ${LIGHT_BG[idx]} opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none`} />
              </button>
            );
          })}
        </div>

        {/* Funnel CTA */}
        <div className="text-center mt-10">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200"
          >
            See Pricing &amp; Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      {/* Service detail modal */}
      {activeModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[activeModal]} flex items-center justify-center shadow-md flex-shrink-0`}>
                {(() => { const Icon = ICONS[activeModal]; return <Icon size={18} className="text-white" />; })()}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{SERVICE_DETAILS[activeModal].title}</h3>
            </div>

            {/* Bullets */}
            <ul className="space-y-3 mb-6">
              {SERVICE_DETAILS[activeModal].bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="#pricing"
              onClick={() => setActiveModal(null)}
              className="block w-full text-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md"
            >
              Get Started →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
