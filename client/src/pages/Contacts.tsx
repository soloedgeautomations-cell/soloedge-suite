import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CDN } from "../../../shared/assets";
import {
  Users, Search, ChevronLeft, ChevronRight, Phone, Mail, Building2,
  Globe, Clock, CheckCircle, XCircle, RefreshCw, LogOut, User,
  MessageSquare, Tag, Filter,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type LeadStatus = "all" | "new" | "contacted" | "qualified" | "closed" | "lost";

interface Lead {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  message: string | null;
  language: string | null;
  source: string | null;
  status: string | null;
  createdAt: Date;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; next: string }> = {
  new:        { label: "New",       dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200",   next: "contacted" },
  contacted:  { label: "Contacted", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200", next: "qualified" },
  qualified:  { label: "Qualified", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200", next: "closed" },
  closed:     { label: "Closed",    dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",  next: "new" },
  lost:       { label: "Lost",      dot: "bg-red-400",    badge: "bg-red-50 text-red-600 border-red-200",        next: "new" },
};

const STATUS_ORDER: LeadStatus[] = ["all", "new", "contacted", "qualified", "closed", "lost"];

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Contacts() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, refetch } = trpc.leads.list.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Lead updated"); },
    onError: () => toast.error("Failed to update lead"),
  });

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = (leadsData ?? []) as Lead[];
    if (statusFilter !== "all") list = list.filter(l => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        (l.name ?? "").toLowerCase().includes(q) ||
        (l.phone ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.business_type ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [leadsData, statusFilter, search]);

  // ── Status counts ─────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const all = (leadsData ?? []) as Lead[];
    return {
      all: all.length,
      new: all.filter(l => l.status === "new").length,
      contacted: all.filter(l => l.status === "contacted").length,
      qualified: all.filter(l => l.status === "qualified").length,
      closed: all.filter(l => l.status === "closed").length,
      lost: all.filter(l => l.status === "lost").length,
    };
  }, [leadsData]);

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
          <img src={CDN.logoTransparent} alt="SoloEdge Automations" className="h-10 w-auto mx-auto mb-6 object-contain" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-6">Access your contacts and leads by signing in.</p>
          <a href={getLoginUrl()} className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200">
            Sign In to Continue
          </a>
          <a href="/app" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const sc = selectedLead ? (STATUS_CONFIG[selectedLead.status ?? "new"] ?? STATUS_CONFIG.new) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/app" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-700 transition-colors text-sm font-medium flex-shrink-0">
            <ChevronLeft size={16} />
            Dashboard
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Users size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 truncate">Contacts & Leads</span>
            <span className="text-xs text-gray-400 ml-1">{(leadsData ?? []).length} total</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">
              <User size={11} className="text-gray-400" />
              <span className="text-xs text-gray-600 hidden sm:inline">{user?.name ?? "User"}</span>
            </div>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5 flex flex-col gap-4">

        {/* ── Summary cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(["new", "contacted", "qualified", "closed", "lost"] as Exclude<LeadStatus, "all">[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? "all" : s)}
                className={`rounded-xl p-3 border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  statusFilter === s ? "ring-2 ring-blue-400 border-blue-300 bg-blue-50" : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${cfg.dot} mb-2`} />
                <div className="text-lg font-bold text-gray-900">{counts[s]}</div>
                <div className="text-xs text-gray-500 capitalize">{cfg.label}</div>
              </button>
            );
          })}
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl p-3 border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              statusFilter === "all" ? "ring-2 ring-blue-400 border-blue-300 bg-blue-50" : "bg-white border-gray-200 shadow-sm"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-gray-400 mb-2" />
            <div className="text-lg font-bold text-gray-900">{counts.all}</div>
            <div className="text-xs text-gray-500">All Leads</div>
          </button>
        </div>

        {/* ── Search + Filter bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name, phone, email, business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
            {STATUS_ORDER.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  statusFilter === s
                    ? s === "new" ? "bg-blue-600 text-white shadow-sm"
                    : s === "contacted" ? "bg-yellow-500 text-white shadow-sm"
                    : s === "qualified" ? "bg-purple-600 text-white shadow-sm"
                    : s === "closed" ? "bg-green-600 text-white shadow-sm"
                    : s === "lost" ? "bg-red-500 text-white shadow-sm"
                    : "bg-gray-700 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lead list ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-blue-400" />
              </div>
              <p className="text-gray-400 text-sm">
                {search || statusFilter !== "all" ? "No leads match your filter." : "No leads yet. Riley will capture them automatically from your website."}
              </p>
              {(search || statusFilter !== "all") && (
                <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-3 text-xs text-blue-600 hover:text-blue-800">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(lead => {
                const cfg = STATUS_CONFIG[lead.status ?? "new"] ?? STATUS_CONFIG.new;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-700">{(lead.name ?? "?")[0].toUpperCase()}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">{lead.name ?? "Unknown"}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {lead.phone && <span className="flex items-center gap-1"><Phone size={10} />{lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail size={10} />{lead.email}</span>}
                        {lead.business_type && <span className="flex items-center gap-1"><Building2 size={10} />{lead.business_type}</span>}
                        {lead.language && lead.language !== "English" && <span className="flex items-center gap-1"><Globe size={10} />{lead.language}</span>}
                      </div>
                    </div>

                    {/* Time + source */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="text-xs text-gray-400">{formatRelativeTime(lead.createdAt)}</div>
                      {lead.source && <div className="text-[10px] text-gray-300 mt-0.5 capitalize">{lead.source}</div>}
                    </div>

                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Lead Detail Modal ──────────────────────────────────────────────────── */}
      {selectedLead && sc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-display text-base font-bold text-gray-900">Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-700">{(selectedLead.name ?? "?")[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-base">{selectedLead.name ?? "Unknown"}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.badge}`}>{sc.label}</span>
                </div>
              </div>

              {/* Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                {selectedLead.phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                    <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">{selectedLead.phone}</a>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline truncate">{selectedLead.email}</a>
                  </div>
                )}
                {selectedLead.business_type && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{selectedLead.business_type}</span>
                  </div>
                )}
                {selectedLead.language && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Globe size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{selectedLead.language}</span>
                  </div>
                )}
                {selectedLead.source && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 capitalize">{selectedLead.source}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">{formatRelativeTime(selectedLead.createdAt)}</span>
                </div>
                {selectedLead.message && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 italic">"{selectedLead.message}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status actions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["new", "contacted", "qualified", "closed", "lost"] as Exclude<LeadStatus, "all">[]).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const isActive = selectedLead.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          updateStatus.mutate({ id: selectedLead.id, status: s });
                          setSelectedLead({ ...selectedLead, status: s });
                        }}
                        disabled={isActive || updateStatus.isPending}
                        className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                          isActive
                            ? `${cfg.badge} border-current opacity-100 cursor-default`
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="capitalize">{cfg.label}</span>
                        {isActive && <CheckCircle size={12} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
                  >
                    <Phone size={14} /> Call Now
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all"
                  >
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
