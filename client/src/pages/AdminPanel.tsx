import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CDN } from "../../../shared/assets";
import { Users, BarChart3, Settings, LogOut, Shield, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function AdminPanel() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"clients" | "stats" | "settings">("clients");

  const { data: clients, refetch: refetchClients } = trpc.admin.getClients.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const updateClient = trpc.admin.updateClient.useMutation({ onSuccess: () => refetchClients() });

  if (loading) {
    return <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex items-center justify-center"><div className="text-white/40">Loading...</div></div>;
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.09_0.012_240)] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
          <Shield size={32} className="text-red-400 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-white/50 text-sm mb-4">This panel is restricted to SoloEdge administrators.</p>
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.09_0.012_240)]">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[oklch(0.11_0.013_240/0.95)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={CDN.logo} alt="SoloEdge" className="h-7 w-auto" />
            <div className="w-px h-4 bg-white/10" />
            <span className="text-sm font-semibold text-white/70">Admin Panel</span>
            <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-medium">Gary Only</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{user.name}</span>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Leads", value: stats?.totalLeads ?? "—", color: "text-blue-400" },
            { label: "Active Clients", value: stats?.totalClients ?? "—", color: "text-green-400" },
            { label: "Total Bookings", value: stats?.totalBookings ?? "—", color: "text-cyan-400" },
            { label: "Field Logs", value: stats?.totalLogs ?? "—", color: "text-orange-400" },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{String(s.value)}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[oklch(0.13_0.015_240)] border border-white/8 mb-5 w-fit">
          {[
            { key: "clients", label: "Clients", icon: Users },
            { key: "stats", label: "Analytics", icon: BarChart3 },
            { key: "settings", label: "Settings", icon: Settings },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Clients tab */}
        {activeTab === "clients" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white/60">White-Label Clients</h2>
              <button onClick={() => refetchClients()} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                <RefreshCw size={13} />
              </button>
            </div>

            {!clients || clients.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <Users size={28} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No clients yet. Clients will appear here when they sign up.</p>
              </div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt={client.clientName} className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                          {client.clientName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white">{client.businessName ?? client.clientName}</div>
                        <div className="text-xs text-white/40">{client.planId ?? "No plan"} · {client.aiMode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        client.status === "active" ? "bg-green-600/15 border-green-500/25 text-green-400" : "bg-red-600/15 border-red-500/25 text-red-400"
                      }`}>
                        {client.status}
                      </span>
                      <select
                        value={client.planId ?? ""}
                        onChange={e => updateClient.mutate({ id: client.id, planId: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                      >
                        <option value="" className="bg-[oklch(0.13_0.015_240)]">No plan</option>
                        <option value="field-starter" className="bg-[oklch(0.13_0.015_240)]">Field Starter</option>
                        <option value="field-pro" className="bg-[oklch(0.13_0.015_240)]">Field Pro</option>
                        <option value="field-team" className="bg-[oklch(0.13_0.015_240)]">Field Team</option>
                        <option value="sched-starter" className="bg-[oklch(0.13_0.015_240)]">Sched Starter</option>
                        <option value="sched-pro" className="bg-[oklch(0.13_0.015_240)]">Sched Pro</option>
                        <option value="sched-plus" className="bg-[oklch(0.13_0.015_240)]">Sched Plus</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Config */}
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2">
                    {[
                      { label: "STT", value: client.sttProvider, field: "sttProvider", options: ["whisper", "deepgram", "google"] },
                      { label: "LLM", value: client.llmProvider, field: "llmProvider", options: ["manus", "openai", "anthropic"] },
                      { label: "TTS", value: client.ttsProvider, field: "ttsProvider", options: ["manus", "elevenlabs", "google"] },
                    ].map(cfg => (
                      <div key={cfg.field}>
                        <label className="block text-xs text-white/30 mb-1">{cfg.label}</label>
                        <select
                          value={cfg.value ?? ""}
                          onChange={e => updateClient.mutate({ id: client.id, [cfg.field]: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                        >
                          {cfg.options.map(opt => (
                            <option key={opt} value={opt} className="bg-[oklch(0.13_0.015_240)]">{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="glass rounded-2xl p-8 text-center">
            <BarChart3 size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Detailed analytics coming soon. Current totals shown above.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Platform Settings</h3>
            <div className="space-y-3">
              {[
                { label: "Default STT Provider", value: "Whisper (Manus Built-in)" },
                { label: "Default LLM Provider", value: "Manus Built-in LLM" },
                { label: "Default TTS Provider", value: "Manus Built-in TTS" },
                { label: "Notification Channel", value: "Telegram + SMS" },
                { label: "White-label Support", value: "Enabled" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-white/5">
                  <span className="text-sm text-white/60">{s.label}</span>
                  <span className="text-sm text-white/90 font-medium">{s.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30">To swap providers per client, use the Clients tab above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
