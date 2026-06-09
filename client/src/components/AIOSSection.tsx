import { HardDrive, Sparkles, Lock, Phone, Calendar, Mail, Globe } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const PILLARS = [
  {
    title: "Local hardware",
    icon: HardDrive,
    color: "from-blue-600 to-blue-400",
    body: "SoloCommand runs on a small box that sits in your office. Not a cloud. Not a SaaS portal you log into. Your AI lives where you do.",
  },
  {
    title: "Anthropic inside",
    icon: Sparkles,
    color: "from-violet-600 to-purple-500",
    body: "Built on Anthropic's Claude and the MCP toolbox. The model that explains your work without making it up.",
  },
  {
    title: "Your data, your accounts",
    icon: Lock,
    color: "from-emerald-600 to-emerald-500",
    body: "We write to YOUR Google Sheet, YOUR calendar, YOUR Gmail. Nothing custodied by SoloEdge. You walk away with everything if you ever leave.",
  },
];

const AGENTS = [
  {
    name: "SoloHub",
    role: "Answers the phone.",
    icon: Phone,
    color: "from-blue-600 to-blue-400",
  },
  {
    name: "SoloBooking",
    role: "Owns your calendar.",
    icon: Calendar,
    color: "from-cyan-600 to-cyan-400",
  },
  {
    name: "EdgeMail",
    role: "Triages your inbox.",
    icon: Mail,
    color: "from-purple-600 to-purple-400",
  },
  {
    name: "LiveDesk",
    role: "Live translator in the room.",
    icon: Globe,
    color: "from-orange-600 to-orange-400",
  },
];

export default function AIOSSection() {
  return (
    <section id="aios" className="section-pad bg-gray-50 relative overflow-hidden">
      <SectionBackground overlayClass="bg-gray-50/85" offset={4} />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            SoloEdgeStack
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            SoloEdgeStack.<br className="hidden md:block" /> Your operation, your hardware, your data.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            SoloCommand is the product I build for small businesses that don't have time to learn another app. It runs on a small box in your shop. Your AI lives there.
          </p>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="glass shadow-md border border-gray-100/60 hover:shadow-xl hover:border-gray-200/80 rounded-2xl p-7 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-md bg-gradient-to-br ${pillar.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{pillar.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{pillar.body}</p>
              </div>
            );
          })}
        </div>

        {/* Four-agent strip */}
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-gray-700 mb-6 tracking-wide uppercase">
            Inside SoloCommand
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.name}
                  className="glass shadow-sm border border-gray-100/60 hover:shadow-md hover:border-gray-200/80 rounded-2xl p-5 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md bg-gradient-to-br ${agent.color}`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base mb-1">{agent.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{agent.role}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <a
            href="#audit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            Start with a SoloAudit →
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Or call Murphy directly. (512) 399-1605
          </p>
        </div>
      </div>
    </section>
  );
}
