import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock invokeLLM ───────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Mocked Riley response." } }],
  }),
}));

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null), // null = no DB, graceful fallback
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makeAuthCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("auth.me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });

  it("auth.logout clears session cookie", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Riley Chat ───────────────────────────────────────────────────────────────
describe("riley.chat", () => {
  it("returns a reply for receptionist mode in English", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.riley.chat({
      message: "What services do you offer?",
      mode: "receptionist",
      language: "en",
      sessionId: "test-session-1",
      history: [],
    });
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
    expect(result.mode).toBe("receptionist");
  });

  it("returns a reply for ops_manager mode", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.riley.chat({
      message: "What is the status of the rough-in?",
      mode: "ops_manager",
      language: "en",
      sessionId: "test-session-2",
      history: [],
    });
    expect(result.reply).toBeTruthy();
    expect(result.mode).toBe("ops_manager");
  });

  it("handles Spanish language input", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.riley.chat({
      message: "¿Cuáles son sus servicios?",
      mode: "receptionist",
      language: "es",
      sessionId: "test-session-3",
      history: [],
    });
    expect(result.reply).toBeTruthy();
  });

  it("handles Chinese language input", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.riley.chat({
      message: "你们提供什么服务？",
      mode: "receptionist",
      language: "zh",
      sessionId: "test-session-4",
      history: [],
    });
    expect(result.reply).toBeTruthy();
  });

  it("returns empty conversations when not authenticated", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    // getConversations is a protected procedure — should throw
    await expect(caller.riley.getConversations()).rejects.toThrow();
  });

  it("getConversations works for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.riley.getConversations();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Lead Capture ─────────────────────────────────────────────────────────────
describe("leads.submit", () => {
  it("accepts a valid lead submission", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.leads.submit({
      name: "John Smith",
      phone: "555-1234",
      email: "john@example.com",
      businessType: "Construction",
      message: "I need help with crew communication",
      language: "English",
      source: "website-contact",
    });
    expect(result.success).toBe(true);
  }, 15000);

  it("requires at least a name", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.leads.submit({ name: "", language: "English", source: "website" })).rejects.toThrow();
  });
});

// ─── Interpreter ──────────────────────────────────────────────────────────────
describe("interpreter.translate", () => {
  it("translates English to Spanish", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.interpreter.translate({
      text: "Good morning, how can I help you?",
      fromLang: "en",
      toLang: "es",
    });
    expect(result.fromLang).toBe("en");
    expect(result.toLang).toBe("es");
    expect(result.translation).toBeTruthy();
  });

  it("translates Spanish to Chinese", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.interpreter.translate({
      text: "Buenos días",
      fromLang: "es",
      toLang: "zh",
    });
    expect(result.fromLang).toBe("es");
    expect(result.toLang).toBe("zh");
  });

  it("rejects empty text", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.interpreter.translate({ text: "", fromLang: "en", toLang: "es" })).rejects.toThrow();
  });
});

// ─── Construction Tools ───────────────────────────────────────────────────────
describe("construction", () => {
  it("logEntry requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.construction.logEntry({
      logType: "check-in",
      content: "Crew arrived at 7am",
      language: "en",
    })).rejects.toThrow();
  });

  it("checkIn works for authenticated user", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "Crew checked in at 7am. All present." } }],
    } as any);

    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.construction.checkIn({
      workerName: "Carlos",
      location: "Second floor",
      jobSite: "Main St Project",
      sessionId: "test-session",
    });
    expect(result.reply).toBeTruthy();
  });

  it("progressUpdate works for authenticated user", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "Progress noted: rough-in complete on second floor." } }],
    } as any);

    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.construction.progressUpdate({
      jobSite: "Main St Project",
      update: "Rough-in complete on second floor",
      sessionId: "test-session",
      language: "en",
    });
    expect(result.reply).toBeTruthy();
  });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
describe("bookings", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.list()).rejects.toThrow();
  });

  it("list returns empty array for authenticated user without DB", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.bookings.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.create({ customerName: "Jane", language: "en" })).rejects.toThrow();
  });

  it("create throws when DB is unavailable", async () => {
    // bookings.create requires DB — it throws 'Database unavailable' gracefully
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.bookings.create({
      customerName: "Jane Doe",
      customerPhone: "555-9999",
      serviceType: "Massage",
      language: "en",
    })).rejects.toThrow();
  });

  it("listByDateRange requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.listByDateRange({ startDate: "2026-01-01", endDate: "2026-01-31" })).rejects.toThrow();
  });

  it("listByDateRange returns empty array for authenticated user without DB", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.bookings.listByDateRange({ startDate: "2026-01-01", endDate: "2026-01-31" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("reschedule requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.reschedule({ id: 1, newDate: "2026-02-01" })).rejects.toThrow();
  });

  it("reschedule throws when DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.bookings.reschedule({ id: 1, newDate: "2026-02-01" })).rejects.toThrow();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.delete({ id: 1 })).rejects.toThrow();
  });

  it("delete throws when DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.bookings.delete({ id: 1 })).rejects.toThrow();
  });
});

/// ─── Contacts / Leads Management ─────────────────────────────────────────────────────
describe("leads.management", () => {
  it("leads.list requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.leads.list()).rejects.toThrow();
  });

  it("leads.list returns array for authenticated user without DB", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.leads.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("leads.updateStatus requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.leads.updateStatus({ id: 1, status: "contacted" })).rejects.toThrow();
  });

  it("leads.updateStatus throws when DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.leads.updateStatus({ id: 1, status: "contacted" })).rejects.toThrow();
  });
});

// ─── Admin Panel ─────────────────────────────────────────────────────
describe("admin", () => {
  it("getClients throws for non-admin user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.getClients()).rejects.toThrow();
  });

  it("getLeads throws for non-admin user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.getLeads()).rejects.toThrow();
  });

  it("getLeads returns array for admin without DB", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("admin"));
    const result = await caller.admin.getLeads();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Google Calendar ──────────────────────────────────────────────────────────
describe("googleCalendar", () => {
  it("status requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.googleCalendar.status()).rejects.toThrow();
  });

  it("status returns connected:false when DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.googleCalendar.status();
    expect(result).toHaveProperty("connected");
    expect(typeof result.connected).toBe("boolean");
  });

  it("getConnectUrl requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.googleCalendar.getConnectUrl()).rejects.toThrow();
  });

  it("getConnectUrl returns a URL string for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.googleCalendar.getConnectUrl();
    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
    expect(result.url).toContain("/api/google/connect");
  });

  it("disconnect requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.googleCalendar.disconnect()).rejects.toThrow();
  });

  it("disconnect succeeds for authenticated user (no-op when DB unavailable)", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.googleCalendar.disconnect();
    expect(result).toHaveProperty("success", true);
  });
});
