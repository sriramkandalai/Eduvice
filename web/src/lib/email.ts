import { envOr } from "./env";

interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body (always sent). */
  text: string;
  /** Call-to-action shown as a button in the HTML version. */
  action: { label: string; url: string };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Simple branded HTML email using the EduVice palette. */
function renderHtml({ subject, text, action }: EmailMessage): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.5">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#ffd010;font-family:Arial,sans-serif;color:#1a3d8f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px">
<tr><td>
<div style="font-size:28px;font-weight:bold;color:#2350b5;margin-bottom:16px">EduVice</div>
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(subject)}</h1>
${paragraphs}
<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#2350b5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">${escapeHtml(action.label)}</a></p>
<p style="font-size:12px;color:#1a3d8f;margin:0">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${escapeHtml(action.url)}</span></p>
</td></tr></table></td></tr></table></body></html>`;
}

/**
 * Send an email through Resend (https://resend.com). Without AUTH_RESEND_KEY in development (or
 * with EMAIL_CONSOLE=1), the email is printed to the server console instead, so sign-in links can
 * be tested locally.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key || process.env.EMAIL_CONSOLE === "1") {
    // Production must really send email, unless console output is explicitly requested (local testing).
    if (process.env.NODE_ENV === "production" && process.env.EMAIL_CONSOLE !== "1") {
      throw new Error("AUTH_RESEND_KEY is not set");
    }
    console.log(
      `\n──── [dev email: set AUTH_RESEND_KEY to really send] ────\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n\n${message.action.label}: ${message.action.url}\n────────────────────────────────────────────────────────\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: envOr("EMAIL_FROM", "EduVice <onboarding@resend.dev>"),
      to: message.to,
      subject: message.subject,
      text: `${message.text}\n\n${message.action.label}: ${message.action.url}`,
      html: renderHtml(message),
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}
