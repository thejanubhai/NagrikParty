import React, { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

interface SourceReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sourceUrl: string;
  crimeType?: string;
  incidentDate?: string;
  domain: string;
}

export function SourceReaderModal({ isOpen, onClose, title, sourceUrl, crimeType, incidentDate, domain }: SourceReaderModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dateStr = incidentDate
    ? new Date(incidentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Source: ${title}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(10, 10, 12, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(960px, 100%)",
          height: "min(86vh, 780px)",
          background: "var(--paper-card)",
          border: "1px solid var(--line-strong)",
          borderRadius: "10px",
          boxShadow: "var(--shadow-elevated)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header with title + top-right close */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--line)",
            background: "var(--paper-subtle)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              {crimeType && (
                <span className="crime-feed-chip" style={{ fontSize: "10px" }}>
                  {crimeType}
                </span>
              )}
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                {domain}
                {dateStr ? ` · ${dateStr}` : ""}
              </span>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title || "Verified news source"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close source reader"
            title="Close (Esc)"
            style={{
              flexShrink: 0,
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "1px solid var(--line-strong)",
              background: "var(--paper-card)",
              color: "var(--ink)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* In-app browser, user never leaves nagrik.party */}
        <iframe
          src={sourceUrl}
          title={title || "Verified news source"}
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
          style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
        />

        {/* Footer: open original in new tab as fallback */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "10px 16px",
            borderTop: "1px solid var(--line)",
            background: "var(--paper-subtle)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Source: {domain} · Agar page load na ho to original kholein
          </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="listen-btn"
            style={{ textDecoration: "none", minHeight: "36px", fontSize: "12.5px" }}
          >
            <ExternalLink size={14} />
            <span>Original Source</span>
          </a>
        </div>
      </div>
    </div>
  );
}