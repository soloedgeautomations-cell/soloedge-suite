import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot, Calendar, Mail, Globe, Activity, Zap, CheckCircle,
  Clock, AlertCircle, TrendingUp, Phone, MessageSquare
} from "lucide-react";

interface AgentCard {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status: "active" | "standby" | "offline";
  todayCount: number;
  lastAction: string;
  plan: "starter" | "pro" | "team";
}

const AGENTS: AgentCard[] = [
  {
    id: "solohub",
    name: "SoloHub",
    tagline: "AI Receptionist — answers every call",
    icon: Bot,
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-200",
    status: "active",
    todayCount: 0,
    lastAction: "Waiting for calls",
    plan: "starter",
  },
  {
    id: "solobooking",
    name: "SoloBooking",
    tagline: "Scheduling Agent — books appointments",
    icon: Calendar,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    status: "standby",
    todayCount: 0,
    lastAction: "Ready to book",
    plan: "pro",
  },
  {
    id: "edgemail",
    name: "EdgeMail",
    tagline: "Email Agent — triages and drafts replies",
    icon: Mail,
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
    status: "standby",
    todayCount: 0,
    lastAction: "Monitoring inbox",
    plan: "pro",
  },
  {
    id: "livedesk",
    name: "LiveDesk",
    tagline: "Translation Agent — EN ↔ ES ↔ ZH",
    icon: Globe,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    status: "standby",
    todayCount: 0,
    lastAction: "Ready to translate",
    plan: "starter",
  },
];

function StatusBadge({ status }: { status: AgentCard["status"] }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Active
      </Badge>
    );
  }
  if (status === "standby") {
    return (
      <Badge variant="outline" className="text-slate-500 gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
        Standby
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-red-500 gap-1">
      <AlertCircle className="w-3 h-3" />
      Offline
    </Badge>
  );
}

export default function AgentCommandCenter() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: activity } = trpc.dashboard.recentActivity.useQuery();

  // Enrich SoloHub with real call data
  const enrichedAgents = AGENTS.map(agent => {
    if (agent.id === "solohub" && stats) {
      const callCount = stats.conversationsTotal ?? 0;
      return {
        ...agent,
        todayCount: callCount,
        lastAction: callCount > 0
          ? `Handled ${callCount} conversation${callCount !== 1 ? "s" : ""} total`
          : "Waiting for first call",
        status: "active" as const,
      };
    }
    if (agent.id === "solobooking" && stats) {
      const bookCount = stats.bookingsToday ?? 0;
      return {
        ...agent,
        todayCount: bookCount,
        lastAction: bookCount > 0
          ? `${bookCount} booking${bookCount !== 1 ? "s" : ""} today`
          : "No bookings today yet",
      };
    }
    return agent;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-sky-500" />
            Agent Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Your SoloStack agents — working 24/7 so you don't have to
          </p>
        </div>
        <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-xs px-3 py-1">
          SoloEdge AI
        </Badge>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Calls Handled", value: stats?.conversationsTotal ?? 0, icon: Phone, color: "text-sky-600" },
          { label: "Bookings Today", value: stats?.bookingsToday ?? 0, icon: Calendar, color: "text-emerald-600" },
          { label: "Active Agents", value: enrichedAgents.filter(a => a.status === "active").length, icon: Bot, color: "text-violet-600" },
          { label: "Leads Captured", value: stats?.leadsTotal ?? 0, icon: TrendingUp, color: "text-amber-600" },
        ].map(stat => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color} shrink-0`} />
              <div>
                <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrichedAgents.map(agent => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className={`border-2 ${agent.bgColor} shadow-sm`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                      <Icon className={`w-5 h-5 ${agent.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {agent.name}
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">{agent.tagline}</p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {agent.lastAction}
                  </span>
                  {agent.todayCount > 0 && (
                    <span className={`font-semibold ${agent.color}`}>
                      {agent.todayCount} today
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {agent.id === "solohub" && (
                    <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-7 px-3">
                      <Phone className="w-3 h-3 mr-1" />
                      Call Riley
                    </Button>
                  )}
                  {agent.id === "solobooking" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => window.location.href = "/app/bookings"}>
                      <Calendar className="w-3 h-3 mr-1" />
                      View Bookings
                    </Button>
                  )}
                  {agent.id === "edgemail" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3 border-violet-300 text-violet-700 hover:bg-violet-50">
                      <Mail className="w-3 h-3 mr-1" />
                      Open EdgeMail
                    </Button>
                  )}
                  {agent.id === "livedesk" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3 border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Globe className="w-3 h-3 mr-1" />
                      Start LiveDesk
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Agent Activity Feed */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Agent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!activity || activity.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No agent activity yet.</p>
              <p className="text-xs mt-1">Call (512) 399-1605 to see Riley in action.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map(item => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                    {item.badge === "Riley" || item.badge === "Ops" ? (
                      <Bot className="w-3.5 h-3.5 text-sky-600" />
                    ) : item.badge === "Safety" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {item.subtitle && <span className="mr-2">{item.subtitle}</span>}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{item.badge}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telegram Quick Control */}
      <Card className="border border-sky-200 bg-sky-50 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <MessageSquare className="w-8 h-8 text-sky-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Control Riley from Telegram</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Send <code className="bg-white px-1 rounded text-sky-700">/status</code>{" "}
              <code className="bg-white px-1 rounded text-sky-700">/pause</code>{" "}
              <code className="bg-white px-1 rounded text-sky-700">/resume</code>{" "}
              to your Riley bot anytime
            </p>
          </div>
          <Badge className="bg-sky-600 text-white text-xs">Live</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
