import React, { useEffect, useState } from "react";
import { ShieldCheck, FileText, CheckCircle2, Hash, ArrowUpRight, ArrowDownLeft, AlertTriangle, Landmark } from "lucide-react";

interface PublishedPeriod {
  id: string;
  title: string;
  fiscal_year: string;
  period_type: string;
  start_date: string;
  end_date: string;
  opening_balance: string;
  closing_balance: string;
  total_credits: string;
  total_debits: string;
  published_at?: string;
  notes?: string;
  statements?: Array<{
    id: string;
    original_filename: string;
    file_sha256: string;
    file_size_bytes: number;
    bank_name: string;
  }>;
}

interface BankStatus {
  bank_name: string;
  account_number_masked: string;
  branch_name: string;
  statement_closing_balance: number | string;
  live_bank_balance: number | string;
  live_bank_balance_formatted: string;
  balance_type: string;
  as_of_date: string;
  disclosure_title: string;
  disclosure_explanation: string;
}

interface PublicTransaction {
  id: string;
  period_id: string;
  date: string;
  type: string;
  classification: string;
  description: string;
  reference_masked: string | null;
  amount: string;
  debit: string;
  credit: string;
  balance_after?: string | null;
}

interface TransparencyDataResponse {
  has_data: boolean;
  bank_status?: BankStatus | null;
  periods: PublishedPeriod[];
  selected_period_id: string;
  totals: {
    total_donations: string;
    total_donations_formatted: string;
    total_expenses: string;
    total_expenses_formatted: string;
    other_income: string;
    other_income_formatted: string;
    closing_balance: string;
    closing_balance_formatted: string;
    total_inflow: string;
    total_inflow_formatted: string;
    total_outflow: string;
    total_outflow_formatted: string;
    net_position: string;
    net_position_formatted: string;
    latest_balance_date: string;
    latest_period_title: string;
    verified_transactions_count: number;
  };
  transactions: PublicTransaction[];
}

interface DonationConfig {
  is_enabled: boolean;
  legal_status_label?: string;
  upi_id?: string;
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
  qr_image_url?: string;
  payment_instructions?: string;
  disclosure_text?: string;
}

