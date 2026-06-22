import { CDN } from "../../../shared/assets";
import { HardHat, Dumbbell, Sparkles, Briefcase, Home, Car, ArrowRight } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const INDUSTRIES = [
  {
    key: "roofing",
    icon: Home,
    title: "Roofing",
    subtitle: "Insurance claims, storm leads, crew scheduling",
    img: CDN.constructionTeam,
    iconBg: "from-red-500 to-orange-400",
    accent: "text-red-600",
    border: "border-red-100 hover:border-red-300",
    shadow: "hover:shadow-red-100",
    bullets: [
      "Multilingual phone coverage for storm leads",
      "Insurance claim status follow-up",
      "Estimate booking and reminders",
      "Crew + sub coordination",
      "Customer status updates during multi-day jobs",
    ],
  },
  {
    key: "auto",
    icon: Car,
    title: "Auto",
    subtitle: "Service shops, dealers, recon, tow, glass, tint",
    img: CDN.corporateOffice,
    iconBg: "from-slate-600 to-gray-500",
    accent: "text-slate-700",
    border: "border-slate-100 hover:border-slate-300",
    shadow: "hover:shadow-slate-100",
    bullets: [
      "24/7 tow dispatch + sales line coverage",
      "Multilingual customer intake (EN/ES)",
      "Appointment booking + no-show recovery",
      "Insurance and warranty paperwork tracking",
      "Test-drive and detail scheduling",
    ],
  },
  {
    key: "construction",
    icon: HardHat,
    title: "Construction & GC",
    subtitle: "Field crews, multilingual coordination, sub management",
    img: CDN.constructionTeam,
    iconBg: "from-orange-500 to-amber-400",
    accent: "text-orange-600",
    border: "border-orange-100 hover:border-orange-300",
    shadow: "hover:shadow-orange-100",
    bullets: [
      "Multilingual crew communication (EN/ES)",
      "Sub coordinator and task routing",
      "Field voice check-in agent",
      "Change order and punch list handling",
      "Daily progress summaries",
    ],
  },
  {
    key: "gym",
    icon: Dumbbell,
    title: "Gyms & Fitness",
    subtitle: "Memberships, class bookings, trial sign-ups",
    img: CDN.gymBarbell,
    iconBg: "from-green-500 to-emerald-400",
    accent: "text-green-600",
    border: "border-green-100 hover:border-green-300",
    shadow: "hover:shadow-green-100",
    bullets: [
      "24/7 membership inquiry handling",
      "Class and personal training bookings",
      "Trial sign-up automation",
      "Cancellation and freeze requests",
      "Multilingual member support",
    ],
  },
  {
    key: "massage",
    icon: Sparkles,
    title: "Massage & Spa",
    subtitle: "Appointments, upsells, client retention",
    img: CDN.massageTable,
    iconBg: "from-purple-500 to-violet-400",
    accent: "text-purple-600",
    border: "border-purple-100 hover:border-purple-300",
    shadow: "hover:shadow-purple-100",
    bullets: [
      "Appointment booking and reminders",
      "Service upsell conversations",
      "Cancellation and reschedule handling",
      "Gift card and package inquiries",
      "Multilingual client communication",
    ],
  },
  {
    key: "corporate",
    icon: Briefcase,
    title: "Corporate & Office",
    subtitle: "Reception, scheduling, admin automation",
    img: CDN.corporateOffice,
    iconBg: "from-blue-500 to-sky-400",
    accent: "text-blue-600",
    border: "border-blue-100 hover:border-blue-300",
    shadow: "hover:shadow-blue-100",
    bullets: [
      "Professional call answering",
      "Meeting and conference scheduling",
      "Visitor and vendor coordination",
      "Email triage and admin automation",
      "Multilingual executive support",
    ],
  },
];

export default function IndustriesSection() {
  return (
    <section id="industries" className="section-pad bg-gray-50 relative overflow-hidden">
      <SectionBackground overlayClass="bg-gray-50/85" offset={3} />
      <div className="container relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            INDUSTRIES WE SERVE
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Built for Your Industry
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            SoloCommand is trained on the language, workflows, and tools your industry already uses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDUSTRIES.map(ind => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.key}
                className={`group relative rounded-2xl overflow-hidden glass ${ind.shadow} hover:shadow-xl transition-all duration-300`}
              >
                {/* Top image strip */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={ind.img}
                    alt={ind.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                  <div className={`absolute bottom-4 left-6 w-12 h-12 rounded-xl bg-gradient-to-br ${ind.iconBg} flex items-center justify-center shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                </div>

                <div className="p-6 pt-4">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-1">{ind.title}</h3>
                  <p className="text-sm text-gray-500 mb-5">{ind.subtitle}</p>

                  <ul className="space-y-2 mb-6">
                    {ind.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${ind.iconBg} flex-shrink-0`} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#audit"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${ind.accent} hover:opacity-70 transition-opacity`}
                  >
                    Start a SoloAudit for {ind.title.split(" ")[0]}
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel CTA */}
        <div className="text-center mt-12">
          <a
            href="#audit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200"
          >
            See SoloAudit Pricing
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
