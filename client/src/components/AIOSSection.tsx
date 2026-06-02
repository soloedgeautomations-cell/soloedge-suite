import { HardDrive, Sparkles, Lock, Bot, Calendar, Mail, Globe } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const FEATURES = [
  {
    title: "Local hardware",
    icon: HardDrive,
    body: "SoloCommand runs on a small box that sits in your office. Not a cloud. Not a SaaS portal you log into. Your AI lives where you do.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Anthropic inside",
    icon: Sparkles,
    body: "Built on Anthropic's Claude and the MCP toolbox. The model that explains your work without making it up.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Your data, your accounts",
    icon: Lock,
    body: "We write to YOUR Google Sheet, YOUR calendar, YOUR Gmail. Nothing custodied by SoloEdge. You walk away with everything if you ever leave.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

const AGENTS = [
  {
    name: "SoloHub",
    tagline: "AI Receptionist (answers your phone, English + Spanish)",
    icon: Bot,
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-200",
  },
  {
    name: "SoloBooking",
    tagline: "Scheduling Agent (books appointments into your calendar)",
    icon: Calendar,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  {
    name: "EdgeMail",
    tagline: "Email Agent (triages and drafts replies)",
    icon: Mail,
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
  },
  {
    name: "LiveDesk",
    tagline: "Translation Agent (live EN ↔ ES ↔ ZH)",
    icon: Globe,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
];

export default function AIOSSection() {
  return (
    <section id="aios" className="section-pad bg-slate-50 relative overflow-hidden">
      <SectionBackground overlayClass="bg-slate-50/80" offset={2} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            What is AIOS?
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            An AI Operating System for your shop,<br className="hidden md:block" /> not a SaaS dashboard.
          </h2>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass p-8 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                  <Icon className={feature.color} size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Agent Strip */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">The SoloCommand Agent Crew</h3>
            <div className="h-px w-20 bg-slate-200 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div key={i} className={`border-2 ${agent.bgColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      <Icon className={`w-5 h-5 ${agent.color}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">{agent.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{agent.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
