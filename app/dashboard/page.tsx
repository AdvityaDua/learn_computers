"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearSession, ensureSession } from "../lib/api";
import { Sidebar, TeacherSection } from "../components/sidebar";
import { OverviewPanel } from "../components/overview-panel";
import { ClassResultsView } from "../components/class-results";
import { StudentManagerView } from "../components/student-manager";
import { SubmissionReviewView } from "../components/submission-review";
import { LeaderboardView } from "../components/leaderboard";
import { DueDateManager } from "../components/due-date-manager";
import { CurriculumBrowser } from "../components/curriculum-browser";
import { TeacherProfileView } from "../components/teacher-profile";
import { COLORS, SIDEBAR_WIDTH } from "../lib/constants";
import { Menu, Sun, Moon } from "lucide-react";

const SECTION_TITLES: Record<TeacherSection, string> = {
  Overview: "Overview",
  Curriculum: "Curriculum",
  ClassResults: "Class Results",
  Students: "Student Management",
  Submissions: "Submission Review",
  Leaderboard: "Leaderboard",
  DueDates: "Due Dates",
  MyProfile: "My Profile",
};

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState<TeacherSection>("Overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const user = getUser();

  useEffect(() => {
    const stored = localStorage.getItem("teacherTheme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }

    const handleUnauthorized = () => {
      clearSession();
      setAuthorized(false);
      setSessionChecked(true);
      router.replace("/login");
    };

    window.addEventListener("teacher:unauthorized", handleUnauthorized);

    const validate = async () => {
      if (!getToken()) {
        setAuthorized(false);
        setSessionChecked(true);
        router.replace("/login");
        return;
      }
      const ok = await ensureSession();
      setAuthorized(ok);
      setSessionChecked(true);
      if (!ok) router.replace("/login");
    };

    validate();

    return () => {
      window.removeEventListener("teacher:unauthorized", handleUnauthorized);
    };
  }, [router]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("teacherTheme", next);
  };

  if (!sessionChecked || !authorized) return null;

  const renderSection = () => {
    switch (active) {
      case "Overview":    return <OverviewPanel />;
      case "Curriculum":  return <CurriculumBrowser />;
      case "ClassResults":return <ClassResultsView />;
      case "Students":    return <StudentManagerView />;
      case "Submissions": return <SubmissionReviewView />;
      case "Leaderboard": return <LeaderboardView />;
      case "DueDates":    return <DueDateManager />;
      case "MyProfile":   return <TeacherProfileView />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        @media (max-width: 1023px) { .t-sidebar-desktop { display: none !important; } }
        @media (min-width: 1024px) { .t-menu-btn { display: none !important; } }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="t-sidebar-desktop" style={{
        width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        position: "sticky",
        top: 0, height: "100vh", overflowY: "auto", flexShrink: 0,
        display: "flex",
      }}>
        <Sidebar active={active} onSelect={setActive} teacherName={user?.fullName} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <button
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer" }}
          />
          <div style={{
            position: "relative", zIndex: 1, width: SIDEBAR_WIDTH,
            background: "var(--surface)", borderRight: "1px solid var(--border)",
            height: "100%", overflowY: "auto", display: "flex",
          }}>
            <Sidebar active={active} onSelect={(s) => { setActive(s); setDrawerOpen(false); }} teacherName={user?.fullName} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          height: 60, display: "flex", alignItems: "center", gap: 16,
          padding: "0 1.75rem",
          background: "rgba(var(--background-rgb), 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <button
            className="t-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
              width: 34, height: 34, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--foreground)",
              boxShadow: "var(--elevation-1)",
            }}
          >
            <Menu size={17} />
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 3, height: 14, background: COLORS.accent, borderRadius: 2 }} />
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              {SECTION_TITLES[active]}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              width: 34, height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              boxShadow: "var(--elevation-1)",
              transition: "all 0.2s",
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
