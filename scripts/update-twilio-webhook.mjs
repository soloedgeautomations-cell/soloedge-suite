// Read from environment variables (injected by Manus platform)
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const phoneSid = "PN911a1085d2ff9ff26c9c1a5e8305426d";
const newWebhook = "https://soloedgesui-fivshgf3.manus.space/api/voice";

if (!sid || !token) {
  console.error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env");
  process.exit(1);
}

console.log("Updating Twilio webhook for (737) 259-5692...");
console.log("New webhook URL:", newWebhook);

const params = new URLSearchParams({ VoiceUrl: newWebhook, VoiceMethod: "POST" });
const res = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers/${phoneSid}.json`,
  {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  }
);

const data = await res.json();
if (data.voice_url) {
  console.log("✅ Success! voice_url is now:", data.voice_url);
} else {
  console.error("❌ Error:", JSON.stringify(data, null, 2));
}
