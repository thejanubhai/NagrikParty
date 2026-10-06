import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { SkeletonBlock } from '@/components/SkeletonBlock';
import { ShareButton } from '@/components/ShareButton';
import { ListenButton } from '@/components/ListenButton';
import { EmptyState } from '@/components/EmptyState';

interface CrimeStat {
  crime_type: string;
  count: number;
}

const CRIME_HI: Record<string, string> = {
  Rape: 'बलात्कार',
  Murder: 'हत्या',
  Kidnapping: 'अपहरण',
  Robbery: 'लूट',
  Extortion: 'रंगदारी',
};

export function CrimeDashboard() {
  const [stats, setStats] = useState<CrimeStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/crimes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStats(data);
        }
      }
    } catch {
      // Network error: stats unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <SkeletonBlock rows={2} height={96} />;
  }

  // Ensure default crimes exist even if 0
  const defaultCrimes = ['Rape', 'Murder', 'Kidnapping', 'Robbery', 'Extortion'];
  const displayStats = defaultCrimes.map(type => {
    const found = stats.find(s => s.crime_type === type);
    return { crime_type: type, count: found ? found.count : 0 };
  });

  const total = displayStats.reduce((sum, s) => sum + s.count, 0);
  const summaryText = `Delhi NCR verified crime tracker. ${displayStats
    .map((s) => `${CRIME_HI[s.crime_type] || s.crime_type} ${s.count} cases`)
    .join('. ')}.`;

  if (total === 0) {
    return (
      <EmptyState
        icon="🛡️"
        title="Abhi koi verified report nahi hai"
        message="Jaise hi verified citations aayengi, yahan seedha count dikhega. Har record news source se juda hota hai."
        actionLabel="Crime Tracker Dekhein"
        actionHref="/crime"
      />
    );
  }

  return (
    <div className="crime-dashboard-card" style={{ background: "var(--paper-card)", border: "1px solid var(--line-strong)", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow)" }}>
      {/* Official printed border */}
      <div style={{ height: "3px", background: "var(--red)", width: "100%", marginBottom: "18px", borderRadius: "2px 2px 0 0" }} />

      {/* Header section */}
      <div className="crime-dashboard-header" style={{ marginBottom: "20px" }}>
        <div className="crime-dashboard-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className="flex align-center gap-2" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={24} color="var(--red)" />
            <h3 className="crime-dashboard-title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
              Verified Crime Tracker
            </h3>
          </div>
          <div className="badge-citation" style={{ border: "1px solid rgba(220, 38, 38, 0.3)", background: "rgba(220, 38, 38, 0.06)", color: "var(--red)" }}>
            <Clock size={12} />
            <span>100% Verified Citations</span>
          </div>
        </div>
        <div className="crime-feed-actions" style={{ marginTop: 12 }}>
          <ListenButton text={summaryText} label="Poora Suniye" />
          <ShareButton
            title="Nagrik Party: Delhi Verified Crime Tracker"
            text={summaryText}
            url="/crime"
            label="WhatsApp par Bhejein"
          />
        </div>
      </div>

      {/* Grid of stats */}
      <div className="crime-dashboard-grid">
        {displayStats.map((stat, idx) => {
          const isCritical = idx < 2;

          return (
            <a href={`/crimes/${stat.crime_type.toLowerCase()}`} key={stat.crime_type} className={`crime-stat-card ${isCritical ? 'critical' : ''}`}>
              <div className="crime-stat-label">
                <span className="lang-en">{stat.crime_type}</span>
                <span className="lang-hi">{CRIME_HI[stat.crime_type] || stat.crime_type}</span>
              </div>
              <div className="flex align-center gap-1">
                <span className="crime-stat-count">
                  {stat.count.toLocaleString('en-IN')}
                </span>
                {stat.count > 0 && (
                  <TrendingUp size={16} className="crime-stat-icon" />
                )}
              </div>
              <div className="crime-stat-help">Verify karein →</div>
            </a>
          );
        })}
      </div>

      {/* Footer text & Action */}
      <div className="crime-dashboard-footer" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangle size={14} color="#ff4d4d" />
          <span>100% verified Delhi NCR data. Har count official news citation se juda hai.</span>
        </div>
        <a href="/crime" style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          Poora Crime Tracker Dekhein &rarr;
        </a>
      </div>
    </div>
  );
}

