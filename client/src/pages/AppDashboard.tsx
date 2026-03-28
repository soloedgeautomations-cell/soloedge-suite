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
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg animate-pulse">R</div>
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
          <img src={CDN.logo} alt="SoloEdge" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">SoloEdge Dashboard</h2>
          <p className="text-white/50 text-sm mb-6">Sign in to access Riley, the Live Interpreter, and your business tools.</p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
          >
            Sign In to Continue
          </a>
          <a href="/" className="block mt-3 text-sm text-white/40 hover:text-white/70 transition-colors">← Back to soloedgeautomations.com</a>
        </div>
      </div>
    );
  }

  // If a view is active, show it full-screen
  if (activeView === "receptionist" || activeView === "ops_manager") {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={activeView === "receptionist" ? t.dashboard.launchReceptionist : t.dashboard.launchOpsManager} logout={logout} />
        <div className="flex-1 overflow-hidden">
          <RileyChat mode={activeView === "receptionist" ? "receptionist" : "ops_manager"} />
        </div>
      </div>
    );
  }

  if (activeView === "interpreter") {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={t.dashboard.startInterpreter} logout={logout} />
        <div className="flex-1 overflow-hidden">
          <InterpreterDesk />
        </div>
      </div>
    );
  }

  if (activeView === "calendar") {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={t.dashboard.viewCalendar} logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <CalendarView />
        </div>
      </div>
    );
  }

  if (activeView === "construction") {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title="Construction Tools" logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <ConstructionTools />
        </div>
      </div>
    );
  }

  // Main one-screen dashboard
  return (
    <div className="min-h-screen bg-[oklch(0.09_0.012_240)]">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[oklch(0.11_0.013_240/0.8)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src={CDN.logo} alt="SoloEdge" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={() => {
                const langs = ["en", "es", "zh"] as const;
                const idx = langs.indexOf(lang);
                setLang(langs[(idx + 1) % langs.length]);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white transition-colors"
            >
              {lang === "en" ? "🇺🇸 EN" : lang === "es" ? "🇲🇽 ES" : "🇨🇳 ZH"}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <User size={12} className="text-white/40" />
              <span className="text-xs text-white/60">{user?.name ?? "User"}</span>
            </div>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {t.dashboard.welcome}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-white/45 mt-0.5">What do you need help with today?</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t.dashboard.callsHandled, value: "—", color: "text-blue-400" },
            { label: t.dashboard.bookingsToday, value: "—", color: "text-green-400" },
            { label: t.dashboard.activeLang, value: lang.toUpperCase(), color: "text-cyan-400" },
            { label: t.dashboard.planTier, value: "Pro", color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-3.5 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Big action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BigButton
            icon={<Phone size={24} />}
            label={t.dashboard.launchReceptionist}
            sublabel="Answer calls, capture leads, book appointments"
            color="from-blue-600 to-blue-500"
            glow="shadow-blue-900/40"
            onClick={() => setActiveView("receptionist")}
          />
          <BigButton
            icon={<Bot size={24} />}
            label={t.dashboard.launchOpsManager}
            sublabel="Crew coordination, daily summaries, task routing"
            color="from-purple-600 to-purple-500"
            glow="shadow-purple-900/40"
            onClick={() => setActiveView("ops_manager")}
          />
          <BigButton
            icon={<Globe size={24} />}
            label={t.dashboard.startInterpreter}
            sublabel="Real-time EN ↔ ES ↔ ZH translation desk"
            color="from-cyan-600 to-cyan-500"
            glow="shadow-cyan-900/40"
            onClick={() => setActiveView("interpreter")}
          />
          <BigButton
            icon={<Calendar size={24} />}
            label={t.dashboard.viewCalendar}
            sublabel="Upcoming appointments and booking requests"
            color="from-green-600 to-green-500"
            glow="shadow-green-900/40"
            onClick={() => setActiveView("calendar")}
          />
        </div>

        {/* Construction tools button */}
        <button
          onClick={() => setActiveView("construction")}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-[oklch(0.13_0.015_240)] border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-900/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center shadow-lg">
            <HardHat size={18} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-white">Construction Tools</div>
            <div className="text-xs text-white/45">Check-in, sub coordinator, safety alerts, progress logs</div>
          </div>
          <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
        </button>

        {/* Recent activity */}
        <div>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">{t.dashboard.recentActivity}</h2>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.slice(0, 5).map(conv => (
                <div key={conv.id} className="flex items-center gap-3 p-3 rounded-xl bg-[oklch(0.13_0.015_240)] border border-white/5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${conv.mode === "ops_manager" ? "bg-purple-600/30" : "bg-blue-600/30"}`}>
                    {conv.mode === "ops_manager" ? "O" : "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{conv.title ?? `${conv.mode} session`}</div>
                    <div className="text-xs text-white/35">{new Date(conv.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs text-white/30 uppercase">{conv.language}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[oklch(0.13_0.015_240)] border border-white/5 text-center">
              <p className="text-sm text-white/35">No recent activity yet. Launch Riley to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BigButton({ icon, label, sublabel, color, glow, onClick }: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  glow: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl bg-gradient-to-br ${color} hover:opacity-90 transition-all shadow-xl ${glow} text-left`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <div className="font-display text-base font-bold text-white leading-tight">{label}</div>
        <div className="text-xs text-white/65 mt-0.5 leading-relaxed">{sublabel}</div>
      </div>
      <ChevronRight size={16} className="absolute top-4 right-4 text-white/40 group-hover:text-white/70 transition-colors" />
    </button>
  );
}

function DashboardTopBar({ user, onBack, title, logout }: { user: any; onBack: () => void; title: string; logout: () => void }) {
  return (
    <div className="border-b border-white/5 bg-[oklch(0.11_0.013_240/0.95)] backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-sm font-semibold text-white truncate flex-1">{title}</span>
        <button onClick={() => logout()} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
