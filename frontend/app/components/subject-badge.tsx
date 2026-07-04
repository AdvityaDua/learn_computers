import React from "react";
import { SubjectIcon } from "./subject-icon";

/**
 * Subjects carry an admin-picked accent color that can be anything (crimson, cyan, amber, ...),
 * which reads as clashing next to the app's own purple/indigo identity. Icons always use the
 * app's primary theme color instead, so every subject feels like part of the same product.
 */
export function SubjectBadge({
  icon,
  size = "md",
  className = "",
}: {
  icon: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-11 w-11" : size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const iconSize = size === "sm" ? 20 : size === "lg" ? 26 : 22;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary-soft text-primary ${dims} ${className}`}
    >
      <SubjectIcon name={icon} size={iconSize} />
    </div>
  );
}
