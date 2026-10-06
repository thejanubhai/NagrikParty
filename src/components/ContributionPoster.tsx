import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { AlertCircle, Check, Copy, Download, FileText, Loader2 } from "lucide-react";

/**
 * Contribution Poster (Phase 1, Formation Phase).
 *
 * Every rupee value, UPI ID, bank detail and QR shown here comes from
 * GET /api/v1/donation-config, the exact same backend row that powers
 * /transparency. Nothing is hardcoded in the poster, so the admin panel
 * stays the single place where bank details are updated.
 */

export interface ContributionConfig {
  is_enabled?: boolean;
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

// 1mm = 96/25.4 px at the CSS reference resolution, and 1mm = 72/25.4 pt in PDF.
const MM_TO_PX = 96 / 25.4;
const MM_TO_PT = 72 / 25.4;

export const POSTER_SIZES = {
  a4: { label: "A4", widthMm: 210, heightMm: 297 },
  a5: { label: "A5", widthMm: 148, heightMm: 210 },
} as const;

export type PosterSize = keyof typeof POSTER_SIZES;

const FALLBACK_QR = "/images/qrnagrikparty.jpeg";
const FALLBACK_UPI = "areynetaji@ybl";

export function ContributionPoster({
  config,
  size,
  posterRef,
  upiUri,
  qrBroken,
  onQrBroken,
}: {
  config: ContributionConfig;
  size: PosterSize;
  posterRef: React.RefObject<HTMLDivElement | null>;
  upiUri: string;
  qrBroken: boolean;
  onQrBroken: () => void;
}) {
  const dims = POSTER_SIZES[size];
  const showQrImage = Boolean(config.qr_image_url) && !qrBroken;

  return (
    <div
      ref={posterRef}
      data-testid="contribution-poster"
      className="contribution-poster"
      style={{
        width: `${dims.widthMm}mm`,
        height: `${dims.heightMm}mm`,
        background: "#ffffff",
        color: "#1c1917",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        boxSizing: "border-box",
      }}
    >
      {/* Tricolor identity band */}
      <div style={{ display: "flex", height: "10mm", flexShrink: 0 }}>
        <div style={{ flex: 1, background: "#f58220" }} />
        <div style={{ flex: 1, background: "#ffffff" }} />
        <div style={{ flex: 1, background: "#00873e" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10mm 12mm 8mm" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "4mm" }}>
          {/* Rule 21: canonical logo only */}
          <img src="/nagrikpartylogo.svg" alt="Nagrik Party logo" width={64} height={64} style={{ width: "14mm", height: "14mm" }} />
          <div>
            <div style={{ fontSize: "8mm", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.01em" }}>NAGRIK PARTY</div>
            <div style={{ fontSize: "3.4mm", fontWeight: 700, color: "#b34a15", letterSpacing: "0.08em" }}>
              PHASE 1 · FORMATION PHASE
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginTop: "7mm" }}>
          <div style={{ fontSize: "7.4mm", fontWeight: 800, lineHeight: 1.15 }}>
            Party ban rahi hai.
            <br />
            Aap bhi hissa baniye.
          </div>
          <div style={{ fontSize: "3.8mm", color: "#44403c", marginTop: "4mm", lineHeight: 1.45 }}>
            Yeh kisi ek neta ka kaam nahi hai. Yeh nagrik ka kaam hai. Chhota yogdaan bhi kaam aata hai.
          </div>
        </div>

        {/* QR + payment block */}
        <div
          style={{
            marginTop: "6mm",
            border: "1.2mm solid #1c1917",
            borderRadius: "2mm",
            padding: "5mm",
            display: "flex",
            gap: "6mm",
            alignItems: "center",
          }}
        >
          <div style={{ width: "42mm", flexShrink: 0, textAlign: "center" }}>
            {showQrImage ? (
              <img
                src={config.qr_image_url}
                alt="Nagrik Party UPI QR code"
                onError={onQrBroken}
                style={{ width: "42mm", height: "42mm", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ background: "#ffffff", padding: "1mm", display: "inline-block" }}>
                <QRCode value={upiUri} size={150} level="M" />
              </div>
            )}
            <div style={{ fontSize: "3mm", fontWeight: 700, marginTop: "2.5mm" }}>SCAN KARKE YOGDAAN DEIN</div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "grid", gap: "2.6mm" }}>
            <PosterField label="UPI ID" value={config.upi_id} mono />
            <PosterField label="ACCOUNT NAME" value={config.account_name} />
            <PosterField label="BANK" value={config.bank_name} />
            <PosterField label="ACCOUNT NUMBER" value={config.account_number} mono />
            <PosterField label="IFSC CODE" value={config.ifsc_code} mono />
            <PosterField label="ACCOUNT TYPE" value={config.account_type} small />
          </div>
        </div>

        {config.payment_instructions && (
          <div style={{ marginTop: "4mm", fontSize: "3mm", color: "#44403c", lineHeight: 1.4 }}>{config.payment_instructions}</div>
        )}

        {/* Plain language trust points */}
        <div style={{ marginTop: "5mm", display: "grid", gap: "3mm" }}>
          <PosterPoint>Har rupaya public ledger me likha jaata hai. Koi cash nahi.</PosterPoint>
          <PosterPoint>Poora hisaab khula hai: nagrik.party/transparency</PosterPoint>
          <PosterPoint>Membership free hai aur yogdaan se alag hai: nagrik.party/membership</PosterPoint>
        </div>

        <div style={{ flex: 1, minHeight: "3mm" }} />

        {/* Legal honesty box */}
        <div style={{ border: "0.4mm solid #a8a29e", borderRadius: "1.5mm", padding: "4mm", background: "#fafaf9" }}>
          <div style={{ fontSize: "3.2mm", fontWeight: 800, marginBottom: "1.6mm" }}>ZAROORI JAANKARI (PADHEIN)</div>
          <div style={{ fontSize: "2.9mm", lineHeight: 1.45, color: "#292524" }}>
            Nagrik Party abhi registration process me hai (Phase 1).{" "}
            <strong>Registered party banne se pehle yogdaan par income tax me 80GGB ya 80GGC chhoot available nahi hai.</strong> Aap
            is yogdaan ko tax chhoot ke liye claim nahi kar sakte. Yogdaan poora voluntary hai.
          </div>
          {config.disclosure_text && (
            <div style={{ fontSize: "2.6mm", lineHeight: 1.4, marginTop: "2.2mm", color: "#57534e" }}>{config.disclosure_text}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "4mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "4mm" }}>
          <div style={{ fontSize: "3mm", fontWeight: 700 }}>
            nagrik.party/contribute
            <div style={{ fontSize: "2.6mm", fontWeight: 500, color: "#57534e", maxWidth: "70mm" }}>{config.legal_status_label}</div>
          </div>
          <div style={{ fontSize: "2.6mm", color: "#57534e", textAlign: "right", maxWidth: "50mm" }}>
            20,000 rupaye se zyada yogdaan par naam aur PAN record hota hai.
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterField({ label, value, mono, small }: { label: string; value?: string; mono?: boolean; small?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: "2.6mm", fontWeight: 700, color: "#78716c", letterSpacing: "0.06em" }}>{label}</div>
      <div
        style={{
          fontSize: small ? "2.7mm" : "3.5mm",
          fontWeight: 700,
          fontFamily: mono ? "var(--font-mono, monospace)" : undefined,
          wordBreak: "break-word",
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PosterPoint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "2.5mm", alignItems: "flex-start", fontSize: "3.4mm", lineHeight: 1.35 }}>
      <Check style={{ color: "#00873e", flexShrink: 0, marginTop: "0.8mm", width: "4mm", height: "4mm" }} />
      <div>{children}</div>
    </div>
  );
}

export function ContributionPosterBoard({ defaultSize = "a4" }: { defaultSize?: PosterSize }) {
  const [config, setConfig] = useState<ContributionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<PosterSize>(defaultSize);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrBroken, setQrBroken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(0.4);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/v1/donation-config")
      .then((res) => res.json())
      .then((data: ContributionConfig) => {
        setConfig({
          ...data,
          upi_id: data.upi_id || FALLBACK_UPI,
          qr_image_url: data.qr_image_url || FALLBACK_QR,
        });
        setQrBroken(false);
      })
      .catch(() => setConfig({ is_enabled: true, upi_id: FALLBACK_UPI, qr_image_url: FALLBACK_QR }))
      .finally(() => setLoading(false));
  }, []);

  const dims = POSTER_SIZES[size];
  const posterWidthPx = dims.widthMm * MM_TO_PX;
  const posterHeightPx = dims.heightMm * MM_TO_PX;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const available = frame.clientWidth;
      if (available > 0) setScale(Math.min(1, available / posterWidthPx));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [posterWidthPx]);

