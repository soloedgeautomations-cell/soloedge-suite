/**
 * server/_core/magicAuth.ts
 *
 * GET /api/auth/magic?token=<JWT>
 *
 * One-time auto-login endpoint for guest customers who just completed a
 * Stripe checkout. The webhook generates a short-lived session JWT and stores
 * it in users.magicLoginToken. This endpoint:
 *   1. Verifies the JWT signature and expiry (using the same secret as normal sessions).
 *   2. Looks up the user by openId from the token payload.
 *   3. Confirms the stored magicLoginToken matches (one-time use).
 *   4. Clears the stored token (so it can't be reused).
 *   5. Sets the session cookie (same as the OAuth callback does).
 *   6. Redirects to /app (the customer dashboard).
 *
 * If anything fails, redirects to /get-started?error=magic_failed so the
 * customer sees a friendly message and can sign in manually.
 */

import type { Express, Request, Response } from "express";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
// Note: COOKIE_NAME, ONE_YEAR_MS, and getSessionCookieOptions are used below for session cookie creation

export function registerMagicAuthRoute(app: Express): void {
  app.get("/api/auth/magic", async (req: Request, res: Response) => {
    const token = typeof req.query.token === "string" ? req.query.token : null;

    if (!token) {
      console.warn("[MagicAuth] No token provided");
      res.redirect(302, "/get-started?error=magic_failed");
      return;
    }

    try {
      // 1. Verify the JWT (signature + expiry) — pass the raw token string
      const payload = await sdk.verifySession(token);
      if (!payload?.openId) {
        console.warn("[MagicAuth] Token payload missing openId");
        res.redirect(302, "/get-started?error=magic_failed");
        return;
      }

      const db = await getDb();
      if (!db) {
        console.error("[MagicAuth] Database unavailable");
        res.redirect(302, "/get-started?error=magic_failed");
        return;
      }

      // 2. Look up the user by openId
      const [userRow] = await db
        .select({ id: users.id, magicLoginToken: users.magicLoginToken, name: users.name })
        .from(users)
        .where(eq(users.openId, payload.openId))
        .limit(1);

      if (!userRow) {
        console.warn(`[MagicAuth] No user found for openId: ${payload.openId}`);
        res.redirect(302, "/get-started?error=magic_failed");
        return;
      }

      // 3. Confirm the stored token matches (one-time use guard)
      if (!userRow.magicLoginToken || userRow.magicLoginToken !== token) {
        console.warn(`[MagicAuth] Token mismatch for user ${userRow.id} — may have already been used`);
        // If token is already cleared, the user may already be logged in — send to /app
        res.redirect(302, "/app");
        return;
      }

      // 4. Clear the stored token so it can't be reused
      await db
        .update(users)
        .set({ magicLoginToken: null } as any)
        .where(eq(users.id, userRow.id));

      // 5. Issue a full-length session cookie (same as OAuth callback)
      const sessionToken = await sdk.createSessionToken(payload.openId, {
        name: userRow.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[MagicAuth] Auto-login successful for user ${userRow.id} — redirecting to /app`);

      // 6. Redirect to the dashboard
      res.redirect(302, "/app");
    } catch (err) {
      console.error("[MagicAuth] Error during magic login:", err);
      if (!res.headersSent) {
        res.redirect(302, "/get-started?error=magic_failed");
      }
    }
  });
}
