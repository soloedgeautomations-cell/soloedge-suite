import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLang, LANGUAGES } from "@/contexts/LanguageContext";
import { CDN } from "../../../shared/assets";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === lang)!;

  const navLinks = [
    { label: t.nav.services, href: "#services" },
    { label: t.nav.industries, href: "#industries" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[oklch(0.09_0.012_240/0.95)] backdrop-blur-xl border-b border-white/5 shadow-lg" : "bg-transparent"
    }`}>
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src={CDN.logo} alt="SoloEdge" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/app"
              className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            >
              {t.nav.dashboard}
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition-all"
              >
                <span>{currentLang.flag}</span>
                <span className="font-medium">{currentLang.native}</span>
                <ChevronDown size={14} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-[oklch(0.13_0.015_240)] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        lang === l.code ? "bg-blue-600/20 text-blue-400" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <a
              href="#contact"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/30"
            >
              {t.nav.bookSession}
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile lang */}
            <button
              onClick={() => {
                const idx = LANGUAGES.findIndex(l => l.code === lang);
                setLang(LANGUAGES[(idx + 1) % LANGUAGES.length].code);
              }}
              className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm"
            >
              {currentLang.flag}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white/80 hover:text-white"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[oklch(0.11_0.013_240/0.98)] backdrop-blur-xl border-t border-white/5">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/app"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-4 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all font-medium"
            >
              {t.nav.dashboard}
            </Link>
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-center"
            >
              {t.nav.bookSession}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
