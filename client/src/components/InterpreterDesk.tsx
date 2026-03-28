import { useState, useRef } from "react";
import { useLang, LANGUAGES, Language } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeftRight, Radio, Users, Volume2, Mic, MicOff } from "lucide-react";

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
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">{t.interpreter.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t.interpreter.subtitle}</p>
          </div>
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 border border-gray-200">
            <button
              onClick={() => setSessionMode("one-on-one")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${sessionMode === "one-on-one" ? "bg-cyan-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Users size={12} /> {t.interpreter.oneOnOne}
            </button>
            <button
              onClick={() => setSessionMode("broadcast")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${sessionMode === "broadcast" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Radio size={12} /> {t.interpreter.broadcast}
            </button>
          </div>
        </div>

        {/* Language selector row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">{t.interpreter.langA}</label>
            <select
              value={langA}
              onChange={e => setLangA(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 appearance-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            className="mt-5 p-2.5 rounded-xl bg-gray-100 border border-gray-200 hover:bg-cyan-50 hover:border-cyan-300 text-gray-500 hover:text-cyan-700 transition-all"
          >
            <ArrowLeftRight size={16} />
          </button>

          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">{t.interpreter.langB}</label>
            <select
              value={langB}
              onChange={e => setLangB(e.target.value as Language)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 appearance-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translation log */}
      <div
        ref={logRef}
        className="bg-white rounded-2xl p-4 h-64 overflow-y-auto space-y-3 border border-gray-200 shadow-sm"
      >
        {translations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-3">
              <Volume2 size={20} className="text-cyan-600" />
            </div>
            <p className="text-sm text-gray-400">Type or speak to start translating</p>
            <p className="text-xs text-gray-300 mt-1">Supports noisy environments — type clearly for best results</p>
          </div>
        ) : (
          translations.map((entry, idx) => (
            <div key={idx} className="space-y-1.5">
              {/* Original */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-400 mt-0.5 flex-shrink-0 w-6">{langFlag(entry.fromLang)}</span>
                <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-700">{entry.from}</p>
                </div>
                <span className="text-xs text-gray-300 mt-1.5 flex-shrink-0">{entry.time}</span>
              </div>
              {/* Translation */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-cyan-600 mt-0.5 flex-shrink-0 w-6">{langFlag(entry.toLang)}</span>
                <div className="flex-1 px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200">
                  <p className="text-sm text-cyan-800">{entry.to}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {translate.isPending && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-xs text-gray-400">{t.interpreter.translating}</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
        {/* Side selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speaking as:</span>
          <button
            onClick={() => setActiveSide("A")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeSide === "A" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900"}`}
          >
            {langFlag(langA)} {langLabel(langA)}
          </button>
          <button
            onClick={() => setActiveSide("B")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeSide === "B" ? "bg-cyan-600 text-white shadow-sm" : "bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900"}`}
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
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none transition-all"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || translate.isPending}
              className="flex-1 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-200"
            >
              Translate
            </button>
            <button
              onClick={() => setIsListening(!isListening)}
              className={`flex-1 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${isListening ? "bg-red-50 border-red-300 text-red-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800"}`}
            >
              {isListening ? <MicOff size={12} /> : <Mic size={12} />}
              {isListening ? "Stop" : "Mic"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">
          {sessionMode === "broadcast" ? "Broadcast mode — all participants see translations" : "1-on-1 mode — private session"}
        </p>
      </div>
    </div>
  );
}
