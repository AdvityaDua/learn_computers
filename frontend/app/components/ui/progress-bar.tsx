import React from "react";

export function ProgressBar({
  value,
  color = "var(--color-primary)",
  trackClassName = "",
  className = "",
}: {
  value: number;
  color?: string;
  trackClassName?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full border border-border bg-surface-soft ${trackClassName}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${className}`}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
