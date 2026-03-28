import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { HardHat, AlertTriangle, Users, ClipboardList, FileText, CheckCircle } from "lucide-react";
import { nanoid } from "nanoid";

type LogType = "check-in" | "progress" | "safety" | "material-request";

const LOG_TYPES: { key: LogType; label: string; icon: typeof HardHat; color: string; bg: string }[] = [
  { key: "check-in", label: "Field Check-In", icon: HardHat, color: "from-blue-600 to-blue-400", bg: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "progress", label: "Progress Update", icon: ClipboardList, color: "from-green-600 to-green-400", bg: "bg-green-50 border-green-200 text-green-700" },
  { key: "safety", label: "Safety Alert", icon: AlertTriangle, color: "from-red-600 to-red-400", bg: "bg-red-50 border-red-200 text-red-700" },
  { key: "material-request", label: "Material Request", icon: FileText, color: "from-orange-600 to-orange-400", bg: "bg-orange-50 border-orange-200 text-orange-700" },
];

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
type Severity = typeof SEVERITY_OPTIONS[number];

const SESSION_ID = nanoid();

export default function ConstructionTools() {
  const { t } = useLang();
  const [activeType, setActiveType] = useState<LogType>("check-in");
  const [form, setForm] = useState({ jobSite: "", crewMember: "", content: "", phase: "", severity: "medium" as Severity });
  const [reply, setReply] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ logType: string; content: string; reply: string; time: string }[]>([]);
  const [isPending, setIsPending] = useState(false);

  const checkIn = trpc.construction.checkIn.useMutation({
    onSuccess: (data) => {
      setReply(data.reply);
      addLog(data.reply);
    },
  });

  const progressUpdate = trpc.construction.progressUpdate.useMutation({
    onSuccess: (data) => {
      setReply(data.reply);
      addLog(data.reply);
    },
  });

  const safetyAlert = trpc.construction.safetyAlert.useMutation({
    onSuccess: () => {
      setReply("Safety alert logged and Murphy notified via Telegram + SMS.");
      addLog("Safety alert logged and Murphy notified via Telegram + SMS.");
    },
  });

  const addLog = (r: string) => {
    setLogs(prev => [{
      logType: activeType,
      content: form.content,
      reply: r,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...prev.slice(0, 9)]);
    setForm(f => ({ ...f, content: "" }));
    setIsPending(false);
  };

  const handleSubmit = () => {
    if (!form.content.trim()) return;
    setIsPending(true);
    setReply(null);

    if (activeType === "check-in") {
      checkIn.mutate({
        workerName: form.crewMember || "Field Worker",
        location: form.content,
        jobSite: form.jobSite || "Job Site",
        notes: form.content,
        sessionId: SESSION_ID,
      });
    } else if (activeType === "safety") {
      safetyAlert.mutate({
        alertType: "Safety Incident",
        location: form.jobSite || "Job Site",
        description: form.content,
        severity: form.severity,
        sessionId: SESSION_ID,
      });
    } else {
      // progress and material-request both use progressUpdate
      progressUpdate.mutate({
        jobSite: form.jobSite || "Job Site",
        update: form.content,
        phase: form.phase || undefined,
        sessionId: SESSION_ID,
        language: "en",
      });
    }
  };

  const activeTypeInfo = LOG_TYPES.find(l => l.key === activeType)!;
  const Icon = activeTypeInfo.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Construction Tools</h2>
        <p className="text-sm text-gray-500 mt-0.5">Field check-in, sub coordination, safety alerts, and progress logs — powered by Riley Ops Manager</p>
      </div>

      {/* Log type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LOG_TYPES.map(lt => {
          const LtIcon = lt.icon;
          return (
            <button
              key={lt.key}
              onClick={() => { setActiveType(lt.key); setReply(null); }}
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
            placeholder={activeType === "check-in" ? "Worker Name" : "Phase / Section"}
            value={activeType === "check-in" ? form.crewMember : form.phase}
            onChange={e => setForm(f => activeType === "check-in" ? { ...f, crewMember: e.target.value } : { ...f, phase: e.target.value })}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {activeType === "safety" && (
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, severity: s }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  form.severity === s
                    ? s === "critical" ? "bg-red-600 text-white border-red-600"
                    : s === "high" ? "bg-red-100 text-red-700 border-red-300"
                    : s === "medium" ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={3}
          placeholder={t.construction?.jargonHint ?? "Describe the update (rough-in, punch list, change order, material request...)"}
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!form.content.trim() || isPending}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
        >
          {isPending ? "Riley is processing..." : `Submit ${activeTypeInfo.label}`}
        </button>
      </div>

      {/* Riley reply */}
      {reply && (
        <div className={`rounded-2xl p-5 border ${activeType === "safety" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={15} className={activeType === "safety" ? "text-red-500" : "text-blue-500"} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Riley's Response</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{reply}</p>
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
                  <p className="text-sm text-gray-700 truncate mt-0.5">{log.reply}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
