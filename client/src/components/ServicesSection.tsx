import { useLang } from "@/contexts/LanguageContext";
import { Phone, Calendar, Zap, Mail, Globe, Mic } from "lucide-react";

const ICONS = [Phone, Calendar, Zap, Mail, Globe, Mic];
const COLORS = [
  "from-blue-600 to-blue-400",
  "from-cyan-600 to-cyan-400",
  "from-green-600 to-green-400",
  "from-purple-600 to-purple-400",
  "from-orange-600 to-orange-400",
  "from-pink-600 to-pink-400",
];

export default function ServicesSection() {
  const { t } = useLang();

  return (
    <section id="services" className="section-pad">
      <div className="container">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            WHAT WE DO
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {t.services.title}
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.services.items.map((item, idx) => {
            const Icon = ICONS[idx];
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-2xl bg-[oklch(0.13_0.015_240)] border border-white/5 hover:border-white/15 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${COLORS[idx]} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{item.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
