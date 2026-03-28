import { useState, useRef, useEffect } from "react";
import { CDN } from "../../../shared/assets";
import { trpc } from "@/lib/trpc";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { nanoid } from "nanoid";
import { useLang } from "@/contexts/LanguageContext";

const SESSION_ID = nanoid();

type Msg = { role: "riley" | "user"; text: string };

const QUICK_PROMPTS = [
  "What problems does SoloEdge solve?",
  "What does it cost?",
  "Does Riley speak Spanish?",
  "How long does setup take?",
];

export default function FloatingRiley() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "riley", text: "Hi, I'm Riley — the AI behind SoloEdge. Happy to answer questions about what we do, how it works, or whether it's a good fit for your business." },
  ]);
  const [input, setInput] = useState("");
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = trpc.riley.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "riley", text: data.reply }]);
    },
  });

  // Stop pulsing after 8s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    chat.mutate({
      message: msg,
      sessionId: SESSION_ID,
      mode: "receptionist",
      language: lang as "en" | "es" | "zh",
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); setPulse(false); }}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          open ? "bg-gray-800 rotate-0" : "bg-gradient-to-br from-blue-600 to-blue-800"
        }`}
        aria-label="Chat with Riley"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <img src={CDN.logoSymbol} alt="Riley" className="w-11 h-11 object-contain" />
        )}
        {/* Pulse ring when closed */}
        {!open && pulse && (
          <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
        )}
        {/* Unread dot */}
        {!open && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white pulse-dot" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[520px] flex flex-col bg-white rounded-2xl shadow-2xl shadow-blue-900/20 border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-600 flex-shrink-0">
            <div className="relative">
              <img src={CDN.logoSymbol} alt="Riley" className="w-11 h-11 rounded-full object-contain bg-white/20 p-1 border border-white/30" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-blue-700 pulse-dot" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Riley · SoloEdge AI</div>
              <div className="text-xs text-blue-200">
                {chat.isPending ? "Typing..." : "Online Now"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {m.role === "riley" && (
                  <img src={CDN.logoSymbol} alt="Riley" className="w-9 h-9 rounded-full object-contain bg-blue-100 border border-blue-200 p-1 flex-shrink-0 mt-0.5" />
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex gap-2">
                <img src={CDN.logoSymbol} alt="Riley" className="w-9 h-9 rounded-full object-contain bg-blue-100 border border-blue-200 p-1 flex-shrink-0 mt-0.5" />
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 bg-gray-50 border-t border-gray-100">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  {q}
                </button>
              ))}
              <a
                href="tel:+17372595692"
                className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
              >
                📞 Call (737) 259-5692
              </a>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask Riley anything..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || chat.isPending}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95"
            >
              {chat.isPending ? <Loader2 size={15} className="text-white animate-spin" /> : <Send size={15} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
