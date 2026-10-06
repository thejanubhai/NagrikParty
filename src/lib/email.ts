// Nagrik Party: Brevo (nagrik.party domain) transactional email helper.
// No SDK: direct Brevo SMTP API v3 `sendMail` via fetch. Runs on Cloudflare Workers.
// Sender domain must be verified in Brevo + DKIM/SPF records present in Cloudflare DNS.
// Secrets on the Worker: BREVO_API_KEY (secret/plain var), BREVO_FROM_EMAIL/NAME (vars).
// Rate guard: keep each call to one recipient so Brevo free-tier (300/day) stays predictable.
// Audit the send in DB (email_events table) + notification log so admin can trace receipts.

interface BrevoSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tag?: string;
  headers?: Record<string, string>;
}

interface BrevoKeyResult {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

// Cloudflare Workers env access: Astro v6 removed `Astro.locals.runtime.env`.
// Secrets/bindings are resolved via the `cloudflare:workers` env module
// (see src/lib/worker-env.ts), never from client-supplied headers.
export interface EmailCarrier {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export function buildEmailCarrier(localsEnv: Record<string, unknown>): EmailCarrier {
  const apiKey = String(
    localsEnv.BREVO_API_KEY ||
      (import.meta.env.BREVO_API_KEY as string | undefined) ||
      ""
  ).trim();
  const fromEmail = String(
    localsEnv.BREVO_FROM_EMAIL ||
      (import.meta.env.BREVO_FROM_EMAIL as string | undefined) ||
      "no-reply@nagrik.party"
  ).trim();
  const fromName = String(
    localsEnv.BREVO_FROM_NAME ||
      (import.meta.env.BREVO_FROM_NAME as string | undefined) ||
      "Nagrik Party"
  ).trim();
  return { apiKey, fromEmail, fromName };
}

// Official logo for emails AND discovery (manifest/meta consumers).
// SVG renders in inboxes that allow it; the PNG fallback (1024px) works
// in Gmail/Outlook clients that block SVG.
export const EMAIL_LOGO_SVG = "https://nagrik.party/nagrikpartylogo.svg";
export const EMAIL_LOGO_PNG = "https://nagrik.party/brand/logo.png";

function brandShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f1e8;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e3dccb;border-top:4px solid #1d5635;">
<tr><td style="padding:24px 32px 4px;" align="center">
<img src="${EMAIL_LOGO_PNG}" width="120" alt="Nagrik Party" style="display:block;width:120px;height:auto;border:0;" />
<div style="font-size:11px;letter-spacing:0.12em;color:#8a7f63;font-family:monospace;margin-top:10px;">NAGRIK PARTY &middot; FORMATION PHASE</div>
<h1 style="margin:8px 0 4px;font-size:22px;color:#14161a;">${title}</h1>
</td></tr>
<tr><td style="padding:8px 32px 8px;color:#3d3a33;font-size:14.5px;line-height:1.6;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 32px 28px;color:#8a7f63;font-size:11.5px;line-height:1.5;border-top:1px solid #eee7d3;">
100% digital receipts &middot; Zero cash &middot; Statements published every 6 months.<br/>
Nagrik Party (Formation Phase) &middot; Section 29A RPA 1951 registration in progress.<br/>
<a href="https://nagrik.party/transparency" style="color:#b3541e;">Transparency Ledger</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export async function brevoSend(carrier: EmailCarrier, opts: BrevoSendOptions): Promise<{ messageId: string }> {
  if (!carrier.apiKey) throw new Error("BREVO_API_KEY not configured on Worker");

  const html = opts.html.includes("<html") ? opts.html : brandShell(opts.subject, opts.html);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": carrier.apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: carrier.fromEmail, name: carrier.fromName },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: html,
      textContent: opts.text,
      replyTo: opts.replyTo ? { email: opts.replyTo } : undefined,
      tags: opts.tag ? [opts.tag] : ["nagrik-party"],
      headers: opts.headers,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { messageId: data.messageId || "unknown" };
}

export { brandShell };