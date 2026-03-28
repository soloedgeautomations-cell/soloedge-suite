import { CDN } from "../../../shared/assets";
import { HardHat, Dumbbell, Sparkles, Briefcase, ArrowRight } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const INDUSTRIES = [
  {
    key: "construction",
    icon: HardHat,
    title: "Construction & GC",
    subtitle: "Field crews, bilingual coordination, sub management",
    img: CDN.constructionTeam,
    iconBg: "from-orange-500 to-amber-400",
    accent: "text-orange-600",
    border: "border-orange-100 hover:border-orange-300",
    shadow: "hover:shadow-orange-100",
    bullets: [
      "Bilingual crew communication (EN/ES)",
      "Sub coordinator & task routing",
      "Field voice check-in agent",
      "Change order & punch list handling",
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
      "Class & personal training bookings",
      "Trial sign-up automation",
      "Cancellation & freeze requests",
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
      "Appointment booking & reminders",
      "Service upsell conversations",
      "Cancellation & reschedule handling",
      "Gift card & package inquiries",
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
      "Meeting & conference scheduling",
      "Visitor & vendor coordination",
      "Email triage & admin automation",
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
            SoloEdge is trained on the specific language, workflows, and needs of each industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDUSTRIES.map(ind => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.key}
                className={`group relative rounded-2xl overflow-hidden bg-white border ${ind.border} ${ind.shadow} hover:shadow-xl transition-all duration-300`}
              >
                {/* Top image strip */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={ind.img}
                    alt={ind.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                  {/* Icon badge overlapping image bottom */}
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
                    href="#contact"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${ind.accent} hover:opacity-70 transition-opacity`}
                  >
                    Get started for {ind.title.split(" ")[0]}
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
