import { config } from "dotenv";
config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

console.log("TOKEN present:", !!token, token ? token.slice(0, 15) + "..." : "MISSING");
console.log("CHAT_ID present:", !!chatId, chatId || "MISSING");

if (!token || !chatId) {
  console.log("CREDENTIALS MISSING — cannot send test message");
  process.exit(1);
}

// First check the bot info
const botInfo = await fetch(`https://api.telegram.org/bot${token}/getMe`);
const botData = await botInfo.json();
console.log("Bot info:", JSON.stringify(botData));

// Send a test message
const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: "✅ SoloEdge connection test — Riley Telegram alerts are working.",
  }),
});

const data = await res.json();
console.log("Send result:", JSON.stringify(data));
