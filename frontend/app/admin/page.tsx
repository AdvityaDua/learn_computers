"use client";

import React, { useState } from "react";
import { useTheme } from "../components/common/theme-context";
import { AdminSidebar } from "./components/sidebar";
import { ChaptersView } from "./components/chapters";
import { StudentsView } from "./components/students";
import { UploadsView } from "./components/uploads";
import { OverviewView } from "./components/overview";

export type AdminSection = "Overview" | "Chapters" | "Students" | "Uploads";

export default function AdminPage() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [active, setActive] = useState<AdminSection>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (active) {
      case "Overview":   return <OverviewView />;
      case "Chapters":   return <ChaptersView />;
      case "Students":   return <StudentsView />;
      case "Uploads":    return <UploadsView />;
    }
  };

  return (
    <div className="theme-page flex min-h-screen" style={{ background: "var(--background)" }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col" style={{
        width: "var(--admin-sidebar-width)",
        minWidth: "var(--admin-sidebar-width)",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}>
        <AdminSidebar
          active={active}
          onSelect={(s) => setActive(s)}
          theme={theme}
          mounted={mounted}
          onToggleTheme={toggleTheme}
        />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
          role="dialog"
          aria-modal="true"
        >
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer" }}
          />
          <div style={{
            position: "relative",
            width: "var(--admin-sidebar-width)",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            height: "100%",
            overflow: "hidden",
            zIndex: 1,
          }}>
            <AdminSidebar
              active={active}
              onSelect={(s) => { setActive(s); setSidebarOpen(false); }}
              theme={theme}
              mounted={mounted}
              onToggleTheme={toggleTheme}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 1.25rem",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 style={{ fontSize: "0.875rem", fontWeight: 700, flex: 1, color: "var(--foreground)" }}>
            {active}
          </h1>

          <span
            className="admin-badge admin-badge-blue"
            style={{ display: "inline-flex" }}
          >
            Admin Panel
          </span>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
