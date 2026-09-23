import twilio from "twilio";
import { env } from "./env.js";

function getClient() {
  const sid = (env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (env.TWILIO_AUTH_TOKEN || "").trim();
  if (!sid || !token) {
    const err = new Error("Twilio is not configured");
    // @ts-expect-error attach code
    err.code = "NO_TWILIO";
    throw err;
  }
  return twilio(sid, token);
}

function chunkText(text: string, max = 1500) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + max));
    i += max;
  }
  return chunks;
}

export async function notifyAdvisorWhatsApp(input: { body: string }) {
  const from = (env.TWILIO_WHATSAPP_FROM || "").trim();
  const to = (env.TWILIO_WHATSAPP_TO || "").trim();
  if (!from || !to) {
    const err = new Error("WhatsApp numbers not configured (TWILIO_WHATSAPP_FROM / TWILIO_WHATSAPP_TO)");
    // @ts-expect-error attach code
    err.code = "NO_WHATSAPP_NUMBERS";
    throw err;
  }

  const client = getClient();
  const parts = chunkText(input.body, 1500);

  for (const p of parts) {
    // eslint-disable-next-line no-await-in-loop
    await client.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body: p
    });
  }
}

