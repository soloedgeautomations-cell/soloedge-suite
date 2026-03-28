import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { CDN } from "../../../shared/assets";
import { Phone, Calendar, Globe, Mail, Users } from "lucide-react";

const CHIP_ICONS = [Phone, Globe, Calendar, Mail, Users];

const INDUSTRIES = [
  { key: "construction", label: "Construction", img: CDN.constructionWorkers, color: "from-orange-900/40 to-orange-950/60" },
  { key: "gym", label: "Gym & Fitness", img: CDN.gymWeights, color: "from-green-900/40 to-green-950/60" },
  { key: "massage", label: "Massage & Spa", img: CDN.massageRoom, color: "from-purple-900/40 to-purple-950/60" },
  { key: "corporate", label: "Corporate", img: CDN.corporateOffice, color: "from-blue-900/40 to-blue-950/60" },
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
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={ind.img}
          alt={ind.label}
          className="w-full h-full object-cover transition-all duration-1000 opacity-20"
          key={ind.key}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.09_0.012_240/0.85)] via-[oklch(0.09_0.012_240/0.7)] to-[oklch(0.09_0.012_240)]" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      <div className="relative container py-16 md:py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot" />
            {t.hero.badge}
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 text-white">
            {t.hero.headline1}
            <br />
            <span className="gradient-text">{t.hero.headline2}</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-white/60 max-w-xl mb-8 leading-relaxed">
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
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>

          {/* Riley Demo Card */}
          <div className="glass rounded-2xl p-5 mb-6 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Riley · SoloEdge AI</div>
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                  Online Now
                </div>
              </div>
              {/* Waveform */}
              <div className="ml-auto flex items-end gap-0.5 h-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar w-1 rounded-full bg-blue-400/60"
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
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
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
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    R
                  </div>
                  <p className={`text-sm text-white/85 leading-relaxed ${isTyping ? "cursor-blink" : ""}`}>
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 glow-blue"
            >
              {t.hero.cta}
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white/80 hover:text-white font-semibold text-sm transition-all"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/20" />
        <span>scroll</span>
      </div>
    </section>
  );
}
