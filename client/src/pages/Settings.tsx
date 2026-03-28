import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CDN } from "../../../shared/assets";
import {
  Settings as SettingsIcon, ChevronLeft, User, Bell, Globe, CreditCard,
  Shield, LogOut, Check, ChevronRight, Smartphone, Mail, Phone,
  Building2, Zap, Star, HardHat,
} from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LanguageContext";

// ── Plan config ────────────────────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, { label: string; color: string; badge: string; features: string[] }> = {
  Free: {
    label: "Free",
    color: "text-gray-600",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    features: ["50 AI messages/month", "1 language", "Basic booking calendar"],
  },
  "Field Starter": {
    label: "Field Starter",
    color: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    features: ["500 AI messages/month", "EN + ES bilingual", "Booking calendar", "Riley Receptionist", "SMS notifications"],
  },
  "Field Pro": {
    label: "Field Pro",
    color: "text-purple-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    features: ["2,000 AI messages/month", "EN + ES + ZH", "Riley Ops Manager", "Live Interpreter Desk", "Construction Tools", "Priority support"],
  },
  "Field Team": {
    label: "Field Team",
    color: "text-orange-600",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    features: ["Unlimited messages", "All languages", "All features", "White-label branding", "Dedicated onboarding", "Custom AI training"],
  },
};

