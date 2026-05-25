"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { COLORS } from "../lib/constants";
import { StatCard } from "./stat-card";
import { DonutChart } from "./charts/donut-chart";
import { BarChart } from "./charts/bar-chart";
import { Users, BookOpen, GraduationCap, Award, TrendingUp, School } from "lucide-react";

type DashboardData = {
  teacher: { _id: string; fullName: string; email: string; profileImage?: string | null };
  school: { _id: string; name: string; code: string } | null;
  classes: {
    _id: string;
    name: string;
    grade: number;
    description: string;
    studentCount: number;
    schools: { _id: string; name: string; code: string }[];
  }[];
};

type ClassResult = {
  students: {
    userId: string;
    fullName: string;
    points: number;
    lessonCompletion: number;
    completedLessons: number;
    totalLessons: number;
    completedQuizzes: number;
    totalQuizzes: number;
    avgQuizScore: number;
    submissions: { pending: number; approved: number; rejected: number; total: number };
  }[];
  summary: {
    totalStudents: number;
    avgCompletion: number;
    avgPoints: number;
    totalLessons: number;
    totalQuizzes: number;
  };
};

export function OverviewPanel() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [classResults, setClassResults] = useState<Record<string, ClassResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/users/teacher/dashboard");
        setDashboard(data);

        // Fetch results for each class
        const results: Record<string, ClassResult> = {};
        await Promise.all(
          data.classes.map(async (cls: DashboardData["classes"][0]) => {
            try {
              const res = await apiFetch(`/progress/teacher/class-results/${encodeURIComponent(cls.name)}`);
              results[cls._id] = res;
            } catch { /* skip */ }
          })
        );
        setClassResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <div style={{
          width: 32, height: 32,
          border: `3px solid var(--border)`,
          borderTopColor: COLORS.accent,
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!dashboard) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Failed to load dashboard.</div>;

  const totalStudents = dashboard.classes.reduce((s, c) => s + c.studentCount, 0);
  const totalClasses = dashboard.classes.length;

  // Compute average metrics across all classes
  const allSummaries = Object.values(classResults);
  const avgCompletion = allSummaries.length > 0
    ? Math.round(allSummaries.reduce((s, r) => s + r.summary.avgCompletion, 0) / allSummaries.length)
    : 0;
  const avgPoints = allSummaries.length > 0
    ? Math.round(allSummaries.reduce((s, r) => s + r.summary.avgPoints, 0) / allSummaries.length)
    : 0;

  // Data for bar chart: students per class
  const classBarData = dashboard.classes.map(c => ({
    label: c.name,
    value: c.studentCount,
  }));

  // Data for donut chart: completion across classes
  const completedTotal = allSummaries.reduce((s, r) => {
    return s + r.students.filter(st => st.lessonCompletion === 100).length;
  }, 0);
  const inProgressTotal = totalStudents - completedTotal;

  return (
    <div style={{ animation: "slideUp 0.3s ease-out" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
          Welcome back, {dashboard.teacher.fullName.split(" ")[0]}
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted)", margin: "0.25rem 0 0" }}>
          {dashboard.school ? `${dashboard.school.name} • ` : ""}
          {totalClasses} class{totalClasses !== 1 ? "es" : ""} assigned
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard icon={Users} label="Total Students" value={totalStudents} subtitle={`Across ${totalClasses} classes`} color={COLORS.accent} />
        <StatCard icon={TrendingUp} label="Avg Completion" value={`${avgCompletion}%`} subtitle="Lesson progress" color={COLORS.success} />
        <StatCard icon={Award} label="Avg Points" value={avgPoints} subtitle="Per student" color={COLORS.warning} />
        <StatCard icon={School} label="School" value={dashboard.school?.name || "—"} subtitle={dashboard.school?.code || "Not assigned"} color={COLORS.info} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="t-card" style={{ padding: "1.25rem" }}>
          <BarChart
            data={classBarData}
            title="Students per Class"
            color={COLORS.accent}
            height={200}
          />
        </div>
        <div className="t-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.75rem", alignSelf: "flex-start",
          }}>
            Completion Overview
          </div>
          <DonutChart
            data={[
              { label: "Completed", value: completedTotal, color: COLORS.success },
              { label: "In Progress", value: Math.max(0, inProgressTotal), color: COLORS.warning },
            ]}
            size={160}
            centerValue={`${avgCompletion}%`}
            centerLabel="Average"
          />
        </div>
      </div>

      {/* Class Cards */}
      <div style={{
        fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.75rem",
      }}>
        Your Classes
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {dashboard.classes.map(cls => {
          const result = classResults[cls._id];
          return (
            <div key={cls._id} className="t-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: `${COLORS.accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <GraduationCap size={20} color={COLORS.accent} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{cls.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Grade {cls.grade}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Students</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.accent }}>{cls.studentCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Avg Completion</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.success }}>{result?.summary?.avgCompletion ?? 0}%</div>
                </div>
              </div>

              {result && result.summary.totalStudents > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--surface-soft)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 3,
                      background: COLORS.accent,
                      width: `${result.summary.avgCompletion}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              )}

              {cls.schools && cls.schools.length > 0 && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {cls.schools.map((s: { _id: string; name: string }) => (
                    <span key={s._id} className="t-badge t-badge-gray" style={{ fontSize: "0.625rem" }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
