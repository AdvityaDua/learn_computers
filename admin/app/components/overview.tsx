"use client";

import React, { useEffect, useState } from "react";
import { Users, BookOpen, Upload, Shield, CheckCircle } from "lucide-react";
import { AdminAuthError, fetchAdmin } from "../lib/admin-api";

interface Stats {
  students: number;
  chapters: number;
  materials: number;
  quizzes: number;
}

export function OverviewView() {
  const [stats, setStats] = useState<Stats>({ students: 0, chapters: 0, materials: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, lessons, materials, quizzes] = await Promise.all([
          fetchAdmin("/users").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/lessons").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/materials").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/quizzes").then((res) => (res.ok ? res.json() : [])),
        ]);

        setStats({
          students: Array.isArray(users) ? users.length : 0,
          chapters: Array.isArray(lessons) ? lessons.length : 0,
          materials: Array.isArray(materials) ? materials.length : 0,
          quizzes: Array.isArray(quizzes) ? quizzes.length : 0,
        });
      } catch (err) {
        if (!(err instanceof AdminAuthError)) {
          console.error("Error fetching stats:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const STAT_CARDS = [
    { label: "Students",  value: stats.students,  color: "var(--admin-accent)", icon: <Users size={20} /> },
    { label: "Lessons",   value: stats.chapters,  color: "#10b981",            icon: <BookOpen size={20} /> },
    { label: "Materials", value: stats.materials, color: "#f59e0b",            icon: <Upload size={20} /> },
    { label: "Quizzes",   value: stats.quizzes,   color: "#ef4444",            icon: <Shield size={20} /> },
  ];

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Dashboard Overview</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>Platform performance and activity metrics</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {STAT_CARDS.map((card, idx) => (
          <div key={idx} className="admin-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--muted)", margin: 0 }}>{card.label}</p>
                <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: "0.5rem 0 0" }}>
                  {loading ? "..." : card.value}
                </h3>
              </div>
              <div style={{
                width: 42, height: 42, borderRadius: "0.75rem", background: "var(--surface-soft)",
                display: "flex", alignItems: "center", justifyContent: "center", color: card.color
              }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "1.5rem" }}>System Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <StatusRow label="Backend API" status="online" />
            <StatusRow label="Database Connection" status="online" />
            <StatusRow label="File Storage (Uploads)" status="active" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string, status: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--surface-soft)", borderRadius: "0.5rem" }}>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--foreground)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
        <CheckCircle size={13} style={{ color: "#10b981" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#10b981" }}>{status}</span>
      </div>
    </div>
  );
}
