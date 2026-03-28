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

  const { data: leads } = trpc.admin.getLeads.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const upsertClient = trpc.admin.upsertClient.useMutation({ onSuccess: () => refetchClients() });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <img src={CDN.logoSymbol} alt="SoloEdge" className="w-16 h-16 object-contain animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-gray-200 shadow-xl shadow-gray-100">
          <Shield size={32} className="text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 text-sm mb-4">This panel is restricted to SoloEdge administrators.</p>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={CDN.logoSymbol} alt="S" className="h-12 w-12 object-contain drop-shadow-sm" />
            <img src={CDN.logo} alt="SoloEdge" className="h-9 w-auto hidden sm:block" />
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-sm font-semibold text-gray-600">Admin Panel</span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium">Gary Only</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{user.name}</span>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Leads", value: leads?.length ?? "—", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "Active Clients", value: clients?.filter(c => c.status === "active").length ?? "—", color: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: "Total Clients", value: clients?.length ?? "—", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
            { label: "New Leads", value: leads?.filter(l => l.status === "new").length ?? "—", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 text-center border ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{String(s.value)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 mb-5 w-fit">
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
                  activeTab === tab.key ? "bg-white text-blue-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-800"
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
              <h2 className="text-sm font-semibold text-gray-600">White-Label Clients</h2>
              <button onClick={() => refetchClients()} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <RefreshCw size={13} />
              </button>
            </div>

            {!clients || clients.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
                <Users size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No clients yet. Clients will appear here when they sign up.</p>
              </div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt={client.clientName} className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                          {client.clientName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{client.businessName ?? client.clientName}</div>
                        <div className="text-xs text-gray-400">{client.planId ?? "No plan"} · {client.aiMode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        client.status === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
                      }`}>
                        {client.status}
                      </span>
                      <select
                        value={client.planId ?? ""}
                        onChange={e => upsertClient.mutate({ id: client.id, businessName: client.businessName ?? client.clientName, plan: e.target.value as Parameters<typeof upsertClient.mutate>[0]['plan'], active: client.status === 'active' })}
                        className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs focus:outline-none focus:border-blue-400"
                      >
                        <option value="">No plan</option>
                        <option value="field-starter">Field Starter</option>
                        <option value="field-pro">Field Pro</option>
                        <option value="field-team">Field Team</option>
                        <option value="sched-starter">Sched Starter</option>
                        <option value="sched-pro">Sched Pro</option>
                        <option value="sched-plus">Sched Plus</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Config */}
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                    {[
                      { label: "STT", value: client.sttProvider, field: "sttProvider", options: ["whisper", "deepgram", "google"] },
                      { label: "LLM", value: client.llmProvider, field: "llmProvider", options: ["manus", "openai", "anthropic"] },
                      { label: "TTS", value: client.ttsProvider, field: "ttsProvider", options: ["manus", "elevenlabs", "google"] },
                    ].map(cfg => (
                      <div key={cfg.field}>
                        <label className="block text-xs text-gray-400 mb-1">{cfg.label}</label>
                        <select
                          value={cfg.value ?? ""}
                          onChange={e => upsertClient.mutate({ id: client.id, businessName: client.businessName ?? client.clientName, plan: (client.planId ?? 'field_starter') as Parameters<typeof upsertClient.mutate>[0]['plan'], [cfg.field]: e.target.value, active: client.status === 'active' })}
                          className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs focus:outline-none focus:border-blue-400"
                        >
                          {cfg.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
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
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
            <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Detailed analytics coming soon. Current totals shown above.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Platform Settings</h3>
            <div className="space-y-3">
              {[
                { label: "Default STT Provider", value: "Whisper (Manus Built-in)" },
                { label: "Default LLM Provider", value: "Manus Built-in LLM" },
                { label: "Default TTS Provider", value: "Manus Built-in TTS" },
                { label: "Notification Channel", value: "Telegram + SMS" },
                { label: "White-label Support", value: "Enabled" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className="text-sm font-medium text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