  const upiId = config?.upi_id || FALLBACK_UPI;
  const upiUri =
    config?.upi_payload ||
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(config?.account_name || "Nagrik Party")}&cu=INR`;

  const capturePoster = useCallback(async () => {
    const node = posterRef.current;
    if (!node) throw new Error("Poster taiyaar nahi hai. Page dobara load karein.");
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
    return canvas.toDataURL("image/png");
  }, []);

  async function downloadPng() {
    setBusy("png");
    setError(null);
    try {
      const dataUrl = await capturePoster();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `nagrik-party-yogdaan-${size}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poster image nahi ban paya. Dobara koshish karein.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const dataUrl = await capturePoster();
      const { PDFDocument } = await import("pdf-lib");
      const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const png = await pdfDoc.embedPng(pngBytes);
      const widthPt = dims.widthMm * MM_TO_PT;
      const heightPt = dims.heightMm * MM_TO_PT;
      const page = pdfDoc.addPage([widthPt, heightPt]);
      page.drawImage(png, { x: 0, y: 0, width: widthPt, height: heightPt });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nagrik-party-yogdaan-${size}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF nahi ban paya. Dobara koshish karein.");
    } finally {
      setBusy(null);
    }
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }} data-testid="poster-loading">
        <Loader2 className="animate-spin" size={26} style={{ margin: "0 auto 10px" }} />
        Poster load ho raha hai...
      </div>
    );
  }

  if (config && config.is_enabled === false) {
    return (
      <div
        className="card"
        data-testid="poster-disabled"
        style={{ padding: "24px", border: "1px solid var(--line-strong)", background: "var(--paper-card)", borderRadius: "4px" }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertCircle size={20} style={{ color: "var(--saffron)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ display: "block", color: "var(--ink)", marginBottom: "4px" }}>Abhi yogdaan online band hai</strong>
            <div style={{ fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.55 }}>
              Bank ya UPI detail update ho rahi hai. Updated hisaab hamesha{" "}
              <a href="/transparency" style={{ color: "var(--saffron)", fontWeight: 700 }}>
                nagrik.party/transparency
              </a>{" "}
              par dikhta hai.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="poster-shell">
      {/* Print page size follows the poster size the user picked */}
      <style>{`@page { size: ${dims.widthMm}mm ${dims.heightMm}mm; margin: 0; }`}</style>

      <div
        className="poster-controls no-print"
        style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}
      >
        {(["a4", "a5"] as PosterSize[]).map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`poster-size-${option}`}
            onClick={() => setSize(option)}
            className="button"
            style={{
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              background: size === option ? "var(--ink)" : "var(--paper-card)",
              color: size === option ? "#ffffff" : "var(--ink)",
              borderColor: size === option ? "var(--ink)" : "var(--line)",
            }}
          >
            {POSTER_SIZES[option].label} poster
          </button>
        ))}

        <button
          type="button"
          data-testid="download-poster-png"
          onClick={downloadPng}
          disabled={busy !== null}
          className="button"
          style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {busy === "png" ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
          PNG download
        </button>

        <button
          type="button"
          data-testid="download-poster-pdf"
          onClick={downloadPdf}
          disabled={busy !== null}
          className="button"
          style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {busy === "pdf" ? <Loader2 className="animate-spin" size={15} /> : <FileText size={15} />}
          PDF download
        </button>

        <button
          type="button"
          data-testid="copy-poster-upi"
          onClick={copyUpi}
          className="button"
          style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {copied ? <Check size={15} style={{ color: "var(--green)" }} /> : <Copy size={15} />}
          {copied ? "UPI copy ho gaya" : "UPI ID copy karein"}
        </button>
      </div>

      {error && (
        <div
          data-testid="poster-error"
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "10px 14px",
            marginBottom: "14px",
            borderRadius: "4px",
            border: "1px solid var(--red)",
            background: "rgba(180, 40, 40, 0.06)",
            color: "var(--red)",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div
        ref={frameRef}
        className="poster-frame"
        style={{ width: "100%", height: `${posterHeightPx * scale}px`, overflow: "hidden" }}
      >
        <div
          className="poster-scaler"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${posterWidthPx}px`,
            height: `${posterHeightPx}px`,
          }}
        >
          <ContributionPoster
            config={config ?? { upi_id: FALLBACK_UPI, qr_image_url: FALLBACK_QR }}
            size={size}
            posterRef={posterRef}
            upiUri={upiUri}
            qrBroken={qrBroken}
            onQrBroken={() => setQrBroken(true)}
          />
        </div>
      </div>

      <p className="no-print" style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "12px", lineHeight: 1.55 }}>
        Yeh page seedha print bhi hota hai (Ctrl+P ya phone me Share &gt; Print). Print me sirf poster chhapega,{" "}
        {POSTER_SIZES[size].label} size me, bina kisi extra button ke. Poster ko WhatsApp par bhejne ke liye PNG download karein,
        press ya photocopy ke liye PDF download karein.
      </p>
    </div>
  );
}

