"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch, API_BASE_URL } from "../lib/admin-api";
import { Star, TrendingUp, Users, BarChart2, Award, Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ReviewSummary = {
  totalReviews: number;
  totalDaily: number;
  totalMonthly: number;
  avgOverall: number | null;
  avgAcademic: number | null;
  avgBehavior: number | null;
  avgParticipation: number | null;
  avgMarksPercentage: number | null;
  marksEntryCount: number;
  monthlyTrend: { month: number; year: number; avgRating: number; count: number }[];
};

type MarkEntry = { subject: string; obtained: number; total: number };

type ReviewEntry = {
  _id: string;
  studentId: { _id: string; fullName: string; email: string; profileImage?: string | null } | null;
  teacherId: { _id: string; fullName: string; email: string } | null;
  classId: string;
  type: "daily" | "monthly" | "yearly";
  date?: string;
  month?: number;
  year?: number;
  overallRating: number;
  academicRating?: number;
  behaviorRating?: number;
  participationRating?: number;
  notes: string;
  strengths: string[];
  areasForImprovement: string[];
  marks: MarkEntry[];
  createdAt: string;
};

type ClassOption = { _id: string; name: string };

function RatingBadge({ value }: { value: number | null | undefined }) {
  if (value == null || isNaN(value)) return <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>—</span>;
  const color = value >= 4 ? "#10b981" : value >= 3 ? "#f59e0b" : "#dc2626";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.2rem",
      background: `${color}18`, color, fontSize: "0.8125rem",
      fontWeight: 700, padding: "0.2rem 0.625rem", borderRadius: "99px",
    }}>
      <Star size={11} fill={color} />
      {value.toFixed(1)}
    </span>
  );
}

function scoreColor(pct: number): string {
  if (pct >= 80) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#dc2626";
}

