import { CDN } from "../../../shared/assets";
import { HardHat, Dumbbell, Sparkles, Briefcase, ArrowRight } from "lucide-react";

const INDUSTRIES = [
  {
    key: "construction",
    icon: HardHat,
    title: "Construction & GC",
    subtitle: "Field crews, bilingual coordination, sub management",
    img: CDN.constructionTeam,
    color: "from-orange-500 to-amber-400",
    border: "hover:border-orange-500/30",
    glow: "hover:shadow-orange-900/20",
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
    img: CDN.gymFitness,
    color: "from-green-500 to-emerald-400",
    border: "hover:border-green-500/30",
    glow: "hover:shadow-green-900/20",
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
    img: CDN.massageStudio,
    color: "from-purple-500 to-violet-400",
    border: "hover:border-purple-500/30",
    glow: "hover:shadow-purple-900/20",
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
    color: "from-blue-500 to-sky-400",
    border: "hover:border-blue-500/30",
    glow: "hover:shadow-blue-900/20",
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
    <section id="industries" className="section-pad bg-[oklch(0.11_0.013_240/0.5)]">
      <div className="container">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            INDUSTRIES WE SERVE
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Built for Your Industry
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            SoloEdge is trained on the specific language, workflows, and needs of each industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INDUSTRIES.map(ind => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.key}
                className={`group relative rounded-2xl overflow-hidden border border-white/5 ${ind.border} ${ind.glow} hover:shadow-2xl transition-all duration-300`}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <img src={ind.img} alt={ind.title} className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.11_0.013_240/0.95)] to-[oklch(0.11_0.013_240/0.80)]" />
                </div>

                <div className="relative p-7">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ind.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>

                  <h3 className="font-display text-xl font-bold text-white mb-1">{ind.title}</h3>
                  <p className="text-sm text-white/50 mb-5">{ind.subtitle}</p>

                  <ul className="space-y-2 mb-6">
                    {ind.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${ind.color} flex-shrink-0`} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contact"
                    className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${ind.color} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                  >
                    Get started for {ind.title.split(" ")[0]}
                    <ArrowRight size={14} className="text-white/60" />
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
