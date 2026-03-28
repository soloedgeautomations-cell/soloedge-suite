import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { CDN } from "../../../shared/assets";
import { Phone, Calendar, Globe, Mail, Users } from "lucide-react";

const CHIP_ICONS = [Phone, Globe, Calendar, Mail, Users];

const INDUSTRIES = [
  { key: "construction", label: "Construction", img: CDN.constructionWorkers },
  { key: "gym", label: "Gym & Fitness", img: CDN.gymBarbell },
  { key: "massage", label: "Massage & Spa", img: CDN.massageTable },
  { key: "corporate", label: "Corporate", img: CDN.corporateOffice },
];

export default function HeroSection() {
  const { t } = useLang();
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);

  // Rotate industries every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndustry(i => (i + 1) % INDUSTRIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleChip = (key: string) => {
    if (activeChip === key) { setActiveChip(null); setDisplayedResponse(""); return; }
    setActiveChip(key);
    const fullText = t.hero.responses[key] ?? "";
    setDisplayedResponse("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedResponse(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  };

  const ind = INDUSTRIES[activeIndustry];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background image — clearly visible on light theme */}
      <div className="absolute inset-0">
        <img
          src={ind.img}
          alt={ind.label}
          className="w-full h-full object-cover transition-all duration-1000"
          key={ind.key}
        />
        {/* Light overlay: right side stays image-heavy, left gets readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/50" />
      </div>

      <div className="relative container py-16 md:py-24">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
            {t.hero.badge}
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 text-gray-900">
            {t.hero.headline1}
            <br />
            <span className="gradient-text">{t.hero.headline2}</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-8 leading-relaxed">
            {t.hero.subtext}
          </p>

          {/* Industry tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {INDUSTRIES.map((ind, idx) => (
              <button
                key={ind.key}
                onClick={() => setActiveIndustry(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeIndustry === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>

          {/* Riley Demo Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 mb-6 max-w-xl border border-gray-200 shadow-xl shadow-gray-200/60">
            <div className="flex items-center gap-3 mb-4">
              <img src={CDN.logoSymbol} alt="Riley" className="w-9 h-9 rounded-full object-contain bg-white border border-blue-100 p-0.5 shadow-md" />
              <div>
                <div className="text-sm font-semibold text-gray-900">Riley · SoloEdge AI</div>
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
                  Online Now
                </div>
              </div>
              {/* Waveform */}
              <div className="ml-auto flex items-end gap-0.5 h-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar w-1 rounded-full bg-blue-400"
                    style={{ height: "4px" }}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">{t.hero.greeting}</p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {t.hero.chips.map((chip, idx) => {
                const Icon = CHIP_ICONS[idx];
                return (
                  <button
                    key={chip.key}
                    onClick={() => handleChip(chip.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeChip === chip.key
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    <Icon size={12} />
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Response */}
            {activeChip && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2.5">
                  <img src={CDN.logoSymbol} alt="Riley" className="w-6 h-6 rounded-full object-contain bg-white border border-blue-100 p-0.5 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm text-gray-700 leading-relaxed ${isTyping ? "cursor-blink" : ""}`}>
                    {displayedResponse}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-200"
            >
              {t.hero.cta}
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold text-sm transition-all shadow-sm"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 text-xs">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-300" />
        <span>scroll</span>
      </div>
    </section>
  );
}
