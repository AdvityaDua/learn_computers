"use client";

import React from "react";
import type { AdminSection } from "../shell";
import {
  LayoutDashboard, BookOpen, Users, Video, ClipboardList,
  CheckSquare, HelpCircle, ChevronRight, Sun, Moon, LogOut, GraduationCap,
} from "lucide-react";

const NAV: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "Overview",    label: "Overview",           icon: <LayoutDashboard size={15} /> },
  { id: "Chapters",   label: "Curriculum Builder",  icon: <BookOpen size={15} /> },
  { id: "Students",   label: "Students",            icon: <Users size={15} /> },
  { id: "Videos",     label: "Video Lessons",       icon: <Video size={15} /> },
  { id: "Assignments",label: "Assignments",         icon: <ClipboardList size={15} /> },
  { id: "Activities", label: "Class Activities",    icon: <CheckSquare size={15} /> },
  { id: "Quizzes",    label: "Quizzes",             icon: <HelpCircle size={15} /> },
];

export function Sidebar({ active, onSelect, theme, mounted, onToggleTheme }: {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  theme: string;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: "100vh" }}>
      {/* Brand */}
      <div style={{ padding: "1rem 1rem 0.875rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "0.5rem", flexShrink: 0,
          background: "var(--admin-accent)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", margin: 0, lineHeight: 1.3 }}>Learn Computers</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", padding: "0.25rem 0.75rem", margin: "0 0 0.375rem" }}>
          Navigation
        </p>
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`admin-sidebar-item${active === id ? " active" : ""}`}
          >
            {icon}
            <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
            {active === id && <ChevronRight size={12} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0.625rem", borderTop: "1px solid var(--border)" }}>
        <button onClick={onToggleTheme} className="admin-sidebar-item" style={{ width: "100%", marginBottom: "0.25rem" }}>
          {mounted && theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Toggle Theme"}
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/login";
          }} 
          className="admin-sidebar-item" 
          style={{ width: "100%", marginBottom: "0.5rem", color: "var(--admin-danger)" }}
        >
          <LogOut size={14} />
          Logout
        </button>

      </div>
    </div>
  );
}
