import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Award,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Megaphone,
  Layers,
  ScrollText,
  Activity,
  IdCard,
  Clock,
  Server,
  UserCog,
  TrendingUp,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { supabase } from "@/lib/supabase";

interface Metrics {
  totalProfiles: number;
  approvedMembers: number;
  pendingApplications: number;
  rejectedApplications: number;
  activeCards: number;
  totalVolunteers: number;
  pendingVolunteers: number;
  openIssues: number;
  totalCrimes: number;
  totalExports: number;
  totalStatements: number;
  publicDocuments: number;
  openTasks: number;
}

interface AuditRow {
  id: string;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

interface Staff {
  verifiers: number;
  admins: number;
  superAdmins: number;
}

interface Trends {
  days: string[];
  applications: number[];
  volunteers: number[];
  profiles: number[];
}

interface HealthItem {
  ok: boolean;
  label: string;
  critical: boolean;
}

interface PendingPreviewRow {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
}

interface Payload {
  generatedAt: string;
  role: string;
  metrics: Metrics;
  staff: Staff;
  trends: Trends;
  pendingPreview: PendingPreviewRow[];
  health: Record<string, HealthItem>;
  dbLatencyMs: number;
  audit: AuditRow[] | null;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Pure-SVG sparkline for a 14-day intake series.
function Sparkline({ series, color, height = 64 }: { series: number[]; color: string; height?: number }) {
  const width = 320;
  const max = Math.max(1, ...series);
  const step = series.length > 1 ? width / (series.length - 1) : width;
  const points = series.map((v, i) => `${(i * step).toFixed(1)},${(height - 6 - (v / max) * (height - 14)).toFixed(1)}`);
  const line = points.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block" }}>
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((v, i) =>
        i === series.length - 1 ? <circle key={i} cx={i * step} cy={height - 6 - (v / max) * (height - 14)} r="3.5" fill={color} /> : null
      )}
    </svg>
  );
}

