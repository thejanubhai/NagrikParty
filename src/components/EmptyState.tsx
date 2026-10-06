import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

/** Friendly bilingual empty state. Never show a blank list. */
export function EmptyState({ icon = "📭", title, message, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-msg">{message}</p>
      {actionLabel && actionHref && (
        <a className="button button-primary" href={actionHref} style={{ minHeight: 48 }}>
          {actionLabel}
        </a>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" className="button button-primary" onClick={onAction} style={{ minHeight: 48 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
