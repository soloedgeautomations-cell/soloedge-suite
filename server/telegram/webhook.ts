/**
 * server/telegram/webhook.ts
 * Handles incoming Telegram bot updates (messages, /start commands).
 *
 * Registered at: POST /api/telegram/webhook
 *
 * Two cases:
 *  A) /start <token>  → connect the customer's account
 *  B) Regular message → route to Riley AI and reply
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { users, conversations, messages } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { RILEY_RECEPTIONIST_PROMPT } from "../prompts/riley";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

// ── Telegram API helper ───────────────────────────────────────────────────────
async function sendMessage(chatId: string | number, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("[Telegram] sendMessage failed:", err);
  }
}

// ── Riley text response ───────────────────────────────────────────────────────
async function getRileyReply(
  userId: number,
  chatId: string,
  userMessage: string,
  userName: string
): Promise<string> {
  const db = await getDb();

  // Build conversation history (last 10 messages for context)
  let history: { role: "user" | "assistant"; content: string }[] = [];
  if (db) {
    const sessionId = `telegram_${chatId}`;
    // Get or create conversation record
    const existing = await db
      .select()
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .limit(1);
    let convId: number | null = null;
    if (existing.length === 0) {
      await db.insert(conversations).values({
        userId,
        sessionId,
        mode: "receptionist",
        language: "en",
        title: `Telegram — ${userName}`,
      });
      const [created] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionId, sessionId))
        .limit(1);
      convId = created?.id ?? null;
    } else {
      convId = existing[0].id;
    }

    if (convId) {
      // Fetch last 10 messages for context
      const recent = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(messages.createdAt)
        .limit(10);
      history = recent.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      // Save the incoming user message
      await db.insert(messages).values({
        conversationId: convId,
        role: "user",
        content: userMessage,
        language: "en",
      });
    }
  }

  // Call Riley via LLM
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: RILEY_RECEPTIONIST_PROMPT },
        ...history,
        { role: "user", content: userMessage },
      ],
      maxTokens: 400,
    });
    const rawContent = result.choices?.[0]?.message?.content;
    const reply = (typeof rawContent === "string" ? rawContent : null)
      ?? "I'm sorry, I couldn't process that right now. Please try again.";


    // Save Riley's reply to conversation history
    if (db) {
      const sessionId = `telegram_${chatId}`;
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionId, sessionId))
        .limit(1);
      if (conv) {
        await db.insert(messages).values({
          conversationId: conv.id,
          role: "assistant",
          content: reply,
          language: "en",
        });
      }
    }

    return reply;
  } catch (err) {
    console.error("[Telegram] Riley LLM error:", err);
    return "Hi! I'm Riley, your SoloEdge AI receptionist. I'm having a moment — please try again shortly.";
  }
}

// ── Main webhook handler ──────────────────────────────────────────────────────
export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  // Always respond 200 immediately so Telegram doesn't retry
  res.status(200).json({ ok: true });

  const update = req.body;
  if (!update?.message) return;

  const msg = update.message;
  const chatId = String(msg.chat?.id ?? "");
  const text: string = msg.text ?? "";
  const userName: string = msg.from?.first_name ?? msg.from?.username ?? "there";

  if (!chatId || !text) return;

  const db = await getDb();

  // ── Case A: /start <token> — account connection ───────────────────────────
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const token = parts[1]?.trim();

    if (!token) {
      await sendMessage(
        chatId,
        "👋 Hi! I'm Riley, your SoloEdge AI receptionist.\n\nTo connect your account, please use the link from your SoloEdge dashboard under <b>Settings → Integrations → Telegram</b>."
      );
      return;
    }

    if (!db) {
      await sendMessage(chatId, "⚠️ Connection failed — please try again in a moment.");
      return;
    }

    // Find user with this connect token
    const [matchedUser] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.telegramConnectToken, token))
      .limit(1);

    if (!matchedUser) {
      await sendMessage(
        chatId,
        "⚠️ This link has expired or already been used.\n\nPlease generate a new connection link from your SoloEdge dashboard."
      );
      return;
    }

    // Connect the account
    await db
      .update(users)
      .set({
        telegramChatId: chatId,
        telegramConnected: true,
        telegramConnectToken: null, // consume the token
      })
      .where(eq(users.id, matchedUser.id));

    const displayName = matchedUser.name ?? matchedUser.email ?? "there";
    await sendMessage(
      chatId,
      `✅ <b>Connected!</b>\n\nHi ${displayName}! Your SoloEdge account is now linked to this Telegram chat.\n\n` +
      `I'm <b>Riley</b>, your AI receptionist. You can message me here anytime — I'll handle inquiries, answer questions, and keep you updated.\n\n` +
      `Try sending me a message to get started! 🚀`
    );
    console.log(`[Telegram] Account connected: user ${matchedUser.id} → chat ${chatId}`);
    return;
  }

  // ── Case B: Regular message — route to Riley ──────────────────────────────
  if (!db) {
    await sendMessage(chatId, "I'm having a moment — please try again shortly.");
    return;
  }

  // Find the user associated with this chat_id
  const [user] = await db
    .select({ id: users.id, name: users.name, telegramConnected: users.telegramConnected })
    .from(users)
    .where(and(eq(users.telegramChatId, chatId), eq(users.telegramConnected, true)))
    .limit(1);

  if (!user) {
    // Unknown chat — prompt them to connect
    await sendMessage(
      chatId,
      "👋 I don't recognize this chat yet. Please connect your account from your SoloEdge dashboard under <b>Settings → Integrations → Telegram</b>."
    );
    return;
  }

  // Show typing indicator
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
  } catch {}

  // Get Riley's reply
  const reply = await getRileyReply(user.id, chatId, text, userName);
  await sendMessage(chatId, reply);
  console.log(`[Telegram] Riley replied to user ${user.id} in chat ${chatId}`);
}
