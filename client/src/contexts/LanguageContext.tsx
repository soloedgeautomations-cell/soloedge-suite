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
      headline1: "Built in Austin for Texas businesses.",
      headline2: "Every edge covered.",
      subtext: "Riley gives you the power of a full Front-Office without the overhead!",
      cta: "See Pricing →",
      ctaSecondary: "Get Started Free",
      greeting: "What's taking up too much of your time?",
      chips: [
        { label: "Missed calls while on the job", key: "calls" },
        { label: "Language barriers with crews", key: "language" },
        { label: "Appointment booking & follow-up", key: "appointments" },
        { label: "Email and inbox overload", key: "email" },
        { label: "Crew coordination & updates", key: "crew" },
      ],
      responses: {
        calls: "Riley picks up when you can't — qualifies the caller, captures the lead, and sends you a text. You stay focused on the job.",
        language: "English, Spanish, and Chinese across calls, texts, field notes, and client updates. Your crew and your clients stay on the same page.",
        appointments: "Riley handles the back-and-forth, confirms the time, and sends reminders. Your calendar fills without you managing it.",
        email: "Priority messages surface. Routine replies get drafted. The clutter clears. You check in when it makes sense.",
        crew: "Field notes go in rough, come out clean. Your office and job site stay connected without the constant check-ins.",
      },
    },
    services: {
      title: "Built for the Person Running the Show",
      subtitle: "Two focused suites. One system that works while you work.",
      items: [
        { title: "AI Receptionist", desc: "Every call answered, every lead captured — around the clock, without you picking up." },
        { title: "Appointment Setting", desc: "Bookings land in your calendar. Riley handles the conversation." },
        { title: "Lead Follow-Up", desc: "Instant responses and timely follow-ups. Nothing falls through the cracks." },
        { title: "Email & Admin", desc: "Your inbox stays manageable. Routine tasks run on their own." },
        { title: "Bilingual Communication", desc: "English, Spanish, and Chinese across every channel — automatically." },
        { title: "Live Interpreter Mode", desc: "Real-time translation for job sites, front desks, and client calls." },
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
      subtitle: "The SoloEdge team is happy to walk you through what fits your business. No pressure — just a straightforward conversation.",
      name: "Your Name", phone: "Phone Number", email: "Email Address",
      businessType: "Business Type", message: "Tell us a bit about your business",
      submit: "Send Message", success: "Got it — the SoloEdge team will follow up within 24 hours.",
      demoLabel: "Or call our team directly",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "One person. Every edge covered.",
      rights: "All rights reserved.",
    },
    dashboard: {
      welcome: "Welcome back",
      launchReceptionist: "Launch Riley Receptionist",
      launchOpsManager: "Launch Riley Ops Manager",
      startInterpreter: "Start Live Interpreter",
      viewCalendar: "View Calendar",
      recentActivity: "Recent Activity",
      callsHandled: "Calls Handled",
      bookingsToday: "Bookings Today",
      activeLang: "Active Language",
      planTier: "Plan Tier",
    },
    interpreter: {
      title: "Live Interpreter Desk",
      subtitle: "Real-time translation for job sites and front desks",
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
      headline1: "Una persona.",
      headline2: "Cada ventaja cubierta.",
      subtext: "SoloEdge le da al operador independiente y a las cuadrillas pequeñas el mismo poder de comunicación que una oficina completa — sin el costo.",
      cta: "Ver Cómo Funciona →",
      ctaSecondary: "Hablar con el Equipo",
      greeting: "¿Qué te está quitando demasiado tiempo?",
      chips: [
        { label: "Llamadas perdidas en el trabajo", key: "calls" },
        { label: "Barreras de idioma con la cuadrilla", key: "language" },
        { label: "Citas y seguimiento", key: "appointments" },
        { label: "Correos y bandeja de entrada", key: "email" },
        { label: "Coordinación de cuadrilla", key: "crew" },
      ],
      responses: {
        calls: "Riley contesta cuando no puedes — califica al cliente, captura el prospecto y te manda un mensaje. Tú te quedas enfocado en el trabajo.",
        language: "Inglés, español y chino en llamadas, mensajes, notas de campo y actualizaciones. Tu cuadrilla y tus clientes siempre en la misma página.",
        appointments: "Riley maneja la conversación, confirma el horario y manda recordatorios. Tu agenda se llena sin que tengas que administrarla.",
        email: "Los mensajes importantes aparecen primero. Las respuestas rutinarias se redactan solas. El desorden desaparece.",
        crew: "Las notas de campo entran en bruto y salen limpias. Tu oficina y tu obra se mantienen conectadas sin los check-ins constantes.",
      },
    },
    services: {
      title: "Hecho para Quien Lleva el Negocio",
      subtitle: "Dos suites enfocadas. Un sistema que trabaja mientras tú trabajas.",
      items: [
        { title: "Recepcionista IA", desc: "Cada llamada contestada, cada prospecto capturado — sin que tengas que contestar." },
        { title: "Programación de Citas", desc: "Las reservas llegan a tu calendario. Riley maneja la conversación." },
        { title: "Seguimiento de Prospectos", desc: "Respuestas rápidas y seguimiento oportuno. Nada se pierde." },
        { title: "Correo y Administración", desc: "Tu bandeja de entrada se mantiene manejable. Las tareas rutinarias se hacen solas." },
        { title: "Comunicación Bilingüe", desc: "Inglés, español y chino en cada canal — automáticamente." },
        { title: "Modo Intérprete en Vivo", desc: "Traducción en tiempo real para obras, recepciones y llamadas con clientes." },
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
      subtitle: "El equipo de SoloEdge puede explicarte qué encaja mejor con tu negocio. Sin presión — solo una conversación directa.",
      name: "Tu Nombre", phone: "Número de Teléfono", email: "Correo Electrónico",
      businessType: "Tipo de Negocio", message: "Cuéntanos un poco sobre tu negocio",
      submit: "Enviar Mensaje", success: "Recibido — el equipo de SoloEdge te contactará en 24 horas.",
      demoLabel: "O llama a nuestro equipo",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "Una persona. Cada ventaja cubierta.",
      rights: "Todos los derechos reservados.",
    },
    dashboard: {
      welcome: "Bienvenido de nuevo",
      launchReceptionist: "Iniciar Riley Recepcionista",
      launchOpsManager: "Iniciar Riley Gerente de Ops",
      startInterpreter: "Iniciar Intérprete en Vivo",
      viewCalendar: "Ver Calendario",
      recentActivity: "Actividad Reciente",
      callsHandled: "Llamadas Atendidas",
      bookingsToday: "Reservas Hoy",
      activeLang: "Idioma Activo",
      planTier: "Plan Activo",
    },
    interpreter: {
      title: "Mesa de Intérprete en Vivo",
      subtitle: "Traducción en tiempo real para obras y recepciones",
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
      headline1: "一个人。",
      headline2: "每一个优势都覆盖到。",
      subtext: "SoloEdge 让独立运营者和小团队拥有完整办公室级别的沟通能力——无需额外开销。",
      cta: "了解工作原理 →",
      ctaSecondary: "联系团队",
      greeting: "什么事情占用了您太多时间？",
      chips: [
        { label: "工作时错过电话", key: "calls" },
        { label: "与团队的语言障碍", key: "language" },
        { label: "预约和跟进", key: "appointments" },
        { label: "邮件和收件箱管理", key: "email" },
        { label: "团队协调和更新", key: "crew" },
      ],
      responses: {
        calls: "Riley 在您无法接听时代为接听——筛选来电、记录客户信息并发短信通知您。您专注于工作本身。",
        language: "英语、西班牙语和中文覆盖电话、短信、现场记录和客户更新。您的团队和客户始终保持同步。",
        appointments: "Riley 处理预约沟通、确认时间并发送提醒。日历自动填满，无需您手动管理。",
        email: "重要邮件优先显示，常规回复自动起草，杂乱信息自动清理。",
        crew: "现场粗略记录自动整理为清晰更新。办公室与工地保持连接，无需频繁确认。",
      },
    },
    services: {
      title: "为独立运营者而建",
      subtitle: "两套专注的系统。一个在您工作时同步运转的平台。",
      items: [
        { title: "AI 接待员", desc: "全天候接听每一个电话，记录每一位潜在客户——无需您亲自接听。" },
        { title: "预约管理", desc: "预约直接进入您的日历，Riley 负责沟通。" },
        { title: "客户跟进", desc: "快速响应和及时跟进，不遗漏任何机会。" },
        { title: "邮件与行政", desc: "收件箱保持整洁，日常任务自动处理。" },
        { title: "多语言沟通", desc: "英语、西班牙语和中文覆盖所有渠道，自动切换。" },
        { title: "实时口译模式", desc: "为工地、前台和客户通话提供实时翻译。" },
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
      subtitle: "SoloEdge 团队很乐意为您介绍适合您业务的方案。没有压力——只是一次直接的对话。",
      name: "您的姓名", phone: "电话号码", email: "电子邮件",
      businessType: "业务类型", message: "简单介绍一下您的业务",
      submit: "发送消息", success: "已收到——SoloEdge 团队将在 24 小时内联系您。",
      demoLabel: "或直接联系我们团队",
      demoNumber: "(512) 702-9685",
    },
    footer: {
      tagline: "一人。每一个优势都覆盖到。",
      rights: "版权所有。",
    },
    dashboard: {
      welcome: "欢迎回来",
      launchReceptionist: "启动 Riley 接待员",
      launchOpsManager: "启动 Riley 运营经理",
      startInterpreter: "开始实时口译",
      viewCalendar: "查看日历",
      recentActivity: "最近活动",
      callsHandled: "已处理电话",
      bookingsToday: "今日预约",
      activeLang: "当前语言",
      planTier: "套餐级别",
    },
    interpreter: {
      title: "实时口译台",
      subtitle: "为工地和前台提供实时双向翻译",
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
