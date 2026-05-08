"use client";

import React from "react";
import type { AdminSection } from "../page";

const NAV: { id: AdminSection; icon: React.ReactNode; label: string }[] = [
  {
    id: "Overview",
    label: "Overview",
    icon: <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>,
  },
  {
    id: "Chapters",
    label: "Chapters & Lessons",
    icon: <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>,
  },
  {
    id: "Students",
    label: "Students",
    icon: <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>,
  },
  {
    id: "Uploads",
    label: "File Uploads",
    icon: <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
];

export function AdminSidebar({
  active,
  onSelect,
  theme,
  mounted,
  onToggleTheme,
}: {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  theme: string;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <div style={{
        padding: "1rem 1rem 0.875rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
      }}>
        <div className="admin-accent-bg" style={{
          width: 34, height: 34, borderRadius: "0.5rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
            Learn Computers
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.2 }}>
            Admin Console
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", padding: "0.25rem 0.75rem", marginBottom: "0.25rem" }}>
          Navigation
        </p>
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`admin-sidebar-item ${active === id ? "active" : ""}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: "0.625rem", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onToggleTheme}
          className="admin-sidebar-item"
          style={{ width: "100%" }}
        >
          {mounted && theme === "dark" ? (
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c.19 0 .37.01.56.03A7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Theme"}
        </button>

        {/* Back to Dashboard */}
        <a
          href="/dashboard"
          className="admin-sidebar-item"
          style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginTop: "0.25rem" }}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