// ── Language options ───────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇲🇽" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { lang: language, setLang: setLanguage } = useLang();
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "language" | "plan" | "security">("profile");

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: isAuthenticated });

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <img src={CDN.logoSymbol} alt="SoloEdge" className="w-12 h-12 object-contain animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-gray-200 shadow-xl">
          <img src={CDN.logo} alt="SoloEdge" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-6">Access your settings by signing in.</p>
          <a href={getLoginUrl()} className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200">
            Sign In to Continue
          </a>
          <a href="/app" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const planName = stats?.planName ?? "Free";
  const planCfg = PLAN_CONFIG[planName] ?? PLAN_CONFIG.Free;

  const NAV_SECTIONS = [
    { id: "profile" as const, icon: <User size={16} />, label: "Profile" },
    { id: "language" as const, icon: <Globe size={16} />, label: "Language" },
    { id: "notifications" as const, icon: <Bell size={16} />, label: "Notifications" },
    { id: "plan" as const, icon: <CreditCard size={16} />, label: "Plan & Usage" },
    { id: "security" as const, icon: <Shield size={16} />, label: "Security" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/app" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-700 transition-colors text-sm font-medium flex-shrink-0">
            <ChevronLeft size={16} />
            Dashboard
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SettingsIcon size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900">Settings</span>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium flex-shrink-0">
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        <div className="flex gap-5">

          {/* ── Sidebar nav ─────────────────────────────────────────────────── */}
          <div className="w-48 flex-shrink-0 hidden sm:block">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* User card */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-2 shadow-md shadow-blue-200">
                  <span className="text-lg font-bold text-white">{(user?.name ?? "U")[0].toUpperCase()}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "User"}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold mt-1 inline-block ${planCfg.badge}`}>
                  {planCfg.label}
                </span>
              </div>
              {/* Nav items */}
              <div className="p-1.5">
                {NAV_SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeSection === s.id
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className={activeSection === s.id ? "text-blue-600" : "text-gray-400"}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Mobile nav tabs ──────────────────────────────────────────────── */}
          <div className="sm:hidden w-full mb-4">
            <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              {NAV_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    activeSection === s.id ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content panel ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Profile */}
            {activeSection === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-display text-base font-bold text-gray-900">Profile</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Your account information from Manus OAuth.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                      <span className="text-2xl font-bold text-white">{(user?.name ?? "U")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{user?.name ?? "User"}</div>
                      <div className="text-sm text-gray-400">{user?.openId ? `ID: ${user.openId.slice(0, 12)}...` : "Manus Account"}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold mt-1 inline-block ${planCfg.badge}`}>
                        {planCfg.label} Plan
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Display Name</div>
                        <div className="text-sm font-medium text-gray-800">{user?.name ?? "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield size={14} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Account Role</div>
                        <div className="text-sm font-medium text-gray-800 capitalize">{user?.role ?? "user"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap size={14} className="text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Auth Provider</div>
                        <div className="text-sm font-medium text-gray-800">Manus OAuth</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
                    Profile details are managed through your Manus account. Contact support to update your name or email.
                  </div>
                </div>
              </div>
            )}

            {/* Language */}
            {activeSection === "language" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-display text-base font-bold text-gray-900">Language</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Riley and the dashboard will respond in your selected language.</p>
                </div>
                <div className="p-5 space-y-3">
                  {LANGUAGE_OPTIONS.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => { setLanguage(opt.code as "en" | "es" | "zh"); toast.success(`Language set to ${opt.label}`); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        language === opt.code
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <span className="text-2xl">{opt.flag}</span>
                      <span className="font-semibold text-gray-900 flex-1 text-left">{opt.label}</span>
                      {language === opt.code && <Check size={18} className="text-blue-600" />}
                    </button>
                  ))}
                  <p className="text-xs text-gray-400 pt-2">
                    Riley supports bilingual conversations — you can also switch languages mid-conversation from the chat interface.
                  </p>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-display text-base font-bold text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-400 mt-0.5">How SoloEdge alerts you about new leads and bookings.</p>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { icon: <Smartphone size={16} />, title: "SMS Alerts", desc: "New leads and bookings sent to your phone via Twilio", active: true },
                    { icon: <Phone size={16} />, title: "Telegram Alerts", desc: "Instant Telegram messages for urgent events", active: true },
                    { icon: <Mail size={16} />, title: "Email Digest", desc: "Daily summary of activity (coming soon)", active: false },
                    { icon: <Bell size={16} />, title: "Browser Push", desc: "In-app notifications when dashboard is open (coming soon)", active: false },
                  ].map(item => (
                    <div key={item.title} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {item.active ? "Active" : "Soon"}
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
                    SMS and Telegram are pre-configured with your credentials. To update phone numbers, contact support.
                  </div>
                </div>
              </div>
            )}

            {/* Plan & Usage */}
            {activeSection === "plan" && (
              <div className="space-y-4">
                {/* Current plan */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-display text-base font-bold text-gray-900">Current Plan</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
                        <Star size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{planCfg.label}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${planCfg.badge}`}>Active</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {planCfg.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check size={14} className="text-green-500 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Usage stats */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-display text-base font-bold text-gray-900">Usage This Month</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-3">
                    {[
                      { icon: <Building2 size={16} />, label: "Bookings Today", value: stats?.bookingsToday ?? 0, color: "blue" },
                      { icon: <HardHat size={16} />, label: "Total Bookings", value: stats?.bookingsTotal ?? 0, color: "green" },
                      { icon: <Phone size={16} />, label: "AI Conversations", value: stats?.conversationsTotal ?? 0, color: "purple" },
                      { icon: <User size={16} />, label: "Leads Captured", value: stats?.leadsTotal ?? 0, color: "orange" },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className={`text-${item.color}-500 mb-2`}>{item.icon}</div>
                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade CTA */}
                {planName === "Free" || planName === "Field Starter" ? (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                    <div className="font-bold text-lg mb-1">Upgrade to Field Pro</div>
                    <p className="text-blue-200 text-sm mb-4">Unlock Riley Ops Manager, Live Interpreter, and Construction Tools.</p>
                    <a
                      href="tel:+17372595692"
                      className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-md"
                    >
                      <Phone size={14} /> Call (737) 259-5692 to Upgrade
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-display text-base font-bold text-gray-900">Security</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Account access and session management.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Shield size={18} className="text-green-600 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-green-800">Secured with Manus OAuth</div>
                      <div className="text-xs text-green-600">Your account uses OAuth 2.0 — no passwords stored.</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Authentication", value: "Manus OAuth 2.0" },
                      { label: "Session", value: "JWT (HttpOnly cookie)" },
                      { label: "Data Encryption", value: "TLS 1.3 in transit" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { logout(); toast.success("Signed out successfully"); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
                  >
                    <LogOut size={15} /> Sign Out of All Sessions
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
