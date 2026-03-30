export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ── Zero-Touch Automation ──────────────────────────────────────────────────
  appBaseUrl: process.env.APP_BASE_URL ?? "https://soloedge.app",

  // Twilio (voice, SMS, number provisioning)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioSmsFrom: process.env.TWILIO_SMS_FROM ?? "",

  // SendGrid (transactional email)
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "riley@soloedge.app",

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Set to "live" (or use sk_live_ key) to enable Stripe live mode pricing
  stripeMode: process.env.STRIPE_MODE ?? "test",

  // Telegram owner alerts
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramAlertChatId: process.env.TELEGRAM_ALERT_CHAT_ID ?? "",
};
