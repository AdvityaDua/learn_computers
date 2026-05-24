"use client";

import React from "react";
import { Dialog } from "./dialog";
import { COLORS, API_BASE_URL } from "../lib/constants";
import { DonutChart } from "./charts/donut-chart";
import { User, BookOpen, Brain, ClipboardCheck, Award } from "lucide-react";

type StudentResult = {
  userId: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  points: number;
  completedLessons: number;
  totalLessons: number;
  lessonCompletion: number;
  completedQuizzes: number;
  totalQuizzes: number;
  avgQuizScore: number;
  submissions: { pending: number; approved: number; rejected: number; total: number };
};

interface Props {
  student: StudentResult;
  onClose: () => void;
}

export function StudentDetailDialog({ student, onClose }: Props) {
  const s = student;

  return (
    <Dialog open={true} onClose={onClose} title="Student Details" maxWidth={500}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: "50%",
          background: `${COLORS.accent}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: COLORS.accent,
        }}>
          {s.profileImage ? (
            <img src={s.profileImage.startsWith("http") ? s.profileImage : `${API_BASE_URL}${s.profileImage.startsWith("/") ? "" : "/"}${s.profileImage}`} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            s.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)" }}>{s.fullName}</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{s.email}</div>
        </div>
        <div style={{
          marginLeft: "auto",
          padding: "0.375rem 0.75rem",
          borderRadius: 8,
          background: `${COLORS.accent}15`,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}>
          <Award size={14} color={COLORS.accent} />
          <span style={{ fontWeight: 800, color: COLORS.accent, fontSize: "1rem" }}>{s.points}</span>
          <span style={{ fontSize: "0.625rem", color: "var(--muted)" }}>pts</span>
        </div>
      </div>

      {/* Donut Chart */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <DonutChart
          data={[
            { label: "Completed", value: s.completedLessons, color: COLORS.success },
            { label: "Remaining", value: Math.max(0, s.totalLessons - s.completedLessons), color: COLORS.border },
          ]}
          size={120}
          strokeWidth={16}
          centerValue={`${s.lessonCompletion}%`}
          centerLabel="Done"
        />
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div className="t-stat-card" style={{ padding: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <BookOpen size={14} color={COLORS.accent} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Lessons</span>
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)" }}>
            {s.completedLessons}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)" }}>/{s.totalLessons}</span>
          </div>
        </div>

        <div className="t-stat-card" style={{ padding: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Brain size={14} color={COLORS.info} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Quizzes</span>
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)" }}>
            {s.completedQuizzes}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)" }}>/{s.totalQuizzes}</span>
          </div>
        </div>

        <div className="t-stat-card" style={{ padding: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Brain size={14} color={COLORS.chart4} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Avg Quiz Score</span>
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: 800, color: s.avgQuizScore >= 70 ? COLORS.success : s.avgQuizScore >= 40 ? COLORS.warning : COLORS.danger }}>
            {s.avgQuizScore}%
          </div>
        </div>

        <div className="t-stat-card" style={{ padding: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <ClipboardCheck size={14} color={COLORS.success} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Submissions</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem" }}>
            <span style={{ color: COLORS.success, fontWeight: 700 }}>OK: {s.submissions.approved}</span>
            <span style={{ color: COLORS.warning, fontWeight: 700 }}>Pending: {s.submissions.pending}</span>
            <span style={{ color: COLORS.danger, fontWeight: 700 }}>Rejected: {s.submissions.rejected}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
