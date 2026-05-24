"use client";

import React from "react";
import {
  BookOpen, BarChart3, Trophy, Users, ClipboardList,
  UserPlus, FileCheck, LogOut, User, Award,
} from "lucide-react";
import { COLORS } from "../lib/constants";
import { clearSession, getUser, API_BASE_URL } from "../lib/api";
import { useRouter } from "next/navigation";

export type TeacherSection =
  | "Overview" | "Curriculum" | "ClassResults" | "Students"
  | "Submissions" | "Leaderboard" | "DueDates" | "MyProfile";

interface SidebarProps {
  active: TeacherSection;
  onSelect: (section: TeacherSection) => void;
  teacherName?: string;
}

const SECTIONS: { key: TeacherSection; label: string; icon: typeof BookOpen; group?: string }[] = [
  { key: "Overview",     label: "Overview",       icon: BarChart3,     group: "main" },
  { key: "Curriculum",   label: "Curriculum",     icon: BookOpen,      group: "main" },
  { key: "ClassResults", label: "Class Results",  icon: Users,         group: "main" },
  { key: "Students",     label: "Students",       icon: UserPlus,      group: "main" },
  { key: "Submissions",  label: "Submissions",    icon: FileCheck,     group: "main" },
  { key: "Leaderboard",  label: "Leaderboard",    icon: Trophy,        group: "main" },
  { key: "DueDates",     label: "Due Dates",      icon: ClipboardList, group: "main" },
  { key: "MyProfile",    label: "My Profile",     icon: User,          group: "account" },
];

export function Sidebar({ active, onSelect, teacherName }: SidebarProps) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const mainSections = SECTIONS.filter(s => s.group === "main");
  const accountSections = SECTIONS.filter(s => s.group === "account");

  const initials = (teacherName || "T")
    .trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  const avatarSrc = user?.profileImage
    ? `${API_BASE_URL.replace("/api", "")}${user.profileImage}`
    : null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      padding: "1.25rem 0.875rem",
    }}>
      {/* Brand */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1.75rem",
        padding: "0 0.25rem",
      }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: 10,
          background: COLORS.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 2px 8px ${COLORS.accentRing}`,
        }}>
          <BookOpen size={18} color={COLORS.onAccent} />
        </div>
        <div>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: 800,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}>
            Teacher Portal
          </div>
          <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 1, fontWeight: 500 }}>
            Learn Computers
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        fontSize: "0.5625rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
        padding: "0 0.5rem",
        marginBottom: "0.375rem",
      }}>
        Navigation
      </div>

      {/* Main nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {mainSections.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`t-sidebar-item ${active === key ? "active" : ""}`}
            onClick={() => onSelect(key)}
          >
            <Icon size={15} strokeWidth={2.5} />
            <span style={{ fontSize: "0.8125rem" }}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Account section */}
      <div style={{
        fontSize: "0.5625rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
        padding: "0 0.5rem",
        marginBottom: "0.375rem",
        marginTop: "1rem",
      }}>
        Account
      </div>

      {/* Profile shortcut — avatar + name */}
      <button
        className={`t-sidebar-item ${active === "MyProfile" ? "active" : ""}`}
        onClick={() => onSelect("MyProfile")}
        style={{ marginBottom: "0.2rem" }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
          background: COLORS.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.5625rem", fontWeight: 800, color: COLORS.accentText,
          border: `1.5px solid ${active === "MyProfile" ? COLORS.accent : COLORS.accentSoftBorder}`,
        }}>
          {avatarSrc
            ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {teacherName || "My Profile"}
          </div>
          <div style={{ fontSize: "0.5625rem", color: "var(--muted)", marginTop: 0 }}>Edit profile</div>
        </div>
      </button>

      {/* Logout */}
      <button
        className="t-sidebar-item"
        onClick={handleLogout}
        style={{ color: COLORS.danger }}
      >
        <LogOut size={15} strokeWidth={2.5} />
        <span style={{ fontSize: "0.8125rem" }}>Sign Out</span>
      </button>
    </div>
  );
}
