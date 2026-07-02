"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./theme-context";
import { Sidebar } from "./components/sidebar";
import { Sun, Moon, Bell } from "lucide-react";
import { OverviewView } from "./components/overview";
import { ChaptersView } from "./components/chapters";
import { SubjectsView } from "./components/subjects";
import { StudentsView } from "./components/students";
import { VideosView } from "./components/videos";
import { AssignmentsView } from "./components/assignments";
import { ActivitiesView } from "./components/activities";
import { QuizzesView } from "./components/quizzes";
import { SchoolsView } from "./components/schools";
import { ClassesView } from "./components/classes";
import { TeachersView } from "./components/teachers";
import { QuizProgressView } from "./components/quiz-progress";
import { clearAdminSession, ensureAdminSession, getAdminToken } from "./lib/admin-api";
import { SubmissionsView } from "./components/submissions";
import { AdminLeaderboardView } from "./components/admin-leaderboard";
import { AdminDialogProvider } from "./components/admin-dialog";
import { AttendanceView } from "./components/attendance";
import { StudentReviewsView } from "./components/student-reviews";
import { TeacherWorkView } from "./components/teacher-work";
import { AdminDataProvider } from "./contexts/admin-data-context";
import { useRouter } from "next/navigation";

export type AdminSection =
  | "Overview" | "Schools" | "Classes" | "Teachers" | "Chapters" | "Subjects"
  | "Students" | "Videos" | "Assignments" | "Activities" | "Quizzes"
  | "QuizProgress" | "Submissions" | "Leaderboards"
  | "Attendance" | "StudentReviews" | "TeacherWork";

const SECTION_META: Record<AdminSection, { subtitle: string }> = {
  Overview:      { subtitle: "Platform performance at a glance" },
  Schools:       { subtitle: "Manage registered schools and configuration" },
  Classes:       { subtitle: "Configure grade classes across schools" },
  Teachers:      { subtitle: "Faculty management and assignments" },
  Chapters:      { subtitle: "Build and organize curriculum chapters" },
  Subjects:      { subtitle: "Manage subjects for each class" },
  Students:      { subtitle: "Student enrollment and progress tracking" },
  Videos:        { subtitle: "Manage video lessons and content" },
  Assignments:   { subtitle: "Create and review student assignments" },
  Activities:    { subtitle: "Manage classroom activities and exercises" },
  Quizzes:       { subtitle: "Build quizzes and assessment tools" },
  QuizProgress:  { subtitle: "Monitor quiz performance across students" },
  Submissions:   { subtitle: "Review and grade student submissions" },
  Leaderboards:  { subtitle: "Student rankings and achievements" },
  Attendance:    { subtitle: "Daily attendance records across all classes" },
  StudentReviews:{ subtitle: "Teacher reviews and student progress evaluations" },
  TeacherWork:   { subtitle: "Assignments and activities delivered by teachers" },
};

