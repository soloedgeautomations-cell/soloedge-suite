import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { HardHat, AlertTriangle, Users, ClipboardList, FileText } from "lucide-react";

type LogType = "check-in" | "progress" | "safety" | "material-request" | "sub-coordination" | "change-order";

const LOG_TYPES: { key: LogType; label: string; icon: typeof HardHat; color: string; bg: string }[] = [
  { key: "check-in", label: "Field Check-In", icon: HardHat, color: "from-blue-600 to-blue-400", bg: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "progress", label: "Progress Update", icon: ClipboardList, color: "from-green-600 to-green-400", bg: "bg-green-50 border-green-200 text-green-700" },
  { key: "safety", label: "Safety Alert", icon: AlertTriangle, color: "from-red-600 to-red-400", bg: "bg-red-50 border-red-200 text-red-700" },
  { key: "material-request", label: "Material Request", icon: FileText, color: "from-orange-600 to-orange-400", bg: "bg-orange-50 border-orange-200 text-orange-700" },
  { key: "sub-coordination", label: "Sub Coordinator", icon: Users, color: "from-purple-600 to-purple-400", bg: "bg-purple-50 border-purple-200 text-purple-700" },
  { key: "change-order", label: "Change Order", icon: FileText, color: "from-yellow-600 to-yellow-400", bg: "bg-yellow-50 border-yellow-200 text-yellow-700" },
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
        <h2 className="font-display text-xl font-bold text-gray-900">Construction Tools</h2>
        <p className="text-sm text-gray-500 mt-0.5">Field check-in, sub coordination, safety alerts, and progress logs</p>
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
                  ? `${lt.bg} shadow-sm`
                  : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
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
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${activeTypeInfo.color} flex items-center justify-center`}>
            <Icon size={15} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{activeTypeInfo.label}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Job Site"
            value={form.jobSite}
            onChange={e => setForm(f => ({ ...f, jobSite: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Crew Member"
            value={form.crewMember}
            onChange={e => setForm(f => ({ ...f, crewMember: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <textarea
          rows={3}
          placeholder={t.construction.jargonHint}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={() => logEntry.mutate({ ...form, logType: activeType, language: "en" })}
            disabled={!form.content.trim() || logEntry.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
          >
            {logEntry.isPending ? "Processing..." : "Log Entry"}
          </button>
          <button
            onClick={() => dailySummary.mutate({ jobSite: form.jobSite })}
            disabled={dailySummary.isPending}
            className="px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
          >
            {dailySummary.isPending ? "..." : "Daily Summary"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-5 border ${result.urgent ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          {result.urgent && (
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Urgent Item Flagged — Telegram + SMS sent to Gary</span>
            </div>
          )}
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Riley's Summary</h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{result.summary}</p>
          {result.translatedContent && result.translatedContent !== result.summary && (
            <>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Translation</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{result.translatedContent}</p>
            </>
          )}
          {result.jargonTerms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Construction Terms Detected</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.jargonTerms.map((term, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-medium">{term}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily summary result */}
      {dailySummary.data && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Daily Summary</h4>
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">English</p>
            <p className="text-sm text-gray-700 leading-relaxed">{dailySummary.data.summary}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Español</p>
            <p className="text-sm text-gray-600 leading-relaxed">{dailySummary.data.spanishSummary}</p>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Logs</h3>
          <div className="space-y-2">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{log.time}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{log.logType}</span>
                  <p className="text-sm text-gray-700 truncate mt-0.5">{log.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
