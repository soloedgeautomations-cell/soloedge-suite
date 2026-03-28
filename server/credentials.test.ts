import { describe, expect, it } from "vitest";

/**
 * Validates that all required credentials are present in the environment.
 * These are injected as secrets and must be non-empty strings.
 */
describe("credentials — environment variables", () => {
  it("TELEGRAM_BOT_TOKEN is set and non-empty", () => {
    const val = process.env.TELEGRAM_BOT_TOKEN;
    expect(val).toBeTruthy();
    expect(typeof val).toBe("string");
    expect(val!.length).toBeGreaterThan(10);
  });

  it("TELEGRAM_ALERT_CHAT_ID is set and non-empty", () => {
    const val = process.env.TELEGRAM_ALERT_CHAT_ID;
    expect(val).toBeTruthy();
    expect(typeof val).toBe("string");
  });

  it("TWILIO_ACCOUNT_SID is set and starts with AC", () => {
    const val = process.env.TWILIO_ACCOUNT_SID;
    expect(val).toBeTruthy();
    expect(val).toMatch(/^AC/);
  });

  it("TWILIO_AUTH_TOKEN is set and non-empty", () => {
    const val = process.env.TWILIO_AUTH_TOKEN;
    expect(val).toBeTruthy();
    expect(typeof val).toBe("string");
    expect(val!.length).toBeGreaterThan(10);
  });

  it("TWILIO_SMS_FROM is set and is a phone number", () => {
    const val = process.env.TWILIO_SMS_FROM;
    expect(val).toBeTruthy();
    expect(val).toMatch(/^\+\d+/);
  });

  it("ALERT_TO_NUMBER is set and is a phone number", () => {
    const val = process.env.ALERT_TO_NUMBER;
    expect(val).toBeTruthy();
    expect(val).toMatch(/^\+\d+/);
  });

  it("OPENAI_API_KEY is set and starts with sk-", () => {
    const val = process.env.OPENAI_API_KEY;
    expect(val).toBeTruthy();
    expect(val).toMatch(/^sk-/);
  });

  it("BOOKING_TIMEZONE is set", () => {
    const val = process.env.BOOKING_TIMEZONE;
    expect(val).toBeTruthy();
    expect(val).toBe("America/Chicago");
  });
});
