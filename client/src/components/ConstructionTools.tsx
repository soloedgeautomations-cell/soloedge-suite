import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { HardHat, AlertTriangle, Users, ClipboardList, FileText, ChevronDown } from "lucide-react";

type LogType = "check-in" | "progress" | "safety" | "material-request" | "sub-coordination" | "change-order";

const LOG_TYPES: { key: LogType; label: string; icon: typeof HardHat; color: string }[] = [
  { key: "check-in", label: "Field Check-In", icon: HardHat, color: "from-blue-600 to-blue-400" },
  { key: "progress", label: "Progress Update", icon: ClipboardList, color: "from-green-600 to-green-400" },
  { key: "safety", label: "Safety Alert", icon: AlertTriangle, color: "from-red-600 to-red-400" },
  { key: "material-request", label: "Material Request", icon: FileText, color: "from-orange-600 to-orange-400" },
  { key: "sub-coordination", label: "Sub Coordinator", icon: Users, color: "from-purple-600 to-purple-400" },
  { key: "change-order", label: "Change Order", icon: FileText, color: "from-yellow-600 to-yellow-400" },
];

export default function ConstructionTools() {
  const { t } = useLang();
  const [activeType, setActiveType] = useState<LogType>("check-in");
  const [form, setForm] = useState({ jobSite: "", crewMember: "", content: "" });
  const [result, setResult] = useState<{ summary: string; translatedContent: string; jargonTerms: string[]; urgent: boolean } | null>(null);
  const [logs, setLogs] = useState<{ logType: string; content: string; summary: string; time: string }[]>([]);

  const logEntry = trpc.construction.logEntry.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setLogs(prev => [{
        logType: activeType,
        content: form.content,
        summary: data.summary,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }, ...prev.slice(0, 9)]);
      setForm(f => ({ ...f, content: "" }));
    },
  });

  const dailySummary = trpc.construction.generateDailySummary.useMutation();

  const activeTypeInfo = LOG_TYPES.find(l => l.key === activeType)!;
  const Icon = activeTypeInfo.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-white">Construction Tools</h2>
        <p className="text-sm text-white/45 mt-0.5">Field check-in, sub coordination, safety alerts, and progress logs</p>
      </div>

      {/* Log type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LOG_TYPES.map(lt => {
          const LtIcon = lt.icon;
          return (
            <button
              key={lt.key}
              onClick={() => { setActiveType(lt.key); setResult(null); }}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                activeType === lt.key
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/3 border-white/8 text-white/55 hover:text-white hover:bg-white/6"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${lt.color} flex items-center justify-center flex-shrink-0`}>
                <LtIcon size={13} className="text-white" />
              </div>
              <span className="text-xs font-medium leading-tight">{lt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input form */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${activeTypeInfo.color} flex items-center justify-center`}>
            <Icon size={15} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-white">{activeTypeInfo.label}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Job Site"
            value={form.jobSite}
            onChange={e => setForm(f => ({ ...f, jobSite: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
          />
          <input
            placeholder="Crew Member"
            value={form.crewMember}
            onChange={e => setForm(f => ({ ...f, crewMember: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
          />
        </div>

        <textarea
          rows={3}
          placeholder={t.construction.jargonHint}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={() => logEntry.mutate({ ...form, logType: activeType, language: "en" })}
            disabled={!form.content.trim() || logEntry.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-all"
          >
            {logEntry.isPending ? "Processing..." : "Log Entry"}
          </button>
          <button
            onClick={() => dailySummary.mutate({ jobSite: form.jobSite })}
            disabled={dailySummary.isPending}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-sm font-semibold transition-all"
          >
            {dailySummary.isPending ? "..." : "Daily Summary"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`glass rounded-2xl p-5 border ${result.urgent ? "border-red-500/30 bg-red-900/10" : "border-green-500/20"}`}>
          {result.urgent && (
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Urgent Item Flagged</span>
            </div>
          )}
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Riley's Summary</h4>
          <p className="text-sm text-white/80 leading-relaxed mb-3">{result.summary}</p>
          {result.translatedContent && result.translatedContent !== result.summary && (
            <>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Translation</h4>
              <p className="text-sm text-white/60 leading-relaxed mb-3">{result.translatedContent}</p>
            </>
          )}
          {result.jargonTerms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Construction Terms Detected</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.jargonTerms.map((term, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-orange-600/15 border border-orange-500/20 text-orange-300 text-xs">{term}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily summary result */}
      {dailySummary.data && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-white">Daily Summary</h4>
          <div>
            <p className="text-xs text-white/40 mb-1">English</p>
            <p className="text-sm text-white/80 leading-relaxed">{dailySummary.data.summary}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Español</p>
            <p className="text-sm text-white/70 leading-relaxed">{dailySummary.data.spanishSummary}</p>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Recent Logs</h3>
          <div className="space-y-2">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(0.13_0.015_240)] border border-white/5">
                <span className="text-xs text-white/30 flex-shrink-0 mt-0.5">{log.time}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white/50 uppercase">{log.logType}</span>
                  <p className="text-sm text-white/70 truncate mt-0.5">{log.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
