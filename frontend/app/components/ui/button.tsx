"use client";

import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[var(--shadow-card)]",
  secondary:
    "bg-secondary-soft text-secondary hover:brightness-95",
  outline:
    "bg-surface text-foreground border border-border hover:bg-surface-soft",
  ghost: "bg-transparent text-foreground hover:bg-surface-soft",
  danger: "bg-danger text-white hover:brightness-95",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold font-[family-name:var(--font-display)] transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
      ) : null}
      {children}
    </button>
  );
}
