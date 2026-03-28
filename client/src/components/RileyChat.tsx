import { useState, useRef, useEffect } from "react";
import { useLang, LANGUAGES } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Send, User, RefreshCw } from "lucide-react";
import { nanoid } from "nanoid";
import { CDN } from "../../../shared/assets";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "receptionist" | "ops_manager";

export default function RileyChat({ mode: initialMode }: { mode: Mode }) {
  const { lang, setLang } = useLang();
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
    <div className="flex flex-col h-full max-w-3xl mx-auto bg-white">
      {/* Mode + Lang bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 border border-gray-200">
          <button
            onClick={() => setMode("receptionist")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === "receptionist" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            Receptionist
          </button>
          <button
            onClick={() => setMode("ops_manager")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === "ops_manager" ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
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
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${lang === l.code ? "bg-blue-50 border border-blue-200 text-blue-700" : "text-gray-400 hover:text-gray-700"}`}
            >
              {l.flag}
            </button>
          ))}
        </div>

        {/* Clear */}
        <button
          onClick={() => setMessages([])}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          title="Clear conversation"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            {msg.role === "assistant" ? (
              <img
                src={CDN.logoSymbol}
                alt="Riley"
                className="w-8 h-8 rounded-full flex-shrink-0 object-contain bg-white border border-gray-200 p-0.5 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-600">
                <User size={14} />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {chat.isPending && (
          <div className="flex gap-3">
            <img
              src={CDN.logoSymbol}
              alt="Riley"
              className="w-8 h-8 rounded-full flex-shrink-0 object-contain bg-white border border-gray-200 p-0.5 shadow-sm animate-pulse"
            />
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={lang === "es" ? "Escribe un mensaje..." : lang === "zh" ? "输入消息..." : "Type a message..."}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none transition-all"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chat.isPending}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shadow-md shadow-blue-200 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          {mode === "ops_manager" ? "SR Ops Manager Mode — proactive coordination & bilingual summaries" : "Receptionist Mode — calls, leads, bookings"}
        </p>
      </div>
    </div>
  );
}
