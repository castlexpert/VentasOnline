import { Resend } from "resend";
import { env } from "../env.js";

function client() {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export type QuoteEmailPayload = {
  to: string;
  cc: string[];
  subject: string;
  html: string;
};

export async function sendQuoteEmail(payload: QuoteEmailPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = client();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const from = env.RESEND_FROM_EMAIL;
    const res = await resend.emails.send({
      from,
      to: payload.to,
      cc: payload.cc.length ? payload.cc : undefined,
      subject: payload.subject,
      html: payload.html
    });
    if (res.error) {
      return { ok: false, error: res.error.message || "Resend error" };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 400) };
  }
}

export function trimSendDetail(s: string, max = 500) {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
