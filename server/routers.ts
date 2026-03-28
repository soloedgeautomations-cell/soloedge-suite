import { z } from "zod/v4";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { leads, conversations, messages, bookings, constructionLogs, interpreterSessions, whiteLabelClients } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Riley System Prompts ────────────────────────────────────────────────────

const RILEY_RECEPTIONIST_PROMPT = `
You are Riley, the SoloEdge AI Receptionist and multilingual communication assistant.

You represent SoloEdge Automations, owned by Murphy.
Your job: answer questions, capture leads, handle scheduling, and explain SoloEdge services in short, practical language.

CORE SERVICES:
- SoloEdge Communication Suite: handles calls, texts, lead capture, front-door communication, field communication support, and email help.
- SoloEdge Scheduling Suite: handles booking support, confirmations, reminders, reschedules, follow-up, and schedule coordination.

PRICING:
Communication Suite:
- Field Starter (AI Helper): $149 setup + $59/mo per line
- Field Pro (AI Specialist): $249 setup + $99/mo per line
- Field Team (Crew System): $349 setup + $149/mo per line

Scheduling Suite:
- Scheduling Starter: $149 setup + $49/mo
- Scheduling Pro: $249 setup + $89/mo
- Scheduling Plus: $349 setup + $149/mo

SETUP: "We typically have your system up and running within 24–48 hours."

LANGUAGE RULES:
- Reply in the same language the user writes in (English, Spanish, or Chinese)
- Do not mix languages unless asked

BEHAVIOR:
- Keep replies short and practical
- Get to the point fast
- Ask one useful question at a time
- No filler phrases
- Do not explain technical AI details
- Do not act like a generic chatbot
`.trim();

const RILEY_OPS_MANAGER_PROMPT = `
You are Riley, the SoloEdge SR Operations Manager — an advanced AI coordinator for construction GCs, field crews, and service businesses.

You go beyond basic reception. You proactively coordinate, summarize, route tasks, and manage communication across crews, subs, and clients.

CORE CAPABILITIES:
1. Proactive Coordination: Monitor tasks, flag delays, suggest next steps before being asked
2. Bilingual Daily Summaries: Generate end-of-day summaries in both English and Spanish (or Chinese)
3. Crew & Sub Management: Track who is on site, assign tasks, coordinate subcontractors
4. Task Routing: Route messages and requests to the right person or team
5. Escalation: Identify urgent issues and escalate with clear context
6. Construction Jargon: Handle rough-in, punch list, change orders, material requests, RFIs, submittals, progress updates
7. Calendar Oversight: Review upcoming bookings, flag conflicts, suggest schedule adjustments

CONSTRUCTION TERMS YOU KNOW:
rough-in, punch list, change order, material request, RFI (Request for Information), submittal, scope of work, progress update, safety incident, daily log, site walk, closeout, as-built, lien waiver, certificate of occupancy

LANGUAGE RULES:
- Reply in the same language the user writes in
- When generating summaries, provide both English and Spanish versions

BEHAVIOR:
- Be proactive — offer insights and next steps without being asked
- Be concise but thorough
- Sound like a seasoned operations manager, not a chatbot
- Flag risks and blockers clearly
- Use structured formats (lists, summaries) for complex updates
`.trim();

// ─── Notification helpers ─────────────────────────────────────────────────────

async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("Telegram notification failed:", e);
  }
}

async function sendSmsNotification(body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;
  const to = process.env.ALERT_TO_NUMBER;
  if (!sid || !token || !from || !to) return;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (e) {
    console.error("SMS notification failed:", e);
  }
}

