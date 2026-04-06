import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMagicAuthRoute } from "./magicAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { voiceRouter, mediaStreamWss } from "../voice";
import { handleGoogleConnect, handleGoogleCallback, handleGoogleStatus } from "../googleCalendar";
import { handleStripeWebhook } from "../stripe/webhook";
import { handleTelegramWebhook } from "../telegram/webhook";
import { registerGoogleAuthRoutes } from "./googleAuth";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Stripe webhook MUST use raw body — register BEFORE express.json()
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Magic auto-login for guest customers after Stripe checkout
  registerMagicAuthRoute(app);

  // Google OAuth for customer login
  registerGoogleAuthRoutes(app);

  // Riley voice webhook (Twilio inbound calls) — must be before tRPC
  app.use("/api", voiceRouter);

  // Telegram bot webhook — receives messages from Telegram servers
  app.post("/api/telegram/webhook", handleTelegramWebhook);

  // Google Calendar OAuth routes — must be before tRPC
  app.get("/api/google/connect", handleGoogleConnect);
  app.get("/api/google/callback", handleGoogleCallback);
  app.get("/api/google/status", handleGoogleStatus);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // WebSocket upgrade for Twilio media stream → OpenAI Realtime bridge
  server.on("upgrade", (request, socket, head) => {
    const url = request.url || "";
    if (url === "/api/media-stream" || url.startsWith("/api/media-stream?")) {
      mediaStreamWss.handleUpgrade(request, socket as any, head, (ws) => {
        mediaStreamWss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// ─── One-time startup: link existing Twilio number to admin user ──────────────
// Runs every boot but only updates if assignedPhoneNumber is not yet set.
async function autoLinkAdminPhone() {
  try {
    const db = await getDb();
    if (!db) return;
    const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
    const token = process.env.TWILIO_AUTH_TOKEN ?? "";
    if (!sid || !token) return;

    // Find admin user without a phone number
    const adminRows = await db.select({ id: users.id, phone: users.assignedPhoneNumber })
      .from(users).where(eq(users.role, "admin")).limit(1);
    if (!adminRows.length || adminRows[0].phone) {
      console.log("[AutoLink] Admin already has phone:", adminRows[0]?.phone ?? "(no admin)");
      return;
    }

    const PHONE = "+15123991605";
    const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
    const base = `https://api.twilio.com/2010-04-01/Accounts/${sid}`;
    const voiceUrl = `${(process.env.APP_BASE_URL ?? "https://soloedge.app").replace(/\/+$/, "")}/api/incoming-call`;

    // Get Twilio number SID
    const searchRes = await fetch(`${base}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(PHONE)}`,
      { headers: { Authorization: auth } });
    const searchData = await searchRes.json() as { incoming_phone_numbers?: { sid: string }[] };
    const phoneSid = searchData.incoming_phone_numbers?.[0]?.sid;
    if (!phoneSid) { console.log("[AutoLink] Phone not found in Twilio account"); return; }

    // Set webhook
    await fetch(`${base}/IncomingPhoneNumbers/${phoneSid}.json`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ VoiceUrl: voiceUrl, VoiceMethod: "POST" }).toString(),
    });

    // Save to DB
    await db.update(users).set({ assignedPhoneNumber: PHONE }).where(eq(users.id, adminRows[0].id));
    console.log(`[AutoLink] ✅ Linked ${PHONE} to admin user ${adminRows[0].id}, webhook → ${voiceUrl}`);
  } catch (e) {
    console.error("[AutoLink] Error:", e);
  }
}
autoLinkAdminPhone();
