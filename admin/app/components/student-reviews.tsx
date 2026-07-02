"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";
import { Star, TrendingUp, Users, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";

type ReviewSummary = {
  totalReviews: number;
  avgOverall: number;
  avgAcademic: number;
  avgBehavior: number;
  avgParticipation: number;
  monthlyTrend: { month: string; avgRating: number; count: number }[];
};

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

export function StudentReviewsView() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/student-reviews/admin/summary")
      .then((d: ReviewSummary) => { setSummary(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const radarData = summary
    ? [
        { subject: "Overall",       value: summary.avgOverall },
        { subject: "Academic",      value: summary.avgAcademic },
        { subject: "Behavior",      value: summary.avgBehavior },
        { subject: "Participation", value: summary.avgParticipation },
      ]
    : [];

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Student Reviews</h2>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Daily and monthly reviews submitted by teachers
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
          <p style={{ color: "var(--muted-2)", margin: "0.5rem 0 0", fontSize: "0.8rem" }}>Teachers submit daily and monthly reviews from the app.</p>
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
            {/* Monthly trend */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.5rem",
            }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
                Rating Trend (Monthly)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summary.monthlyTrend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.625rem", fontSize: "0.8rem" }}
                  />
                  <Bar dataKey="avgRating" name="Avg Rating" fill="#cb444a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar: category averages */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.5rem",
            }}>
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
        </>
      )}
    </div>
  );
}
