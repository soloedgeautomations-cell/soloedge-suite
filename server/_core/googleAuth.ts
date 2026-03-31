/**
 * Google OAuth 2.0 — Customer Login
 * Routes:
 *   GET /api/auth/google          → redirect to Google consent screen
 *   GET /api/auth/google/callback → exchange code, upsert user, set session cookie
 */
import type { Express } from "express";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function registerGoogleAuthRoutes(app: Express) {
  // Step 1: Redirect to Google
  app.get("/api/auth/google", (req, res) => {
    if (!ENV.googleClientId) {
      return res.status(503).json({ error: "Google login not configured" });
    }

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: ENV.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Handle callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, error } = req.query as Record<string, string>;

    if (error || !code) {
      console.error("[GoogleAuth] OAuth error:", error);
      return res.redirect("/login?error=google_denied");
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: ENV.googleRedirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json() as { access_token: string };

      // Get user info from Google
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        throw new Error(`User info fetch failed: ${userInfoRes.status}`);
      }

      const googleUser = await userInfoRes.json() as {
        sub: string;
        email: string;
        name: string;
        picture?: string;
      };

      const openId = `google_${googleUser.sub}`;
      const db = await getDb();

      if (!db) {
        throw new Error("Database unavailable");
      }

      // Upsert user
      const [existing] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

      if (!existing) {
        // Check if email already exists (from a purchase before Google login)
        const [byEmail] = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
        if (byEmail) {
          // Link Google to existing account
          await db.update(users).set({
            openId,
            loginMethod: "google",
            lastSignedIn: new Date(),
          }).where(eq(users.id, byEmail.id));
        } else {
          // Create new account
          await db.insert(users).values({
            openId,
            name: googleUser.name,
            email: googleUser.email,
            loginMethod: "google",
            role: "user",
          });
        }
      } else {
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, openId));
      }

      // Issue session cookie
      const sessionToken = await sdk.createSessionToken(openId, { name: googleUser.name });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect("/app");
    } catch (err) {
      console.error("[GoogleAuth] Callback error:", err);
      res.redirect("/login?error=google_failed");
    }
  });
}
