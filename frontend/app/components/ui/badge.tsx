import React from "react";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "gold" | "silver" | "bronze" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  gold: "bg-gold/15 text-gold",
  silver: "bg-silver/15 text-silver",
  bronze: "bg-bronze/15 text-bronze",
  neutral: "bg-surface-soft text-muted",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
