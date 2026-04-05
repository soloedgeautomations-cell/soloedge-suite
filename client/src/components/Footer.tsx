import { useLang, LANGUAGES } from "@/contexts/LanguageContext";
import { CDN } from "../../../shared/assets";
import { Link } from "wouter";

export default function Footer() {
  const { t, lang, setLang } = useLang();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={CDN.logoTransparent} alt="SoloEdge Automations" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-4">
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
                      ? "bg-blue-50 border border-blue-200 text-blue-700"
                      : "bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {l.flag} {l.native}
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Services</h4>
            <ul className="space-y-2">
              {["AI Receptionist", "Appointment Setting", "Lead Capture", "Live Interpreter", "Email Automation", "Crew Coordination"].map(s => (
                <li key={s}>
                  <a href="#services" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="tel:+17372595692" className="text-sm text-gray-500 hover:text-blue-700 transition-colors font-medium">
                  (737) 259-5692 — Demo / Book
                </a>
              </li>
              <li>
                <a href="tel:+15127029685" className="text-sm text-gray-500 hover:text-blue-700 transition-colors font-medium">
                  (512) 702-9685 — Team
                </a>
              </li>
              <li><a href="mailto:hello@soloedgeautomations.com" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">hello@soloedgeautomations.com</a></li>
              <li><a href="#pricing" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">Pricing</a></li>
              <li><a href="#industries" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">Industries</a></li>
              <li><Link href="/app" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">Customer Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SoloEdge Automations. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
