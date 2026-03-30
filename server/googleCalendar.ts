/**
 * server/googleCalendar.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Google Calendar OAuth 2.0 + Calendar API helpers for SoloEdge Suite.
 *
 * Flow:
 *   1. User clicks "Connect Google Calendar" → GET /api/google/connect
 *   2. Google redirects back → GET /api/google/callback?code=...
 *   3. We exchange code for tokens, store in google_calendar_tokens table
 *   4. On every booking create/confirm/reschedule/delete we call the Calendar API
 *
 * Token refresh is handled transparently before every API call.
 */

import { Request, Response } from "express";
import { getDb } from "./db";
import { googleCalendarTokens, bookings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Config ──────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BOOKING_TIMEZONE = process.env.BOOKING_TIMEZONE ?? "America/Chicago";

// The redirect URI must exactly match what's registered in Google Cloud Console.
// We derive it at runtime from the request so it works on any domain.
function getRedirectUri(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.headers["x-forwarded-host"] ?? req.get("host");
  return `${proto}://${host}/api/google/callback`;
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

// ─── OAuth URL builder ────────────────────────────────────────────────────────

export function buildAuthUrl(req: Request, userId: number): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: String(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json() as Promise<TokenResponse>;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

// ─── Token storage helpers ────────────────────────────────────────────────────

export async function saveTokens(
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const existing = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(googleCalendarTokens)
      .set({ accessToken, refreshToken, expiresAt })
      .where(eq(googleCalendarTokens.userId, userId));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(googleCalendarTokens) as any).values({ userId, accessToken, refreshToken, expiresAt });
  }
}

export async function getValidAccessToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId)).limit(1);
  if (rows.length === 0) return null;
  const row = rows[0];
  // If token expires within 60 seconds, refresh it
  if (row.expiresAt.getTime() - Date.now() < 60_000) {
    try {
      const refreshed = await refreshAccessToken(row.refreshToken);
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await db.update(googleCalendarTokens)
        .set({ accessToken: refreshed.access_token, expiresAt })
        .where(eq(googleCalendarTokens.userId, userId));
      return refreshed.access_token;
    } catch (e) {
      console.error("[GoogleCalendar] Token refresh failed:", e);
      return null;
    }
  }
  return row.accessToken;
}

export async function isConnected(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: googleCalendarTokens.id })
    .from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId))
    .limit(1);
  return rows.length > 0;
}

export async function disconnectCalendar(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
}

// ─── Calendar API helpers ─────────────────────────────────────────────────────

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}

