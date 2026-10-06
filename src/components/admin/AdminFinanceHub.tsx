import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  QrCode,
  Receipt,
  Save,
  RefreshCw,
  Landmark,
  AlertTriangle,
  Check,
  Copy,
  Upload,
  ExternalLink,
} from "lucide-react";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabase";
import { AdminStatementManager } from "@/components/admin/AdminStatementManager";

async function getSessionToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

interface BankAccountStatusRecord {
  id: string;
  bank_name: string;
  account_number_masked: string;
  branch_name: string;
  statement_closing_balance: number;
  live_bank_balance: number;
  balance_type: string;
  as_of_date: string;
  disclosure_title: string;
  disclosure_explanation: string;
  is_public_visible: boolean;
}

interface DonationConfig {
  id: string;
  is_enabled: boolean;
  legal_status_label: string;
  upi_id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  qr_image_url: string;
  payment_instructions: string;
  disclosure_text: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
}

export function AdminFinanceHub() {
  const [activeTab, setActiveTab] = useState<"statements" | "bank-status" | "config" | "transactions">("statements");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "statements" || tabParam === "periods") {
      setActiveTab("statements");
    } else if (tabParam === "bank-status" || tabParam === "config" || tabParam === "transactions") {
      setActiveTab(tabParam as "bank-status" | "config" | "transactions");
    }
  }, []);

  function switchTab(tab: "statements" | "bank-status" | "config" | "transactions") {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }

  // --- CONFIG TAB STATE ---
  const [config, setConfig] = useState<DonationConfig>({
    id: "default",
    is_enabled: true,
    legal_status_label: "Contributions currently accepted under the Formation Phase",
    upi_id: "areynetaji@ybl",
    account_name: "SHEIKH ARSALAN ULLAH CHISHTI",
    bank_name: "Axis Bank",
    account_number: "924020035537387",
    ifsc_code: "UTIB0002912",
    account_type: "Current Account: Election & Donation Account (MLA 2025, ECI affidavit verified; interim party account till registration)",
    qr_image_url: "/images/qrnagrikparty.jpeg",
    payment_instructions: "Scan the UPI QR code or transfer directly to the formation account. Retain reference UTR for audit receipting.",
    disclosure_text: "Nagrik Party operates on a strictly digital, zero-cash basis. Every receipt is auditable under RPA 1951.",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState("");

  async function fetchConfig() {
    setConfigLoading(true);
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/donation-config", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // error
    } finally {
      setConfigLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/donation-config", {
        method: "POST",
        headers,
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setConfigMsg("Donation & UPI configuration saved successfully.");
        setTimeout(() => setConfigMsg(""), 3500);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save configuration.");
      }
    } catch {
      alert("Network error updating configuration.");
    } finally {
      setSavingConfig(false);
    }
  }

  const [uploadingQr, setUploadingQr] = useState(false);
  const [copiedTestUpi, setCopiedTestUpi] = useState(false);

  async function handleQrImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploadingQr(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `donation-qr-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("public-assets")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: publicUrlData } = supabase.storage
        .from("public-assets")
        .getPublicUrl(uploadData.path);
      setConfig((prev) => ({ ...prev, qr_image_url: publicUrlData.publicUrl }));
    } catch (err: unknown) {
      alert("Failed to upload image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingQr(false);
    }
  }

  // --- BANK STATUS TAB STATE ---
  const [bankStatus, setBankStatus] = useState<BankAccountStatusRecord>({
    id: "primary",
    bank_name: "Axis Bank",
    account_number_masked: "XXXXXX7387",
    branch_name: "Sarojini Nagar Branch, New Delhi",
    statement_closing_balance: 0.00,
    live_bank_balance: -22202.53,
    balance_type: "ACCUMULATED_BANK_MAB_CHARGES",
    as_of_date: new Date().toISOString().split("T")[0],
    disclosure_title: "Live Bank Account Status & Unrecovered Bank Charges",
    disclosure_explanation: "The current account reflects a negative balance of -₹22,202.53 in net banking due to institutional Monthly Average Balance (MAB) non-maintenance penalties and statutory 18% GST accumulated during the pre-registration formation phase. This is an institutional bank ledger liability, not personal or third-party debt. Zero unaccounted funds exist.",
    is_public_visible: true,
  });
  const [bankStatusLoading, setBankStatusLoading] = useState(false);
  const [savingBankStatus, setSavingBankStatus] = useState(false);
  const [bankStatusMsg, setBankStatusMsg] = useState("");

  async function fetchBankStatus() {
    setBankStatusLoading(true);
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/finance/bank-status", { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.status) setBankStatus(json.status);
      }
    } catch {
      // ignore
    } finally {
      setBankStatusLoading(false);
    }
  }

  async function handleSaveBankStatus(e: React.FormEvent) {
    e.preventDefault();
    setSavingBankStatus(true);
    setBankStatusMsg("");
    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/finance/bank-status", {
        method: "POST",
        headers,
        body: JSON.stringify(bankStatus),
      });
      if (res.ok) {
        setBankStatusMsg("Bank status and statutory deficit disclosure saved successfully.");
        setTimeout(() => setBankStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save bank status.");
      }
    } catch {
      alert("Network error updating bank status.");
    } finally {
      setSavingBankStatus(false);
    }
  }

  // --- TRANSACTIONS TAB STATE ---
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  async function fetchTransactions() {
    setTxLoading(true);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch {
      // error
    } finally {
      setTxLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "bank-status") fetchBankStatus();
    if (activeTab === "config") fetchConfig();
    if (activeTab === "transactions") fetchTransactions();
  }, [activeTab]);

  const totalRaised = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Sub-tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--line-strong)",
          paddingBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => switchTab("statements")}
          className="button"
          style={{
            background: activeTab === "statements" ? "var(--ink)" : "var(--paper-card)",
            color: activeTab === "statements" ? "#fff" : "var(--ink)",
            borderColor: activeTab === "statements" ? "var(--ink)" : "var(--line)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <FileSpreadsheet size={16} />
          6-Month Statements & Upload Engine
        </button>

        <button
          type="button"
          onClick={() => switchTab("bank-status")}
          className="button"
          style={{
            background: activeTab === "bank-status" ? "var(--ink)" : "var(--paper-card)",
            color: activeTab === "bank-status" ? "#fff" : "var(--ink)",
            borderColor: activeTab === "bank-status" ? "var(--ink)" : "var(--line)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <Landmark size={16} />
          Live Bank Position & Deficit Notice
        </button>

        <button
          type="button"
          onClick={() => switchTab("config")}
          className="button"
          style={{
            background: activeTab === "config" ? "var(--ink)" : "var(--paper-card)",
            color: activeTab === "config" ? "#fff" : "var(--ink)",
            borderColor: activeTab === "config" ? "var(--ink)" : "var(--line)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <QrCode size={16} />
          Donation & UPI Acceptance Config
        </button>

        <button
          type="button"
          onClick={() => switchTab("transactions")}
          className="button"
          style={{
            background: activeTab === "transactions" ? "var(--ink)" : "var(--paper-card)",
            color: activeTab === "transactions" ? "#fff" : "var(--ink)",
            borderColor: activeTab === "transactions" ? "var(--ink)" : "var(--line)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <Receipt size={16} />
          Contribution Records ({transactions.length})
        </button>
      </div>

      {/* --- TAB 0: 6-MONTH STATEMENT ENGINE --- */}
      {activeTab === "statements" && (
        <div>
          <AdminStatementManager />
        </div>
      )}

      {/* --- TAB: LIVE BANK STATUS & DEFICIT NOTICE --- */}
      {activeTab === "bank-status" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {bankStatusMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(4, 106, 56, 0.08)",
                border: "1px solid rgba(4, 106, 56, 0.25)",
                color: "var(--green)",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {bankStatusMsg}
            </div>
          )}

          <div
            className="card"
            style={{
              background: "var(--paper-card)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              padding: "24px 28px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--saffron)",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                <Landmark size={14} /> LIVE BANK POSITION & STATUTORY DEFICIT DESK
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 6px", color: "var(--ink)" }}>
                Core Banking Snapshot & Unrecovered Bank Charges
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
                When bank statement CSVs end at ₹0.00 settled ledger but net banking reflects unrecovered Monthly Average Balance (MAB) charges or penalties, manage the official public disclosure and live numbers here.
              </p>
            </div>

            {bankStatusLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                Loading bank status records...
              </div>
            ) : (
              <form onSubmit={handleSaveBankStatus} style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                      BANK NAME
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={bankStatus.bank_name}
                      onChange={(e) => setBankStatus({ ...bankStatus, bank_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                      MASKED ACCOUNT NUMBER
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={bankStatus.account_number_masked}
                      onChange={(e) => setBankStatus({ ...bankStatus, account_number_masked: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                      BRANCH DETAILS
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={bankStatus.branch_name}
                      onChange={(e) => setBankStatus({ ...bankStatus, branch_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                      AUDITED STATEMENT CLOSING (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={bankStatus.statement_closing_balance}
                      onChange={(e) => setBankStatus({ ...bankStatus, statement_closing_balance: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--red)", marginBottom: "4px" }}>
                      LIVE NET BANKING BALANCE (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      style={{ color: "var(--red)", fontWeight: 700, fontFamily: "var(--font-mono)" }}
                      value={bankStatus.live_bank_balance}
                      onChange={(e) => setBankStatus({ ...bankStatus, live_bank_balance: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                      AS OF DATE
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={bankStatus.as_of_date}
                      onChange={(e) => setBankStatus({ ...bankStatus, as_of_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                    DISCLOSURE HEADING
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={bankStatus.disclosure_title}
                    onChange={(e) => setBankStatus({ ...bankStatus, disclosure_title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--ink)", marginBottom: "4px" }}>
                    STATUTORY EXPLANATION FOR PUBLIC TRANSPARENCY
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={bankStatus.disclosure_explanation}
                    onChange={(e) => setBankStatus({ ...bankStatus, disclosure_explanation: e.target.value })}
                    required
                    style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="is_public_visible"
                    checked={bankStatus.is_public_visible}
                    onChange={(e) => setBankStatus({ ...bankStatus, is_public_visible: e.target.checked })}
                  />
                  <label htmlFor="is_public_visible" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                    Publish live bank deficit & statutory notice on the public /transparency page
                  </label>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="submit"
                    className="button"
                    disabled={savingBankStatus}
                    style={{
                      background: "var(--ink)",
                      color: "#fff",
                      borderColor: "var(--ink)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <Save size={15} />
                    {savingBankStatus ? "Saving..." : "Save Bank Disclosure"}
                  </button>

                  <button
                    type="button"
                    onClick={fetchBankStatus}
                    className="button"
                    disabled={bankStatusLoading}
                    style={{
                      background: "var(--paper-card)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <RefreshCw size={15} />
                    Reload
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: CONFIG --- */}
      {activeTab === "config" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {configMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(4, 106, 56, 0.08)",
                border: "1px solid rgba(4, 106, 56, 0.25)",
                color: "var(--green)",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {configMsg}
            </div>
          )}

          <div
            className="card"
            style={{
              background: "var(--paper-card)",
              padding: "24px 28px",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-serif)" }}>
                  Voluntary Contribution & UPI Gateway Settings
                </h3>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                  Configure digital contribution collection in compliance with Phase 1 zero-cash transparency rules.
                </p>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "2px",
                  background: config.is_enabled ? "rgba(4, 106, 56, 0.1)" : "rgba(232, 87, 26, 0.1)",
                  color: config.is_enabled ? "var(--green)" : "var(--saffron)",
                  border: "1px solid var(--line)",
                }}
              >
                {config.is_enabled ? "CONTRIBUTIONS ACTIVE" : "CONTRIBUTIONS DISABLED"}
              </span>
            </div>

            {configLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading configuration...</div>
            ) : (
              <form onSubmit={handleSaveConfig} style={{ display: "grid", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "var(--paper)", borderRadius: "3px", border: "1px solid var(--line)" }}>
                  <input
                    type="checkbox"
                    id="enable_donations"
                    checked={config.is_enabled}
                    onChange={(e) => setConfig((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="enable_donations" style={{ cursor: "pointer", fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>
                    Enable Public Contribution Acceptance (Show UPI QR and Contribution Widget across public website for logged-in and logged-out users)
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
                  {/* Left Column: Form Fields */}
                  <div style={{ display: "grid", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          UPI ID (VPA) <span style={{ color: "var(--saffron)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. areynetaji@ybl"
                          value={config.upi_id || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, upi_id: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SHEIKH ARSALAN ULLAH CHISHTI"
                          value={config.account_name || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, account_name: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Axis Bank"
                          value={config.bank_name || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, bank_name: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 924020035537387"
                          value={config.account_number || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, account_number: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px", fontFamily: "var(--font-mono)" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. UTIB0002912"
                          value={config.ifsc_code || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, ifsc_code: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px", fontFamily: "var(--font-mono)" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                          Account Type
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Political Current Account"
                          value={config.account_type || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, account_type: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                        />
                      </div>
                    </div>

                    {/* QR Code Upload / URL option */}
                    <div style={{ padding: "12px 14px", background: "var(--paper-subtle)", borderRadius: "4px", border: "1px solid var(--line)" }}>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                        Custom QR Code Image (Optional)
                      </label>
                      <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "0 0 10px", lineHeight: "1.4" }}>
                        Live file: <code style={{ fontFamily: "var(--font-mono)" }}>/images/qrnagrikparty.jpeg</code> (app folder me bundled).
                        Isko khaali chhodne par bhi wahi bundled QR dikhega. Bank ka naya QR aaye to yahan upload/URL update kar dein.
                      </p>
                      
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <label
                          className="button"
                          style={{
                            cursor: uploadingQr ? "wait" : "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "var(--paper)",
                          }}
                        >
                          <Upload size={14} /> {uploadingQr ? "Uploading..." : "Upload QR Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrImageUpload}
                            disabled={uploadingQr}
                            style={{ display: "none" }}
                          />
                        </label>
                        {config.qr_image_url && (
                          <button
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, qr_image_url: "" }))}
                            style={{ fontSize: "11px", color: "var(--red)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Remove custom image (use auto QR)
                          </button>
                        )}
                      </div>

                      {config.qr_image_url && (
                        <div style={{ marginTop: "8px" }}>
                          <input
                            type="text"
                            value={config.qr_image_url}
                            onChange={(e) => setConfig((prev) => ({ ...prev, qr_image_url: e.target.value }))}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                        Legal Status Label
                      </label>
                      <input
                        type="text"
                        value={config.legal_status_label || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, legal_status_label: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", minHeight: "40px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                        Payment Instructions for Citizens
                      </label>
                      <textarea
                        rows={2}
                        value={config.payment_instructions || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, payment_instructions: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                        Statutory Transparency Disclosure
                      </label>
                      <textarea
                        rows={2}
                        value={config.disclosure_text || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, disclosure_text: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "3px", border: "1px solid var(--line)", background: "var(--paper)", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Interactive QR & Widget Preview */}
                  <div
                    style={{
                      background: "var(--paper-subtle)",
                      border: "1.5px solid var(--saffron)",
                      borderRadius: "6px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: "12px",
                      position: "sticky",
                      top: "20px",
                    }}
                  >
                    <div style={{ fontSize: "10.5px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      LIVE PUBLIC WIDGET PREVIEW
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                        boxShadow: "var(--shadow)",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minWidth: "170px",
                        minHeight: "170px",
                      }}
                    >
                      {config.qr_image_url ? (
                        <img
                          src={config.qr_image_url}
                          alt="Custom UPI QR"
                          style={{ width: "160px", height: "160px", objectFit: "contain" }}
                        />
                      ) : config.upi_id ? (
                        <QRCode
                          value={`upi://pay?pa=${encodeURIComponent(config.upi_id)}&pn=${encodeURIComponent(config.account_name || "Nagrik Party")}&cu=INR`}
                          size={160}
                          level="M"
                        />
                      ) : (
                        <div style={{ color: "var(--muted)", fontSize: "12px", width: "160px" }}>
                          Enter a UPI ID to preview QR code
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                        {config.upi_id || "No UPI ID set"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                        {config.account_name || "Nagrik Party"}
                      </div>
                      {config.bank_name && (
                        <div style={{ fontSize: "11px", color: "var(--ink-faint)", marginTop: "1px" }}>
                          {config.bank_name} {config.ifsc_code ? `· ${config.ifsc_code}` : ""}
                        </div>
                      )}
                    </div>

                    {config.upi_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const uri = `upi://pay?pa=${encodeURIComponent(config.upi_id)}&pn=${encodeURIComponent(config.account_name || "Nagrik Party")}&cu=INR`;
                          navigator.clipboard.writeText(uri);
                          setCopiedTestUpi(true);
                          setTimeout(() => setCopiedTestUpi(false), 2000);
                        }}
                        className="button"
                        style={{
                          fontSize: "11.5px",
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#fff",
                        }}
                      >
                        {copiedTestUpi ? <Check size={13} style={{ color: "var(--green)" }} /> : <Copy size={13} />}
                        {copiedTestUpi ? "UPI URI Copied!" : "Copy Test UPI URI"}
                      </button>
                    )}

                    <div
                      style={{
                        fontSize: "11px",
                        color: config.is_enabled ? "var(--green)" : "var(--muted)",
                        background: config.is_enabled ? "rgba(4, 106, 56, 0.08)" : "var(--paper)",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: 600,
                        marginTop: "4px",
                      }}
                    >
                      {config.is_enabled ? "● Currently visible to all public visitors" : "○ Currently hidden from public website"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="button primary"
                    style={{ padding: "10px 24px", minHeight: "44px", borderRadius: "3px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700 }}
                  >
                    <Save size={16} /> {savingConfig ? "Saving Settings..." : "Save Donation Configuration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: TRANSACTIONS --- */}
      {activeTab === "transactions" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Summary Banner */}
          <div
            className="card"
            style={{
              background: "var(--paper-card)",
              padding: "20px 24px",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                Total Recorded Contributions
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--green)" }}>
                ₹{totalRaised.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                From {transactions.length} digitally verified receipts
              </div>
            </div>

            <button
              type="button"
              onClick={fetchTransactions}
              className="button"
              style={{ fontSize: "12px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={13} /> Refresh Transactions
            </button>
          </div>

          {/* Transactions Table */}
          <div
            className="card"
            style={{
              background: "var(--paper-card)",
              padding: "20px 24px",
              borderRadius: "4px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 14px", fontFamily: "var(--font-serif)" }}>
              Recorded Contribution Ledger ({transactions.length})
            </h4>

            {txLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>Loading records...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>No transactions recorded yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line-strong)", background: "var(--paper)" }}>
                      <th style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase" }}>Transaction ID / UTR</th>
                      <th style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase" }}>Amount</th>
                      <th style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase" }}>Donor Ref</th>
                      <th style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {tx.transaction_id}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--green)" }}>
                          ₹{Number(tx.amount).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: "12px" }}>
                          {tx.user_id ? `${tx.user_id.slice(0, 8)}...` : "Anonymous"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                          {new Date(tx.created_at).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
