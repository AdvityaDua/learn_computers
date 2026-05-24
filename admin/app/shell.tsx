"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./theme-context";
import { Sidebar } from "./components/sidebar";
import { Sun, Moon } from "lucide-react";
import { OverviewView } from "./components/overview";
import { ChaptersView } from "./components/chapters";
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
import { useRouter } from "next/navigation";

export type AdminSection = "Overview" | "Schools" | "Classes" | "Teachers" | "Chapters" | "Students" | "Videos" | "Assignments" | "Activities" | "Quizzes" | "QuizProgress" | "Submissions" | "Leaderboards";


export function AdminShell() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [active, setActive] = useState<AdminSection>("Overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const handleUnauthorized = () => {
      clearAdminSession();
      if (isMounted) {
        setAuthorized(false);
        setSessionChecked(true);
      }
      router.replace("/login");
    };

    window.addEventListener("admin:unauthorized", handleUnauthorized);

    const validateSession = async () => {
      if (!getAdminToken()) {
        if (isMounted) {
          setAuthorized(false);
          setSessionChecked(true);
        }
        router.replace("/login");
        return;
      }

      const ok = await ensureAdminSession();
      if (!isMounted) {
        return;
      }

      setAuthorized(ok);
      setSessionChecked(true);

      if (!ok) {
        router.replace("/login");
      }
    };

    void validateSession();

    return () => {
      isMounted = false;
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
    };
  }, [router]);

  if (!sessionChecked || !authorized) {
    return null;
  }

  const renderSection = () => {
    switch (active) {
      case "Overview": return <OverviewView />;
      case "Schools": return <SchoolsView />;
      case "Classes": return <ClassesView />;
      case "Teachers": return <TeachersView />;
      case "Chapters": return <ChaptersView />;
      case "Students": return <StudentsView />;
      case "Videos":   return <VideosView />;
      case "Assignments": return <AssignmentsView />;
      case "Activities": return <ActivitiesView />;
      case "Quizzes": return <QuizzesView />;
      case "QuizProgress": return <QuizProgressView />;
      case "Submissions": return <SubmissionsView />;
      case "Leaderboards": return <AdminLeaderboardView />;
    }
  };

  const sidebarProps = { active, onSelect: setActive, theme, mounted, onToggleTheme: toggleTheme };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        @media (max-width: 1023px) { .admin-sidebar-desktop { display: none !important; } }
        @media (min-width: 1024px) { .admin-menu-btn { display: none !important; } }
        
        .theme-toggle-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--muted);
          box-shadow: var(--elevation-1);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle-btn:hover {
          background: var(--surface-soft);
          color: var(--admin-accent);
          border-color: var(--admin-accent-soft-border);
          transform: translateY(-1px);
          box-shadow: var(--elevation-2);
        }
        .theme-toggle-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        width: 256, minWidth: 256, background: "var(--surface)",
        borderRight: "1px solid var(--border)", position: "sticky",
        top: 0, height: "100vh", overflowY: "auto", flexShrink: 0,
        display: "flex",
      }}>
        <Sidebar {...sidebarProps} onSelect={(s) => setActive(s)} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <button aria-label="Close" onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer" }} />
          <div style={{
            position: "relative", zIndex: 1, width: 256,
            background: "var(--surface)", borderRight: "1px solid var(--border)",
            height: "100%", overflowY: "auto", display: "flex",
          }}>
            <Sidebar {...sidebarProps} onSelect={(s) => { setActive(s); setDrawerOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <header style={{
          height: 64, display: "flex", alignItems: "center", gap: 16,
          padding: "0 2rem", background: "rgba(var(--background-rgb), 0.7)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <button className="admin-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu"
            style={{ 
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
              width: 36, height: 36, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--foreground)",
              boxShadow: "var(--elevation-1)"
            }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 4, height: 16, background: "var(--admin-accent)", borderRadius: 2 }} />
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em" }}>{active}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
             <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
               {theme === "dark" ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
             </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {renderSection()}
        </main>
      </div>
      <AdminDialogProvider />
    </div>
  );
}
