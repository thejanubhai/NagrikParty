import type { APIRoute } from "astro";

export const prerender = false;

// Sentry Internal Integration webhook receiver.
// Sentry requires a Webhook URL even if we only use the integration for
// source-map uploads. This endpoint acknowledges events and logs them to
// Sentry-side workflows (future: forward critical alerts to email/Slack).
export const POST: APIRoute = async ({ request }) => {
  const resource = request.headers.get("sentry-hook-resource") || "unknown";
  let action = "unknown";
  try {
    const body = await request.json();
    action = body?.action || "unknown";
  } catch {
    // empty/invalid body, still ack
  }
  return new Response(
    JSON.stringify({ ok: true, resource, action }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, service: "sentry-webhook" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};