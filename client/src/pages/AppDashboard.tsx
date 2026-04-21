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
  Phone, Bot, Globe, Calendar, HardHat, LogOut,
  User, MessageSquare, Users, CheckCircle2, Clock,
  Zap, Settings as SettingsIcon, CreditCard,
  Copy, CheckCheck, PhoneCall, X, Sparkles,
  ChevronRight, ExternalLink, ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type ActiveView = null | "receptionist" | "ops_manager" | "interpreter" | "calendar" | "construction";

export default function AppDashboard() {
  const { t, lang, setLang } = useLang();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const { data: todayBookings } = trpc.dashboard.todayBookings.useQuery(undefined, {
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
          <img src={CDN.logoTransparent} alt="SoloEdge Automations" className="h-10 w-auto mx-auto mb-6 object-contain" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">SoloEdge Dashboard</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to access Riley and your business tools.</p>
          <a
            href={getLoginUrl()}
            className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  // ── Full-screen sub-views ─────────────────────────────────────────────────
  if (activeView === "receptionist" || activeView === "ops_manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title={activeView === "receptionist" ? "SoloHub — AI Receptionist" : "SoloHub — Ops Manager"} logout={logout} />
        <div className="flex-1 overflow-hidden">
          <RileyChat mode={activeView === "receptionist" ? "receptionist" : "ops_manager"} />
        </div>
      </div>
    );
  }

  if (activeView === "interpreter") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title="LiveDesk — Live Translator" logout={logout} />
        <div className="flex-1 overflow-hidden">
          <InterpreterDesk />
        </div>
      </div>
    );
  }

  if (activeView === "calendar") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title="SoloBooking — Calendar" logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <CalendarView />
        </div>
      </div>
    );
  }

  if (activeView === "construction") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardTopBar user={user} onBack={() => setActiveView(null)} title="Field Tools" logout={logout} />
        <div className="flex-1 overflow-auto p-4">
          <ConstructionTools />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const rileyNumber = stats?.assignedPhoneNumber;
  const formattedNumber = rileyNumber
    ? rileyNumber.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '($2) $3-$4')
    : null;

  // ── Main Dashboard Home ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src={CDN.logoTransparent} alt="SoloEdge" className="h-8 w-auto object-contain" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const langs = ["en", "es", "zh"] as const;
                const idx = langs.indexOf(lang);
                setLang(langs[(idx + 1) % langs.length]);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {lang === "en" ? "🇺🇸 EN" : lang === "es" ? "🇲🇽 ES" : "🇨🇳 ZH"}
            </button>
            <a href="/app/settings" className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <SettingsIcon size={16} />
            </a>
            <button onClick={() => logout()} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Hero Greeting ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold leading-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                {rileyNumber
                  ? `Riley is answering calls on ${formattedNumber}`
                  : "Riley is online and ready."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Riley Online
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                <Zap size={10} />
                {stats?.planName ?? "Field Starter"}
              </span>
            </div>
          </div>

          {/* Riley number — prominent inside hero */}
          {rileyNumber && (
            <div className="mt-4 flex items-center justify-between bg-white/15 rounded-xl px-4 py-3">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Your Riley Number</p>
                <p className="text-2xl font-bold font-mono tracking-wide mt-0.5">{formattedNumber}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rileyNumber!);
                    setPhoneCopied(true);
                    setTimeout(() => setPhoneCopied(false), 2000);
                  }}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
                  title="Copy number"
                >
                  {phoneCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
                </button>
                <a
                  href={`tel:${rileyNumber}`}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
                  title="Test call"
                >
                  <PhoneCall size={16} />
                </a>
              </div>
            </div>
          )}

          {!rileyNumber && !statsLoading && (
            <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-2">
              <Clock size={14} className="text-blue-200" />
              <p className="text-blue-200 text-sm">Your Riley number is being provisioned — check back shortly.</p>
            </div>
          )}
        </div>

        {/* ── Onboarding Checklist (only if not complete) ────────────────── */}
        {stats && !statsLoading && !(stats.hasSubscription && stats.hasPhone && stats.hasCalendar && stats.hasFirstBooking) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <CheckCircle2 size={15} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-900">Getting Started</span>
              <span className="ml-auto text-xs text-gray-400 mr-2">
                {[stats.hasSubscription, stats.hasPhone, stats.hasCalendar, stats.hasFirstBooking].filter(Boolean).length}/4 done
              </span>
              <button
                onClick={() => { setWizardStep(0); setShowWizard(true); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
              >
                <Sparkles size={11} />
                Setup
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { done: stats.hasSubscription, label: "Subscription active", action: null },
                { done: stats.hasPhone, label: "Riley phone number assigned", action: null },
                { done: stats.hasCalendar, label: "Google Calendar connected", action: "/app/settings" },
                { done: stats.hasFirstBooking, label: "First booking created", action: "/app/bookings" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-100" : "bg-gray-100"}`}>
                    {item.done
                      ? <CheckCircle2 size={14} className="text-green-600" />
                      : <Clock size={14} className="text-gray-400" />}
                  </div>
                  <p className={`text-sm font-medium flex-1 ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.label}</p>
                  {!item.done && item.action && (
                    <a href={item.action} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 transition-colors">
                      Fix <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4 Big Action Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* SoloHub */}
          <button
            onClick={() => setActiveView("receptionist")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start gap-3 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.97] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">SoloHub</div>
              <div className="text-xs text-gray-400 mt-0.5">Talk to Riley</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-auto">
              Launch <ArrowRight size={12} />
            </div>
          </button>

          {/* SoloBooking */}
          <button
            onClick={() => window.location.href = "/app/bookings"}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start gap-3 hover:border-green-200 hover:shadow-md transition-all active:scale-[0.97] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md shadow-green-200">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">SoloBooking</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {todayBookings && todayBookings.length > 0
                  ? `${todayBookings.length} booking${todayBookings.length > 1 ? "s" : ""} today`
                  : "View schedule"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-auto">
              Open <ArrowRight size={12} />
            </div>
          </button>

          {/* LiveDesk */}
          <button
            onClick={() => setActiveView("interpreter")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start gap-3 hover:border-cyan-200 hover:shadow-md transition-all active:scale-[0.97] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shadow-md shadow-cyan-200">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">LiveDesk</div>
              <div className="text-xs text-gray-400 mt-0.5">Live translator</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-600 font-medium mt-auto">
              Start <ArrowRight size={12} />
            </div>
          </button>

          {/* Field Tools */}
          <button
            onClick={() => setActiveView("construction")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start gap-3 hover:border-orange-200 hover:shadow-md transition-all active:scale-[0.97] text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
              <HardHat size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">Field Tools</div>
              <div className="text-xs text-gray-400 mt-0.5">Crew & job site</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mt-auto">
              Open <ArrowRight size={12} />
            </div>
          </button>

        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {statsLoading ? "—" : String(stats?.bookingsToday ?? 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Today</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {statsLoading ? "—" : String(stats?.bookingsTotal ?? 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Bookings</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {statsLoading ? "—" : String(stats?.conversationsTotal ?? 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Conversations</div>
          </div>
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-900">Recent Activity</span>
            <a href="/app/agents" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-colors">
              Agent Center <ChevronRight size={12} />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {activityLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0
                    ${item.badge === "Ops" ? "bg-purple-500" :
                      item.badge === "Safety" ? "bg-red-500" :
                      item.badge === "Log" ? "bg-orange-500" :
                      "bg-blue-500"}`}
                  >
                    {item.badge === "Ops" ? <Bot size={15} /> :
                     item.badge === "Log" ? <HardHat size={15} /> :
                     <MessageSquare size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate capitalize">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.subtitle}</div>
                  </div>
                  <div className="text-xs text-gray-300 whitespace-nowrap">
                    {formatRelativeTime(new Date(item.timestamp))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bot size={28} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No activity yet.</p>
                <p className="text-xs text-gray-300 mt-0.5">Call your Riley number to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── More Links ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Users size={16} />, label: "Contacts", href: "/app/contacts", color: "text-purple-600 bg-purple-50" },
            { icon: <CreditCard size={16} />, label: "Billing", href: "/app/billing", color: "text-green-600 bg-green-50" },
            { icon: <Zap size={16} />, label: "Agents", href: "/app/agents", color: "text-amber-600 bg-amber-50" },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-2 hover:shadow-sm transition-all active:scale-[0.97]"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pb-4">
          Powered by{" "}
          <a href="https://soloedgeautomations.com" className="hover:text-gray-400 transition-colors">
            SoloEdge
          </a>
        </p>

      </div>

      {/* ── Onboarding Wizard Modal ────────────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowWizard(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-5">
              {[0,1,2].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= wizardStep ? "bg-blue-600" : "bg-gray-200"}`} />
              ))}
            </div>

            {wizardStep === 0 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <Globe size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Step 1: Connect Your Business</h2>
                <p className="text-gray-500 text-sm mb-4">Tell Riley where to find your business info so it can answer questions accurately.</p>
                <a href="/app/settings" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center">
                    <Globe size={16} className="text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Add your website or Google listing</p>
                    <p className="text-xs text-gray-400">Riley learns from it automatically</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-blue-500" />
                </a>
                <button onClick={() => setWizardStep(1)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all">
                  Next: Connect Calendar →
                </button>
                <button onClick={() => setWizardStep(1)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">Skip for now</button>
              </div>
            )}

            {wizardStep === 1 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                  <Calendar size={24} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Step 2: Connect Google Calendar</h2>
                <p className="text-gray-500 text-sm mb-4">Riley books appointments directly into your calendar — no double-booking, no missed calls.</p>
                <a href="/app/settings" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center">
                    <Calendar size={16} className="text-gray-500 group-hover:text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Connect Google Calendar</p>
                    <p className="text-xs text-gray-400">Takes about 30 seconds</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-green-500" />
                </a>
                <button onClick={() => setWizardStep(2)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all">
                  Next: Phone Setup →
                </button>
                <button onClick={() => setWizardStep(2)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">Skip for now</button>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mb-4">
                  <Phone size={24} className="text-sky-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Step 3: Your Riley Number</h2>
                <p className="text-gray-500 text-sm mb-4">Riley answers every call 24/7 on your dedicated number.</p>
                {rileyNumber ? (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-4">
                    <p className="text-sm font-bold text-green-800">✅ You're all set!</p>
                    <p className="text-2xl font-bold text-green-700 font-mono mt-1">{formattedNumber}</p>
                    <p className="text-xs text-green-600 mt-1">Share this number — Riley answers 24/7</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                    <p className="text-sm font-semibold text-amber-800">⏳ Your number is being set up</p>
                    <p className="text-xs text-amber-600 mt-1">Usually takes a few minutes. Contact support if it's been more than 10 minutes.</p>
                  </div>
                )}
                <button onClick={() => setShowWizard(false)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all">
                  🎉 Done — Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

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
    <div className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
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
