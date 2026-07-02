"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";
import { CalendarCheck, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";

type AttendanceSummary = {
  total: number; present: number; absent: number;
  late: number; excused: number; rate: number;
  trend: { date: string; present: number; absent: number; late: number }[];
  month: number; year: number;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#10b981","#f43f5e","#f59e0b","#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  present: "#10b981", absent: "#f43f5e", late: "#f59e0b", excused: "#8b5cf6",
};

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "1rem", padding: "1.25rem 1.5rem",
      display: "flex", alignItems: "center", gap: "1rem",
      boxShadow: "var(--elevation-1)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "0.875rem", flexShrink: 0,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
        color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem", fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export function AttendanceView() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    apiFetch(`/attendance/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then((d: AttendanceSummary) => { setSummary(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pieData = summary
    ? [
        { name: "Present", value: summary.present },
        { name: "Absent",  value: summary.absent },
        { name: "Late",    value: summary.late },
        { name: "Excused", value: summary.excused },
      ].filter((d) => d.value > 0)
    : [];

  const trendData = (summary?.trend ?? []).map((t) => ({
    date: t.date.slice(5),
    present: t.present, absent: t.absent, late: t.late,
  }));

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Attendance</h2>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          {MONTHS[(summary?.month ?? new Date().getMonth() + 1) - 1]} {summary?.year ?? new Date().getFullYear()} — class-wide summary
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading attendance data…</div>
      ) : !summary || summary.total === 0 ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: "3rem", textAlign: "center",
        }}>
          <CalendarCheck size={40} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>No attendance records for this month.</p>
          <p style={{ color: "var(--muted-2)", margin: "0.5rem 0 0", fontSize: "0.8rem" }}>Teachers mark attendance via the app.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
            <StatCard icon={<TrendingUp size={20} />} label="Attendance Rate" value={`${summary.rate}%`} color="#10b981" />
            <StatCard icon={<UserCheck size={20} />} label="Present" value={summary.present} color="#10b981" />
            <StatCard icon={<UserX size={20} />} label="Absent" value={summary.absent} color="#f43f5e" />
            <StatCard icon={<Clock size={20} />} label="Late" value={summary.late} color="#f59e0b" />
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "start" }}>
            {/* Bar trend */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.5rem",
            }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
                Daily Trend
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.625rem", fontSize: "0.8rem" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="absent"  name="Absent"  fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="late"    name="Late"    fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie breakdown */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "1rem", padding: "1.5rem", minWidth: 240,
            }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)" }}>
                Breakdown
              </h3>
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={95} cy={95} innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: "0.8rem" }} />
              </PieChart>
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ color: "var(--muted)", flex: 1 }}>{d.name}</span>
                    <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