async function calendarRequest(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API ${method} ${path} failed: ${err}`);
  }
  if (res.status === 204) return null; // DELETE returns no body
  return res.json();
}

function buildEventDateTime(date: string | null | undefined, time: string | null | undefined, durationMinutes: number) {
  // date: YYYY-MM-DD, time: HH:MM:SS or HH:MM
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const timeStr = time ? time.slice(0, 5) : "09:00"; // HH:MM
  const startISO = `${dateStr}T${timeStr}:00`;

  // Calculate end time
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  const endISO = `${dateStr}T${endTimeStr}:00`;

  return { startISO, endISO };
}

// ─── Public Calendar event functions ─────────────────────────────────────────

export interface BookingData {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  preferredDate: string | null; // YYYY-MM-DD from DB
  preferredTime: string | null; // HH:MM:SS from DB
  duration: number | null;
  notes: string | null;
  status: string | null;
}

export async function createCalendarEvent(userId: number, booking: BookingData): Promise<string | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  const duration = booking.duration ?? 60;
  const { startISO, endISO } = buildEventDateTime(booking.preferredDate, booking.preferredTime, duration);

  const event: CalendarEvent = {
    summary: `${booking.serviceType ?? "Appointment"} — ${booking.customerName ?? "Client"}`,
    description: [
      `Customer: ${booking.customerName ?? "Unknown"}`,
      booking.customerPhone ? `Phone: ${booking.customerPhone}` : null,
      booking.customerEmail ? `Email: ${booking.customerEmail}` : null,
      booking.notes ? `Notes: ${booking.notes}` : null,
      `Status: ${booking.status ?? "pending"}`,
      `Booked via SoloEdge Suite`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: startISO, timeZone: BOOKING_TIMEZONE },
    end: { dateTime: endISO, timeZone: BOOKING_TIMEZONE },
  };

  if (booking.customerEmail) {
    event.attendees = [{ email: booking.customerEmail }];
  }

  try {
    const result = await calendarRequest("POST", "/calendars/primary/events", accessToken, event) as { id: string };
    console.log(`[GoogleCalendar] Event created: ${result.id} for booking ${booking.id}`);
    return result.id;
  } catch (e) {
    console.error("[GoogleCalendar] createCalendarEvent failed:", e);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: number,
  eventId: string,
  booking: BookingData,
): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return false;

  const duration = booking.duration ?? 60;
  const { startISO, endISO } = buildEventDateTime(booking.preferredDate, booking.preferredTime, duration);

  const event: CalendarEvent = {
    summary: `${booking.serviceType ?? "Appointment"} — ${booking.customerName ?? "Client"}`,
    description: [
      `Customer: ${booking.customerName ?? "Unknown"}`,
      booking.customerPhone ? `Phone: ${booking.customerPhone}` : null,
      booking.customerEmail ? `Email: ${booking.customerEmail}` : null,
      booking.notes ? `Notes: ${booking.notes}` : null,
      `Status: ${booking.status ?? "confirmed"}`,
      `Booked via SoloEdge Suite`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: startISO, timeZone: BOOKING_TIMEZONE },
    end: { dateTime: endISO, timeZone: BOOKING_TIMEZONE },
  };

  try {
    await calendarRequest("PUT", `/calendars/primary/events/${eventId}`, accessToken, event);
    console.log(`[GoogleCalendar] Event updated: ${eventId} for booking ${booking.id}`);
    return true;
  } catch (e) {
    console.error("[GoogleCalendar] updateCalendarEvent failed:", e);
    return false;
  }
}

export async function deleteCalendarEvent(userId: number, eventId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return false;
  try {
    await calendarRequest("DELETE", `/calendars/primary/events/${eventId}`, accessToken);
    console.log(`[GoogleCalendar] Event deleted: ${eventId}`);
    return true;
  } catch (e) {
    console.error("[GoogleCalendar] deleteCalendarEvent failed:", e);
    return false;
  }
}

// ─── Express route handlers ───────────────────────────────────────────────────

/**
 * GET /api/google/connect
 * Redirects authenticated user to Google OAuth consent screen.
 * Requires the user to be logged in (session cookie present).
 */
export async function handleGoogleConnect(req: Request, res: Response): Promise<void> {
  // The user ID is passed as a query param from the frontend (after auth check)
  const userId = parseInt(req.query.userId as string, 10);
  if (!userId || isNaN(userId)) {
    res.status(400).send("Missing userId");
    return;
  }
  const authUrl = buildAuthUrl(req, userId);
  res.redirect(authUrl);
}

/**
 * GET /api/google/callback
 * Google redirects here after user grants permission.
 * Exchanges code for tokens, stores them, redirects to settings page.
 */
export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    console.error("[GoogleCalendar] OAuth error:", error);
    res.redirect("/app/settings?gcal=error");
    return;
  }

  if (!code || !state) {
    res.status(400).send("Missing code or state");
    return;
  }

  const userId = parseInt(state, 10);
  if (!userId || isNaN(userId)) {
    res.status(400).send("Invalid state");
    return;
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokens = await exchangeCode(code, redirectUri);
    if (!tokens.refresh_token) {
      // This happens if the user already granted access before — revoke and reconnect
      res.redirect("/app/settings?gcal=no_refresh_token");
      return;
    }
    await saveTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_in);
    console.log(`[GoogleCalendar] Connected for userId ${userId}`);
    res.redirect("/app/settings?gcal=connected");
  } catch (e) {
    console.error("[GoogleCalendar] Callback error:", e);
    res.redirect("/app/settings?gcal=error");
  }
}

/**
 * GET /api/google/status?userId=X
 * Returns whether the user has connected Google Calendar.
 */
export async function handleGoogleStatus(req: Request, res: Response): Promise<void> {
  const userId = parseInt(req.query.userId as string, 10);
  if (!userId || isNaN(userId)) {
    res.json({ connected: false });
    return;
  }
  const connected = await isConnected(userId);
  res.json({ connected });
}