async function notifyMurphy(message: string, smsShort: string) {
  await Promise.allSettled([
    sendTelegramNotification(message),
    sendSmsNotification(smsShort),
  ]);
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getOrCreateConversation(userId: number | null, sessionId: string, mode: string, language: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(conversations)
    .where(eq(conversations.sessionId, sessionId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(conversations).values({ userId, sessionId, mode, language, title: `${mode} session` });
  const created = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId)).limit(1);
  return created[0] ?? null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Riley AI Chat ────────────────────────────────────────────────────────
  riley: router({
    chat: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        mode: z.enum(["receptionist", "ops_manager"]).default("receptionist"),
        language: z.enum(["en", "es", "zh"]).default("en"),
        sessionId: z.string(),
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        const systemPrompt = input.mode === "ops_manager" ? RILEY_OPS_MANAGER_PROMPT : RILEY_RECEPTIONIST_PROMPT;
        const langInstruction = input.language === "es"
          ? "\n\nIMPORTANT: The user is writing in Spanish. Reply in Spanish."
          : input.language === "zh"
          ? "\n\nIMPORTANT: The user is writing in Chinese. Reply in Chinese."
          : "";

        const historyMessages = input.history.slice(-10).map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        }));

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt + langInstruction },
            ...historyMessages,
            { role: "user", content: input.message },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const reply = (typeof rawContent === 'string' ? rawContent : null) ?? "I'm here to help. Could you tell me more about your business?";

        // Persist conversation if user is logged in
        const userId = ctx.user?.id ?? null;
        const db = await getDb();
        if (db) {
          const conv = await getOrCreateConversation(userId, input.sessionId, input.mode, input.language);
          if (conv) {
            await db.insert(messages).values([
              { conversationId: conv.id, role: "user", content: input.message, language: input.language },
              { conversationId: conv.id, role: "assistant", content: reply, language: input.language },
            ]);
          }
        }

        return { reply, mode: input.mode };
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conv = await db.select().from(conversations)
          .where(eq(conversations.sessionId, input.sessionId)).limit(1);
        if (!conv[0]) return [];
        const msgs = await db.select().from(messages)
          .where(eq(messages.conversationId, conv[0].id))
          .orderBy(messages.createdAt);
        return msgs;
      }),

    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(conversations)
        .where(eq(conversations.userId, ctx.user.id))
        .orderBy(desc(conversations.updatedAt))
        .limit(20);
    }),
  }),

  // ─── Lead Capture ─────────────────────────────────────────────────────────
  leads: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        businessType: z.string().optional(),
        message: z.string().optional(),
        language: z.string().default("English"),
        source: z.string().default("website"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db) {
          await db.insert(leads).values({
            name: input.name,
            phone: input.phone ?? null,
            email: input.email ?? null,
            business_type: input.businessType ?? null,
            message: input.message ?? null,
            language: input.language,
            source: input.source,
            status: "new",
          });
        }

        const notifMsg = [
          "🔔 <b>New SoloEdge Lead</b>",
          `👤 Name: ${input.name}`,
          `📞 Phone: ${input.phone ?? "—"}`,
          `✉️ Email: ${input.email ?? "—"}`,
          `🏢 Business: ${input.businessType ?? "—"}`,
          `🌐 Language: ${input.language}`,
          `📝 Message: ${input.message ?? "—"}`,
          `📍 Source: ${input.source}`,
        ].join("\n");

        const smsMsg = `New SoloEdge Lead: ${input.name} | ${input.phone ?? input.email ?? "—"} | ${input.businessType ?? "—"}`;
        await notifyMurphy(notifMsg, smsMsg);
        return { success: true };
      }),
  }),

  // ─── Live Interpreter ─────────────────────────────────────────────────────
  interpreter: router({
    translate: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(2000),
        fromLang: z.enum(["en", "es", "zh"]),
        toLang: z.enum(["en", "es", "zh"]),
        context: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const langNames: Record<string, string> = { en: "English", es: "Spanish", zh: "Chinese" };
        const from = langNames[input.fromLang];
        const to = langNames[input.toLang];
        const contextNote = input.context ? `\nContext: ${input.context}` : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional interpreter specializing in construction, business, and service industry terminology. Translate accurately and naturally. Preserve technical jargon. Be concise.${contextNote}`,
            },
            {
              role: "user",
              content: `Translate the following from ${from} to ${to}. Return ONLY the translation, nothing else:\n\n${input.text}`,
            },
          ],
        });

        const translation = response.choices?.[0]?.message?.content ?? "";
        return { translation, fromLang: input.fromLang, toLang: input.toLang };
      }),

    startSession: protectedProcedure
      .input(z.object({
        sessionType: z.enum(["one-on-one", "broadcast"]).default("one-on-one"),
        languageA: z.enum(["en", "es", "zh"]),
        languageB: z.enum(["en", "es", "zh"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { sessionId: null };
        await db.insert(interpreterSessions).values({
          userId: ctx.user.id,
          sessionType: input.sessionType,
          languageA: input.languageA,
          languageB: input.languageB,
        });
        const session = await db.select().from(interpreterSessions)
          .where(eq(interpreterSessions.userId, ctx.user.id))
          .orderBy(desc(interpreterSessions.createdAt)).limit(1);
        return { sessionId: session[0]?.id ?? null };
      }),
  }),

  // ─── Construction Tools ───────────────────────────────────────────────────
  construction: router({
    logEntry: protectedProcedure
      .input(z.object({
        logType: z.enum(["check-in", "progress", "safety", "material-request", "sub-coordination", "change-order"]),
        jobSite: z.string().optional(),
        crewMember: z.string().optional(),
        content: z.string().min(1).max(3000),
        language: z.enum(["en", "es", "zh"]).default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use Riley Ops Manager to process and translate the log entry
        const processPrompt = `You are Riley, SoloEdge SR Operations Manager. Process this construction log entry.
Log Type: ${input.logType}
Job Site: ${input.jobSite ?? "Not specified"}
Crew Member: ${input.crewMember ?? "Not specified"}
Content: ${input.content}

Tasks:
1. Identify any construction jargon terms (rough-in, punch list, change order, material request, RFI, etc.)
2. Translate to English if not already in English
3. Generate a clean, professional summary
4. Flag any urgent items or safety concerns

Return JSON: { "summary": "...", "translatedContent": "...", "jargonTerms": ["..."], "urgent": false, "urgentReason": "" }`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: processPrompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "construction_log",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  translatedContent: { type: "string" },
                  jargonTerms: { type: "array", items: { type: "string" } },
                  urgent: { type: "boolean" },
                  urgentReason: { type: "string" },
                },
                required: ["summary", "translatedContent", "jargonTerms", "urgent", "urgentReason"],
                additionalProperties: false,
              },
            },
          },
        });

        let processed = { summary: input.content, translatedContent: input.content, jargonTerms: [] as string[], urgent: false, urgentReason: "" };
        try {
          const rawContent2 = response.choices?.[0]?.message?.content;
          const raw = typeof rawContent2 === 'string' ? rawContent2 : '{}';
          processed = JSON.parse(raw);
        } catch { /* use defaults */ }

        const db = await getDb();
        if (db) {
          await db.insert(constructionLogs).values({
            userId: ctx.user.id,
            logType: input.logType,
            jobSite: input.jobSite ?? null,
            crewMember: input.crewMember ?? null,
            content: input.content,
            language: input.language,
            translatedContent: processed.translatedContent,
            jargonTerms: JSON.stringify(processed.jargonTerms),
            status: processed.urgent ? "urgent" : "logged",
          });
        }

        if (processed.urgent) {
          const urgentTg = `⚠️ <b>URGENT Construction Alert</b>\n🏗️ Site: ${input.jobSite ?? "Unknown"}\n👷 Crew: ${input.crewMember ?? "Unknown"}\n📋 ${processed.urgentReason}\n\n${processed.summary}`;
          const urgentSms = `URGENT: ${input.jobSite ?? "Job Site"} — ${processed.urgentReason}`;
          await notifyMurphy(urgentTg, urgentSms);
        }

        return { ...processed, logType: input.logType };
      }),

    getLogs: protectedProcedure
      .input(z.object({ jobSite: z.string().optional(), limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(constructionLogs)
          .where(eq(constructionLogs.userId, ctx.user.id))
          .orderBy(desc(constructionLogs.createdAt))
          .limit(input.limit);
      }),

    generateDailySummary: protectedProcedure
      .input(z.object({ jobSite: z.string().optional(), date: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { summary: "", spanishSummary: "" };

        const logs = await db.select().from(constructionLogs)
          .where(eq(constructionLogs.userId, ctx.user.id))
          .orderBy(desc(constructionLogs.createdAt)).limit(10);

        const logText = logs.map(l => `[${l.logType}] ${l.crewMember ?? "Unknown"}: ${l.content}`).join("\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: RILEY_OPS_MANAGER_PROMPT,
            },
            {
              role: "user",
              content: `Generate a bilingual daily summary for job site: ${input.jobSite ?? "All Sites"}\nDate: ${input.date ?? "Today"}\n\nLog entries:\n${logText}\n\nReturn JSON: { "summary": "English summary...", "spanishSummary": "Spanish summary..." }`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "daily_summary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  spanishSummary: { type: "string" },
                },
                required: ["summary", "spanishSummary"],
                additionalProperties: false,
              },
            },
          },
        });

        try {
          const rawContent3 = response.choices?.[0]?.message?.content;
          const raw = typeof rawContent3 === 'string' ? rawContent3 : '{}';
          return JSON.parse(raw);
        } catch {
          return { summary: "Summary unavailable", spanishSummary: "Resumen no disponible" };
        }
      }),
  }),

  // ─── Bookings ─────────────────────────────────────────────────────────────
  bookings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bookings)
        .where(eq(bookings.userId, ctx.user.id))
        .orderBy(desc(bookings.createdAt)).limit(20);
    }),

    create: protectedProcedure
      .input(z.object({
        customerName: z.string(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
        serviceType: z.string().optional(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        notes: z.string().optional(),
        language: z.enum(["en", "es", "zh"]).default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.insert(bookings).values({
          userId: ctx.user.id,
          customerName: input.customerName,
          customerPhone: input.customerPhone ?? null,
          customerEmail: input.customerEmail ?? null,
          serviceType: input.serviceType ?? null,
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
          preferredTime: input.preferredTime ?? null,
          notes: input.notes ?? null,
          language: input.language,
          status: "pending",
        });
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "cancelled", "completed"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.update(bookings).set({ status: input.status }).where(eq(bookings.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Admin Panel ──────────────────────────────────────────────────────────
  admin: router({
    getClients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(whiteLabelClients).orderBy(desc(whiteLabelClients.createdAt));
    }),

    updateClient: protectedProcedure
      .input(z.object({
        id: z.number(),
        businessName: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        planId: z.string().optional(),
        status: z.string().optional(),
        aiMode: z.string().optional(),
        sttProvider: z.string().optional(),
        llmProvider: z.string().optional(),
        ttsProvider: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return { success: false };
        const { id, ...updates } = input;
        await db.update(whiteLabelClients).set(updates).where(eq(whiteLabelClients.id, id));
        return { success: true };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return { totalLeads: 0, totalClients: 0, totalBookings: 0, totalLogs: 0 };
      const [leadsCount] = await db.select({ count: leads.id }).from(leads);
      const [clientsCount] = await db.select({ count: whiteLabelClients.id }).from(whiteLabelClients);
      const [bookingsCount] = await db.select({ count: bookings.id }).from(bookings);
      const [logsCount] = await db.select({ count: constructionLogs.id }).from(constructionLogs);
      return {
        totalLeads: leadsCount?.count ?? 0,
        totalClients: clientsCount?.count ?? 0,
        totalBookings: bookingsCount?.count ?? 0,
        totalLogs: logsCount?.count ?? 0,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
