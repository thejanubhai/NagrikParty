import React, { useState } from "react";
import { ExternalLink, BookOpen } from "lucide-react";
import { ListenButton } from "@/components/ListenButton";
import { ShareButton } from "@/components/ShareButton";
import { SourceReaderModal } from "@/components/SourceReaderModal";

export interface CrimeFeedItem {
  id: string;
  title: string;
  source_url: string;
  incident_date: string;
  crime_type: string;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "news source";
  }
}

function dateStrOf(incidentDate: string): string {
  try {
    return new Date(incidentDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return incidentDate;
  }
}

export function CrimeFeed({ items }: { items: CrimeFeedItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((c) => c.id === openId) || null;

  return (
    <>
      <div className="crime-feed">
        {items.map((c) => {
          // Fallback: kabhi title khaali ho to domain + date dikhao taaki card blank na lage
          const displayTitle =
            c.title && c.title.trim().length > 0
              ? c.title
              : `Verified ${c.crime_type} incident, ${domainOf(c.source_url)} · ${dateStrOf(c.incident_date)}`;
          const domain = domainOf(c.source_url);
          const dateStr = dateStrOf(c.incident_date);

          return (
            <div className="crime-feed-card" key={c.id}>
              <div className="crime-feed-top">
                <span className="crime-feed-chip">{c.crime_type}</span>
                <span className="crime-feed-date">
                  {domain} · {dateStr}
                </span>
              </div>

              <h4 className="crime-feed-title">
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  title="In-app source reader me kholein"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    font: "inherit",
                    color: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {displayTitle}
                </button>
              </h4>

              <div className="crime-feed-actions">
                <ListenButton text={`${c.crime_type}. ${displayTitle}. Date: ${dateStr}`} label="Suniye" />
                <ShareButton
                  title={`Delhi Crime Report: ${c.crime_type}`}
                  text={displayTitle}
                  url={c.source_url}
                  label="Share"
                />
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className="listen-btn"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <BookOpen size={14} />
                  <span>Padhein (yahi par)</span>
                </button>
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="listen-btn"
                  style={{ textDecoration: "none" }}
                >
                  <ExternalLink size={14} />
                  <span>Source</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {openItem && (
        <SourceReaderModal
          isOpen={true}
          onClose={() => setOpenId(null)}
          title={openItem.title && openItem.title.trim() ? openItem.title : `Verified ${openItem.crime_type} incident`}
          sourceUrl={openItem.source_url}
          crimeType={openItem.crime_type}
          incidentDate={openItem.incident_date}
          domain={domainOf(openItem.source_url)}
        />
      )}
    </>
  );
}