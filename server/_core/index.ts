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

  // Riley voice webhook (Twilio inbound calls) — must be before tRPC
  app.use("/api", voiceRouter);

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