function ReviewCard({ review }: { review: ReviewEntry }) {
  const [expanded, setExpanded] = useState(false);
  const student = review.studentId;
  const teacher = review.teacherId;
  const avatarSrc = student?.profileImage
    ? (student.profileImage.startsWith("http") ? student.profileImage : `${API_BASE_URL}${student.profileImage.startsWith("/") ? "" : "/"}${student.profileImage}`)
    : null;
  const period = review.type === "daily"
    ? (review.date ? new Date(review.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—")
    : review.type === "monthly"
      ? `${MONTH_NAMES[(review.month ?? 1) - 1]} ${review.year}`
      : `Year ${review.year}`;

  return (
    <div className="admin-card" style={{ padding: "1.125rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8125rem", fontWeight: 800, flexShrink: 0, overflow: "hidden" }}>
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (student?.fullName?.charAt(0).toUpperCase() ?? "?")}
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{student?.fullName ?? "Unknown student"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {review.classId} · reviewed by {teacher?.fullName ?? "Unknown teacher"}
          </div>
        </div>
        <span className={`admin-badge ${review.type === "daily" ? "admin-badge-blue" : review.type === "monthly" ? "admin-badge-info" : "admin-badge-yellow"}`}>{review.type}</span>
        <span className="admin-badge admin-badge-gray">{period}</span>
        <RatingBadge value={review.overallRating} />
        <button
          className="admin-btn admin-btn-ghost"
          style={{ padding: "0.35rem" }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {review.marks.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.75rem" }}>
          {review.marks.map((m, i) => {
            const pct = Math.round((m.obtained / m.total) * 100);
            return (
              <span key={i} style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: `${scoreColor(pct)}18`, color: scoreColor(pct) }}>
                {m.subject}: {m.obtained}/{m.total} ({pct}%)
              </span>
            );
          })}
        </div>
      ) : null}

      {expanded ? (
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8125rem" }}>
            <span style={{ color: "var(--muted)" }}>Academic: <RatingBadge value={review.academicRating} /></span>
            <span style={{ color: "var(--muted)" }}>Behavior: <RatingBadge value={review.behaviorRating} /></span>
            <span style={{ color: "var(--muted)" }}>Participation: <RatingBadge value={review.participationRating} /></span>
          </div>
          {review.notes ? <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--foreground)", lineHeight: 1.55 }}>{review.notes}</p> : null}
          {review.strengths.length > 0 ? (
            <div>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Strengths</div>
              <ul style={{ margin: 0, paddingLeft: "1.125rem", fontSize: "0.8125rem", color: "var(--foreground)" }}>
                {review.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}
          {review.areasForImprovement.length > 0 ? (
            <div>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Areas for improvement</div>
              <ul style={{ margin: 0, paddingLeft: "1.125rem", fontSize: "0.8125rem", color: "var(--foreground)" }}>
                {review.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StudentReviewsView() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/student-reviews/admin/summary"),
      apiFetch("/classes?limit=100"),
    ])
      .then(([summaryData, classesData]) => {
        setSummary(summaryData);
        setClasses(classesData?.items ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Deferred so this doesn't count as a synchronous setState-in-effect (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setReviewsLoading(true);
      const params = new URLSearchParams();
      if (classFilter) params.set("classId", classFilter);
      if (typeFilter) params.set("type", typeFilter);
      apiFetch(`/student-reviews${params.toString() ? `?${params}` : ""}`)
        .then((data) => setReviews(data ?? []))
        .catch(console.error)
        .finally(() => setReviewsLoading(false));
    });
  }, [classFilter, typeFilter]);

  const filteredReviews = useMemo(
    () => reviews.filter((r) => (r.studentId?.fullName ?? "").toLowerCase().includes(search.toLowerCase())),
    [reviews, search],
  );

  const trendData = (summary?.monthlyTrend ?? []).map((row) => ({
    label: `${MONTH_NAMES[row.month - 1]} '${String(row.year).slice(-2)}`,
    avgRating: Math.round(row.avgRating * 10) / 10,
  }));

  const radarData = summary
    ? [
        { subject: "Overall",       value: summary.avgOverall ?? 0 },
        { subject: "Academic",      value: summary.avgAcademic ?? 0 },
        { subject: "Behavior",      value: summary.avgBehavior ?? 0 },
        { subject: "Participation", value: summary.avgParticipation ?? 0 },
      ]
    : [];

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Student Reviews</h2>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Daily and monthly reviews, marks, and ratings submitted by teachers
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading review data…</div>
      ) : !summary || summary.totalReviews === 0 ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "3rem", textAlign: "center",
        }}>
          <Star size={40} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>No reviews yet.</p>
          <p style={{ color: "var(--muted-2)", margin: "0.5rem 0 0", fontSize: "0.8rem" }}>Teachers submit daily and monthly reviews from the Teacher Portal.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
            {[
              { icon: <Users size={20} />, label: "Total Reviews", value: summary.totalReviews, color: "#8b5cf6" },
              { icon: <Star size={20} />, label: "Avg Overall", value: <RatingBadge value={summary.avgOverall} />, color: "#f59e0b" },
              { icon: <TrendingUp size={20} />, label: "Avg Academic", value: <RatingBadge value={summary.avgAcademic} />, color: "#10b981" },
              { icon: <BarChart2 size={20} />, label: "Avg Behavior", value: <RatingBadge value={summary.avgBehavior} />, color: "#0ea5e9" },
              {
                icon: <Award size={20} />,
                label: "Avg Marks",
                value: summary.avgMarksPercentage != null
                  ? <span style={{ color: scoreColor(summary.avgMarksPercentage), fontWeight: 800, fontSize: "1.5rem" }}>{Math.round(summary.avgMarksPercentage)}%</span>
                  : <span style={{ color: "var(--muted)" }}>—</span>,
                color: "#cb444a",
              },
            ].map((c, i) => (
              <div key={i} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "1rem", padding: "1.25rem 1.5rem",
                display: "flex", alignItems: "center", gap: "1rem",
                boxShadow: "var(--elevation-1)",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "0.875rem", flexShrink: 0,
                  background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color,
                }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem", fontWeight: 500 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
                Rating Trend (Monthly)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.625rem", fontSize: "0.8rem" }} />
                  <Bar dataKey="avgRating" name="Avg Rating" fill="#cb444a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
                Category Averages
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Radar dataKey="value" stroke="#cb444a" fill="#cb444a" fillOpacity={0.15} strokeWidth={2} dot />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual reviews */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--foreground)" }}>All Reviews</h3>
              <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                <select className="admin-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ width: 180 }}>
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="admin-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 140 }}>
                  <option value="">All types</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input
                    className="admin-input"
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: "2.25rem", width: 200 }}
                  />
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", padding: "1.5rem 0" }}>Loading reviews…</div>
            ) : filteredReviews.length === 0 ? (
              <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "1rem", padding: "2.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
                No reviews match these filters.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredReviews.map((r) => <ReviewCard key={r._id} review={r} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
