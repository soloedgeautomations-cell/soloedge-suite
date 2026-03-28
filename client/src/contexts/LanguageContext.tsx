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
      contact: "Contact", dashboard: "Dashboard", bookSession: "Book a Session",
    },
    hero: {
      badge: "SoloEdge · Online Now",
      headline1: "You do the work.",
      headline2: "We handle the rest.",
      subtext: "AI-powered receptionist, scheduler, and operations manager for contractors, field crews, gyms, spas, and restaurants.",
      cta: "Book a Free Session →",
      ctaSecondary: "See How It Works",
      greeting: "What does your business need help with?",
      chips: [
        { label: "Missed calls while on the job", key: "calls" },
        { label: "Language barriers with crews", key: "language" },
        { label: "Appointment booking & follow-up", key: "appointments" },
        { label: "Email and inbox overload", key: "email" },
        { label: "Crew coordination & updates", key: "crew" },
      ],
      responses: {
        calls: "SoloEdge picks up every call you miss, qualifies the caller, captures the lead, and texts you immediately — while you stay working.",
        language: "English ↔ Spanish ↔ Chinese across calls, texts, field notes, and client updates. No confusion for your crew, no gaps with your clients.",
        appointments: "SoloEdge handles the booking conversation, confirms appointments, and sends reminders automatically. Your calendar fills itself.",
        email: "Your inbox, sorted. SoloEdge surfaces priority messages, drafts professional replies, and clears the clutter.",
        crew: "Rough field notes become clean professional updates. SoloEdge keeps your office and job site connected — no constant back-and-forth.",
      },
    },
    services: {
      title: "Everything Your Business Needs",
      subtitle: "Two powerful suites. One affordable system.",
      items: [
        { title: "AI Receptionist", desc: "Answer every call, capture every lead — automatically, around the clock." },
        { title: "Appointment Setting", desc: "Book appointments directly into your calendar without lifting a finger." },
        { title: "Lead Capture & Follow-Up", desc: "Instant responses and persistent follow-ups. No lead left behind." },
        { title: "Email & Admin Automation", desc: "Stop drowning in your inbox. Automate your tedious daily tasks." },
        { title: "Bilingual Communication", desc: "English ↔ Spanish ↔ Chinese across all channels, automatically." },
        { title: "Live Interpreter Mode", desc: "Real-time bidirectional translation for job sites and front desks." },
      ],
    },
    pricing: {
      title: "Simple, Affordable Pricing",
      subtitle: "Setup once. Keep it affordable every month.",
      setupFee: "Setup Fee",
      perMonth: "/mo",
      perLine: "/line",
      commSuite: "Communication Suite",
      schedSuite: "Scheduling Suite",
      getStarted: "Get Started",
      mostPopular: "Most Popular",
    },
    contact: {
      title: "Ready to Get Started?",
      subtitle: "Book a free 20-minute session. Murphy will walk you through exactly what SoloEdge can handle for your business.",
      name: "Your Name", phone: "Phone Number", email: "Email Address",
      businessType: "Business Type", message: "Tell us about your business",
      submit: "Send Message", success: "Message sent! We'll be in touch within 24 hours.",
    },
    footer: {
      tagline: "You do the work. We handle the rest.",
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
      subtitle: "Real-time bidirectional translation for job sites and front desks",
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
      contact: "Contacto", dashboard: "Panel", bookSession: "Reservar Sesión",
    },
    hero: {
      badge: "SoloEdge · En Línea",
      headline1: "Tú haces el trabajo.",
      headline2: "Nosotros manejamos el resto.",
      subtext: "Recepcionista, programador y gerente de operaciones con IA para contratistas, cuadrillas, gimnasios, spas y restaurantes.",
      cta: "Reserva una Sesión Gratis →",
      ctaSecondary: "Ver Cómo Funciona",
      greeting: "¿En qué necesita ayuda tu negocio?",
      chips: [
        { label: "Llamadas perdidas en el trabajo", key: "calls" },
        { label: "Barreras de idioma con la cuadrilla", key: "language" },
        { label: "Citas y seguimiento", key: "appointments" },
        { label: "Correos y bandeja de entrada", key: "email" },
        { label: "Coordinación de cuadrilla", key: "crew" },
      ],
      responses: {
        calls: "SoloEdge contesta cada llamada que pierdes, califica al cliente, captura el prospecto y te avisa por mensaje — mientras tú sigues trabajando.",
        language: "Inglés ↔ Español ↔ Chino en llamadas, mensajes, notas de campo y actualizaciones. Sin confusión para tu cuadrilla.",
        appointments: "SoloEdge maneja la conversación de reserva, confirma citas y envía recordatorios automáticamente. Tu agenda se llena sola.",
        email: "Tu bandeja de entrada, organizada. SoloEdge saca los mensajes importantes, redacta respuestas profesionales y limpia el desorden.",
        crew: "Las notas de campo se convierten en actualizaciones profesionales. SoloEdge mantiene tu oficina y obra conectadas.",
      },
    },
    services: {
      title: "Todo lo que Tu Negocio Necesita",
      subtitle: "Dos suites poderosas. Un sistema accesible.",
      items: [
        { title: "Recepcionista IA", desc: "Contesta cada llamada, captura cada prospecto — automáticamente, las 24 horas." },
        { title: "Programación de Citas", desc: "Reserva citas directamente en tu calendario sin mover un dedo." },
        { title: "Captura y Seguimiento de Prospectos", desc: "Respuestas instantáneas y seguimiento persistente. Ningún prospecto se pierde." },
        { title: "Automatización de Correo", desc: "Deja de ahogarte en tu bandeja de entrada. Automatiza tus tareas diarias." },
        { title: "Comunicación Bilingüe", desc: "Inglés ↔ Español ↔ Chino en todos los canales, automáticamente." },
        { title: "Modo Intérprete en Vivo", desc: "Traducción bidireccional en tiempo real para obras y recepciones." },
      ],
    },
    pricing: {
      title: "Precios Simples y Accesibles",
      subtitle: "Configura una vez. Mantén el costo bajo cada mes.",
      setupFee: "Costo de Instalación",
      perMonth: "/mes",
      perLine: "/línea",
      commSuite: "Suite de Comunicación",
      schedSuite: "Suite de Programación",
      getStarted: "Comenzar",
      mostPopular: "Más Popular",
    },
    contact: {
      title: "¿Listo para Comenzar?",
      subtitle: "Reserva una sesión gratuita de 20 minutos. Murphy te explicará exactamente qué puede manejar SoloEdge para tu negocio.",
      name: "Tu Nombre", phone: "Número de Teléfono", email: "Correo Electrónico",
      businessType: "Tipo de Negocio", message: "Cuéntanos sobre tu negocio",
      submit: "Enviar Mensaje", success: "¡Mensaje enviado! Te contactaremos en 24 horas.",
    },
    footer: {
      tagline: "Tú haces el trabajo. Nosotros manejamos el resto.",
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
      subtitle: "Traducción bidireccional en tiempo real para obras y recepciones",
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
      contact: "联系", dashboard: "控制台", bookSession: "预约咨询",
    },
    hero: {
      badge: "SoloEdge · 在线",
      headline1: "您专注工作，",
      headline2: "我们处理其余一切。",
      subtext: "为承包商、施工队、健身房、水疗中心和餐厅提供AI接待员、调度员和运营经理。",
      cta: "免费预约咨询 →",
      ctaSecondary: "了解工作原理",
      greeting: "您的业务需要哪方面的帮助？",
      chips: [
        { label: "工作时错过电话", key: "calls" },
        { label: "与团队的语言障碍", key: "language" },
        { label: "预约和跟进", key: "appointments" },
        { label: "邮件和收件箱管理", key: "email" },
        { label: "团队协调和更新", key: "crew" },
      ],
      responses: {
        calls: "SoloEdge接听您错过的每一个电话，筛选来电者，捕获潜在客户，并立即发短信通知您——让您专注工作。",
        language: "英语↔西班牙语↔中文，覆盖电话、短信、现场记录和客户更新。消除团队沟通障碍。",
        appointments: "SoloEdge处理预约对话，确认预约并自动发送提醒。您的日历自动填满。",
        email: "整理您的收件箱。SoloEdge筛选重要邮件，起草专业回复，清理杂乱信息。",
        crew: "现场粗略记录变成清晰的专业更新。SoloEdge保持您的办公室和工地同步。",
      },
    },
    services: {
      title: "您业务所需的一切",
      subtitle: "两套强大系统。一个实惠方案。",
      items: [
        { title: "AI接待员", desc: "全天候自动接听每一个电话，捕获每一个潜在客户。" },
        { title: "预约管理", desc: "直接将预约添加到您的日历，无需手动操作。" },
        { title: "潜在客户捕获和跟进", desc: "即时响应和持续跟进。不遗漏任何潜在客户。" },
        { title: "邮件和行政自动化", desc: "不再被收件箱淹没。自动化您的日常繁琐任务。" },
        { title: "多语言沟通", desc: "英语↔西班牙语↔中文，覆盖所有渠道，自动切换。" },
        { title: "实时口译模式", desc: "为工地和前台提供实时双向翻译。" },
      ],
    },
    pricing: {
      title: "简单实惠的价格",
      subtitle: "一次设置。每月保持低成本。",
      setupFee: "安装费",
      perMonth: "/月",
      perLine: "/线路",
      commSuite: "通信套件",
      schedSuite: "调度套件",
      getStarted: "立即开始",
      mostPopular: "最受欢迎",
    },
    contact: {
      title: "准备好开始了吗？",
      subtitle: "预约免费20分钟咨询。Murphy将为您详细介绍SoloEdge能为您的业务处理什么。",
      name: "您的姓名", phone: "电话号码", email: "电子邮件",
      businessType: "业务类型", message: "告诉我们您的业务情况",
      submit: "发送消息", success: "消息已发送！我们将在24小时内联系您。",
    },
    footer: {
      tagline: "您专注工作，我们处理其余一切。",
      rights: "版权所有。",
    },
    dashboard: {
      welcome: "欢迎回来",
      launchReceptionist: "启动Riley接待员",
      launchOpsManager: "启动Riley运营经理",
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
      langA: "语言A", langB: "语言B",
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
