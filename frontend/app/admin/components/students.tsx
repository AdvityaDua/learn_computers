"use client";

import React, { useState } from "react";

const MOCK_STUDENTS = [
  { id: "1", name: "Priya Sharma", email: "priya@example.com", role: "student", joined: "2026-04-12", progress: 72 },
  { id: "2", name: "Kabir Singh", email: "kabir@example.com", role: "student", joined: "2026-04-15", progress: 88 },
  { id: "3", name: "Meera Kapoor", email: "meera@example.com", role: "student", joined: "2026-04-20", progress: 45 },
  { id: "4", name: "Aarav Patel", email: "aarav@example.com", role: "student", joined: "2026-04-22", progress: 60 },
  { id: "5", name: "Sanya Verma", email: "sanya@example.com", role: "student", joined: "2026-04-28", progress: 30 },
  { id: "6", name: "Rohan Mehta", email: "rohan@example.com", role: "student", joined: "2026-05-01", progress: 15 },
];

function ProgressBar({ value }: { value: number }) {
  const color = value >= 70 ? "var(--admin-success)" : value >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <div style={{ flex: 1, height: 6, background: "var(--surface-soft)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, minWidth: "2.5rem", textAlign: "right" }}>{value}%</span>
    </div>
  );
}

export function StudentsView() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>Students</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.2rem" }}>
            {MOCK_STUDENTS.length} registered students
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="admin-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {/* Table */}
      <div className="admin-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Joined</th>
                <th style={{ minWidth: 160 }}>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", fontWeight: 800,
                      }}>
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{s.email}</td>
                  <td style={{ color: "var(--muted)" }}>
                    {new Date(s.joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td><ProgressBar value={s.progress} /></td>
                  <td>
                    <span className={`admin-badge ${s.progress >= 70 ? "admin-badge-green" : s.progress >= 40 ? "admin-badge-yellow" : "admin-badge-red"}`}>
                      {s.progress >= 70 ? "On Track" : s.progress >= 40 ? "In Progress" : "Needs Help"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                    No students match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
