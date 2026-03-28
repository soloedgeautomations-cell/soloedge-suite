import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CDN } from "../../../shared/assets";
import RileyChat from "@/components/RileyChat";
import InterpreterDesk from "@/components/InterpreterDesk";
import CalendarView from "@/components/CalendarView";
import ConstructionTools from "@/components/ConstructionTools";
import {
  Phone, Bot, Globe, Calendar, HardHat, ChevronRight, LogOut,
  User, TrendingUp, MessageSquare, Users, CheckCircle2, Clock,
  AlertTriangle, Zap, BarChart3, ArrowUpRight, Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type ActiveView = null | "receptionist" | "ops_manager" | "interpreter" | "calendar" | "construction";

export default function AppDashboard() {
  const { t, lang, setLang } = useLang();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(null);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const { data: todayBookings, isLoading: bookingsLoading } = trpc.dashboard.todayBookings.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

  // ── Full-screen sub-views ─────────────────────────────────────────────────
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

  // ── Main Dashboard Home ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={CDN.logoSymbol} alt="S" className="h-12 w-12 object-contain drop-shadow-sm" />
            <img src={CDN.logo} alt="SoloEdge" className="h-9 w-auto hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Welcome + Riley Status ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Welcome card */}
          <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <img src={CDN.logoSymbol} alt="SoloEdge" className="w-12 h-12 object-contain drop-shadow-md" />
              <div>
                <h1 className="font-display text-xl font-bold leading-tight">
                  {greeting}, {user?.name?.split(" ")[0] ?? "there"} 👋
                </h1>
                <p className="text-blue-200 text-sm mt-0.5">Your command center is ready.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Riley Online
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium text-white">
                <Zap size={10} />
                {stats?.planName ?? "Field Starter"}
              </span>
            </div>
          </div>

          {/* Riley quick launch */}
          <div className="sm:w-56 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bot size={16} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Riley AI</div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online Now
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveView("receptionist")}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors flex items-center justify-between"
              >
                <span>Receptionist Mode</span>
                <ChevronRight size={12} />
              </button>
              <button
                onClick={() => setActiveView("ops_manager")}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors flex items-center justify-between"
              >
                <span>Ops Manager Mode</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Bookings Today"
            value={statsLoading ? "—" : String(stats?.bookingsToday ?? 0)}
            icon={<Calendar size={16} />}
            color="blue"
            trend={stats?.bookingsToday ? `+${stats.bookingsToday} today` : "None yet today"}
          />
          <StatCard
            label="Total Bookings"
            value={statsLoading ? "—" : String(stats?.bookingsTotal ?? 0)}
            icon={<TrendingUp size={16} />}
            color="green"
            trend="All time"
          />
          <StatCard
            label="Conversations"
            value={statsLoading ? "—" : String(stats?.conversationsTotal ?? 0)}
            icon={<MessageSquare size={16} />}
            color="purple"
            trend="With Riley"
          />
          <StatCard
            label="Leads Captured"
            value={statsLoading ? "—" : String(stats?.leadsTotal ?? 0)}
            icon={<Users size={16} />}
            color="cyan"
            trend="Via website"
          />
        </div>

        {/* ── Today's Bookings + Quick Actions ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Today's Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-blue-500" />
                <span className="text-sm font-semibold text-gray-900">Today's Bookings</span>
              </div>
              <button
                onClick={() => window.location.href = "/app/bookings"}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-colors"
              >
                View all <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="p-3 space-y-2 min-h-[120px]">
              {bookingsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : todayBookings && todayBookings.length > 0 ? (
                todayBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === "confirmed" ? "bg-green-500" : b.status === "cancelled" ? "bg-red-400" : "bg-yellow-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{b.customerName ?? "Unknown"}</div>
                      <div className="text-xs text-gray-400 truncate">{b.serviceType ?? "Service"}{b.preferredTime ? ` · ${b.preferredTime}` : ""}</div>
                    </div>
                    <StatusBadge status={b.status ?? "pending"} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-20 text-center">
                  <Calendar size={20} className="text-gray-200 mb-1.5" />
                  <p className="text-xs text-gray-400">No bookings scheduled today</p>
                  <button
                    onClick={() => window.location.href = "/app/bookings"}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Add a booking →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <Zap size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-900">Quick Actions</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {[
                { icon: <Phone size={16} />, label: "Launch Riley", sub: "Receptionist", color: "blue", action: () => setActiveView("receptionist") },
                { icon: <Globe size={16} />, label: "Interpreter", sub: "Live Desk", color: "cyan", action: () => setActiveView("interpreter") },
                { icon: <Calendar size={16} />, label: "Calendar", sub: "Bookings", color: "green", action: () => window.location.href = "/app/bookings" },
                { icon: <HardHat size={16} />, label: "Field Tools", sub: "Construction", color: "orange", action: () => setActiveView("construction") },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${item.color === "blue" ? "bg-blue-50 border-blue-100 hover:bg-blue-100" :
                      item.color === "cyan" ? "bg-cyan-50 border-cyan-100 hover:bg-cyan-100" :
                      item.color === "green" ? "bg-green-50 border-green-100 hover:bg-green-100" :
                      "bg-orange-50 border-orange-100 hover:bg-orange-100"}`}
                >
                  <div className={`
                    ${item.color === "blue" ? "text-blue-600" :
                      item.color === "cyan" ? "text-cyan-600" :
                      item.color === "green" ? "text-green-600" :
                      "text-orange-600"}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Activity Feed ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <Activity size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Recent Activity</span>
          </div>
          <div className="divide-y divide-gray-50">
            {activityLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                    ${item.badge === "Ops" ? "bg-purple-500" :
                      item.badge === "Safety" ? "bg-red-500" :
                      item.badge === "Log" ? "bg-orange-500" :
                      "bg-blue-500"}`}
                  >
                    {item.badge === "Ops" ? <Bot size={14} /> :
                     item.badge === "Safety" ? <AlertTriangle size={14} /> :
                     item.badge === "Log" ? <HardHat size={14} /> :
                     <MessageSquare size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-medium truncate capitalize">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.subtitle}</div>
                  </div>
                  <div className="text-xs text-gray-300 whitespace-nowrap">
                    {formatRelativeTime(new Date(item.timestamp))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <img src={CDN.logoSymbol} alt="" className="w-10 h-10 object-contain mb-2 opacity-30" />
                <p className="text-sm text-gray-400">No activity yet.</p>
                <p className="text-xs text-gray-300 mt-0.5">Launch Riley to get started.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, trend }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "cyan";
  trend: string;
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50 border-blue-100", icon: "bg-blue-100 text-blue-600", value: "text-blue-700" },
    green: { bg: "bg-green-50 border-green-100", icon: "bg-green-100 text-green-600", value: "text-green-700" },
    purple: { bg: "bg-purple-50 border-purple-100", icon: "bg-purple-100 text-purple-600", value: "text-purple-700" },
    cyan: { bg: "bg-cyan-50 border-cyan-100", icon: "bg-cyan-100 text-cyan-600", value: "text-cyan-700" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-xl p-3.5 border ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <BarChart3 size={12} className="text-gray-200" />
      </div>
      <div className={`text-2xl font-bold ${c.value}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 truncate">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5 truncate">{trend}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmed", cls: "bg-green-100 text-green-700" },
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-600" },
    completed: { label: "Done", cls: "bg-gray-100 text-gray-500" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
