import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CDN } from "../../../shared/assets";
import RileyChat from "@/components/RileyChat";
import InterpreterDesk from "@/components/InterpreterDesk";
import CalendarView from "@/components/CalendarView";
import ConstructionTools from "@/components/ConstructionTools";
import { Phone, Bot, Globe, Calendar, HardHat, ChevronRight, LogOut, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ActiveView = null | "receptionist" | "ops_manager" | "interpreter" | "calendar" | "construction";

export default function AppDashboard() {
  const { t, lang, setLang } = useLang();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(null);

  const { data: conversations } = trpc.riley.getConversations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={CDN.logoSymbol} alt="SoloEdge" className="w-12 h-12 object-contain animate-pulse" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-gray-200 shadow-xl shadow-gray-100">
          <img src={CDN.logo} alt="SoloEdge" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">SoloEdge Dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to access Riley, the Live Interpreter, and your business tools.</p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200"
          >
            Sign In to Continue
          </a>
          <a href="/" className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back to soloedgeautomations.com</a>
        </div>
      </div>
    );
  }

  // If a view is active, show it full-screen
  if (activeView === "receptionist" || activeView === "ops_manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={activeView === "receptionist" ? t.dashboard.launchReceptionist : t.dashboard.launchOpsManager} logout={logout} />
        <div className="flex-1 overflow-hidden">
          <RileyChat mode={activeView === "receptionist" ? "receptionist" : "ops_manager"} />
        </div>
      </div>
    );
  }

  if (activeView === "interpreter") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={t.dashboard.startInterpreter} logout={logout} />
        <div className="flex-1 overflow-hidden">
          <InterpreterDesk />
        </div>
      </div>
    );
  }

  if (activeView === "calendar") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={t.dashboard.viewCalendar} logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <CalendarView />
        </div>
      </div>
    );
  }

  if (activeView === "construction") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title="Construction Tools" logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <ConstructionTools />
        </div>
      </div>
    );
  }

  // ── Main one-screen dashboard ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={CDN.logoSymbol} alt="S" className="h-12 w-12 object-contain drop-shadow-sm" />
            <img src={CDN.logo} alt="SoloEdge" className="h-9 w-auto hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={() => {
                const langs = ["en", "es", "zh"] as const;
                const idx = langs.indexOf(lang);
                setLang(langs[(idx + 1) % langs.length]);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              {lang === "en" ? "🇺🇸 EN" : lang === "es" ? "🇲🇽 ES" : "🇨🇳 ZH"}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
              <User size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">{user?.name ?? "User"}</span>
            </div>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center gap-3">
          <img src={CDN.logoSymbol} alt="SoloEdge" className="w-14 h-14 object-contain drop-shadow-md" />
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {t.dashboard.welcome}, {user?.name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">What do you need help with today?</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t.dashboard.callsHandled, value: "—", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: t.dashboard.bookingsToday, value: "—", color: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: t.dashboard.activeLang, value: lang.toUpperCase(), color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
            { label: t.dashboard.planTier, value: "Pro", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl p-3.5 text-center border ${stat.bg}`}>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Big action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BigButton
            icon={<Phone size={24} />}
            label={t.dashboard.launchReceptionist}
            sublabel="Answer calls, capture leads, book appointments"
            gradient="from-blue-600 to-blue-500"
            onClick={() => setActiveView("receptionist")}
          />
          <BigButton
            icon={<Bot size={24} />}
            label={t.dashboard.launchOpsManager}
            sublabel="Crew coordination, daily summaries, task routing"
            gradient="from-purple-600 to-purple-500"
            onClick={() => setActiveView("ops_manager")}
          />
          <BigButton
            icon={<Globe size={24} />}
            label={t.dashboard.startInterpreter}
            sublabel="Real-time EN ↔ ES ↔ ZH translation desk"
            gradient="from-cyan-600 to-cyan-500"
            onClick={() => setActiveView("interpreter")}
          />
          <BigButton
            icon={<Calendar size={24} />}
            label={t.dashboard.viewCalendar}
            sublabel="Upcoming appointments and booking requests"
            gradient="from-green-600 to-green-500"
            onClick={() => setActiveView("calendar")}
          />
        </div>

        {/* Construction tools button */}
        <button
          onClick={() => setActiveView("construction")}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <HardHat size={18} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-gray-900">Construction Tools</div>
            <div className="text-xs text-gray-500">Check-in, sub coordinator, safety alerts, progress logs</div>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
        </button>

        {/* Recent activity */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.dashboard.recentActivity}</h2>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.slice(0, 5).map(conv => (
                <div key={conv.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${conv.mode === "ops_manager" ? "bg-purple-500" : "bg-blue-500"}`}>
                    {conv.mode === "ops_manager" ? "O" : "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate">{conv.title ?? `${conv.mode} session`}</div>
                    <div className="text-xs text-gray-400">{new Date(conv.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs text-gray-300 uppercase">{conv.language}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-white border border-gray-100 text-center shadow-sm">
              <img src={CDN.logoSymbol} alt="" className="w-12 h-12 object-contain mx-auto mb-2 opacity-40" />
              <p className="text-sm text-gray-400">No recent activity yet. Launch Riley to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BigButton({ icon, label, sublabel, gradient, onClick }: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl bg-gradient-to-br ${gradient} hover:opacity-90 active:scale-[0.98] transition-all shadow-lg text-left`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <div className="font-display text-base font-bold text-white leading-tight">{label}</div>
        <div className="text-xs text-white/70 mt-0.5 leading-relaxed">{sublabel}</div>
      </div>
      <ChevronRight size={16} className="absolute top-4 right-4 text-white/40 group-hover:text-white/80 transition-colors" />
    </button>
  );
}

function DashboardTopBar({ user, onBack, title, logout }: { user: any; onBack: () => void; title: string; logout: () => void }) {
  return (
    <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-700 transition-colors text-sm font-medium">
          ← Back
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-sm font-semibold text-gray-900 truncate flex-1">{title}</span>
        <button onClick={() => logout()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
