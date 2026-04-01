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
      scrolled
        ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm"
        : "bg-white/60 backdrop-blur-md"
    }`}>
      <div className="container">
        <div className="flex items-center justify-between h-18 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src={CDN.logoSymbol} alt="S" className="h-14 w-14 object-contain drop-shadow-md" />
            <img src={CDN.logo} alt="SoloEdge Automations" className="h-10 w-auto hidden sm:block" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/app"
              className="text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                <span>{currentLang.flag}</span>
                <span className="font-medium">{currentLang.native}</span>
                <ChevronDown size={14} className={`transition-transform text-gray-400 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        lang === l.code
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone */}
            <a
              href="tel:+17372595692"
              className="hidden lg:flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 transition-colors font-medium"
            >
              <span className="text-gray-400">📞</span>
              (737) 259-5692
            </a>

            {/* CTA */}
            <a
              href="/get-started"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
            >
              {t.nav.bookSession}
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                const idx = LANGUAGES.findIndex(l => l.code === lang);
                setLang(LANGUAGES[(idx + 1) % LANGUAGES.length].code);
              }}
              className="px-2 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm"
            >
              {currentLang.flag}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-700 hover:text-gray-900"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 rounded-lg text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/app"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-4 rounded-lg text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium"
            >
              {t.nav.dashboard}
            </Link>
            <a
              href="/get-started"
              onClick={() => setMobileOpen(false)}
              className="mt-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center transition-all"
            >
              {t.nav.bookSession}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
