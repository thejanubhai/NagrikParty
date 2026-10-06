import { AlertCircle, Loader2, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicIssue } from "@/lib/queries";
import { fetchPublicIssues } from "@/lib/queries";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";

type LoadState = "loading" | "ready" | "error" | "empty";

const statusStyle: Record<string, string> = {
  submitted: "",
  verified: "green",
  "complaint filed": "green",
  escalated: "red",
  unresolved: "red",
  "added to area manifesto": "green",
  resolved: "green",
};

export function IssuesList() {
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchPublicIssues()
      .then((data) => {
        if (cancelled) return;
        setIssues(data);
        setState(data.length === 0 ? "empty" : "ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, []);

  if (state === "loading") {
    return <SkeletonBlock rows={4} height={64} />;
  }

  if (state === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Issues load nahi ho paye"
        message="Connection ki dikkat lag rahi hai. Dobara try karein, aapka data safe hai."
        actionLabel="Dobara Try Karein"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (state === "empty") {
    return (
      <EmptyState
        icon="📮"
        title="Abhi koi issue report nahi hua"
        message="Aapke area ki pehli civic problem aap report kar sakte hain, upar diya form use karein."
      />
    );
  }

  return (
    <div className="list-panel" aria-label="Reported civic issues">
      {issues.map((issue) => (
        <div className="issue-row" key={issue.id}>
          <div className="rank-num category">
            {issue.category.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{issue.title}</strong>
            <div className="issue-meta">
              {issue.lok_sabha ? `${issue.lok_sabha} · ` : ""}{issue.vidhan_sabha} · {issue.ward} · {issue.category}
            </div>
          </div>
          <span className={`tag ${statusStyle[issue.status.toLowerCase()] ?? ""}`}>
            {issue.status}
          </span>
        </div>
      ))}
    </div>
  );
}
