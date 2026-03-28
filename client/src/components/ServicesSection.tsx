import { useLang } from "@/contexts/LanguageContext";
import { Phone, Calendar, Zap, Mail, Globe, Mic } from "lucide-react";
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

export default function ServicesSection() {
  const { t } = useLang();

  return (
    <section id="services" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/85" offset={0} />
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
              <div
                key={idx}
                className="group relative p-6 rounded-2xl glass hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${COLORS[idx]} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>

                {/* Subtle color tint on hover */}
                <div className={`absolute inset-0 rounded-2xl ${LIGHT_BG[idx]} opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