export function AdminShell() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [active, setActive] = useState<AdminSection>("Overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<{ fullName?: string; profileImage?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const handleUnauthorized = () => {
      clearAdminSession();
      if (isMounted) { setAuthorized(false); setSessionChecked(true); }
      router.replace("/login");
    };

    window.addEventListener("admin:unauthorized", handleUnauthorized);

    const validateSession = async () => {
      if (!getAdminToken()) {
        if (isMounted) { setAuthorized(false); setSessionChecked(true); }
        router.replace("/login");
        return;
      }
      const ok = await ensureAdminSession();
      if (!isMounted) return;
      setAuthorized(ok);
      setSessionChecked(true);
      if (!ok) router.replace("/login");
    };

    void validateSession();

    try {
      const userStr = localStorage.getItem("adminUser");
      if (userStr) setAdminUser(JSON.parse(userStr));
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
    };
  }, [router]);

  if (!sessionChecked || !authorized) return null;

  const renderSection = () => {
    switch (active) {
      case "Overview":    return <OverviewView />;
      case "Schools":     return <SchoolsView />;
      case "Classes":     return <ClassesView />;
      case "Teachers":    return <TeachersView />;
      case "Chapters":    return <ChaptersView onNavigateToSubjects={() => setActive("Subjects")} />;
      case "Subjects":    return <SubjectsView onNavigateToChapters={() => setActive("Chapters")} />;
      case "Students":    return <StudentsView />;
      case "Videos":      return <VideosView />;
      case "Assignments": return <AssignmentsView />;
      case "Activities":  return <ActivitiesView />;
      case "Quizzes":     return <QuizzesView />;
      case "QuizProgress":  return <QuizProgressView />;
      case "Submissions":   return <SubmissionsView />;
      case "Leaderboards":  return <AdminLeaderboardView />;
      case "Attendance":    return <AttendanceView />;
      case "StudentReviews":return <StudentReviewsView />;
      case "TeacherWork":   return <TeacherWorkView />;
    }
  };

  const sidebarProps = { active, onSelect: setActive, theme, mounted, onToggleTheme: toggleTheme };

  const initials = adminUser?.fullName
    ? adminUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <AdminDataProvider>
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        @media (max-width: 1023px) { .admin-sidebar-desktop { display: none !important; } }
        @media (min-width: 1024px) { .admin-menu-btn { display: none !important; } }

        .shell-topbar-btn {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 0.625rem; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--muted);
          box-shadow: var(--elevation-1);
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .shell-topbar-btn:hover {
          background: var(--admin-accent-soft);
          color: var(--admin-accent-text);
          border-color: var(--admin-accent-soft-border);
          transform: translateY(-1px);
          box-shadow: var(--elevation-2);
        }
        .shell-topbar-btn:active { transform: translateY(0); }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: "var(--admin-sidebar-width)", minWidth: "var(--admin-sidebar-width)",
          background: "var(--sidebar-bg, var(--surface))",
          borderRight: "1px solid var(--border)",
          position: "sticky", top: 0, height: "100vh",
          overflowY: "auto", flexShrink: 0, display: "flex",
        }}
      >
        <Sidebar {...sidebarProps} onSelect={(s) => setActive(s)} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <button
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          />
          <div style={{
            position: "relative", zIndex: 1,
            width: "var(--admin-sidebar-width)",
            background: "var(--sidebar-bg, var(--surface))",
            borderRight: "1px solid var(--border)",
            height: "100%", overflowY: "auto", display: "flex",
          }}>
            <Sidebar {...sidebarProps} onSelect={(s) => { setActive(s); setDrawerOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <header style={{
          height: 66, display: "flex", alignItems: "center", gap: 16,
          padding: "0 1.75rem",
          background: "rgba(var(--background-rgb), 0.8)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          {/* Mobile hamburger */}
          <button
            className="admin-menu-btn shell-topbar-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Section title */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: 3, height: 18, background: "var(--admin-accent-gradient)",
                  borderRadius: 2, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: "0.9375rem", fontWeight: 800, color: "var(--foreground)",
                  letterSpacing: "-0.02em", lineHeight: 1,
                }}>
                  {active}
                </span>
              </div>
              <span style={{
                fontSize: "0.6875rem", color: "var(--muted-2)", marginTop: "0.2rem",
                paddingLeft: "0.6875rem",
              }}>
                {SECTION_META[active].subtitle}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="shell-topbar-btn" aria-label="Toggle theme">
              {mounted && theme === "dark"
                ? <Sun size={16} strokeWidth={2.5} />
                : <Moon size={16} strokeWidth={2.5} />}
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 22, background: "var(--border)" }} />

            {/* User avatar chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.3rem 0.625rem 0.3rem 0.3rem",
              borderRadius: "99px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              cursor: "default",
              boxShadow: "var(--elevation-1)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "var(--admin-accent-gradient)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.625rem", fontWeight: 800, flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>
                {adminUser?.fullName?.split(" ")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}>
          {renderSection()}
        </main>
      </div>

      <AdminDialogProvider />
    </div>
    </AdminDataProvider>
  );
}
