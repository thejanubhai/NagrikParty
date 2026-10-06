import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Plus,
  Users,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { EciComplianceItem, EciFilingDossier, EciReadinessSnapshot, ProposerRecord } from "@/lib/types";

interface DossierPayload {
  dossier: EciFilingDossier;
  proposers: ProposerRecord[];
  checklist: EciComplianceItem[];
  symbols: Array<{ id: string; preference_order: number; symbol_name: string; status: string }>;
  gazette: Array<{ id: string; notification_number: string | null; status: string }>;
}

function statusColor(status: string): string {
  if (status === "APPROVED" || status === "VERIFIED" || status === "ALLOTTED") return "var(--green)";
  if (status === "REJECTED") return "#c81e1e";
  if (status === "DRAFT") return "var(--muted)";
  return "var(--saffron)";
}

export function EciFilingConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<EciFilingDossier[]>([]);
  const [verifiedProposers, setVerifiedProposers] = useState(0);
  const [selected, setSelected] = useState<DossierPayload | null>(null);
  const [readiness, setReadiness] = useState<EciReadinessSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDetail = useCallback(async (accessToken: string, id: string) => {
    const res = await fetch(`/api/v1/admin/eci-filing?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;
    setSelected(await res.json());
  }, []);

  const loadList = useCallback(
    async (accessToken: string) => {
      const res = await fetch("/api/v1/admin/eci-filing", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setDossiers(data.dossiers || []);
      setVerifiedProposers(data.verifiedProposers || 0);
      if (data.dossiers?.length) await loadDetail(accessToken, data.dossiers[0].id);
    },
    [loadDetail]
  );

  const refresh = useCallback(async () => {
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
      await loadList(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadList, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDossier = useCallback(async () => {
    if (!token) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/admin/eci-filing", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_DOSSIER" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create dossier");
      setNotice(`Filing dossier ${data.dossier.filing_number} created with the mandatory ECI checklist.`);
      await loadList(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dossier");
    } finally {
      setWorking(false);
    }
  }, [loadList, token]);

  const assignProposers = useCallback(async () => {
    if (!token || !selected) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/admin/eci-filing", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ASSIGN_PROPOSERS", filingId: selected.dossier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign proposers");
      setNotice(
        `Proposer register synced: ${data.created_records} new records created, ${data.total_proposers} total against this dossier.`
      );
      await loadList(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign proposers");
    } finally {
      setWorking(false);
    }
  }, [loadList, selected, token]);

  const runReadiness = useCallback(async () => {
    if (!token || !selected) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/eci-filing", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_READINESS", filingId: selected.dossier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Readiness check failed");
      setReadiness(data.readiness);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Readiness check failed");
    } finally {
      setWorking(false);
    }
  }, [selected, token]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 4px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "9px" }}>
            <Layers size={20} style={{ color: "var(--green)" }} />
            Section 29A Filing Dossier
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0 }}>
            Compile the statutory registration bundle for submission to the Election Commission of India. Verified proposers available:{" "}
            <strong style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>{verifiedProposers}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={refresh} className="button" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 16px", borderRadius: "3px", fontSize: "13px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" onClick={createDossier} className="button primary" disabled={working || !token} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 18px", borderRadius: "3px", fontSize: "13px", fontWeight: 700 }}>
            {working ? <Loader2 className="spin" size={14} /> : <Plus size={14} />} New Filing Dossier
          </button>
        </div>
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


      {!loading && dossiers.length === 0 && (
        <div
          className="card"
          style={{
            padding: "44px 24px",
            textAlign: "center",
            background: "var(--paper-card)",
            borderRadius: "4px",
            border: "1px dashed var(--line-strong)",
          }}
        >
          <FileText size={34} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", margin: "0 0 6px", color: "var(--ink)" }}>
            No filing dossier yet
          </h3>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 auto", maxWidth: "440px", lineHeight: 1.55 }}>
            Create a dossier to open the mandatory ECI compliance checklist, then sync your approved founding members into
            the proposer register.
          </p>
        </div>
      )}


      {selected && (
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            padding: "22px 24px",
            borderRadius: "4px",
            border: "1px solid var(--line-strong)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Filing Reference
              </div>
              <div style={{ fontSize: "19px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--ink)" }}>
                {selected.dossier.filing_number}
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: statusColor(selected.dossier.status),
                border: "1px solid",
                borderColor: statusColor(selected.dossier.status),
                padding: "4px 10px",
                borderRadius: "2px",
              }}
            >
              {selected.dossier.status}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", fontSize: "13px" }}>
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                Total Proposers
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                {selected.dossier.total_proposers}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                Verified
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--green)" }}>
                {selected.dossier.verified_proposers}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                Total Pages
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                {selected.dossier.total_pages}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                Form Version
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                {selected.dossier.form_version}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap" }}>
            <button type="button" onClick={assignProposers} className="button" disabled={working} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 16px", borderRadius: "3px", fontSize: "13px", fontWeight: 700 }}>
              <Users size={14} /> Sync Approved Members
            </button>
            <button type="button" onClick={runReadiness} className="button" disabled={working} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "40px", padding: "8px 16px", borderRadius: "3px", fontSize: "13px" }}>
              <CheckCircle2 size={14} /> Run Readiness Check
            </button>
          </div>
        </div>
      )}


      {readiness && (
        <div
          className="card"
          style={{
            background: readiness.eci_ready ? "rgba(4, 106, 56, 0.05)" : "var(--paper-card)",
            padding: "22px 24px",
            borderRadius: "4px",
            border: readiness.eci_ready ? "1px solid var(--green)" : "1px solid var(--line-strong)",
            boxShadow: "var(--shadow)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontFamily: "var(--font-serif)", fontWeight: 700, margin: "0 0 12px", color: "var(--ink)" }}>
            Statutory Readiness: {readiness.eci_ready ? "ECI READY" : "PENDING"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", fontSize: "12.5px" }}>
            {[
              { label: "Proposers", value: readiness.total_proposers },
              { label: "Verified", value: readiness.verified_proposers },
              { label: "Declarations", value: readiness.declarations_complete },
              { label: "Consents", value: readiness.consents_complete },
              { label: "Signatures", value: readiness.signatures_complete },
              { label: "Documents", value: readiness.documents_complete },
              { label: "EPIC Numbers", value: readiness.epic_complete },
            ].map((pr) => (
              <div
                key={pr.label}
                style={{
                  padding: "8px 10px",
                  border: "1px solid var(--line)",
                  borderRadius: "3px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "var(--muted)" }}>{pr.label}</span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{pr.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}