"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";
import { Briefcase, CheckCircle, Clock, BookOpen, Activity } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

type WorkSummary = {
  delivered: number;
  inProgress: number;
  completed: number;
  assignments: number;
  activities: number;
  recentActivity: {
    _id: string;
    type: string;
    contentTitle: string;
    status: string;
    deliveredAt: string;
    teacherId?: { fullName?: string };
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  delivered:   "#0ea5e9",
  in_progress: "#f59e0b",
  completed:   "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  delivered:   "Delivered",
  in_progress: "In Progress",
  completed:   "Completed",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span style={{
      display: "inline-block", padding: "0.2rem 0.625rem",
      borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700,
      background: `${color}18`, color,
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function TeacherWorkView() {
  const [summary, setSummary] = useState<WorkSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/teacher-work/admin/summary")
      .then((d: WorkSummary) => { setSummary(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const barData = summary
    ? [
        { name: "Delivered",   count: summary.delivered },
        { name: "In Progress", count: summary.inProgress },
        { name: "Completed",   count: summary.completed },
      ]
    : [];

  const typeData = summary
    ? [
        { name: "Assignments", count: summary.assignments },
        { name: "Activities",  count: summary.activities },
      ]
    : [];

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Teacher Work Logs</h2>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Assignments and activities delivered across all classes
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading work log data…</div>
      ) : !summary || (summary.delivered + summary.inProgress + summary.completed) === 0 ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "3rem", textAlign: "center",
        }}>
          <Briefcase size={40} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>No work logs yet.</p>
          <p style={{ color: "var(--muted-2)", margin: "0.5rem 0 0", fontSize: "0.8rem" }}>Teachers log delivered assignments and activities from the app.</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {[
              { icon: <Briefcase size={20} />,   label: "Delivered",    value: summary.delivered,   color: "#0ea5e9" },
              { icon: <Clock size={20} />,        label: "In Progress",  value: summary.inProgress,  color: "#f59e0b" },
              { icon: <CheckCircle size={20} />,  label: "Completed",    value: summary.completed,   color: "#10b981" },
              { icon: <BookOpen size={20} />,     label: "Assignments",  value: summary.assignments, color: "#8b5cf6" },
              { icon: <Activity size={20} />,     label: "Activities",   value: summary.activities,  color: "#cb444a" },
            ].map((c, i) => (
              <div key={i} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "1rem", padding: "1.25rem",
                display: "flex", alignItems: "center", gap: "0.875rem",
                boxShadow: "var(--elevation-1)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "0.75rem", flexShrink: 0,
                  background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color,
                }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>By Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: "0.8rem" }} />
                  <Bar dataKey="count" name="Count" fill="#cb444a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>By Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: "0.8rem" }} />
                  <Bar dataKey="count" name="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent activity table */}
          {summary.recentActivity.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>Recent Activity</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Content</th><th>Type</th><th>Teacher</th><th>Status</th><th>Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentActivity.map((log) => (
                      <tr key={log._id}>
                        <td style={{ fontWeight: 600, color: "var(--foreground)" }}>{log.contentTitle}</td>
                        <td style={{ textTransform: "capitalize", color: "var(--muted)" }}>{log.type}</td>
                        <td style={{ color: "var(--muted)" }}>{log.teacherId?.fullName ?? "—"}</td>
                        <td><StatusBadge status={log.status} /></td>
                        <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
                          {new Date(log.deliveredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
