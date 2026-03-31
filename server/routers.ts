import z from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { RILEY_RECEPTIONIST_PROMPT, RILEY_OPS_MANAGER_PROMPT } from "./prompts/riley";
import { leads, conversations, messages, bookings, constructionLogs, interpreterSessions, whiteLabelClients, subscriptions, users } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, isConnected } from "./googleCalendar";
import { stripeRouter } from "./stripe/router";
import { telegramRouter } from "./telegram/router";

// ─── Riley System Prompts (imported from shared source of truth) ─────────────
// Edit server/prompts/riley.ts to update Riley's personality, pricing, or behavior.

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
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        // Admin sees all leads; regular users see only their own (from Riley conversations)
        const allLeads = await db.select().from(leads)
          .orderBy(desc(leads.createdAt))
          .limit(input?.limit ?? 50);
        let filtered = allLeads;
        if (input?.status && input.status !== "all") {
          filtered = filtered.filter(l => l.status === input.status);
        }
        if (input?.search) {
          const q = input.search.toLowerCase();
          filtered = filtered.filter(l =>
            (l.name ?? "").toLowerCase().includes(q) ||
            (l.phone ?? "").toLowerCase().includes(q) ||
            (l.email ?? "").toLowerCase().includes(q) ||
            (l.business_type ?? "").toLowerCase().includes(q)
          );
        }
        return filtered;
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id));
        return { success: true };
      }),
  }),
  // ─── Live Interpreter ──────────────────────────────────────────────────────
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
        duration: z.number().default(60),
        notes: z.string().optional(),
        language: z.string().default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertResult = await (db.insert(bookings) as any).values({
          userId: ctx.user.id,
          serviceType: input.serviceType,
          customerName: input.customerName,
          customerPhone: input.customerPhone ?? null,
          customerEmail: input.customerEmail ?? null,
          preferredDate: input.preferredDate ?? null,
          preferredTime: input.preferredTime ?? null,
          duration: input.duration,
          notes: input.notes ?? null,
          language: input.language,
          status: "pending",
        });
        // Sync to Google Calendar if connected — use insertId to avoid race conditions
        try {
          const newBookingId: number | undefined = insertResult?.insertId;
          if (newBookingId) {
            const [newBooking] = await db.select().from(bookings)
              .where(and(eq(bookings.id, newBookingId), eq(bookings.userId, ctx.user.id))).limit(1);
            if (newBooking) {
              const eventId = await createCalendarEvent(ctx.user.id, {
                id: newBooking.id,
                customerName: newBooking.customerName,
                customerPhone: newBooking.customerPhone,
                customerEmail: newBooking.customerEmail,
                serviceType: newBooking.serviceType,
                preferredDate: newBooking.preferredDate ? String(newBooking.preferredDate) : null,
                preferredTime: newBooking.preferredTime ? String(newBooking.preferredTime) : null,
                duration: newBooking.duration,
                notes: newBooking.notes,
                status: newBooking.status,
              });
              if (eventId) {
                await db.update(bookings).set({ googleCalendarEventId: eventId }).where(eq(bookings.id, newBooking.id));
              }
            }
          }
        } catch (e) {
          console.error("[GCal] create sync failed:", e);
        }
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["confirmed", "pending", "cancelled", "completed"]) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const now = new Date();
        const extra: Record<string, unknown> = {};
        if (input.status === "confirmed") extra.confirmedAt = now;
        if (input.status === "cancelled") extra.cancelledAt = now;
        await db.update(bookings).set({ status: input.status, ...extra }).where(eq(bookings.id, input.id));
        // Sync to Google Calendar if connected — enforce ownership with userId filter
        try {
          const [booking] = await db.select().from(bookings)
            .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id))).limit(1);
          if (booking?.googleCalendarEventId) {
            if (input.status === "cancelled" || input.status === "completed") {
              await deleteCalendarEvent(ctx.user.id, booking.googleCalendarEventId);
              // Clear the stored event ID since the event is gone
              await db.update(bookings).set({ googleCalendarEventId: null }).where(eq(bookings.id, input.id));
            } else {
              await updateCalendarEvent(ctx.user.id, booking.googleCalendarEventId, {
                id: booking.id,
                customerName: booking.customerName,
                customerPhone: booking.customerPhone,
                customerEmail: booking.customerEmail,
                serviceType: booking.serviceType,
                preferredDate: booking.preferredDate ? String(booking.preferredDate) : null,
                preferredTime: booking.preferredTime ? String(booking.preferredTime) : null,
                duration: booking.duration,
                notes: booking.notes,
                status: input.status,
              });
            }
          }
        } catch (e) {
          console.error("[GCal] updateStatus sync failed:", e);
        }
        return { success: true };
      }),
    listByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(),   // YYYY-MM-DD
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(bookings)
          .where(and(
            eq(bookings.userId, ctx.user.id),
            sql`${bookings.preferredDate} >= ${input.startDate}`,
            sql`${bookings.preferredDate} <= ${input.endDate}`,
          ))
          .orderBy(sql`${bookings.preferredDate} ASC, ${bookings.preferredTime} ASC`);
      }),
    reschedule: protectedProcedure
      .input(z.object({
        id: z.number(),
        newDate: z.string(),
        newTime: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        // Get original booking
        const [original] = await db.select().from(bookings)
          .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)));
        if (!original) throw new Error("Booking not found");
        // Create new booking as rescheduled version
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.insert(bookings) as any).values({
          userId: ctx.user.id,
          customerName: original.customerName,
          customerPhone: original.customerPhone,
          customerEmail: original.customerEmail,
          serviceType: original.serviceType,
          preferredDate: input.newDate,
          preferredTime: input.newTime ?? original.preferredTime,
          duration: original.duration,
          notes: input.notes ?? original.notes,
          status: "pending",
          language: original.language,
          rescheduledFrom: original.id,
        });
        // Mark original as cancelled
        await db.update(bookings).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(bookings.id, input.id));
        // Sync reschedule to Google Calendar: delete old event, create new one for the new booking
        try {
          const [oldBooking] = await db.select().from(bookings).where(eq(bookings.id, input.id)).limit(1);
          if (oldBooking?.googleCalendarEventId) {
            await deleteCalendarEvent(ctx.user.id, oldBooking.googleCalendarEventId);
          }
          const [newBooking] = await db.select().from(bookings)
            .where(and(eq(bookings.userId, ctx.user.id), eq(bookings.rescheduledFrom, input.id)))
            .orderBy(desc(bookings.createdAt)).limit(1);
          if (newBooking) {
            const eventId = await createCalendarEvent(ctx.user.id, {
              id: newBooking.id,
              customerName: newBooking.customerName,
              customerPhone: newBooking.customerPhone,
              customerEmail: newBooking.customerEmail,
              serviceType: newBooking.serviceType,
              preferredDate: newBooking.preferredDate ? String(newBooking.preferredDate) : null,
              preferredTime: newBooking.preferredTime ? String(newBooking.preferredTime) : null,
              duration: newBooking.duration,
              notes: newBooking.notes,
              status: newBooking.status,
            });
            if (eventId) {
              await db.update(bookings).set({ googleCalendarEventId: eventId }).where(eq(bookings.id, newBooking.id));
            }
          }
        } catch (e) {
          console.error("[GCal] reschedule sync failed:", e);
        }
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        // Delete from Google Calendar if event exists
        try {
          const [booking] = await db.select().from(bookings)
            .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id))).limit(1);
          if (booking?.googleCalendarEventId) {
            await deleteCalendarEvent(ctx.user.id, booking.googleCalendarEventId);
          }
        } catch (e) {
          console.error("[GCal] delete sync failed:", e);
        }
        await db.delete(bookings).where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { bookingsToday: 0, bookingsTotal: 0, conversationsTotal: 0, leadsTotal: 0, planName: "Free", assignedPhoneNumber: null as string | null };

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [bookingsTodayRows, bookingsTotalRows, conversationsRows, leadsRows, subRows, userRows, calendarConnected] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(bookings)
          .where(and(eq(bookings.userId, ctx.user.id), gte(bookings.createdAt, todayStart), lte(bookings.createdAt, todayEnd))),
        db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.userId, ctx.user.id)),
        db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.userId, ctx.user.id)),
        // leads are global (website contact form) — admin sees all, users see 0
        ctx.user.role === "admin"
          ? db.select({ count: sql<number>`count(*)` }).from(leads)
          : Promise.resolve([{ count: 0 }]),
        db.select().from(subscriptions).where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptions.status, "active"))).limit(1),
        db.select({ assignedPhoneNumber: users.assignedPhoneNumber, stripeSubscriptionStatus: users.stripeSubscriptionStatus }).from(users).where(eq(users.id, ctx.user.id)).limit(1),
        isConnected(ctx.user.id),
      ]);

      return {
        bookingsToday: Number(bookingsTodayRows[0]?.count ?? 0),
        bookingsTotal: Number(bookingsTotalRows[0]?.count ?? 0),
        conversationsTotal: Number(conversationsRows[0]?.count ?? 0),
        leadsTotal: Number(leadsRows[0]?.count ?? 0),
        planName: subRows[0]?.planName ?? "Field Starter",
        assignedPhoneNumber: userRows[0]?.assignedPhoneNumber ?? null,
        // Onboarding checklist
        hasSubscription: (userRows[0]?.stripeSubscriptionStatus === "active") || (subRows.length > 0),
        hasPhone: !!(userRows[0]?.assignedPhoneNumber),
        hasCalendar: calendarConnected,
        hasFirstBooking: Number(bookingsTotalRows[0]?.count ?? 0) > 0,
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

  // ─── Stripe ──────────────────────────────────────────────────────────────
  stripe: stripeRouter,

  // ─── Telegram ────────────────────────────────────────────────────────────
  telegram: telegramRouter,

  // ─── Google Calendar ──────────────────────────────────────────────────────
  googleCalendar: router({
    /** Returns whether the current user has connected Google Calendar */
    status: protectedProcedure.query(async ({ ctx }) => {
      const { isConnected: checkConnected } = await import("./googleCalendar");
      const connected = await checkConnected(ctx.user.id);
      return { connected };
    }),

    /** Returns the connect URL for the frontend to redirect to */
    getConnectUrl: protectedProcedure.query(async ({ ctx }) => {
      // The frontend will navigate to this URL directly
      return { url: `/api/google/connect?userId=${ctx.user.id}` };
    }),

    /** Disconnects Google Calendar by removing stored tokens */
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { disconnectCalendar } = await import("./googleCalendar");
      await disconnectCalendar(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
