import type { APIRoute } from "astro";
import { requireRole, logAuditEvent } from "@/lib/auth";
import { createApiSupabase } from "@/lib/supabase";
import { brevoSend, buildEmailCarrier } from "@/lib/email";
import { resolveRuntimeEnv } from "@/lib/worker-env";

// POST /api/v1/admin/email/send: admin-gated single-recipient transactional send.
// Body: { to, subject, html, text?, tag?, purpose? }
// Every send is recorded in public.email_events for ledger-grade traceability
// and in the statutory audit log. Donor PII stays server-side only.
export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireRole(request, ["ADMIN", "SUPER_ADMIN"]);
  if ("response" in authResult) return authResult.response;
  const { ctx } = authResult;

  try {
    const body = await request.json();
    const to = String(body.to || "").trim().toLowerCase();
    const subject = String(body.subject || "").trim();
    const html = String(body.html || "");
    const text = body.text ? String(body.text) : undefined;
    const tag = body.tag ? String(body.tag).slice(0, 40) : "admin-send";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: "Invalid recipient email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!subject || !html) {
      return new Response(JSON.stringify({ error: "subject and html are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Worker runtime env (secrets live here, dashboard "Add variable" or
    // `wrangler secret put BREVO_API_KEY --name nagrikparty`).
    // Astro v6: locals.runtime.env removed → use cloudflare:workers env module.
    const runtimeEnv = await resolveRuntimeEnv();
    const carrier = buildEmailCarrier(runtimeEnv);

    const { messageId } = await brevoSend(carrier, {
      to,
      subject,
      html,
      text,
      tag,
    });

    const scopedSupabase = createApiSupabase(ctx.token);

    // Trace the send (recipient hashed: raw PII stays in Brevo, not our DB).
    if (scopedSupabase) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(to));
      const recipientHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await scopedSupabase.from("email_events").insert({
        recipient_hash: recipientHash,
        subject,
        tag,
        provider: "brevo",
        provider_message_id: messageId,
        status: "SENT",
        sent_by: ctx.user.id,
      });
    }

    await logAuditEvent(ctx.user.id, ctx.profile.role, "EMAIL_SENT", "email_events", messageId, {
      to_domain: to.split("@")[1],
      subject,
      tag,
    }, request, scopedSupabase || undefined);

    return new Response(JSON.stringify({ success: true, messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    const status = msg.includes("BREVO_API_KEY") ? 500 : 502;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};