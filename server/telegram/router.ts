/**
 * server/telegram/router.ts
 * tRPC procedures for the customer Telegram integration.
 *
 * Flow:
 *  1. Customer clicks "Connect Telegram" → calls telegram.generateConnectLink
 *  2. Server creates a one-time token, stores it in users.telegramConnectToken
 *  3. Customer opens the deep-link: https://t.me/<BOT_USERNAME>?start=<token>
 *  4. Telegram sends a /start <token> message to the bot webhook
 *  5. Webhook handler matches the token → sets telegramChatId + telegramConnected = true
 *  6. Bot sends a confirmation message to the customer
 *  7. All subsequent messages from that chat_id are answered by Riley
 */

import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "SoloEdgeRileyBot";

export const telegramRouter = router({
  /** Returns the current Telegram connection status for the logged-in user */
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { connected: false, chatId: null };
    const [user] = await db
      .select({ telegramConnected: users.telegramConnected, telegramChatId: users.telegramChatId })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return {
      connected: user?.telegramConnected ?? false,
      chatId: user?.telegramChatId ?? null,
    };
  }),

  /** Generates a one-time deep-link for the customer to connect their Telegram */
  generateConnectLink: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const token = nanoid(32);
    await db
      .update(users)
      .set({ telegramConnectToken: token, telegramConnected: false, telegramChatId: null })
      .where(eq(users.id, ctx.user.id));
    const deepLink = `https://t.me/${BOT_USERNAME}?start=${token}`;
    return { deepLink, token };
  }),

  /** Disconnects Telegram for the logged-in user */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db
      .update(users)
      .set({ telegramConnected: false, telegramChatId: null, telegramConnectToken: null })
      .where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});
