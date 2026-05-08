"use client";

import React from "react";

const STATS = [
  { label: "Total Students", value: "128", delta: "+12 this month", color: "var(--admin-accent)" },
  { label: "Chapters", value: "8", delta: "24 total lessons", color: "var(--admin-success)" },
  { label: "Uploaded Files", value: "94", delta: "Videos, PDFs & more", color: "var(--admin-warning)" },
  { label: "Quizzes Created", value: "36", delta: "Across all lessons", color: "var(--admin-danger)" },
];

const ACTIVITY = [
  { action: "New student registered", name: "Priya Sharma", time: "5 min ago" },
  { action: "Chapter uploaded", name: "Introduction to Networking", time: "1 hr ago" },
  { action: "Quiz submitted", name: "Kabir Singh — 88%", time: "3 hr ago" },
  { action: "Assignment graded", name: "Meera Kapoor", time: "Yesterday" },
  { action: "New lesson added", name: "Operating Systems Basics", time: "Yesterday" },
];

export function OverviewView() {
  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>
          Welcome back 👋
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>
          Here's a snapshot of your platform today.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {STATS.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", marginTop: "0.25rem" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.125rem" }}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="admin-card">
        <div className="admin-card-header">
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--foreground)" }}>
            Recent Activity
          </span>
        </div>
        <div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              padding: "0.75rem 1.25rem",
              borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: "var(--admin-accent)",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{a.action}</p>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", marginTop: "0.1rem" }}>
                  {a.name}
                </p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
