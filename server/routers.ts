import z from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { leads, conversations, messages, bookings, constructionLogs, interpreterSessions, whiteLabelClients, subscriptions } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// ─── Riley System Prompts ────────────────────────────────────────────────────

const RILEY_RECEPTIONIST_PROMPT = `
You are Riley, the SoloEdge AI Receptionist and multilingual communication assistant.

You represent SoloEdge Automations and the SoloEdge Team.
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

HANDOFF: When someone wants to speak with a person, schedule a demo, or needs more detail, direct them to:
- Call or text: (512) 702-9685
- Or fill out the contact form at soloedgeautomations.com
Do not say "call us now" — say "feel free to reach the SoloEdge Team at (512) 702-9685 whenever you're ready."

LANGUAGE RULES:
- Reply in the same language the user writes in (English, Spanish, or Chinese)
- Do not mix languages unless asked

BEHAVIOR:
- Keep replies short and practical (2-3 sentences max for hero demo)
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

async function notifySoloEdgeTeam(message: string, smsShort: string) {
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
    // Hero chip demo — lightweight, no session persistence needed
    heroChat: publicProcedure
      .input(z.object({
        chipKey: z.string(),   // e.g. "book", "quote", "hours", "emergency", "multilingual"
        industry: z.string(),  // e.g. "construction", "gym", "massage", "corporate"
        language: z.enum(["en", "es", "zh"]).default("en"),
      }))
      .mutation(async ({ input }) => {
        const langInstruction = input.language === "es"
          ? " Reply in Spanish."
          : input.language === "zh"
          ? " Reply in Chinese (Simplified)."
          : "";

        const chipPrompts: Record<string, string> = {
          book: `The user clicked "Book Appointment" on the ${input.industry} industry demo. Give a friendly 2-sentence response as Riley showing how you handle booking for a ${input.industry} business.`,
          quote: `The user clicked "Get a Quote" on the ${input.industry} industry demo. Give a friendly 2-sentence response as Riley showing how you handle quote requests for a ${input.industry} business.`,
          hours: `The user clicked "Business Hours" on the ${input.industry} industry demo. Give a friendly 2-sentence response as Riley showing how you handle hours/availability inquiries for a ${input.industry} business.`,
          emergency: `The user clicked "Emergency Line" on the ${input.industry} industry demo. Give a friendly 2-sentence response as Riley showing how you handle urgent/emergency calls for a ${input.industry} business.`,
          multilingual: `The user clicked "Multilingual" on the ${input.industry} industry demo. Give a friendly 2-sentence response as Riley showing your multilingual capabilities for a ${input.industry} business.`,
        };

        const userPrompt = chipPrompts[input.chipKey] ?? `Introduce yourself as Riley and explain one key benefit for a ${input.industry} business in 2 sentences.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: RILEY_RECEPTIONIST_PROMPT + langInstruction },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const reply = (typeof rawContent === "string" ? rawContent : null)
          ?? "Hi! I'm Riley. I handle your calls, bookings, and messages 24/7 so you never miss a lead.";

        return { reply };
      }),

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
        await notifySoloEdgeTeam(notifMsg, smsMsg);
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

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional interpreter. Translate the following text from ${from} to ${to}. Return ONLY the translation, no explanations.${input.context ? ` Context: ${input.context}` : ""}`,
            },
            { role: "user", content: input.text },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const translation = (typeof rawContent === "string" ? rawContent : null) ?? "";
        return { translation, fromLang: input.fromLang, toLang: input.toLang };
      }),

    startSession: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        primaryLang: z.enum(["en", "es", "zh"]),
        secondaryLang: z.enum(["en", "es", "zh"]),
        mode: z.enum(["1on1", "broadcast"]).default("1on1"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db) {
          await db.insert(interpreterSessions).values({
            sessionType: input.mode === "broadcast" ? "broadcast" : "one-on-one",
            languageA: input.primaryLang,
            languageB: input.secondaryLang,
          });
        }
        return { success: true, sessionId: input.sessionId };
      }),
  }),

  // ─── Construction Tools ───────────────────────────────────────────────────
  construction: router({
    checkIn: publicProcedure
      .input(z.object({
        workerName: z.string(),
        location: z.string(),
        jobSite: z.string(),
        notes: z.string().optional(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db) {
          await db.insert(constructionLogs).values({
            logType: "check_in",
            crewMember: input.workerName,
            jobSite: input.jobSite,
            content: `Check-in at ${input.location}${input.notes ? ': ' + input.notes : ''}`,
            status: "logged",
          });
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: RILEY_OPS_MANAGER_PROMPT },
            { role: "user", content: `Worker check-in: ${input.workerName} checked in at ${input.jobSite} (${input.location}). ${input.notes ? `Notes: ${input.notes}` : ""} Acknowledge and provide a brief status update.` },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const reply = (typeof rawContent === "string" ? rawContent : null) ?? `Check-in confirmed for ${input.workerName} at ${input.jobSite}.`;

        await notifySoloEdgeTeam(
          `🏗️ <b>Field Check-In</b>\n👷 ${input.workerName}\n📍 ${input.jobSite} — ${input.location}${input.notes ? `\n📝 ${input.notes}` : ""}`,
          `Check-in: ${input.workerName} @ ${input.jobSite}`
        );

        return { reply };
      }),

    safetyAlert: publicProcedure
      .input(z.object({
        alertType: z.string(),
        location: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db) {
          await db.insert(constructionLogs).values({
            logType: "safety_alert",
            jobSite: input.location,
            content: `[${input.severity.toUpperCase()}] ${input.alertType}: ${input.description}`,
            status: input.severity === "critical" ? "urgent" : "logged",
          });
        }

        const severityEmoji: Record<string, string> = { low: "🟡", medium: "🟠", high: "🔴", critical: "🚨" };
        await notifySoloEdgeTeam(
          `${severityEmoji[input.severity]} <b>Safety Alert [${input.severity.toUpperCase()}]</b>\n📍 ${input.location}\n⚠️ ${input.alertType}\n📝 ${input.description}`,
          `SAFETY ${input.severity.toUpperCase()}: ${input.alertType} @ ${input.location}`
        );

        return { success: true, severity: input.severity };
      }),

    progressUpdate: publicProcedure
      .input(z.object({
        jobSite: z.string(),
        update: z.string(),
        phase: z.string().optional(),
        sessionId: z.string(),
        language: z.enum(["en", "es", "zh"]).default("en"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (db) {
          await db.insert(constructionLogs).values({
            logType: "progress_update",
            jobSite: input.jobSite,
            content: `${input.phase ? `[${input.phase}] ` : ""}${input.update}`,
            language: input.language,
            status: "logged",
          });
        }

        const langInstruction = input.language === "es" ? " Reply in Spanish." : input.language === "zh" ? " Reply in Chinese." : "";
        const response = await invokeLLM({
          messages: [
            { role: "system", content: RILEY_OPS_MANAGER_PROMPT + langInstruction },
            { role: "user", content: `Progress update for ${input.jobSite}${input.phase ? ` (${input.phase})` : ""}: ${input.update}. Acknowledge and provide a brief summary with any recommendations.` },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const reply = (typeof rawContent === "string" ? rawContent : null) ?? "Progress update logged.";
        return { reply };
      }),
  }),

  // ─── Bookings ─────────────────────────────────────────────────────────────
  bookings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bookings)
        .where(eq(bookings.userId, ctx.user.id))
        .orderBy(desc(bookings.createdAt))
        .limit(50);
    }),

    create: protectedProcedure
      .input(z.object({
        serviceType: z.string(),
        customerName: z.string(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        notes: z.string().optional(),
        language: z.string().default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.insert(bookings).values({
          userId: ctx.user.id,
          serviceType: input.serviceType,
          customerName: input.customerName,
          customerPhone: input.customerPhone ?? null,
          customerEmail: input.customerEmail ?? null,
          notes: input.notes ?? null,
          language: input.language,
          status: "confirmed",
        });
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["confirmed", "pending", "cancelled", "completed"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(bookings).set({ status: input.status }).where(eq(bookings.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { bookingsToday: 0, bookingsTotal: 0, conversationsTotal: 0, leadsTotal: 0, planName: "Free" };

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [bookingsTodayRows, bookingsTotalRows, conversationsRows, leadsRows, subRows] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(bookings)
          .where(and(eq(bookings.userId, ctx.user.id), gte(bookings.createdAt, todayStart), lte(bookings.createdAt, todayEnd))),
        db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.userId, ctx.user.id)),
        db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.userId, ctx.user.id)),
        // leads are global (website contact form) — admin sees all, users see 0
        ctx.user.role === "admin"
          ? db.select({ count: sql<number>`count(*)` }).from(leads)
          : Promise.resolve([{ count: 0 }]),
        db.select().from(subscriptions).where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptions.status, "active"))).limit(1),
      ]);

      return {
        bookingsToday: Number(bookingsTodayRows[0]?.count ?? 0),
        bookingsTotal: Number(bookingsTotalRows[0]?.count ?? 0),
        conversationsTotal: Number(conversationsRows[0]?.count ?? 0),
        leadsTotal: Number(leadsRows[0]?.count ?? 0),
        planName: subRows[0]?.planName ?? "Field Starter",
      };
    }),

    todayBookings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return db.select().from(bookings)
        .where(and(eq(bookings.userId, ctx.user.id), gte(bookings.createdAt, todayStart), lte(bookings.createdAt, todayEnd)))
        .orderBy(bookings.preferredTime)
        .limit(10);
    }),

    recentActivity: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const [convs, logs] = await Promise.all([
        db.select().from(conversations).where(eq(conversations.userId, ctx.user.id)).orderBy(desc(conversations.updatedAt)).limit(5),
        db.select().from(constructionLogs).where(eq(constructionLogs.userId, ctx.user.id)).orderBy(desc(constructionLogs.createdAt)).limit(5),
      ]);

      const activities = [
        ...convs.map(c => ({ type: "conversation" as const, id: `conv-${c.id}`, title: c.title ?? `${c.mode} session`, subtitle: c.language?.toUpperCase() ?? "EN", timestamp: c.updatedAt, badge: c.mode === "ops_manager" ? "Ops" : "Riley" })),
        ...logs.map(l => ({ type: "log" as const, id: `log-${l.id}`, title: l.logType.replace(/_/g, " "), subtitle: l.jobSite ?? "", timestamp: l.createdAt, badge: l.logType === "safety_alert" ? "Safety" : "Log" })),
      ];

      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
    }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    getClients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(whiteLabelClients).orderBy(desc(whiteLabelClients.createdAt));
    }),

    getLeads: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
    }),

    upsertClient: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        businessName: z.string(),
        plan: z.enum(["field_starter", "field_pro", "field_team", "scheduling_starter", "scheduling_pro", "scheduling_plus"]),
        primaryColor: z.string().optional(),
        logoUrl: z.string().optional(),
        sttProvider: z.string().optional(),
        llmProvider: z.string().optional(),
        ttsProvider: z.string().optional(),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        if (input.id) {
          await db.update(whiteLabelClients).set({
            businessName: input.businessName,
            planId: input.plan,
            primaryColor: input.primaryColor ?? null,
            logoUrl: input.logoUrl ?? null,
            sttProvider: input.sttProvider ?? "whisper",
            llmProvider: input.llmProvider ?? "manus",
            ttsProvider: input.ttsProvider ?? "manus",
            status: input.active ? "active" : "inactive",
          }).where(eq(whiteLabelClients.id, input.id));
        } else {
          await db.insert(whiteLabelClients).values({
            clientName: input.businessName,
            businessName: input.businessName,
            planId: input.plan,
            primaryColor: input.primaryColor ?? null,
            logoUrl: input.logoUrl ?? null,
            sttProvider: input.sttProvider ?? "whisper",
            llmProvider: input.llmProvider ?? "manus",
            ttsProvider: input.ttsProvider ?? "manus",
            status: input.active ? "active" : "inactive",
          });
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
