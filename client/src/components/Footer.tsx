import { useLang, LANGUAGES } from "@/contexts/LanguageContext";
import { CDN } from "../../../shared/assets";
import { Link } from "wouter";

export default function Footer() {
  const { t, lang, setLang } = useLang();

  return (
    <footer className="border-t border-white/5 bg-[oklch(0.09_0.012_240)]">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={CDN.logo} alt="SoloEdge" className="h-8 w-auto mb-3" />
            <p className="text-sm text-white/45 max-w-xs leading-relaxed mb-4">
              {t.footer.tagline}
            </p>
            {/* Language switcher */}
            <div className="flex gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    lang === l.code
                      ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                      : "bg-white/5 border border-white/8 text-white/40 hover:text-white/70"
                  }`}
                >
                  {l.flag} {l.native}
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Services</h4>
            <ul className="space-y-2">
              {["AI Receptionist", "Appointment Setting", "Lead Capture", "Live Interpreter", "Email Automation", "Crew Coordination"].map(s => (
                <li key={s}>
                  <a href="#services" className="text-sm text-white/50 hover:text-white/80 transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <li><a href="#pricing" className="text-sm text-white/50 hover:text-white/80 transition-colors">Pricing</a></li>
              <li><a href="#industries" className="text-sm text-white/50 hover:text-white/80 transition-colors">Industries</a></li>
              <li><a href="#contact" className="text-sm text-white/50 hover:text-white/80 transition-colors">Contact</a></li>
              <li><Link href="/app" className="text-sm text-white/50 hover:text-white/80 transition-colors">Customer Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} SoloEdge Automations. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