export function TransparencyLedger() {
  const [data, setData] = useState<TransparencyDataResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [donationConfig, setDonationConfig] = useState<DonationConfig | null>(null);
  const [qrImgBroken, setQrImgBroken] = useState(false);

  useEffect(() => {
    // Load donation configuration
    fetch("/api/v1/donation-config")
      .then((res) => res.json())
      .then((cfg) => {
        // Hard fallback so the live ECI-verified UPI + QR always render
        // even if the API row is stale or the fetch returns defaults.
        setDonationConfig({
          ...cfg,
          qr_image_url: cfg?.qr_image_url || "/images/qrnagrikparty.jpeg",
          upi_id: cfg?.upi_id || "areynetaji@ybl",
        });
        setQrImgBroken(false);
      })
      .catch(() =>
        setDonationConfig({
          is_enabled: false,
          upi_id: "areynetaji@ybl",
          qr_image_url: "/images/qrnagrikparty.jpeg",
        })
      );
  }, []);

  useEffect(() => {
    async function fetchTransparencyData() {
      setLoading(true);
      try {
        const url = selectedPeriod === "ALL"
          ? "/api/v1/transparency/data"
          : `/api/v1/transparency/data?period_id=${encodeURIComponent(selectedPeriod)}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load transparency data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransparencyData();
  }, [selectedPeriod]);

  if (loading && !data) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", background: "var(--paper-card)", borderRadius: "4px", border: "1px solid var(--line)" }}>
        Loading audited financial records and verification ledger...
      </div>
    );
  }

  const hasData = data && data.has_data && data.periods.length > 0;
  const periods = data?.periods || [];
  const totals = data?.totals || {
    total_donations: "0.00",
    total_donations_formatted: "₹0.00",
    total_expenses: "0.00",
    total_expenses_formatted: "₹0.00",
    other_income: "0.00",
    other_income_formatted: "₹0.00",
    closing_balance: "0.00",
    closing_balance_formatted: "₹0.00",
    total_inflow: "0.00",
    total_inflow_formatted: "₹0.00",
    total_outflow: "0.00",
    total_outflow_formatted: "₹0.00",
    net_position: "0.00",
    net_position_formatted: "₹0.00",
    latest_balance_date: "",
    latest_period_title: "",
    verified_transactions_count: 0,
  };
  const transactions = data?.transactions || [];

  return (
    <div style={{ display: "grid", gap: "28px" }}>
      
      {/* 1. TOP STATUTORY DOCTRINE BANNER */}
      <div
        className="card"
        style={{
          background: "var(--paper-card)",
          padding: "24px 28px",
          borderRadius: "4px",
          border: "1px solid var(--line-strong)",
          display: "grid",
          gap: "16px",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: "min(100%, 320px)" }}>
            <div
              className="badge-verified"
              style={{
                fontSize: "11px",
                marginBottom: "8px",
              }}
            >
              <ShieldCheck size={13} /> CASHLESS FORMATION ACCOUNTS
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px", fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
              Financial Transparency Ledger
            </h2>
            <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0, maxWidth: "700px", lineHeight: "1.6" }}>
              Political clean-up begins at the bank account. Nagrik Party operates on a strictly cashless,
              100% digital audit policy. Pre-registration formation funds and expenditures are recorded with complete source provenance and published bank statements.
            </p>
          </div>

          <div
            style={{
              padding: "16px 20px",
              background: "var(--paper-subtle)",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              textAlign: "right",
              minWidth: "220px",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              STATEMENT AUDITED CLOSING
            </div>
            <div style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              marginTop: "2px",
            }}>
              {totals.closing_balance_formatted}
            </div>
            {totals.latest_balance_date && (
              <div style={{ fontSize: "10.5px", color: "var(--ink-faint)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                Audited to {new Date(totals.latest_balance_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}

            {data?.bank_status && Number(data.bank_status.live_bank_balance) !== 0 && (
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--line)" }}>
                <div style={{ fontSize: "10.5px", color: "var(--red)", fontFamily: "var(--font-mono)", textTransform: "uppercase", fontWeight: 700 }}>
                  LIVE BANK POSITION (DEFICIT)
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                  {data.bank_status.live_bank_balance_formatted}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  Axis Bank Net Banking · {data.bank_status.as_of_date}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: "6px" }}>
              <small style={{ fontSize: "11px", color: "var(--muted)" }}>
                {hasData ? `${totals.verified_transactions_count} Verified Transactions` : "Awaiting Published Audit"}
              </small>
            </div>
          </div>
        </div>

        {/* Aggregate Summary Pillars */}
        {hasData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginTop: "8px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
            <div>
              <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                TOTAL INFLOW (CREDITS)
              </small>
              <strong style={{ fontSize: "17px", color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                {totals.total_inflow_formatted}
              </strong>
            </div>

            <div>
              <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                TOTAL OUTFLOW (DEBITS)
              </small>
              <strong style={{ fontSize: "17px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                {totals.total_outflow_formatted}
              </strong>
            </div>

            <div>
              <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                VERIFIED DONATIONS
              </small>
              <strong style={{ fontSize: "17px", color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                {totals.total_donations_formatted}
              </strong>
            </div>

            <div>
              <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                VERIFIED EXPENDITURE
              </small>
              <strong style={{ fontSize: "17px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                {totals.total_expenses_formatted}
              </strong>
            </div>

            <div>
              <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                ACTIVE REPORTING CYCLES
              </small>
              <strong style={{ fontSize: "17px", color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                {periods.length} Half-Yearly Periods
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. OPTION A: LIVE BANK ACCOUNT STATUS & UNRECOVERED CHARGES DISCLOSURE */}
      {data?.bank_status && Number(data.bank_status.live_bank_balance) !== 0 && (
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--line-strong)",
            borderLeft: "5px solid var(--red)",
            borderRadius: "4px",
            padding: "24px 28px",
            boxShadow: "var(--shadow)",
            display: "grid",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ flex: 1, minWidth: "min(100%, 320px)" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--red)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                <AlertTriangle size={13} /> STATUTORY DISCLOSURE · LIVE BANK DEFICIT NOTICE
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--ink)", margin: "0 0 6px" }}>
                {data.bank_status.disclosure_title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {data.bank_status.bank_name} Current Account ({data.bank_status.account_number_masked}) · {data.bank_status.branch_name}
              </p>
            </div>

            {/* Dual Balance Pill Comparison */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "12px 18px",
                  background: "var(--paper-subtle)",
                  borderRadius: "4px",
                  border: "1px solid var(--line)",
                  textAlign: "right",
                  minWidth: "150px",
                }}
              >
                <small style={{ fontSize: "10.5px", color: "var(--muted)", display: "block", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  AUDITED STATEMENT CLOSING
                </small>
                <strong style={{ fontSize: "18px", color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                  ₹{Number(data.bank_status.statement_closing_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
                <div style={{ fontSize: "10px", color: "var(--ink-faint)", marginTop: "2px" }}>
                  Verified settled ledger
                </div>
              </div>

              <div
                style={{
                  padding: "12px 18px",
                  background: "var(--paper-subtle)",
                  borderRadius: "4px",
                  border: "1px solid var(--line-strong)",
                  textAlign: "right",
                  minWidth: "160px",
                }}
              >
                <small style={{ fontSize: "10.5px", color: "var(--muted)", display: "block", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  LIVE NET BANKING POSITION
                </small>
                <strong style={{ fontSize: "20px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                  {data.bank_status.live_bank_balance_formatted}
                </strong>
                <div style={{ fontSize: "10px", color: "var(--red)", marginTop: "2px", fontWeight: 600 }}>
                  As of {new Date(data.bank_status.as_of_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "16px 20px",
              background: "var(--paper-subtle)",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              fontSize: "13.5px",
              color: "var(--ink)",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 12px", fontWeight: 500 }}>
              {data.bank_status.disclosure_explanation}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", paddingTop: "12px", borderTop: "1px dashed var(--line)", fontSize: "12px", color: "var(--muted)" }}>
              <div>
                <strong style={{ color: "var(--ink)", display: "block", marginBottom: "3px" }}>1. Nature of Deficit</strong>
                Institutional Monthly Average Balance (MAB) non-maintenance charges and 18% GST debited by Axis Bank during the pre-registration formation phase.
              </div>
              <div>
                <strong style={{ color: "var(--ink)", display: "block", marginBottom: "3px" }}>2. Zero Commercial Debt</strong>
                Not a personal borrowing, credit line, or commercial loan from any individual, corporation, or bank.
              </div>
              <div>
                <strong style={{ color: "var(--ink)", display: "block", marginBottom: "3px" }}>3. 100% Cashless Discipline</strong>
                Nagrik Party holds zero unaccounted cash. Every rupee received from citizen donors is digitally recorded and verified.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. OPTIONAL CONFIGURABLE DONATION BOX */}
      {donationConfig?.is_enabled && (
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            border: "1.5px solid var(--saffron)",
            borderRadius: "4px",
            padding: "24px 28px",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ flex: 1, minWidth: "min(100%, 240px)" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--saffron)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {donationConfig.legal_status_label || "Contributions currently accepted under the Formation Phase"}
              </span>
              <h3 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "4px 0 8px", color: "var(--ink)" }}>
                Support Formation Phase Operations
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.55 }}>
                {donationConfig.payment_instructions || "Scan the UPI QR code or transfer directly to the formation account. All receipts are 100% digital."}
              </p>

              <div style={{ display: "grid", gap: "8px", fontSize: "13px", background: "var(--paper-subtle)", padding: "12px 16px", borderRadius: "3px", border: "1px solid var(--line)" }}>
                {donationConfig.upi_id && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>UPI ID: </strong>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{donationConfig.upi_id}</span>
                  </div>
                )}
                {donationConfig.account_name && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>ACCOUNT NAME: </strong>
                    <span>{donationConfig.account_name}</span>
                  </div>
                )}
                {donationConfig.bank_name && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>BANK / BRANCH: </strong>
                    <span>{donationConfig.bank_name}</span>
                  </div>
                )}
                {donationConfig.account_number && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>ACCOUNT NUMBER: </strong>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{donationConfig.account_number}</span>
                  </div>
                )}
                {donationConfig.ifsc_code && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>IFSC CODE: </strong>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{donationConfig.ifsc_code}</span>
                  </div>
                )}
                {donationConfig.account_type && (
                  <div>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11px" }}>ACCOUNT TYPE: </strong>
                    <span>{donationConfig.account_type}</span>
                  </div>
                )}
              </div>

              {donationConfig.disclosure_text && (
                <div style={{ fontSize: "11px", color: "var(--ink-faint)", marginTop: "12px" }}>
                  {donationConfig.disclosure_text}
                </div>
              )}
            </div>

            {(donationConfig.qr_image_url && !qrImgBroken) || donationConfig.upi_id ? (
              <div style={{ width: "200px", textAlign: "center", flexShrink: 0 }}>
                {donationConfig.qr_image_url && !qrImgBroken ? (
                  <img
                    src={donationConfig.qr_image_url}
                    alt="UPI QR Code, scan to donate to Nagrik Party"
                    style={{ width: "100%", height: "auto", borderRadius: "3px", border: "1px solid var(--line)", background: "#fff", padding: "6px" }}
                    onError={() => setQrImgBroken(true)}
                  />
                ) : null}
                {(!donationConfig.qr_image_url || qrImgBroken) && donationConfig.upi_id ? (
                  <div style={{ width: "100%", background: "#fff", borderRadius: "3px", border: "1px solid var(--line)", padding: "10px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink)", wordBreak: "break-all" }}>
                    UPI ID: <strong>{donationConfig.upi_id}</strong>
                    <div style={{ marginTop: "6px" }}>
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(donationConfig.upi_id)}&pn=${encodeURIComponent(donationConfig.account_name || "Nagrik Party")}&cu=INR`}
                        style={{ color: "var(--saffron)", fontWeight: 700 }}
                      >
                        Open UPI App &rarr;
                      </a>
                    </div>
                  </div>
                ) : null}
                <small style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                  Instant UPI Scan · {donationConfig.upi_id}
                  <a href="/contribute" style={{ display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: 700, color: "var(--saffron)" }}>Poster download karein (A4 / A5)</a>
                </small>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 3. PERIOD SELECTOR TABS */}
      {hasData ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: 0, color: "var(--ink)" }}>
              6-Month Audited Reporting Periods
            </h3>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedPeriod("ALL")}
                className="button"
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: selectedPeriod === "ALL" ? "var(--ink)" : "var(--paper-card)",
                  color: selectedPeriod === "ALL" ? "#fff" : "var(--ink)",
                  borderColor: selectedPeriod === "ALL" ? "var(--ink)" : "var(--line)",
                }}
              >
                All Periods
              </button>
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className="button"
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: selectedPeriod === p.id ? "var(--ink)" : "var(--paper-card)",
                    color: selectedPeriod === p.id ? "#fff" : "var(--ink)",
                    borderColor: selectedPeriod === p.id ? "var(--ink)" : "var(--line)",
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Cards for reporting periods */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
            {periods
              .filter((p) => selectedPeriod === "ALL" || p.id === selectedPeriod)
              .map((p) => {
                const stmt = p.statements && p.statements.length > 0 ? p.statements[0] : null;
                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      background: "var(--paper-card)",
                      border: "1px solid var(--line)",
                      borderRadius: "4px",
                      padding: "20px 22px",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--saffron)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                        {p.title}
                      </span>
                      <span className="badge-citation" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} /> Published
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", marginBottom: "12px" }}>
                      {p.start_date} to {p.end_date} · {p.fiscal_year}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "12px 0", background: "var(--paper-subtle)", padding: "10px 12px", borderRadius: "3px" }}>
                      <div>
                        <small style={{ color: "var(--muted)", fontSize: "10px", display: "block" }}>OPENING BALANCE</small>
                        <strong style={{ fontSize: "14px", color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                          ₹{Number(p.opening_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)", fontSize: "10px", display: "block" }}>CLOSING BALANCE</small>
                        <strong style={{
                          fontSize: "14px",
                          color: Number(p.closing_balance) >= 0 ? "var(--ink)" : "var(--red)",
                          fontFamily: "var(--font-mono)",
                        }}>
                          ₹{Number(p.closing_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)", fontSize: "10px", display: "block" }}>CREDITS (INFLOW)</small>
                        <strong style={{ fontSize: "14px", color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                          ₹{Number(p.total_credits).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)", fontSize: "10px", display: "block" }}>DEBITS (OUTFLOW)</small>
                        <strong style={{ fontSize: "14px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
                          ₹{Number(p.total_debits).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {p.notes && (
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.45 }}>
                        {p.notes}
                      </p>
                    )}

                    {stmt && (
                      <div style={{ borderTop: "1px dashed var(--line)", paddingTop: "8px", marginTop: "8px" }}>
                        <div style={{ fontSize: "10.5px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-mono)" }}>
                          <Hash size={11} /> SHA-256: {stmt.file_sha256.slice(0, 16)}...
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--ink-faint)", marginTop: "2px" }}>
                          Source: {stmt.bank_name} statement ({stmt.original_filename})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* TRUTHFUL EMPTY STATE */
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            border: "1px dashed var(--line-strong)",
            borderRadius: "4px",
            padding: "44px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--paper-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--muted)" }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px", color: "var(--ink)" }}>
            Formation-Stage Financial Records Under Verification
          </h3>
          <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "560px", margin: "0 auto 16px", lineHeight: 1.6 }}>
            Nagrik Party never publishes estimated or fabricated financial statistics. Pre-registration accounts and bank statements are undergoing formal administrative verification and reconciliation before being published here.
          </p>
          <small style={{ color: "var(--ink-faint)", fontSize: "12px" }}>
            100% digital bank records · Section 29A RPA 1951 Pre-Registration Disclosure
          </small>
        </div>
      )}

      {/* 4. VERIFIED TRANSACTION LEDGER */}
      {transactions.length > 0 && (
        <div
          className="card"
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            padding: "22px 24px",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: 0, color: "var(--ink)" }}>
                Verified Public Transaction Ledger ({transactions.length})
              </h3>
              <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                Individual transaction entries derived directly from published bank statements. Complainant and donor private identifiers are redacted.
              </small>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line-strong)", color: "var(--muted)", fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                  <th style={{ padding: "10px 12px" }}>Direction</th>
                  <th style={{ padding: "10px 12px" }}>Classification</th>
                  <th style={{ padding: "10px 12px" }}>Particulars</th>
                  <th style={{ padding: "10px 12px" }}>Reference</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.type === "CONTRIBUTION" || Number(tx.credit || 0) > 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "2px",
                            background: isCredit ? "rgba(29, 86, 53, 0.1)" : "rgba(142, 38, 23, 0.1)",
                            color: isCredit ? "var(--green)" : "var(--red)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isCredit ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {isCredit ? "CR" : "DR"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600, fontSize: "12px" }}>
                        {tx.classification.replace(/_/g, " ")}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--ink-body)", fontSize: "12.5px" }}>
                        {tx.description}
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "11.5px", whiteSpace: "nowrap" }}>
                        {tx.reference_masked || "–"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: isCredit ? "var(--green)" : "var(--ink)", whiteSpace: "nowrap" }}>
                        {isCredit ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
