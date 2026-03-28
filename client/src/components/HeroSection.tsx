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
  const isMassage = ind.key === "massage";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background image — full bleed, no zoom on massage */}
      <div className="absolute inset-0">
        <img
          src={ind.img}
          alt={ind.label}
          key={ind.key}
          className={`w-full h-full transition-all duration-1000 ${
            isMassage
              ? "object-contain object-center bg-gray-100"
              : "object-cover object-center"
          }`}
        />
        {/* Single uniform dark overlay — no left/right gradient, consistent across full image */}
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative container py-16 md:py-24">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            {t.hero.badge}
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 text-white drop-shadow-lg">
            {t.hero.headline1}
            <br />
            <span className="text-blue-300">{t.hero.headline2}</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-white/80 max-w-xl mb-8 leading-relaxed drop-shadow">
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white/25"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>

          {/* Riley Demo Card — transparent glass, no white box */}
          <div className="backdrop-blur-md bg-white/12 rounded-2xl p-5 mb-6 max-w-xl border border-white/25 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={CDN.logoSymbol}
                alt="Riley"
                className="w-9 h-9 rounded-full object-contain bg-white/20 border border-white/30 p-0.5 shadow-md"
              />
              <div>
                <div className="text-sm font-semibold text-white">Riley · SoloEdge AI</div>
                <div className="flex items-center gap-1.5 text-xs text-green-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                  Online Now
                </div>
              </div>
              {/* Waveform */}
              <div className="ml-auto flex items-end gap-0.5 h-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar w-1 rounded-full bg-blue-300"
                    style={{ height: "4px" }}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-white/70 mb-4">{t.hero.greeting}</p>

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
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                        : "bg-white/15 border border-white/25 text-white/85 hover:bg-white/25 hover:border-white/40"
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
              <div className="mt-4 pt-4 border-t border-white/15">
                <div className="flex items-start gap-2.5">
                  <img
                    src={CDN.logoSymbol}
                    alt="Riley"
                    className="w-6 h-6 rounded-full object-contain bg-white/20 border border-white/30 p-0.5 flex-shrink-0 mt-0.5"
                  />
                  <p className={`text-sm text-white/90 leading-relaxed ${isTyping ? "cursor-blink" : ""}`}>
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/40"
            >
              {t.hero.cta}
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 text-white font-semibold text-sm transition-all"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 text-xs">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/40" />
        <span>scroll</span>
      </div>
    </section>
  );
}
