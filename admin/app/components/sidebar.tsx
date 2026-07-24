"use client";

import React, { useEffect, useState } from "react";
import type { AdminSection } from "../shell";
import { API_BASE_URL } from "../lib/admin-api";
import {
  LayoutDashboard, BookOpen, Users, Video, ClipboardList,
  CheckSquare, HelpCircle, Sun, Moon, LogOut, GraduationCap,
  Building2, School, GraduationCap as TeacherIcon,
  LineChart, FileCheck, Trophy, ChevronRight,
  Star, BookMarked,
} from "lucide-react";

type NavItem = { id: AdminSection; label: string; icon: React.ReactNode };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Platform",
    items: [
      { id: "Overview",  label: "Overview",  icon: <LayoutDashboard size={16} strokeWidth={2} /> },
      { id: "Schools",   label: "Schools",   icon: <Building2 size={16} strokeWidth={2} /> },
      { id: "Classes",   label: "Classes",   icon: <School size={16} strokeWidth={2} /> },
      { id: "Teachers",  label: "Teachers",  icon: <TeacherIcon size={16} strokeWidth={2} /> },
      { id: "Students",  label: "Students",  icon: <Users size={16} strokeWidth={2} /> },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "Chapters",    label: "Curriculum",    icon: <BookOpen size={16} strokeWidth={2} /> },
      { id: "Subjects",    label: "Subjects",      icon: <BookMarked size={16} strokeWidth={2} /> },
      { id: "Videos",      label: "Video Lessons", icon: <Video size={16} strokeWidth={2} /> },
      { id: "Assignments", label: "Assignments",   icon: <ClipboardList size={16} strokeWidth={2} /> },
      { id: "Activities",  label: "Activities",    icon: <CheckSquare size={16} strokeWidth={2} /> },
      { id: "Quizzes",     label: "Quizzes",       icon: <HelpCircle size={16} strokeWidth={2} /> },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "QuizProgress", label: "Quiz Progress",  icon: <LineChart size={16} strokeWidth={2} /> },
      { id: "Submissions",  label: "Submissions",    icon: <FileCheck size={16} strokeWidth={2} /> },
      { id: "Leaderboards", label: "Leaderboards",   icon: <Trophy size={16} strokeWidth={2} /> },
    ],
  },
  {
    label: "Tracking",
    items: [
      { id: "StudentReviews", label: "Student Reviews",  icon: <Star size={16} strokeWidth={2} /> },
    ],
  },
] as { label: string; items: NavItem[] }[];

export function Sidebar({
  active, onSelect, theme, mounted, onToggleTheme,
}: {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  theme: string;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  const [adminUser, setAdminUser] = useState<{
    fullName?: string; email?: string; profileImage?: string; role?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("adminUser");
      if (userStr) setAdminUser(JSON.parse(userStr));
    } catch {}
  }, []);

  const avatarSrc = adminUser?.profileImage
    ? `${API_BASE_URL.replace("/api", "")}${adminUser.profileImage}`
    : null;

  const initials = adminUser?.fullName
    ? adminUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%",
      height: "100%", minHeight: "100vh",
      background: "var(--sidebar-bg, var(--surface))",
    }}>
      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "1.375rem 1.25rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "0.875rem", flexShrink: 0,
            background: "var(--admin-accent-gradient)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px var(--admin-accent-ring), inset 0 1px 1px rgba(255,255,255,0.15)",
          }}>
            <GraduationCap size={22} strokeWidth={2.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: "0.8125rem", fontWeight: 800, color: "var(--foreground)",
              margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
            }}>
              Bagat Puran Singh
            </p>
            <p style={{
              fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)",
              margin: 0, lineHeight: 1.2,
            }}>
              School for Deaf
            </p>
            <p style={{
              fontSize: "0.5625rem", fontWeight: 700, color: "var(--muted-2)",
              margin: "0.125rem 0 0", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "0.875rem 0.75rem", overflowY: "auto" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? "1.375rem" : 0 }}>
            <span className="admin-nav-group-label">{group.label}</span>
            {group.items.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`admin-sidebar-item${active === id ? " active" : ""}`}
                style={{ marginBottom: "0.125rem" }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "0.5625rem", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active === id ? "rgba(244,63,94,0.12)" : "var(--surface-soft)",
                  color: active === id ? "var(--admin-accent)" : "var(--muted)",
                  transition: "all 0.18s",
                }}>
                  {icon}
                </div>
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                {active === id && (
                  <ChevronRight
                    size={13} strokeWidth={2.5}
                    style={{ color: "var(--admin-accent)", opacity: 0.65, flexShrink: 0 }}
                  />
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{ padding: "0.875rem 0.75rem", borderTop: "1px solid var(--border)" }}>

        {/* User info */}
        {adminUser && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.75rem 0.875rem", borderRadius: "0.875rem",
            background: "var(--surface-soft)",
            border: "1px solid var(--border)",
            marginBottom: "0.625rem",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: "var(--admin-accent-gradient)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 0 0 2px var(--surface-soft), 0 0 0 3.5px var(--admin-accent-soft-border)",
            }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>{initials}</span>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                margin: 0, fontSize: "0.8125rem", fontWeight: 700,
                color: "var(--foreground)", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {adminUser.fullName || "Administrator"}
              </p>
              <p style={{
                margin: 0, fontSize: "0.6875rem", color: "var(--muted)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                textTransform: "capitalize",
              }}>
                {adminUser.role || "Admin"}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={onToggleTheme}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
              padding: "0.5rem 0.75rem", borderRadius: "0.625rem",
              border: "1px solid var(--border)",
              background: "var(--surface-soft)", color: "var(--muted)",
              fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.18s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--admin-accent-soft-border)";
              e.currentTarget.style.color = "var(--admin-accent-text)";
              e.currentTarget.style.background = "var(--admin-accent-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
              e.currentTarget.style.background = "var(--surface-soft)";
            }}
          >
            {mounted && theme === "dark"
              ? <Sun size={14} strokeWidth={2.5} />
              : <Moon size={14} strokeWidth={2.5} />}
            <span>{mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              window.location.href = "/login";
            }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
              padding: "0.5rem 0.75rem", borderRadius: "0.625rem",
              border: "1px solid var(--admin-danger-border)",
              background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
              fontSize: "0.75rem", fontWeight: 700,
              cursor: "pointer", transition: "all 0.18s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--admin-danger)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "var(--admin-danger)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.22)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--admin-danger-soft)";
              e.currentTarget.style.color = "var(--admin-danger)";
              e.currentTarget.style.borderColor = "var(--admin-danger-border)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
