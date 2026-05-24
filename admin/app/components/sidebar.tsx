"use client";

import React, { useEffect, useState } from "react";
import type { AdminSection } from "../shell";
import { API_BASE_URL } from "../lib/admin-api";
import {
  LayoutDashboard, BookOpen, Users, Video, ClipboardList,
  CheckSquare, HelpCircle, ChevronRight, Sun, Moon, LogOut, GraduationCap, Building2, School, GraduationCap as TeacherIcon, LineChart, FileCheck, Trophy
} from "lucide-react";

const NAV: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "Overview",    label: "Overview",           icon: <LayoutDashboard size={15} /> },
  { id: "Schools",     label: "Schools",            icon: <Building2 size={15} /> },
  { id: "Classes",     label: "Classes",            icon: <School size={15} /> },
  { id: "Teachers",    label: "Teachers",           icon: <TeacherIcon size={15} /> },
  { id: "Chapters",    label: "Curriculum Builder", icon: <BookOpen size={15} /> },
  { id: "Students",    label: "Students",           icon: <Users size={15} /> },
  { id: "Videos",      label: "Video Lessons",      icon: <Video size={15} /> },
  { id: "Assignments", label: "Assignments",        icon: <ClipboardList size={15} /> },
  { id: "Activities",  label: "Class Activities",   icon: <CheckSquare size={15} /> },
  { id: "Quizzes",     label: "Quizzes",            icon: <HelpCircle size={15} /> },
  { id: "QuizProgress",label: "Quiz Progress",      icon: <LineChart size={15} /> },
  { id: "Submissions", label: "Submissions",        icon: <FileCheck size={15} /> },
  { id: "Leaderboards",label: "Leaderboards",       icon: <Trophy size={15} /> },
];

export function Sidebar({ active, onSelect, theme, mounted, onToggleTheme }: {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  theme: string;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  const [adminUser, setAdminUser] = useState<{ fullName?: string; email?: string; profileImage?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("adminUser");
      if (userStr) setAdminUser(JSON.parse(userStr));
    } catch {}
  }, []);

  const avatarSrc = adminUser?.profileImage
    ? `${API_BASE_URL.replace("/api", "")}${adminUser.profileImage}`
    : null;
    
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: "100vh" }}>
      {/* Brand */}
      <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "0.75rem", flexShrink: 0,
          background: "linear-gradient(135deg, var(--admin-accent), #f43f5e)", 
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px var(--admin-accent-ring)"
        }}>
          <GraduationCap size={20} strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--foreground)", margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Learn Computers</p>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--muted)", margin: 0 }}>Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ width: 12, height: 1, background: "var(--border)" }} />
          <p style={{ fontSize: "0.625rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
            Main Menu
          </p>
        </div>
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`admin-sidebar-item${active === id ? " active" : ""}`}
            style={{ marginBottom: "0.125rem" }}
          >
            <div style={{ 
              width: 28, height: 28, borderRadius: "0.5rem", 
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active === id ? "var(--surface)" : "transparent",
              color: active === id ? "var(--admin-accent)" : "inherit",
              boxShadow: active === id ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s"
            }}>
              {icon}
            </div>
            <span style={{ flex: 1, textAlign: "left", fontWeight: active === id ? 700 : 500 }}>{label}</span>
            {active === id && <ChevronRight size={12} strokeWidth={3} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0.625rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {adminUser && (
          <div style={{ 
            display: "flex", alignItems: "center", gap: "0.625rem", 
            padding: "0.5rem", borderRadius: "0.75rem", 
            background: "var(--surface-soft)", marginBottom: "0.25rem" 
          }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: "50%", 
              background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0, border: "1px solid var(--admin-accent-soft-border)"
            }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>
                  {(adminUser.fullName || "A")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {adminUser.fullName || "Administrator"}
              </p>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "capitalize" }}>
                {adminUser.role || "Admin"}
              </p>
            </div>
          </div>
        )}
      
        <button onClick={onToggleTheme} className="admin-sidebar-item" style={{ width: "100%" }}>
          <div style={{ 
            width: 28, height: 28, borderRadius: "0.5rem", 
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-soft)",
            color: "var(--admin-accent)",
            transition: "all 0.2s"
          }}>
            {mounted && theme === "dark" ? <Sun size={15} strokeWidth={2.5} /> : <Moon size={15} strokeWidth={2.5} />}
          </div>
          <span style={{ flex: 1, fontWeight: 600 }}>
            {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Toggle Theme"}
          </span>
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/login";
          }} 
          style={{ 
            width: "100%", 
            marginTop: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.625rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--admin-danger-soft)",
            background: "var(--admin-danger-soft)",
            color: "var(--admin-danger)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 1px 2px rgba(239, 68, 68, 0.05)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--admin-danger)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--admin-danger-soft)";
            e.currentTarget.style.color = "var(--admin-danger)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(239, 68, 68, 0.05)";
          }}
        >
          <LogOut size={16} strokeWidth={2.5} />
          <span>Logout Session</span>
        </button>

      </div>
    </div>
  );
}
