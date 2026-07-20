import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "es" | "zh";

export const LANGUAGES: { code: Language; label: string; flag: string; native: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "es", label: "Spanish", flag: "🇲🇽", native: "Español" },
  { code: "zh", label: "Chinese", flag: "🇨🇳", native: "中文" },
];

type Translations = {
  nav: {
    services: string; pricing: string; industries: string; contact: string; dashboard: string; bookSession: string;
  };
  hero: {
    badge: string; headline1: string; headline2: string; subtext: string; cta: string; ctaSecondary: string;
    greeting: string; chips: { label: string; key: string }[];
    responses: Record<string, string>;
  };
  services: {
    title: string; subtitle: string;
    items: { title: string; desc: string }[];
  };
  pricing: {
    title: string; subtitle: string; setupFee: string; perMonth: string; perLine: string;
    commSuite: string; schedSuite: string; getStarted: string; mostPopular: string;
  };
  contact: {
    title: string; subtitle: string; name: string; phone: string; email: string;
    businessType: string; message: string; submit: string; success: string;
    demoLabel: string; demoNumber: string;
  };
  footer: {
    tagline: string; rights: string;
  };
  dashboard: {
    welcome: string; launchReceptionist: string; launchOpsManager: string;
    startInterpreter: string; viewCalendar: string; recentActivity: string;
    callsHandled: string; bookingsToday: string; activeLang: string; planTier: string;
  };
  interpreter: {
    title: string; subtitle: string; start: string; stop: string; langA: string; langB: string;
    speaking: string; translating: string; broadcast: string; oneOnOne: string;
  };
  construction: {
    checkIn: string; subCoord: string; safetyAlert: string; progressLog: string;
    jargonHint: string;
  };
};

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      services: "Services", pricing: "Pricing", industries: "Industries",
      contact: "Contact", dashboard: "Dashboard", bookSession: "Get Started",
    },
    hero: {
      badge: "SoloEdge · Online Now",
      headline1: "Your AI runs your front office.",
      headline2: "On your hardware. With your accounts. Anthropic inside.",
      subtext: "Before I install anything, I walk your business through what AI already touches, what's exposed, and what needs a guardrail. Most owners have more risk than they realize. From there, it's your call: a full AI Safety Check with a real written plan, or a tool running today, like phone answering, scheduling, email, or follow-up. Your tools. Your accounts. Your hardware. Nothing added without you.",
      cta: "Book a Free AI Check →",
      ctaSecondary: "Get Started",
      greeting: "What's taking up too much of your time?",
      chips: [
        { label: "Missed calls while on the job", key: "calls" },
        { label: "Language barriers with crews", key: "language" },
        { label: "Appointment booking and follow-up", key: "appointments" },
        { label: "Email and inbox overload", key: "email" },
        { label: "Crew coordination and updates", key: "crew" },
      ],
      responses: {
        calls: "Riley picks up when you can't. She qualifies the caller, captures the lead, sends you a text. You stay on the job.",
        language: "English, Spanish, and Chinese across calls, texts, field notes, and client updates. Your crew and your clients stay on the same page.",
        appointments: "Riley handles the back-and-forth, confirms the time, sends reminders. Your calendar fills without you managing it.",
        email: "Priority messages surface. Routine replies get drafted. The clutter clears. You check in when it makes sense.",
        crew: "Field notes go in rough, come out clean. Your office and job site stay connected without the constant check-ins.",
      },
    },
    services: {
      title: "Four agents. One AI crew.",
      subtitle: "Each agent owns one job. They work together, they hand off cleanly, and the whole crew runs on a small box that sits in your shop.",
      items: [
        { title: "SoloHub", desc: "Answers your phone in English or Spanish, qualifies the caller, captures the lead, sends you a text summary. You stay on the job." },
        { title: "SoloBooking", desc: "Confirms times, sends reminders, handles reschedules. Your calendar fills without you managing it." },
        { title: "EdgeMail", desc: "Priority messages surface. Routine replies get drafted. You read what matters, skip what doesn't." },
        { title: "LiveDesk", desc: "Real-time English, Spanish, and Chinese for job sites, front desks, client calls. No app to download, no headset to buy." },
      ],
    },
    pricing: {
      title: "Straightforward Pricing",
      subtitle: "One setup. One monthly cost. No surprises.",
      setupFee: "Setup Fee",
      perMonth: "/mo",
      perLine: "/line",
      commSuite: "Communication Suite",
      schedSuite: "Scheduling Suite",
      getStarted: "Get Started",
      mostPopular: "Most Popular",
    },
    contact: {
      title: "Have Questions?",
      subtitle: "We can walk you through what fits your business. No pressure. Just a straightforward conversation.",
      name: "Your Name", phone: "Phone Number", email: "Email Address",
      businessType: "Business Type", message: "Tell us a bit about your business",
      submit: "Send Message", success: "Got it. We'll follow up within 24 hours.",
      demoLabel: "Or call our team directly",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "Your AI business builders.",
      rights: "All rights reserved.",
    },
    dashboard: {
      welcome: "Welcome back",
      launchReceptionist: "Launch SoloHub",
      launchOpsManager: "Launch SoloHub Ops",
      startInterpreter: "Start LiveDesk",
      viewCalendar: "SoloBooking Calendar",
      recentActivity: "Recent Activity",
      callsHandled: "Calls Handled",
      bookingsToday: "Bookings Today",
      activeLang: "Active Language",
      planTier: "Plan Tier",
    },
    interpreter: {
      title: "LiveDesk",
      subtitle: "Real-time live meeting translator for job sites and front desks",
      start: "Start Session", stop: "End Session",
      langA: "Language A", langB: "Language B",
      speaking: "Speaking...", translating: "Translating...",
      broadcast: "Broadcast Mode", oneOnOne: "1-on-1 Mode",
    },
    construction: {
      checkIn: "Field Check-In", subCoord: "Sub Coordinator",
      safetyAlert: "Safety Alert", progressLog: "Progress Log",
      jargonHint: "Try: rough-in, punch list, change order, material request...",
    },
  },

  es: {
    nav: {
      services: "Servicios", pricing: "Precios", industries: "Industrias",
      contact: "Contacto", dashboard: "Panel", bookSession: "Hablar con Nosotros",
    },
    hero: {
      badge: "SoloEdge · En Línea",
      headline1: "Tu IA maneja tu oficina.",
      headline2: "En tu hardware. Con tus cuentas. Anthropic adentro.",
      subtext: "Antes de instalar nada, reviso tu negocio contigo: qué IA ya toca tus cuentas, qué está expuesto y qué necesita protección. La mayoría de los negocios tienen más riesgo del que creen. De ahí, tú decides: una Revisión de Seguridad de IA completa con un plan por escrito, o una herramienta funcionando hoy mismo, como contestar llamadas, agendar citas, correo o seguimiento. Tus herramientas. Tus cuentas. Tu hardware. Nada se agrega sin tu aprobación.",
      cta: "Agenda una Revisión Gratis →",
      ctaSecondary: "Comenzar",
      greeting: "¿Qué te está quitando demasiado tiempo?",
      chips: [
        { label: "Llamadas perdidas en el trabajo", key: "calls" },
        { label: "Barreras de idioma con la cuadrilla", key: "language" },
        { label: "Citas y seguimiento", key: "appointments" },
        { label: "Correos y bandeja de entrada", key: "email" },
        { label: "Coordinación de cuadrilla", key: "crew" },
      ],
      responses: {
        calls: "Riley contesta cuando no puedes. Califica al cliente, captura el prospecto, te manda un mensaje. Tú te quedas enfocado en el trabajo.",
        language: "Inglés, español y chino en llamadas, mensajes, notas de campo y actualizaciones. Tu cuadrilla y tus clientes siempre en la misma página.",
        appointments: "Riley maneja la conversación, confirma el horario, manda recordatorios. Tu agenda se llena sin que tengas que administrarla.",
        email: "Los mensajes importantes aparecen primero. Las respuestas rutinarias se redactan solas. El desorden desaparece.",
        crew: "Las notas de campo entran en bruto y salen limpias. Tu oficina y tu obra se mantienen conectadas sin los check-ins constantes.",
      },
    },
    services: {
      title: "Cuatro agentes. Una cuadrilla de IA.",
      subtitle: "Cada agente tiene un trabajo. Trabajan juntos, se pasan el balón limpiamente, y toda la cuadrilla corre en una caja pequeña que vive en tu taller.",
      items: [
        { title: "SoloHub", desc: "Contesta tu teléfono en inglés o español, califica al cliente, captura el prospecto, te manda un mensaje. Tú te quedas en el trabajo." },
        { title: "SoloBooking", desc: "Confirma horarios, manda recordatorios, maneja recambios. Tu calendario se llena sin que tengas que administrarlo." },
        { title: "EdgeMail", desc: "Los mensajes importantes aparecen primero. Las respuestas rutinarias se redactan solas. Lees lo que importa, saltas lo que no." },
        { title: "LiveDesk", desc: "Inglés, español y chino en tiempo real para obras, recepciones, llamadas con clientes. Sin app que descargar, sin auriculares que comprar." },
      ],
    },
    pricing: {
      title: "Precios Claros",
      subtitle: "Una instalación. Un costo mensual. Sin sorpresas.",
      setupFee: "Costo de Instalación",
      perMonth: "/mes",
      perLine: "/línea",
      commSuite: "Suite de Comunicación",
      schedSuite: "Suite de Programación",
      getStarted: "Comenzar",
      mostPopular: "Más Popular",
    },
    contact: {
      title: "¿Tienes Preguntas?",
      subtitle: "Podemos explicarte qué encaja mejor con tu negocio. Sin presión. Solo una conversación directa.",
      name: "Tu Nombre", phone: "Número de Teléfono", email: "Correo Electrónico",
      businessType: "Tipo de Negocio", message: "Cuéntanos un poco sobre tu negocio",
      submit: "Enviar Mensaje", success: "Recibido. Te contactamos en 24 horas.",
      demoLabel: "O llama a nuestro equipo",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "Tus constructores de negocios con IA.",
      rights: "Todos los derechos reservados.",
    },
    dashboard: {
      welcome: "Bienvenido de nuevo",
      launchReceptionist: "Iniciar SoloHub",
      launchOpsManager: "Iniciar SoloHub Ops",
      startInterpreter: "Iniciar LiveDesk",
      viewCalendar: "Calendario SoloBooking",
      recentActivity: "Actividad Reciente",
      callsHandled: "Llamadas Atendidas",
      bookingsToday: "Reservas Hoy",
      activeLang: "Idioma Activo",
      planTier: "Plan Activo",
    },
    interpreter: {
      title: "LiveDesk",
      subtitle: "Traductor en vivo para reuniones, obras y recepciones",
      start: "Iniciar Sesión", stop: "Terminar Sesión",
      langA: "Idioma A", langB: "Idioma B",
      speaking: "Hablando...", translating: "Traduciendo...",
      broadcast: "Modo Difusión", oneOnOne: "Modo 1 a 1",
    },
    construction: {
      checkIn: "Check-In de Campo", subCoord: "Coordinador de Subs",
      safetyAlert: "Alerta de Seguridad", progressLog: "Registro de Avance",
      jargonHint: "Prueba: rough-in, punch list, orden de cambio, solicitud de material...",
    },
  },

  zh: {
    nav: {
      services: "服务", pricing: "价格", industries: "行业",
      contact: "联系", dashboard: "控制台", bookSession: "联系我们",
    },
    hero: {
      badge: "SoloEdge · 在线",
      headline1: "您的 AI 运行您的前台。",
      headline2: "在您的硬件上。用您的账户。内置 Anthropic。",
      subtext: "在安装任何东西之前，我会和您一起梳理业务：哪些 AI 已经在接触您的账户，存在哪些风险，需要哪些防护。大多数企业主的风险比想象中更多。接下来由您决定：做一次完整的 AI 安全检查并拿到书面方案，或者直接用上现成的工具，比如电话接听、预约管理、邮件处理或跟进回访。您的工具。您的账户。您的硬件。未经您同意，不会添加任何东西。",
      cta: "预约免费 AI 检查 →",
      ctaSecondary: "开始使用",
      greeting: "什么事情占用了您太多时间？",
      chips: [
        { label: "工作时错过电话", key: "calls" },
        { label: "与团队的语言障碍", key: "language" },
        { label: "预约和跟进", key: "appointments" },
        { label: "邮件和收件箱管理", key: "email" },
        { label: "团队协调和更新", key: "crew" },
      ],
      responses: {
        calls: "您无法接听时 Riley 会代为接听。她筛选来电、记录客户信息、给您发短信。您专注于工作本身。",
        language: "英语、西班牙语和中文覆盖电话、短信、现场记录和客户更新。您的团队和客户始终保持同步。",
        appointments: "Riley 处理预约沟通、确认时间、发送提醒。日历自动填满，无需您手动管理。",
        email: "重要邮件优先显示，常规回复自动起草，杂乱信息自动清理。",
        crew: "现场粗略记录自动整理为清晰更新。办公室与工地保持连接，无需频繁确认。",
      },
    },
    services: {
      title: "四个智能体。一个 AI 团队。",
      subtitle: "每个智能体只负责一件事。它们协同工作，干净地交接，整个团队运行在您店里的一个小盒子上。",
      items: [
        { title: "SoloHub", desc: "用英语或西班牙语接听您的电话，筛选来电，记录客户信息，给您发短信。您专注于工作。" },
        { title: "SoloBooking", desc: "确认时间，发送提醒，处理改期。您的日历自动填满，无需管理。" },
        { title: "EdgeMail", desc: "重要邮件优先显示。常规回复自动起草。您读重要的，跳过不重要的。" },
        { title: "LiveDesk", desc: "为工地、前台、客户通话提供英语、西班牙语和中文实时翻译。无需下载应用，无需购买耳机。" },
      ],
    },
    pricing: {
      title: "清晰透明的价格",
      subtitle: "一次设置。固定月费。没有隐藏费用。",
      setupFee: "安装费",
      perMonth: "/月",
      perLine: "/线路",
      commSuite: "通信套件",
      schedSuite: "调度套件",
      getStarted: "开始使用",
      mostPopular: "最受欢迎",
    },
    contact: {
      title: "有问题？",
      subtitle: "我们可以为您介绍适合您业务的方案。没有压力。只是一次直接的对话。",
      name: "您的姓名", phone: "电话号码", email: "电子邮件",
      businessType: "业务类型", message: "简单介绍一下您的业务",
      submit: "发送消息", success: "已收到。我们将在 24 小时内联系您。",
      demoLabel: "或直接联系我们团队",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "您的AI业务缔造者。",
      rights: "版权所有。",
    },
    dashboard: {
      welcome: "欢迎回来",
      launchReceptionist: "启动 SoloHub",
      launchOpsManager: "启动 SoloHub 运营",
      startInterpreter: "开始 LiveDesk",
      viewCalendar: "SoloBooking 日历",
      recentActivity: "最近活动",
      callsHandled: "已处理电话",
      bookingsToday: "今日预约",
      activeLang: "当前语言",
      planTier: "套餐级别",
    },
    interpreter: {
      title: "LiveDesk",
      subtitle: "实时会议翻译，适用于工地和前台",
      start: "开始会话", stop: "结束会话",
      langA: "语言 A", langB: "语言 B",
      speaking: "正在说话...", translating: "正在翻译...",
      broadcast: "广播模式", oneOnOne: "一对一模式",
    },
    construction: {
      checkIn: "现场签到", subCoord: "分包协调",
      safetyAlert: "安全警报", progressLog: "进度记录",
      jargonHint: "试试：粗装、竣工清单、变更单、材料申请...",
    },
  },
};

type LanguageContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
