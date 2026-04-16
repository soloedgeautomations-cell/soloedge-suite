/**
 * server/stripe/notify.ts
 * Zero-Touch Automation — Welcome notifications after successful provisioning.
 *
 * Sends:
 *   1. Welcome SMS via Twilio (to the customer's mobile number from Stripe)
 *   2. Welcome Email via Twilio SendGrid (to the customer's email from Stripe)
 *
 * Both messages include:
 *   - The newly provisioned Riley AI phone number
 *   - A direct link to the customer dashboard
 *   - Quick-start instructions
 *
 * Environment variables required:
 *   TWILIO_ACCOUNT_SID      — Twilio Account SID
 *   TWILIO_AUTH_TOKEN       — Twilio Auth Token
 *   TWILIO_SMS_FROM         — SoloEdge outbound SMS number (e.g. +15123991605)
 *   SENDGRID_API_KEY        — SendGrid API key for transactional email
 *   FROM_EMAIL              — Verified sender email (e.g. riley@soloedgeautomations.com)
 *   APP_BASE_URL            — Public base URL (e.g. https://soloedgeautomations.com)
 */

// ─── SMS via Twilio REST API ──────────────────────────────────────────────────

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

/**
 * Send a welcome SMS to the customer's mobile number.
 * `toNumber` is the customer's personal mobile (from Stripe billing details).
 * `assignedNumber` is the new Riley AI number we just provisioned.
 */
export async function sendWelcomeSms(
  toNumber: string,
  assignedNumber: string,
  planName: string,
  dashboardUrl: string
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!sid || !token || !from) {
    console.warn("[Notify] Twilio SMS env vars missing — skipping welcome SMS");
    return;
  }

  if (!toNumber || !toNumber.startsWith("+")) {
    console.warn(`[Notify] Invalid or missing customer phone number "${toNumber}" — skipping SMS`);
    return;
  }

  const body =
    `Welcome to SoloEdge AI! 🎉\n\n` +
    `Your Riley AI is live on: ${assignedNumber}\n` +
    `Plan: ${planName}\n\n` +
    `Your customers can call that number right now — Riley will answer.\n\n` +
    `Dashboard: ${dashboardUrl}\n\n` +
    `Reply HELP for support. Reply STOP to opt out.`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ To: toNumber, From: from, Body: body });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Notify] Welcome SMS failed: ${res.status} — ${errText}`);
    } else {
      console.log(`[Notify] Welcome SMS sent to ${toNumber}`);
    }
  } catch (err) {
    console.error("[Notify] Exception sending welcome SMS:", err);
  }
}

// ─── Email via SendGrid REST API ──────────────────────────────────────────────

/**
 * Send a welcome email to the customer.
 * Uses the SendGrid v3 Mail Send API directly (no extra SDK needed).
 */
export async function sendWelcomeEmail(
  toEmail: string,
  customerName: string,
  planName: string,
  assignedNumber: string,
  dashboardUrl: string,
  tempPassword?: string
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL ?? "riley@soloedgeautomations.com";
  const fromName = "SoloEdge AI";

  if (!apiKey) {
    console.warn("[Notify] SENDGRID_API_KEY not set — skipping welcome email");
    return;
  }

  if (!toEmail || !toEmail.includes("@")) {
    console.warn(`[Notify] Invalid or missing customer email "${toEmail}" — skipping email`);
    return;
  }

  const firstName = customerName?.split(" ")[0] ?? "there";
  const loginSection = tempPassword
    ? `<p><strong>Your temporary login password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${tempPassword}</code><br>
       Please change it after your first login.</p>`
    : `<p>Log in with the same account you used during checkout.</p>`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to SoloEdge AI</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
  <img src="https://soloedgeautomations.com/logo.png" alt="SoloEdge AI" style="height:40px;margin-bottom:24px;" onerror="this.style.display='none'">
  <h1 style="color:#2563eb;font-size:24px;margin-bottom:8px;">Welcome to SoloEdge AI, ${firstName}!</h1>
  <p>Your Riley AI receptionist is <strong>live right now</strong>. Here's everything you need to get started.</p>

  <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 8px;font-size:13px;color:#0369a1;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;">Your Riley AI Phone Number</p>
    <p style="margin:0;font-size:28px;font-weight:bold;color:#0c4a6e;letter-spacing:.05em;">${assignedNumber}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#0369a1;">Share this number with your customers — Riley answers 24/7.</p>
  </div>

  <h2 style="font-size:18px;margin-top:28px;">Your Plan: ${planName}</h2>
  <p>Riley is already configured for your business. Here's what happens next:</p>
  <ol style="line-height:1.8;">
    <li>Give your customers the number above — they can call it right now.</li>
    <li>Riley will answer, capture leads, and book appointments automatically.</li>
    <li>Connect Telegram or WhatsApp in your dashboard to get instant alerts for every call and lead. 📲</li>
    <li>Log in to your dashboard to view bookings, contacts, and call history.</li>
  </ol>

  ${loginSection}

  <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;margin:16px 0;">
    Open Your Dashboard →
  </a>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
  <p style="font-size:13px;color:#6b7280;">
    Questions? Reply to this email or call us at <strong>(512) 399-1605</strong>.<br>
    SoloEdge AI Automations · Austin, TX
  </p>
</body>
</html>`;

  const textBody =
    `Welcome to SoloEdge AI, ${firstName}!\n\n` +
    `Your Riley AI phone number: ${assignedNumber}\n` +
    `Plan: ${planName}\n\n` +
    (tempPassword ? `Temporary password: ${tempPassword}\nPlease change it after first login.\n\n` : "") +
    `Dashboard: ${dashboardUrl}\n\n` +
    `Share ${assignedNumber} with your customers — Riley answers 24/7.\n\n` +
    `Questions? Reply to this email or call (512) 399-1605.`;

  const payload = {
    personalizations: [{ to: [{ email: toEmail, name: customerName }] }],
    from: { email: fromEmail, name: fromName },
    subject: `Your Riley AI is live — ${assignedNumber}`,
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ],
  };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 202) {
      console.log(`[Notify] Welcome email sent to ${toEmail}`);
    } else {
      const errText = await res.text();
      console.error(`[Notify] SendGrid email failed: ${res.status} — ${errText}`);
    }
  } catch (err) {
    console.error("[Notify] Exception sending welcome email:", err);
  }
}
