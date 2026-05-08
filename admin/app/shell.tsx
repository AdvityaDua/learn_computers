"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./theme-context";
import { Sidebar } from "./components/sidebar";
import { OverviewView } from "./components/overview";
import { ChaptersView } from "./components/chapters";
import { StudentsView } from "./components/students";
import { VideosView } from "./components/videos";
import { AssignmentsView } from "./components/assignments";
import { ActivitiesView } from "./components/activities";
import { QuizzesView } from "./components/quizzes";
import { clearAdminSession, ensureAdminSession, getAdminToken } from "./lib/admin-api";

import { useRouter } from "next/navigation";

export type AdminSection = "Overview" | "Chapters" | "Students" | "Videos" | "Assignments" | "Activities" | "Quizzes";


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
      case "Chapters": return <ChaptersView />;
      case "Students": return <StudentsView />;
      case "Videos":   return <VideosView />;
      case "Assignments": return <AssignmentsView />;
      case "Activities": return <ActivitiesView />;
      case "Quizzes": return <QuizzesView />;
    }
  };

  const sidebarProps = { active, onSelect: setActive, theme, mounted, onToggleTheme: toggleTheme };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        @media (max-width: 1023px) { .admin-sidebar-desktop { display: none !important; } }
        @media (min-width: 1024px) { .admin-menu-btn { display: none !important; } }
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
          height: 54, display: "flex", alignItems: "center", gap: 12,
          padding: "0 1.25rem", background: "var(--surface)",
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <button className="admin-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu"
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--muted)",
            }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span style={{ fontSize: "0.875rem", fontWeight: 700, flex: 1, color: "var(--foreground)" }}>{active}</span>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
