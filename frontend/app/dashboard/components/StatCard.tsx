"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon,
  subtitle,
  delay = 0,
}: StatCardProps) {
  return (
    <article
      className="panel rounded-2xl p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="theme-muted text-xs font-semibold uppercase tracking-[0.08em]">
            {label}
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-tight accent-text">
            {value}
          </h3>
          {subtitle && <p className="theme-muted mt-1 text-xs">{subtitle}</p>}
        </div>
        <div className="accent-soft-bg grid h-11 w-11 place-items-center rounded-xl flex-shrink-0">
          {icon}
        </div>
      </div>
    </article>
  );
}
