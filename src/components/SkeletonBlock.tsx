import React from "react";

interface SkeletonBlockProps {
  rows?: number;
  height?: number;
}

/** Solid-block loading placeholders, no shimmer, no gradient animation. */
export function SkeletonBlock({ rows = 3, height = 72 }: SkeletonBlockProps) {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Load ho raha hai">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-block" style={{ height }} />
      ))}
    </div>
  );
}
