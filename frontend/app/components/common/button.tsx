"use client";

import React from "react";
import Link from "next/link";
import { buttonClasses, joinClasses } from "./button-classes";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: keyof typeof buttonClasses.variant;
  size?: keyof typeof buttonClasses.size;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const combinedClasses = joinClasses(
    buttonClasses.base,
    buttonClasses.variant[variant],
    buttonClasses.size[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClasses}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
