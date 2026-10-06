import React, { useState, useEffect } from "react";
import { X, Copy, Check, QrCode, ShieldCheck, Landmark, ExternalLink, HeartHandshake } from "lucide-react";
import QRCode from "react-qr-code";

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
  upi_payload?: string;
}

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [config, setConfig] = useState<DonationConfig | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [qrImgBroken, setQrImgBroken] = useState(false);

  useEffect(() => {
    fetch("/api/v1/donation-config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setQrImgBroken(false);
      })
      .catch(() => setConfig({ is_enabled: true, upi_id: "areynetaji@ybl", qr_image_url: "/images/qrnagrikparty.jpeg" }));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const upiId = config?.upi_id || "areynetaji@ybl";
  const qrImageUrl = config?.qr_image_url || "/images/qrnagrikparty.jpeg";
  const accountName = config?.account_name || "";
  const bankName = config?.bank_name || "";
  const accountNumber = config?.account_number || "";
  const ifscCode = config?.ifsc_code || "";
  const accountType = config?.account_type || "";
  const hasBankDetails = Boolean(accountName || bankName || accountNumber || ifscCode || accountType);
  const upiUri = config?.upi_payload || `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName || "Nagrik Party")}&cu=INR`;

  function copyText(text: string, type: "upi" | "account" | "ifsc") {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === "account") {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2000);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(18, 20, 24, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          background: "var(--paper)",
          borderRadius: "8px",
          border: "1px solid var(--line-strong)",
          maxWidth: "520px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          padding: "24px 28px",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "var(--paper-subtle)",
            border: "1px solid var(--line)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ink)",
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ paddingRight: "32px", marginBottom: "18px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(4, 106, 56, 0.08)",
              color: "var(--green)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "3px",
              fontFamily: "var(--font-mono)",
              marginBottom: "8px",
            }}
          >
            <ShieldCheck size={13} /> 100% DIGITAL · ZERO CASH
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              fontFamily: "var(--font-serif)",
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Contribute to Nagrik Party
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Help fund voter induction kits, verified crime tracking, and public filings during Phase 1, Formation Phase.
          </p>
        </div>

        {/* QR Code Presentation Box */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1.5px solid var(--saffron)",
            borderRadius: "6px",
            padding: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              padding: "14px",
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {qrImageUrl && !qrImgBroken ? (
              <img
                src={qrImageUrl}
                alt="UPI Donation QR Code"
                style={{ width: "170px", height: "170px", objectFit: "contain" }}
                onError={() => setQrImgBroken(true)}
              />
            ) : (
              <QRCode value={upiUri} size={170} level="M" />
            )}
          </div>

          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", fontFamily: "var(--font-mono)" }}>
              SCAN VIA ANY UPI APP
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--ink-faint)", marginTop: "2px" }}>
              Google Pay · PhonePe · Paytm · BHIM · Any Bank UPI
            </div>
          </div>

          {/* Quick Copy UPI ID Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--paper-subtle)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              padding: "8px 12px",
              width: "100%",
              maxWidth: "340px",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
              {upiId}
            </span>
            <button
              type="button"
              onClick={() => copyText(upiId, "upi")}
              className="button"
              style={{
                fontSize: "11.5px",
                padding: "4px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#ffffff",
                minHeight: "28px",
              }}
            >
              {copiedUpi ? <Check size={12} style={{ color: "var(--green)" }} /> : <Copy size={12} />}
              {copiedUpi ? "Copied" : "Copy UPI"}
            </button>
          </div>

          {/* Mobile Direct Pay Trigger */}
          <a
            href={upiUri}
            className="button button-primary"
            style={{
              width: "100%",
              maxWidth: "340px",
              justifyContent: "center",
              fontSize: "13.5px",
              fontWeight: 700,
              minHeight: "42px",
            }}
          >
            Open UPI App Directly &rarr;
          </a>
        </div>

        {/* Direct Bank Account Details (IMPS / NEFT), only when admin has saved verified details */}
        {hasBankDetails && (
        <div
          style={{
            background: "var(--paper-subtle)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            padding: "14px 16px",
            fontSize: "12.5px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px" }}>
            <Landmark size={14} style={{ color: "var(--saffron)" }} /> Direct Bank Transfer (IMPS / NEFT)
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            {bankName && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)" }}>Bank Name:</span>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{bankName}</span>
            </div>
            )}
            {accountName && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)" }}>A/c Name:</span>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{accountName}</span>
            </div>
            )}
            {accountNumber && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)" }}>A/c Number:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{accountNumber}</span>
                <button
                  type="button"
                  onClick={() => copyText(accountNumber, "account")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}
                  title="Copy account number"
                >
                  {copiedAccount ? <Check size={12} style={{ color: "var(--green)" }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            )}
            {ifscCode && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)" }}>IFSC Code:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{ifscCode}</span>
                <button
                  type="button"
                  onClick={() => copyText(ifscCode, "ifsc")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}
                  title="Copy IFSC"
                >
                  {copiedIfsc ? <Check size={12} style={{ color: "var(--green)" }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            )}
            {accountType && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)" }}>A/c Type:</span>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{accountType}</span>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Reassurance Footer */}
        <div style={{ fontSize: "11px", color: "var(--ink-faint)", lineHeight: "1.45", textAlign: "center" }}>
          All contributions are recorded in our public audit ledger under Phase 1, Formation Phase.
          Zero unaccounted funds exist. <a href="/transparency" style={{ color: "var(--saffron)", textDecoration: "underline" }} onClick={onClose}>View Transparency Ledger</a>
        </div>
      </div>
    </div>
  );
}
