import React from "react";
import { ChevronLeft } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        {onBack ? (
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-primary"
          >
            <ChevronLeft size={16} /> Back
          </button>
        ) : null}
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
