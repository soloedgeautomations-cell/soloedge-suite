import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { CDN, GALLERY } from "../../../shared/assets";
import { Phone, Calendar, Globe, Mail, Users, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CHIP_ICONS = [Phone, Globe, Calendar, Mail, Users];

const INDUSTRY_TEXT: Record<string, string> = {
  construction: "Riley answers job-site calls, books subs, coordinates crews in English & Spanish, and sends daily progress summaries — so you stay on the tools.",
  gym: "Riley handles membership inquiries, books classes and personal training sessions, manages cancellations, and follows up with trial sign-ups — 24/7.",
  massage: "Riley books appointments, sends reminders, handles reschedules, and upsells packages — so your table stays full without you touching the phone.",
  corporate: "Riley answers your main line professionally, schedules meetings, triages email, and coordinates visitors — like a front-desk team that never calls in sick.",
};

const INDUSTRIES = [
  { key: "construction" as const, label: "Construction" },
  { key: "gym" as const, label: "Gym & Fitness" },
  { key: "massage" as const, label: "Massage & Spa" },
  { key: "corporate" as const, label: "Corporate" },
];

// Waveform bars that animate when Riley is active
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${active ? "bg-blue-300" : "bg-white/30"}`}
          style={{
            height: active ? `${8 + Math.sin(i * 0.8) * 6}px` : "4px",
            animation: active ? `wave ${0.6 + i * 0.1}s ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection() {
  const { t, lang } = useLang();
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroChat = trpc.riley.heroChat.useMutation({
    onSuccess: (data) => {
      setIsLoadingAI(false);
      const fullText = data.reply;
      setDisplayedResponse("");
      setIsTyping(true);
      let i = 0;
      if (typingRef.current) clearInterval(typingRef.current);
      typingRef.current = setInterval(() => {
        if (i < fullText.length) {
          setDisplayedResponse(fullText.slice(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          if (typingRef.current) clearInterval(typingRef.current);
        }
      }, 16);
    },
    onError: (err) => {
      console.error("[heroChat] LLM error:", err);
      setIsLoadingAI(false);
      setIsTyping(false);
      // Fallback to static response — never crash the page
      const fallback = t.hero.responses[activeChip ?? "calls"] ?? "";
      setDisplayedResponse(fallback);
    },
  });

  // Rotate gallery photos every 3.5s per industry
  useEffect(() => {
    if (userPaused) return;
    const gallery = GALLERY[INDUSTRIES[activeIndustry].key];
    const timer = setInterval(() => {
      setGalleryIdx(i => (i + 1) % gallery.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeIndustry, userPaused]);

  // Rotate industries every 18s (let photos cycle first)
  useEffect(() => {
    if (userPaused) return;
    const timer = setInterval(() => {
      setActiveIndustry(i => (i + 1) % INDUSTRIES.length);
      setGalleryIdx(0);
    }, 18000);
    return () => clearInterval(timer);
  }, [userPaused]);

  const handleIndustryClick = (idx: number) => {
    setActiveIndustry(idx);
    setGalleryIdx(0);
    setUserPaused(true);
    // Resume auto-rotation after 30s
    setTimeout(() => setUserPaused(false), 30000);
  };

  const handleChip = (key: string) => {
    if (activeChip === key) {
      setActiveChip(null);
      setDisplayedResponse("");
      if (typingRef.current) clearInterval(typingRef.current);
      return;
    }
    setActiveChip(key);
    setDisplayedResponse("");
    setIsLoadingAI(true);
    setIsTyping(false);
    if (typingRef.current) clearInterval(typingRef.current);

    heroChat.mutate({
      chipKey: key,
      industry: INDUSTRIES[activeIndustry].label,
      language: lang as "en" | "es" | "zh",
    });
  };

  const ind = INDUSTRIES[activeIndustry];
  const gallery = GALLERY[ind.key];
  const currentImg = gallery[galleryIdx % gallery.length];

  const rileyActive = isLoadingAI || isTyping || !!displayedResponse;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background — cycling gallery per industry */}
      <div className="absolute inset-0">
        {gallery.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={ind.label}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              idx === galleryIdx % gallery.length ? "opacity-100" : "opacity-0"
} object-cover object-center`}
          />
        ))}
        {/* Uniform dark overlay */}
        <div className="absolute inset-0 bg-black/48" />
      </div>

      {/* Photo indicator dots */}
      <div className="absolute bottom-20 right-6 flex flex-col gap-1.5 z-10">
        {gallery.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setGalleryIdx(idx); setUserPaused(true); setTimeout(() => setUserPaused(false), 30000); }}
            className={`w-1.5 rounded-full transition-all ${idx === galleryIdx % gallery.length ? "h-5 bg-white" : "h-1.5 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>

      <div className="relative container py-16 md:py-24">
        <div className="max-w-full">
          {/* Hero logo */}
          <img src={CDN.logoTransparent} alt="SoloEdge Automations" className="h-14 md:h-16 mb-6 object-contain" />


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
          <div className="flex flex-wrap gap-2 mb-3">
            {INDUSTRIES.map((industry, idx) => (
              <button
                key={industry.key}
                onClick={() => handleIndustryClick(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeIndustry === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white/25"
                }`}
              >
                {industry.label}
              </button>
            ))}
          </div>

          {/* Dynamic industry description */}
          <p className="text-sm text-white/75 max-w-md mb-6 leading-relaxed transition-all duration-300">
            {INDUSTRY_TEXT[INDUSTRIES[activeIndustry].key]}
          </p>

          {/* Riley Demo Card — glass, no white box */}
          <div className={`backdrop-blur-md bg-white/12 rounded-2xl p-5 mb-6 max-w-xl border transition-all duration-500 shadow-2xl ${
            rileyActive ? "border-blue-400/50 shadow-blue-500/20" : "border-white/25"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`relative w-14 h-14 rounded-full flex-shrink-0 transition-all duration-300 ${rileyActive ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent" : ""}`}>
                <img
                  src={CDN.logoSymbol}
                  alt="Riley"
                  className="w-full h-full rounded-full object-contain bg-white/20 border border-white/30 p-0.5 shadow-md"
                />
                {rileyActive && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white/20 pulse-dot" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Riley · SoloEdge AI</div>
                <div className="flex items-center gap-1.5 text-xs text-green-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                  {isLoadingAI ? "Thinking..." : isTyping ? "Speaking..." : "Online Now"}
                </div>
              </div>
              <div className="ml-auto">
                <Waveform active={rileyActive} />
              </div>
            </div>

            <p className="text-sm text-white/70 mb-4">{t.hero.greeting}</p>

            {/* Chips — tap to ask Riley */}
            <div className="flex flex-wrap gap-2">
              {t.hero.chips.map((chip, idx) => {
                const Icon = CHIP_ICONS[idx];
                const isActive = activeChip === chip.key;
                return (
                  <button
                    key={chip.key}
                    onClick={() => handleChip(chip.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                        : "bg-white/15 border border-white/25 text-white/85 hover:bg-white/25 hover:border-white/40 hover:scale-105"
                    }`}
                  >
                    <Icon size={12} />
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Riley's AI response */}
            {(isLoadingAI || displayedResponse) && (
              <div className="mt-4 pt-4 border-t border-white/15">
                <div className="flex items-start gap-2.5">
                  <img
                    src={CDN.logoSymbol}
                    alt="Riley"
                    className="w-9 h-9 rounded-full object-contain bg-white/20 border border-white/30 p-0.5 flex-shrink-0 mt-0.5"
                  />
                  {isLoadingAI ? (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Riley is thinking...</span>
                    </div>
                  ) : (
                    <p className={`text-sm text-white/90 leading-relaxed ${isTyping ? "after:content-['|'] after:animate-pulse after:ml-0.5" : ""}`}>
                      {displayedResponse}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 hover:scale-105 hover:shadow-blue-500/50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/40 active:scale-95"
            >
              {t.hero.cta}
            </a>
            <a
              href="/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 text-white font-semibold text-sm transition-all active:scale-95"
            >
              {t.hero.ctaSecondary}
            </a>
            <a
              href="tel:+17372595692"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white/80 font-medium text-sm transition-all active:scale-95"
            >
              <Phone size={15} />
              (737) 259-5692
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
