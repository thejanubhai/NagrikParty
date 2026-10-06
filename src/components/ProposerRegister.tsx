import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  RefreshCw,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ProposerRecord } from "@/lib/types";

interface Counts {
  total: number;
  verified: number;
  notarized: number;
  submitted: number;
  draft: number;
  rejected: number;
}

function statusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    VERIFIED: { bg: "rgba(4, 106, 56, 0.1)", fg: "var(--green)" },
    NOTARIZED: { bg: "rgba(232, 87, 26, 0.1)", fg: "var(--saffron)" },
    SUBMITTED: { bg: "rgba(30, 90, 180, 0.1)", fg: "var(--blue)" },
    DRAFT: { bg: "rgba(120, 120, 130, 0.1)", fg: "var(--muted)" },
    REJECTED: { bg: "rgba(200, 30, 30, 0.1)", fg: "#c81e1e" },
  };
  const c = map[status] || map.DRAFT;
  return (
    <span style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", fontWeight: 700, background: c.bg, color: c.fg, padding: "3px 8px", borderRadius: "2px", letterSpacing: "0.04em" }}>
      {status}
    </span>
  );
}

export function ProposerRegister() {
  const [token, setToken] = useState<string | null>(null);
  const [proposers, setProposers] = useState<ProposerRecord[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, verified: 0, notarized: 0, submitted: 0, draft: 0, rejected: 0 });
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProposerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const { data } = await supabase.auth.getSession();
      const accessToken = token ?? data?.session?.access_token ?? null;
      if (!accessToken) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (!token) setToken(accessToken);
      const res = await fetch("/api/v1/admin/proposers", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const payload = await res.json();
      setProposers(payload.proposers || []);
      setCounts(payload.counts || { total: 0, verified: 0, notarized: 0, submitted: 0, draft: 0, rejected: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const act = useCallback(
    async (status: string, extra?: Record<string, unknown>) => {
      if (!token || !selected) return;
      setActing(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch("/api/v1/admin/proposers", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ proposerId: selected.id, status, ...(extra || {}) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Action failed");
        setNotice(`Proposer ${data.proposer.proposer_serial_number} moved to ${status}.`);
        setRejectReason("");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setActing(false);
      }
    },
    [load, selected, token]
  );

  const filtered = proposers.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.epic_number.toLowerCase().includes(q) ||
        p.proposer_serial_number.toLowerCase().includes(q) ||
        p.vidhan_sabha.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 4px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "9px" }}>
            <Award size={20} style={{ color: "var(--blue)" }} />
            Proposer Register: Section 29A
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0 }}>
            Every approved founding member is an ECI proposer. Move records from draft → notarized → verified before filing.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 16px", borderRadius: "3px", fontSize: "13px" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(200, 30, 30, 0.06)", border: "1px solid rgba(200, 30, 30, 0.3)", padding: "14px 18px", borderRadius: "4px", color: "#c81e1e", fontSize: "13px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {notice && (
        <div className="card" style={{ background: "rgba(4, 106, 56, 0.06)", border: "1px solid rgba(4, 106, 56, 0.3)", padding: "14px 18px", borderRadius: "4px", color: "var(--green)", fontSize: "13px", fontWeight: 600 }}>
          {notice}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        {[
          { label: "Total", value: counts.total, icon: Users, color: "var(--ink)" },
          { label: "Verified", value: counts.verified, icon: CheckCircle2, color: "var(--green)" },
          { label: "Notarized", value: counts.notarized, icon: ShieldCheck, color: "var(--saffron)" },
          { label: "Submitted", value: counts.submitted, icon: FileText, color: "var(--blue)" },
          { label: "Draft", value: counts.draft, icon: Clock, color: "var(--muted)" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "#c81e1e" },
        ].map((c) => (
          <div key={c.label} className="card" style={{ background: "var(--paper-card)", padding: "14px 16px", borderRadius: "4px", border: "1px solid var(--line-strong)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {c.label}
              </span>
              <c.icon size={14} style={{ color: c.color }} />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              {loading ? "…" : c.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px", alignItems: "start" }}>
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            padding: "20px 22px",
            borderRadius: "4px",
            border: "1px solid var(--line-strong)",
            boxShadow: "var(--shadow)",
          }}
        >
          <h3 style={{ fontSize: "15px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 14px", color: "var(--ink)" }}>
            Filter &amp; Search ({filtered.length} of {proposers.length})
          </h3>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ flex: "0 0 160px", padding: "9px 10px", borderRadius: "3px", border: "1px solid var(--line-strong)", fontSize: "13px", color: "var(--ink)" }}
            >
              {["ALL", "DRAFT", "NOTARIZED", "SUBMITTED", "VERIFIED", "REJECTED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, EPIC, serial…"
              style={{ flex: 1, padding: "9px 12px", borderRadius: "3px", border: "1px solid var(--line-strong)", fontSize: "13px", color: "var(--ink)" }}
            />
          </div>
          <div style={{ display: "grid", gap: "6px", maxHeight: "420px", overflowY: "auto" }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "3px",
                  border: selected?.id === p.id ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                  background: selected?.id === p.id ? "rgba(30, 90, 180, 0.05)" : "var(--paper-subtle)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.full_name}
                  </div>
                  <div style={{ fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--muted)", marginTop: "2px" }}>
                    {p.proposer_serial_number} · {p.vidhan_sabha}
                  </div>
                </div>
                {statusPill(p.status)}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "24px 12px" }}>
                No proposer records match this filter.
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            padding: "20px 22px",
            borderRadius: "4px",
            border: "1px solid var(--line-strong)",
            boxShadow: "var(--shadow)",
          }}
        >
          {selected ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "15px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                  {selected.full_name}
                </h3>
                {statusPill(selected.status)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", fontSize: "12.5px", marginBottom: "16px" }}>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Serial</div><div style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", fontWeight: 700 }}>{selected.proposer_serial_number}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>EPIC</div><div style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{selected.epic_number}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Vidhan Sabha</div><div style={{ color: "var(--ink)" }}>{selected.vidhan_sabha}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Ward</div><div style={{ color: "var(--ink)" }}>{selected.ward || "-"}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Part / Sl. No.</div><div style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{selected.part_number || "-"} / {selected.serial_number || "-"}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Polling Station</div><div style={{ color: "var(--ink)" }}>{selected.polling_station || "-"}</div></div>
                <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Address</div><div style={{ color: "var(--ink)" }}>{selected.address || "-"}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Contact</div><div style={{ color: "var(--ink)" }}>{selected.contact_number || "-"}</div></div>
                <div><div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>Affidavit SHA-256</div><div style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", fontSize: "11px", wordBreak: "break-all" }}>{selected.affidavit_sha256 || "Not uploaded"}</div></div>
              </div>
              {selected.rejection_reason && (
                <div style={{ background: "rgba(200, 30, 30, 0.06)", border: "1px solid rgba(200, 30, 30, 0.3)", padding: "10px 12px", borderRadius: "3px", fontSize: "12.5px", color: "#c81e1e", marginBottom: "14px" }}>
                  <strong>Rejection reason:</strong> {selected.rejection_reason}
                </div>
              )}
              <div style={{ display: "grid", gap: "8px" }}>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason (required if rejecting)…"
                  style={{ padding: "9px 12px", borderRadius: "3px", border: "1px solid var(--line-strong)", fontSize: "12.5px", color: "var(--ink)" }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" disabled={acting} onClick={() => act("NOTARIZED")} className="button" style={{ minHeight: "40px", padding: "8px 14px", fontSize: "12.5px", fontWeight: 700 }}>
                    Mark Notarized
                  </button>
                  <button type="button" disabled={acting} onClick={() => act("VERIFIED")} className="button primary" style={{ minHeight: "40px", padding: "8px 16px", fontSize: "12.5px" }}>
                    Verify &amp; File-Ready
                  </button>
                  <button
                    type="button"
                    disabled={acting || !rejectReason.trim()}
                    onClick={() => act("REJECTED", { rejectionReason: rejectReason.trim() })}
                    className="button"
                    style={{ minHeight: "40px", padding: "8px 14px", fontSize: "12.5px", color: "#c81e1e", borderColor: "rgba(200, 30, 30, 0.35)" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "13.5px", color: "var(--muted)", textAlign: "center", padding: "52px 16px" }}>
              Select a proposer record to inspect statutory evidence and advance its status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}