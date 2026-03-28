import { useState, useRef } from "react";
import { useLang, LANGUAGES, Language } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Mic, MicOff, ArrowLeftRight, Radio, Users, Volume2 } from "lucide-react";

type SessionMode = "one-on-one" | "broadcast";

export default function InterpreterDesk() {
  const { t } = useLang();
  const [langA, setLangA] = useState<Language>("en");
  const [langB, setLangB] = useState<Language>("es");
  const [sessionMode, setSessionMode] = useState<SessionMode>("one-on-one");
  const [inputText, setInputText] = useState("");
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [translations, setTranslations] = useState<{ from: string; to: string; fromLang: Language; toLang: Language; time: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const translate = trpc.interpreter.translate.useMutation({
    onSuccess: (data) => {
      const entry = {
        from: inputText,
        to: typeof data.translation === 'string' ? data.translation : String(data.translation),
        fromLang: data.fromLang as Language,
        toLang: data.toLang as Language,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setTranslations(prev => [...prev, entry]);
      setInputText("");
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 100);
    },
  });

  const handleTranslate = () => {
    if (!inputText.trim() || translate.isPending) return;
    const from = activeSide === "A" ? langA : langB;
    const to = activeSide === "A" ? langB : langA;
    translate.mutate({ text: inputText, fromLang: from, toLang: to });
  };

  const swapLanguages = () => {
    setLangA(langB);
    setLangB(langA);
  };

  const langLabel = (code: Language) => LANGUAGES.find(l => l.code === code)?.native ?? code;
  const langFlag = (code: Language) => LANGUAGES.find(l => l.code === code)?.flag ?? "";

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">{t.interpreter.title}</h2>
            <p className="text-sm text-white/45 mt-0.5">{t.interpreter.subtitle}</p>
          </div>
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setSessionMode("one-on-one")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${sessionMode === "one-on-one" ? "bg-cyan-600 text-white" : "text-white/50 hover:text-white"}`}
            >
              <Users size={12} /> {t.interpreter.oneOnOne}
            </button>
            <button
              onClick={() => setSessionMode("broadcast")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${sessionMode === "broadcast" ? "bg-orange-600 text-white" : "text-white/50 hover:text-white"}`}
            >
              <Radio size={12} /> {t.interpreter.broadcast}
            </button>
          </div>
        </div>

        {/* Language selector row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1">{t.interpreter.langA}</label>
            <select
              value={langA}
              onChange={e => setLangA(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/40 appearance-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[oklch(0.13_0.015_240)]">
                  {l.flag} {l.native}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            className="mt-5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <ArrowLeftRight size={16} />
          </button>

          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1">{t.interpreter.langB}</label>
            <select
              value={langB}
              onChange={e => setLangB(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/40 appearance-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[oklch(0.13_0.015_240)]">
                  {l.flag} {l.native}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translation log */}
      <div
        ref={logRef}
        className="glass rounded-2xl p-4 h-64 overflow-y-auto space-y-3"
      >
        {translations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center mb-3">
              <Volume2 size={20} className="text-cyan-400" />
            </div>
            <p className="text-sm text-white/35">Type or speak to start translating</p>
            <p className="text-xs text-white/20 mt-1">Supports noisy environments — type clearly for best results</p>
          </div>
        ) : (
          translations.map((entry, idx) => (
            <div key={idx} className="space-y-1.5">
              {/* Original */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-white/40 mt-0.5 flex-shrink-0 w-6">{langFlag(entry.fromLang)}</span>
                <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-sm text-white/80">{entry.from}</p>
                </div>
                <span className="text-xs text-white/25 mt-1.5 flex-shrink-0">{entry.time}</span>
              </div>
              {/* Translation */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-cyan-400/70 mt-0.5 flex-shrink-0 w-6">{langFlag(entry.toLang)}</span>
                <div className="flex-1 px-3 py-2 rounded-xl bg-cyan-600/10 border border-cyan-500/20">
                  <p className="text-sm text-cyan-100">{entry.to}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {translate.isPending && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-xs text-white/35">{t.interpreter.translating}</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="glass rounded-2xl p-4 space-y-3">
        {/* Side selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Speaking as:</span>
          <button
            onClick={() => setActiveSide("A")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeSide === "A" ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            {langFlag(langA)} {langLabel(langA)}
          </button>
          <button
            onClick={() => setActiveSide("B")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeSide === "B" ? "bg-cyan-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
          >
            {langFlag(langB)} {langLabel(langB)}
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            rows={2}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTranslate(); } }}
            placeholder={`Type in ${langLabel(activeSide === "A" ? langA : langB)}...`}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-cyan-500/40 resize-none transition-all"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || translate.isPending}
              className="flex-1 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-900/30"
            >
              Translate
            </button>
            <button
              onClick={() => setIsListening(!isListening)}
              className={`flex-1 px-3 rounded-xl border text-xs font-semibold transition-all ${isListening ? "bg-red-600/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
            >
              {isListening ? <MicOff size={14} className="mx-auto" /> : <Mic size={14} className="mx-auto" />}
            </button>
          </div>
        </div>

        {sessionMode === "broadcast" && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20">
            <Radio size={14} className="text-orange-400 flex-shrink-0" />
            <p className="text-xs text-orange-300/80">Broadcast mode: translation will be sent to all connected devices on this session</p>
          </div>
        )}
      </div>
    </div>
  );
}
