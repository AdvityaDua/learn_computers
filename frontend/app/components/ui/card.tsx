import React from "react";

export function Card({
  className = "",
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] ${
        interactive
          ? "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    />
  );
}