export function ControlCentre() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError("Session expired. Please log in again.");
        return;
      }
      const res = await fetch("/api/v1/admin/control-centre", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setPayload(await res.json());
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Control Centre load failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const m = payload?.metrics;
  const audit = payload?.audit ?? null;

  const queues = [
    { label: "Membership Scrutiny", pending: m?.pendingApplications ?? 0, href: "/admin/verifications", color: "var(--saffron)" },
    { label: "Volunteer Approvals", pending: m?.pendingVolunteers ?? 0, href: "/admin/operations", color: "var(--green)" },
    { label: "Open Civic Issues", pending: m?.openIssues ?? 0, href: "/admin/civic", color: "var(--blue)" },
  ];
  const maxQueue = Math.max(1, ...queues.map((q) => q.pending));

  const statCards = [
    { label: "Registered Profiles", value: m?.totalProfiles ?? 0, icon: Users, color: "var(--blue)" },
    { label: "Approved Members", value: m?.approvedMembers ?? 0, icon: Award, color: "var(--green)" },
    { label: "Active Cards", value: m?.activeCards ?? 0, icon: IdCard, color: "var(--ink)" },
    { label: "Approved Volunteers", value: m?.totalVolunteers ?? 0, icon: Megaphone, color: "var(--green)" },
    { label: "Verified Crimes", value: m?.totalCrimes ?? 0, icon: ShieldCheck, color: "var(--saffron)" },
    { label: "Public Charters", value: m?.publicDocuments ?? 0, icon: ScrollText, color: "var(--blue)" },
    { label: "Financial Statements", value: m?.totalStatements ?? 0, icon: Receipt, color: "var(--saffron)" },
    { label: "Submission Exports", value: m?.totalExports ?? 0, icon: Layers, color: "var(--ink)" },
    { label: "Open Field Tasks", value: m?.openTasks ?? 0, icon: Megaphone, color: "var(--blue)" },
  ];

  const modules = [
    { href: "/admin/members", title: "Membership Control", desc: "Intake scrutiny, member registry, card issuance & status history.", color: "var(--saffron)", icon: Users },
    { href: "/admin/progress", title: "Formation Progress", desc: "Founding member counters, document completeness & ECI readiness meter.", color: "var(--green)", icon: TrendingUp },
    { href: "/admin/proposers", title: "Proposer Register", desc: "Section 29A proposer records, notarized affidavits & EPIC verification.", color: "var(--blue)", icon: Award },
    { href: "/admin/eci-filing", title: "ECI Filing Dossier", desc: "Compile & submit the Section 29A registration bundle to Nirvachan Sadan.", color: "var(--green)", icon: Layers },
    { href: "/admin/civic", title: "Civic & Governance", desc: "Crime citations, citizen issue resolution & policy deliberations.", color: "var(--blue)", icon: ShieldCheck },
    { href: "/admin/compliance", title: "Compliance & Vault", desc: "ECI dossier exports, statutory charters & formation roadmap.", color: "var(--green)", icon: ScrollText },
    { href: "/admin/finance", title: "Finance & Transparency", desc: "Audited statements, donation configuration & donor provenance.", color: "var(--saffron)", icon: Receipt },
    { href: "/admin/operations", title: "Operations & Fieldwork", desc: "Volunteer pipeline, field task allocation & announcements.", color: "var(--green)", icon: Megaphone },
    { href: "/admin/settings", title: "System, Roles & Audit", desc: "Staff role management, audit trail & organization settings.", color: "var(--blue)", icon: UserCog },
  ];

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Command Bar */}
      <div
        className="card"
        style={{
          background: "var(--paper-card)",
          padding: "22px 26px",
          borderRadius: "4px",
          border: "1px solid var(--line-strong)",
          boxShadow: "var(--shadow)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "21px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              Control Centre
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                background: "rgba(232, 87, 26, 0.08)",
                border: "1px solid rgba(232, 87, 26, 0.25)",
                color: "var(--saffron)",
                padding: "2px 7px",
                borderRadius: "2px",
                letterSpacing: "0.04em",
              }}
            >
              {BRAND.status.phaseLabel}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
              LIVE
            </span>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0 }}>
            {BRAND.fullName} · Unified command centre for formation oversight, scrutiny and statutory compliance. Auto-refreshes every 30s.
            {payload ? ` Signed in as ${payload.role}.` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {lastRefresh && (
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} /> {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            className="button"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 16px", borderRadius: "3px", fontSize: "13px" }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(200, 30, 30, 0.06)", border: "1px solid rgba(200, 30, 30, 0.3)", padding: "14px 18px", borderRadius: "4px", color: "#c81e1e", fontSize: "13px" }}>
          <strong>Load failed:</strong> {error}
        </div>
      )}

      {/* Action Queues */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
        {queues.map((q) => (
          <a
            key={q.href}
            href={q.href}
            className="card"
            style={{
              background: "var(--paper-card)",
              padding: "18px 20px",
              borderRadius: "4px",
              border: q.pending > 0 ? `1px solid ${q.color}` : "1px solid var(--line-strong)",
              boxShadow: "var(--shadow)",
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {q.label}
              </span>
              {q.pending > 0 && <AlertTriangle size={15} style={{ color: q.color }} />}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: q.pending > 0 ? q.color : "var(--ink)" }}>
              {loading ? "…" : q.pending}
            </div>
            <div style={{ height: "4px", background: "var(--line)", borderRadius: "2px", marginTop: "10px", overflow: "hidden" }}>
              <div style={{ width: `${loading ? 0 : (q.pending / maxQueue) * 100}%`, height: "100%", background: q.color, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "6px" }}>
              {q.pending > 0 ? "Action required, open queue" : "Queue clear"}
            </div>
          </a>
        ))}
      </div>

      {/* Platform Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ background: "var(--paper-card)", padding: "16px 18px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {s.label}
              </span>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              {loading ? "…" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Trends + Intelligence (two-column) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "14px", alignItems: "start" }}>
        {/* Left column: intake trends + pending preview */}
        <div style={{ display: "grid", gap: "14px" }}>
          <div className="card" style={{ background: "var(--paper-card)", padding: "22px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 4px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={17} style={{ color: "var(--blue)" }} /> Intake Trends: Last 14 Days
            </h3>
            <div style={{ display: "grid", gap: "16px", marginTop: "14px" }}>
              {[
                { label: "Membership Applications", series: payload?.trends.applications, color: "var(--saffron)" },
                { label: "Volunteer Applications", series: payload?.trends.volunteers, color: "var(--green)" },
                { label: "New Profiles", series: payload?.trends.profiles, color: "var(--blue)" },
              ].map((t) => {
                const total = t.series?.reduce((a, b) => a + b, 0) ?? 0;
                return (
                  <div key={t.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 800, fontFamily: "var(--font-mono)", color: t.color }}>
                        {loading ? "…" : total}
                      </span>
                    </div>
                    <Sparkline series={t.series ?? [0, 0]} color={t.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending applications preview */}
          <div className="card" style={{ background: "var(--paper-card)", padding: "22px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={17} style={{ color: "var(--saffron)" }} /> Longest-Waiting Applications
              </h3>
              <a href="/admin/verifications" style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--saffron)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                Scrutiny queue <ArrowRight size={13} />
              </a>
            </div>
            {!payload?.pendingPreview || payload.pendingPreview.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>No applications waiting for scrutiny.</p>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {payload.pendingPreview.map((row) => (
                  <a
                    key={row.id}
                    href={`/admin/verifications?id=${encodeURIComponent(row.id)}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                      borderRadius: "3px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.full_name || "Unnamed applicant"}
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginTop: "2px" }}>
                        {row.status} · waiting {timeAgo(row.created_at)}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--saffron)", flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: health, staff, audit */}
        <div style={{ display: "grid", gap: "14px" }}>
          {/* System Health */}
          <div className="card" style={{ background: "var(--paper-card)", padding: "22px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 14px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Server size={17} style={{ color: "var(--green)" }} /> System Health
              {payload && (
                <span style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginLeft: "auto" }}>
                  DB {payload.dbLatencyMs}ms
                </span>
              )}
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {Object.entries(payload?.health ?? {}).map(([key, h]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--ink)", fontWeight: 600 }}>
                    {h.label}
                    {h.critical && <span style={{ fontSize: "9.5px", fontFamily: "var(--font-mono)", color: "var(--saffron)", marginLeft: "6px" }}>CRITICAL</span>}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "10.5px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: h.ok ? "var(--green)" : h.critical ? "#c81e1e" : "var(--muted)",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: h.ok ? "var(--green)" : h.critical ? "#c81e1e" : "var(--muted)" }} />
                    {h.ok ? "CONFIGURED" : h.critical ? "MISSING" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff composition */}
          <div className="card" style={{ background: "var(--paper-card)", padding: "22px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 14px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCog size={17} style={{ color: "var(--blue)" }} /> Staff Composition
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
              {[
                { label: "VERIFIER", value: payload?.staff.verifiers, color: "var(--green)" },
                { label: "ADMIN", value: payload?.staff.admins, color: "var(--saffron)" },
                { label: "SUPER ADMIN", value: payload?.staff.superAdmins, color: "var(--blue)" },
              ].map((s) => (
                <div key={s.label} style={{ padding: "12px 8px", border: "1px solid var(--line)", borderRadius: "3px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: s.color }}>
                    {loading ? "…" : (s.value ?? 0)}
                  </div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginTop: "4px", letterSpacing: "0.04em" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail (ADMIN/SUPER_ADMIN only) */}
          <div className="card" style={{ background: "var(--paper-card)", padding: "22px", borderRadius: "4px", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={17} style={{ color: "var(--saffron)" }} /> Privileged Activity
              </h3>
              <a href="/admin/audit" style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--saffron)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                Full trail <ArrowRight size={13} />
              </a>
            </div>
            {audit === null ? (
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Audit trail is visible to ADMIN and SUPER_ADMIN roles only.</p>
            ) : audit.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>No privileged activity recorded yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "6px" }}>
                {audit.slice(0, 8).map((row) => (
                  <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "7px 10px", border: "1px solid var(--line)", borderRadius: "3px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.action}
                      </div>
                      <div style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginTop: "2px" }}>
                        {row.entity_type ?? "-"} · {row.actor_role ?? "-"}
                      </div>
                    </div>
                    <span style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {timeAgo(row.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
        {modules.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="card"
            style={{
              background: "var(--paper-card)",
              padding: "22px",
              borderRadius: "4px",
              border: "1px solid var(--line-strong)",
              boxShadow: "var(--shadow)",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "3px",
                  background: "rgba(232, 87, 26, 0.08)",
                  border: "1px solid rgba(232, 87, 26, 0.25)",
                  color: mod.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <mod.icon size={22} />
              </div>
              <h4 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
                {mod.title}
              </h4>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{mod.desc}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: mod.color, marginTop: "16px" }}>
              Open module <ArrowRight size={14} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
