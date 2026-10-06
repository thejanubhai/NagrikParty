import type { APIRoute } from "astro";
import { requireRole } from "@/lib/auth";
import { createApiSupabase } from "@/lib/supabase";

export const prerender = false;

const TREND_DAYS = 14;

function buildTrendBuckets(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function countByDay(rows: Array<{ created_at: string }> | null | undefined, days: string[]): number[] {
  const counts = days.map(() => 0);
  if (!rows) return counts;
  for (const row of rows) {
    const idx = days.indexOf(row.created_at.slice(0, 10));
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

// Aggregated Control Centre payload: live platform metrics, actionable
// queues, 14-day intake trends, queue previews, staff composition,
// integration health and the recent audit trail: one JWT-protected call.
export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireRole(request, ["VERIFIER", "ADMIN", "SUPER_ADMIN"]);
  if ("response" in authResult) return authResult.response;
  const { ctx } = authResult;

  try {
    const scopedSupabase = createApiSupabase(ctx.token);
    if (!scopedSupabase) {
      return new Response(JSON.stringify({ error: "Database unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const days = buildTrendBuckets();
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - TREND_DAYS);
    const sinceIso = since.toISOString();

    const t0 = Date.now();

    const [
      { count: totalProfiles },
      { count: approvedMembers },
      { count: pendingApplications },
      { count: rejectedApplications },
      { count: totalVolunteers },
      { count: pendingVolunteers },
      { count: openIssues },
      { count: totalCrimes },
      { count: totalExports },
      { count: totalStatements },
      { count: activeCards },
      { count: publicDocuments },
      { count: openTasks },
      { count: verifierCount },
      { count: adminCount },
      { count: superAdminCount },
      { data: trendAppRows },
      { data: trendVolRows },
      { data: trendProfileRows },
      { data: pendingPreview },
    ] = await Promise.all([
      scopedSupabase.from("profiles").select("*", { count: "exact", head: true }),
      scopedSupabase.from("members").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
      scopedSupabase.from("membership_applications").select("*", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
      scopedSupabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "REJECTED"),
      scopedSupabase.from("volunteer_applications").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
      scopedSupabase.from("volunteer_applications").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      scopedSupabase.from("issues").select("*", { count: "exact", head: true }).neq("status", "resolved"),
      scopedSupabase.from("crimes").select("*", { count: "exact", head: true }),
      scopedSupabase.from("submission_exports").select("*", { count: "exact", head: true }),
      scopedSupabase.from("financial_statements").select("*", { count: "exact", head: true }),
      scopedSupabase.from("membership_cards").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      scopedSupabase.from("public_documents").select("*", { count: "exact", head: true }),
      scopedSupabase.from("volunteer_tasks").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
      scopedSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "VERIFIER"),
      scopedSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "ADMIN"),
      scopedSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "SUPER_ADMIN"),
      scopedSupabase.from("membership_applications").select("created_at").gte("created_at", sinceIso),
      scopedSupabase.from("volunteer_applications").select("created_at").gte("created_at", sinceIso),
      scopedSupabase.from("profiles").select("created_at").gte("created_at", sinceIso),
      scopedSupabase
        .from("membership_applications")
        .select("id, full_name, status, created_at")
        .in("status", ["SUBMITTED", "UNDER_REVIEW"])
        .order("created_at", { ascending: true })
        .limit(5),
    ]);

    const dbLatencyMs = Date.now() - t0;

    // Audit trail is readable only by ADMIN/SUPER_ADMIN (RLS).
    let audit: Array<Record<string, unknown>> | null = null;
    if (ctx.profile.role === "ADMIN" || ctx.profile.role === "SUPER_ADMIN") {
      const { data } = await scopedSupabase
        .from("audit_logs")
        .select("id, actor_role, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      audit = data ?? [];
    }

    const env = import.meta.env;
    const health = {
      supabase: { ok: Boolean(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_PUBLISHABLE_KEY), label: "Supabase Database", critical: true },
      gemini: { ok: Boolean(env.GEMINI_API_KEY), label: "Gemini Vision (Document AI)", critical: true },
      email: { ok: Boolean(env.BREVO_API_KEY), label: "Brevo Transactional Email", critical: false },
      razorpay: { ok: Boolean(env.PUBLIC_RAZORPAY_KEY), label: "Razorpay Donations", critical: false },
      sentry: { ok: Boolean(env.PUBLIC_SENTRY_DSN), label: "Sentry Monitoring", critical: false },
    };

    return new Response(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        role: ctx.profile.role,
        metrics: {
          totalProfiles: totalProfiles || 0,
          approvedMembers: approvedMembers || 0,
          pendingApplications: pendingApplications || 0,
          rejectedApplications: rejectedApplications || 0,
          activeCards: activeCards || 0,
          totalVolunteers: totalVolunteers || 0,
          pendingVolunteers: pendingVolunteers || 0,
          openIssues: openIssues || 0,
          totalCrimes: totalCrimes || 0,
          totalExports: totalExports || 0,
          totalStatements: totalStatements || 0,
          publicDocuments: publicDocuments || 0,
          openTasks: openTasks || 0,
        },
        staff: {
          verifiers: verifierCount || 0,
          admins: adminCount || 0,
          superAdmins: superAdminCount || 0,
        },
        trends: {
          days,
          applications: countByDay(trendAppRows, days),
          volunteers: countByDay(trendVolRows, days),
          profiles: countByDay(trendProfileRows, days),
        },
        pendingPreview: (pendingPreview ?? []) as Array<{ id: string; full_name: string; status: string; created_at: string }>,
        health,
        dbLatencyMs,
        audit,
      }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("control-centre error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
