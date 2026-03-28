import { useState, useRef, useEffect } from "react";
import { useLang, LANGUAGES } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Send, Bot, User, RefreshCw } from "lucide-react";
import { nanoid } from "nanoid";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "receptionist" | "ops_manager";

export default function RileyChat({ mode: initialMode }: { mode: Mode }) {
  const { lang, setLang, t } = useLang();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = trpc.riley.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  // Initial greeting
  useEffect(() => {
    const greeting = mode === "receptionist"
      ? lang === "es" ? "¡Hola! Soy Riley, tu recepcionista de SoloEdge. ¿En qué puedo ayudarte hoy?"
        : lang === "zh" ? "你好！我是Riley，您的SoloEdge接待员。今天我能帮您什么？"
        : "Hi! I'm Riley, your SoloEdge AI Receptionist. How can I help you today?"
      : lang === "es" ? "¡Hola! Soy Riley en modo Gerente de Operaciones. Estoy aquí para coordinar tu obra, cuadrilla y tareas. ¿Qué necesitas?"
        : lang === "zh" ? "你好！我是Riley运营经理模式。我在这里协调您的工地、团队和任务。需要什么帮助？"
        : "Hello! I'm Riley in SR Operations Manager mode. I'm here to help coordinate your job site, crew, and tasks. What do you need?";
    setMessages([{ role: "assistant", content: greeting }]);
  }, [mode, lang]);

  const handleSend = () => {
    if (!input.trim() || chat.isPending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    chat.mutate({
      message: userMsg,
      mode,
      language: lang,
      sessionId,
      history: messages.slice(-10),
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Mode + Lang bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[oklch(0.11_0.013_240/0.5)]">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={() => setMode("receptionist")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === "receptionist" ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"}`}
          >
            Receptionist
          </button>
          <button
            onClick={() => setMode("ops_manager")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === "ops_manager" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
          >
            Ops Manager
          </button>
        </div>

        {/* Lang toggle */}
        <div className="flex items-center gap-1 ml-auto">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${lang === l.code ? "bg-white/15 text-white" : "text-white/35 hover:text-white/60"}`}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {/* Clear */}
        <button
          onClick={() => setMessages([])}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          title="Clear conversation"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
              msg.role === "assistant"
                ? mode === "ops_manager" ? "bg-gradient-to-br from-purple-500 to-purple-400" : "bg-gradient-to-br from-blue-500 to-cyan-400"
                : "bg-white/15"
            }`}>
              {msg.role === "assistant" ? "R" : <User size={14} />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600/20 border border-blue-500/20 text-white/90 rounded-tr-sm"
                : "bg-[oklch(0.15_0.015_240)] border border-white/8 text-white/85 rounded-tl-sm"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${mode === "ops_manager" ? "bg-gradient-to-br from-purple-500 to-purple-400" : "bg-gradient-to-br from-blue-500 to-cyan-400"}`}>
              R
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[oklch(0.15_0.015_240)] border border-white/8">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5 bg-[oklch(0.11_0.013_240/0.5)]">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={lang === "es" ? "Escribe un mensaje..." : lang === "zh" ? "输入消息..." : "Type a message..."}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40 resize-none transition-all"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chat.isPending}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shadow-lg shadow-blue-900/30 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-white/25 mt-1.5 text-center">
          {mode === "ops_manager" ? "SR Ops Manager Mode — proactive coordination & bilingual summaries" : "Receptionist Mode — calls, leads, bookings"}
        </p>
      </div>
    </div>
  );
}
