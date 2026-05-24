"use client";

import React, { useEffect, useState } from "react";
import { Users, BookOpen, Upload, Shield, TrendingUp, Award } from "lucide-react";
import { AdminAuthError, fetchAdmin, apiFetch } from "../lib/admin-api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  students: number;
  chapters: number;
  materials: number;
  quizzes: number;
}

export function OverviewView() {
  const [stats, setStats] = useState<Stats>({ students: 0, chapters: 0, materials: 0, quizzes: 0 });
  const [chartData, setChartData] = useState<{ date: string; submissions: number }[]>([]);
  const [topLearners, setTopLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, lessons, materials, quizzes, submissions, leaderboard] = await Promise.all([
          fetchAdmin("/users").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/lessons").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/materials").then((res) => (res.ok ? res.json() : [])),
          fetchAdmin("/quizzes").then((res) => (res.ok ? res.json() : [])),
          apiFetch("/progress/admin/submissions").catch(() => []),
          apiFetch("/progress/leaderboard").catch(() => []),
        ]);

        setStats({
          students: Array.isArray(users) ? users.length : 0,
          chapters: Array.isArray(lessons) ? lessons.length : 0,
          materials: Array.isArray(materials) ? materials.length : 0,
          quizzes: Array.isArray(quizzes) ? quizzes.length : 0,
        });

        if (Array.isArray(leaderboard)) {
          setTopLearners(leaderboard.slice(0, 5));
        }

        // Process submissions for chart (Last 7 days)
        if (Array.isArray(submissions)) {
          const days: Record<string, number> = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
          }
          
          submissions.forEach((sub: any) => {
            if (sub.submittedAt) {
              const d = new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              if (days[d] !== undefined) {
                days[d]++;
              }
            }
          });
          
          setChartData(Object.entries(days).map(([date, count]) => ({ date, submissions: count })));
        }
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
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>Dashboard Overview</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>Platform performance and activity metrics</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {STAT_CARDS.map((card, idx) => (
          <div key={idx} className="admin-card" style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-1rem", right: "-1rem", width: "6rem", height: "6rem", background: card.color, opacity: 0.04, borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.5rem" }}>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
                    {loading ? "..." : card.value}
                  </h3>
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: "0.875rem", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: card.color, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)" }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Chart Area */}
        <div className="admin-card" style={{ padding: "1.5rem", flex: "2 1 500px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <TrendingUp size={18} color="var(--admin-accent)" />
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Activity Trends</h3>
          </div>
          <div style={{ height: 300, width: "100%" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.875rem" }}>Loading chart data...</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <Tooltip 
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "var(--admin-accent)", fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="submissions" name="Submissions" stroke="var(--admin-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.875rem" }}>No activity in the last 7 days.</div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="admin-card" style={{ padding: "1.5rem", flex: "1 1 300px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Award size={18} color="#f59e0b" />
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Top Learners</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {loading ? (
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>Loading...</div>
            ) : topLearners.length > 0 ? (
              topLearners.map((user, idx) => (
                <div key={user.userId || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: "var(--surface)", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", flexShrink: 0 }}>
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{user.fullName}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{user.points || 0} pts</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#b45309" : "var(--border)" }}>
                    #{idx + 1}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>No top learners yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
