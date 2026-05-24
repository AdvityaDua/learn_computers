"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { COLORS } from "../lib/constants";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, color = COLORS.accent }: StatCardProps) {
  return (
    <div className="t-stat-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "0.25rem",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--foreground)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
