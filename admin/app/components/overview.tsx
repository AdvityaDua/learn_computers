"use client";

import React, { useEffect, useState } from "react";
import {
  Users, HelpCircle, TrendingUp, Award,
  GraduationCap, FileCheck, BarChart2, Layers, Activity,
} from "lucide-react";
import { AdminAuthError, fetchAdmin, apiFetch } from "../lib/admin-api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ── Types ──────────────────────────────────────────────────── */
interface Stats {
  students: number;
  teachers: number;
  content: number;
  quizzes: number;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function SkeletonBox({ h = 20, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) {
  return <div className="admin-skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

const DONUT_COLORS = ["#cb444a", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9"];

function SectionHeader({ icon, title, sub, color = "var(--admin-accent)" }: {
  icon: React.ReactNode; title: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "0.75rem", flexShrink: 0,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center", color,
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 800, color: "var(--foreground)" }}>{title}</h3>
        {sub && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Custom Tooltip ──────────────────────────────────────────── */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "0.75rem", padding: "0.625rem 0.875rem",
      boxShadow: "var(--elevation-3)", fontSize: "0.8125rem", minWidth: 120,
    }}>
      <div style={{ color: "var(--muted)", fontWeight: 600, marginBottom: "0.3rem" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: p.color, fontWeight: 700 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export function OverviewView() {
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, content: 0, quizzes: 0 });
  const [submissionTrend, setSubmissionTrend] = useState<{ date: string; submissions: number; quizzes: number }[]>([]);
  const [scoreBuckets, setScoreBuckets] = useState<{ range: string; count: number }[]>([]);
  const [contentMix, setContentMix] = useState<{ name: string; value: number }[]>([]);
  const [userMix, setUserMix] = useState<{ name: string; value: number }[]>([]);
  const [topLearners, setTopLearners] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<{ total: number; present: number; absent: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const go = async () => {
      try {
        const [users, lessons, materials, quizzes, submissions, leaderboard, attendance] = await Promise.all([
          fetchAdmin("/users").then((r) => (r.ok ? r.json() : [])),
          fetchAdmin("/lessons").then((r) => (r.ok ? r.json() : [])),
          fetchAdmin("/materials").then((r) => (r.ok ? r.json() : [])),
          fetchAdmin("/quizzes").then((r) => (r.ok ? r.json() : [])),
          apiFetch("/progress/admin/submissions").catch(() => []),
          apiFetch("/progress/leaderboard").catch(() => []),
          apiFetch("/attendance/today").catch(() => null),
        ]);

        /* KPI cards */
        const allUsers: any[] = Array.isArray(users) ? users : [];
        const students = allUsers.filter((u) => u.role === "student").length;
        const teachers = allUsers.filter((u) => u.role === "instructor").length;
        const lessonCount = Array.isArray(lessons) ? lessons.length : 0;
        const matCount = Array.isArray(materials) ? materials.length : 0;
        const quizCount = Array.isArray(quizzes) ? quizzes.length : 0;

        setStats({ students, teachers, content: lessonCount + matCount, quizzes: quizCount });

        /* User mix donut */
        const admins = allUsers.filter((u) => u.role === "admin").length;
        setUserMix([
          { name: "Students", value: students },
          { name: "Teachers", value: teachers },
          ...(admins > 0 ? [{ name: "Admins", value: admins }] : []),
        ].filter((x) => x.value > 0));

        /* Content mix donut */
        setContentMix([
          { name: "Lessons", value: lessonCount },
          { name: "Materials", value: matCount },
          { name: "Quizzes", value: quizCount },
        ].filter((x) => x.value > 0));

        /* Top learners */
        if (Array.isArray(leaderboard)) setTopLearners(leaderboard.slice(0, 6));

        /* Attendance */
        if (attendance && attendance.total > 0) setTodayAttendance(attendance);

        /* 7-day submission trend */
        if (Array.isArray(submissions)) {
          const days: Record<string, { submissions: number; quizzes: number }> = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const k = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            days[k] = { submissions: 0, quizzes: 0 };
          }
          (submissions as any[]).forEach((sub) => {
            if (sub.submittedAt) {
              const k = new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              if (days[k]) {
                days[k].submissions++;
                if (sub.type === "quiz") days[k].quizzes++;
              }
            }
          });
          setSubmissionTrend(Object.entries(days).map(([date, v]) => ({ date, ...v })));

          /* Score distribution */
          const buckets = [
            { range: "0–20%", min: 0, max: 20, count: 0 },
            { range: "21–40%", min: 21, max: 40, count: 0 },
            { range: "41–60%", min: 41, max: 60, count: 0 },
            { range: "61–80%", min: 61, max: 80, count: 0 },
            { range: "81–100%", min: 81, max: 100, count: 0 },
          ];
          (submissions as any[]).forEach((sub) => {
            if (sub.score != null && sub.total > 0) {
              const pct = (sub.score / sub.total) * 100;
              const b = buckets.find((b) => pct >= b.min && pct <= b.max);
              if (b) b.count++;
            }
          });
          if (buckets.some((b) => b.count > 0)) {
            setScoreBuckets(buckets.map(({ range, count }) => ({ range, count })));
          }
        }
      } catch (err) {
        if (!(err instanceof AdminAuthError)) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    go();
  }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  /* ── KPI cards config ─────────────────────────────────────── */
  const KPI = [
    { label: "Students", value: stats.students, icon: <Users size={19} strokeWidth={2} />, color: "#cb444a",  glow: "rgba(203,68,74,0.14)",  gradient: "linear-gradient(135deg,#9b2226,#cb444a)" },
    { label: "Teachers",  value: stats.teachers, icon: <GraduationCap size={19} strokeWidth={2} />, color: "#10b981", glow: "rgba(16,185,129,0.14)", gradient: "linear-gradient(135deg,#059669,#10b981)" },
    { label: "Content",   value: stats.content,  icon: <Layers size={19} strokeWidth={2} />,       color: "#f59e0b", glow: "rgba(245,158,11,0.14)", gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
    { label: "Quizzes",   value: stats.quizzes,  icon: <HelpCircle size={19} strokeWidth={2} />,   color: "#8b5cf6", glow: "rgba(139,92,246,0.14)", gradient: "linear-gradient(135deg,#7c3aed,#8b5cf6)" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
        paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {dateStr}
          </p>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.035em", lineHeight: 1.15 }}>
            {greeting}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: "0.375rem 0 0" }}>
            Bagat Puran Singh School for Deaf — Admin Console
          </p>
        </div>
        {todayAttendance && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 0.15rem", fontSize: "0.6875rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Attendance</p>
            <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.03em", lineHeight: 1 }}>{todayAttendance.rate}<span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--muted)" }}>%</span></p>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>{todayAttendance.present} present · {todayAttendance.absent} absent</p>
          </div>
        )}
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {KPI.map((k) => (
          <div key={k.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "0.875rem", padding: "1.375rem 1.5rem",
            display: "flex", flexDirection: "column", gap: "1rem",
            boxShadow: "var(--elevation-1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {k.label}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: "0.625rem",
                background: `${k.color}14`,
                display: "flex", alignItems: "center", justifyContent: "center", color: k.color,
              }}>
                {k.icon}
              </div>
            </div>
            {loading
              ? <SkeletonBox h={38} w={72} r={6} />
              : <span style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {k.value.toLocaleString()}
                </span>
            }
            <div style={{ height: 2, background: k.gradient, borderRadius: 99, opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {/* ── Row 2: Submission trend + Content mix ──────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem", alignItems: "start" }}>

        {/* Submissions area chart */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <SectionHeader
            icon={<TrendingUp size={17} strokeWidth={2.5} />}
            title="Submission Activity"
            sub="All submissions vs quiz completions — last 7 days"
          />
          <div style={{ height: 260 }}>
            {loading ? (
              <SkeletonBox h={260} r={12} />
            ) : submissionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cb444a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#cb444a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradQuiz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted)", fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "1rem" }} />
                  <Area type="monotone" dataKey="submissions" name="All Submissions" stroke="#cb444a" strokeWidth={2.5} fill="url(#gradSub)" dot={{ fill: "#cb444a", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="quizzes" name="Quiz Completions" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradQuiz)" dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                <div style={{ width: 52, height: 52, borderRadius: "1rem", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <TrendingUp size={24} strokeWidth={1.5} />
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>No activity in the last 7 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Content mix donut */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <SectionHeader
            icon={<Layers size={17} strokeWidth={2.5} />}
            title="Content Mix"
            sub="Lessons · Materials · Quizzes"
            color="#f59e0b"
          />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <SkeletonBox h={180} r={99} w={180} />
              <SkeletonBox h={12} />
              <SkeletonBox h={12} w="80%" />
              <SkeletonBox h={12} w="60%" />
            </div>
          ) : contentMix.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={200} height={180}>
                  <Pie data={contentMix} cx={95} cy={85} innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {contentMix.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {contentMix.map((d, i) => {
                  const total = contentMix.reduce((a, c) => a + c.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: DONUT_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--muted)", flex: 1 }}>{d.name}</span>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--foreground)" }}>{d.value}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-2)", width: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--muted)", fontSize: "0.875rem" }}>No content yet</div>
          )}
        </div>
      </div>

      {/* ── Row 3: Quiz scores + User distribution + Attendance ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", alignItems: "start" }}>

        {/* Quiz score distribution */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <SectionHeader
            icon={<FileCheck size={17} strokeWidth={2.5} />}
            title="Score Distribution"
            sub="Quiz submission grades"
            color="#8b5cf6"
          />
          <div style={{ height: 200 }}>
            {loading ? <SkeletonBox h={200} r={10} /> : scoreBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBuckets} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted)" }} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "var(--surface-soft)" }} />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {scoreBuckets.map((_, i) => {
                      const cols = ["#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
                      return <Cell key={i} fill={cols[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <BarChart2 size={28} style={{ color: "var(--muted)" }} strokeWidth={1.5} />
                <p style={{ color: "var(--muted)", fontSize: "0.8125rem", margin: 0 }}>No quiz data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* User distribution donut */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <SectionHeader
            icon={<Users size={17} strokeWidth={2.5} />}
            title="User Breakdown"
            sub="Students · Teachers · Admins"
            color="#10b981"
          />
          {loading ? <SkeletonBox h={200} r={10} /> : userMix.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={190} height={155}>
                  <Pie data={userMix} cx={90} cy={70} innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    {userMix.map((_, i) => <Cell key={i} fill={["#cb444a","#10b981","#8b5cf6"][i % 3]} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                {userMix.map((d, i) => {
                  const clr = ["#cb444a","#10b981","#8b5cf6"][i % 3];
                  const total = userMix.reduce((a, c) => a + c.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: clr, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)", flex: 1 }}>{d.name}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--foreground)" }}>{d.value}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-2)", width: 30, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--muted)", fontSize: "0.875rem" }}>No users yet</div>
          )}
        </div>

        {/* Today's attendance OR platform quick-stats */}
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <SectionHeader
            icon={<Activity size={17} strokeWidth={2.5} />}
            title="Today's Attendance"
            sub="Live snapshot from all classes"
            color="#0ea5e9"
          />
          {loading ? <SkeletonBox h={200} r={10} /> : todayAttendance ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Rate ring */}
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <svg width={120} height={120} viewBox="0 0 120 120">
                    <circle cx={60} cy={60} r={48} fill="none" stroke="var(--border)" strokeWidth={10} />
                    <circle
                      cx={60} cy={60} r={48} fill="none"
                      stroke="#10b981" strokeWidth={10}
                      strokeDasharray={`${(todayAttendance.rate / 100) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>{todayAttendance.rate}%</span>
                    <span style={{ fontSize: "0.625rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Present</span>
                  </div>
                </div>
              </div>
              {[
                { label: "Present", value: todayAttendance.present, color: "#10b981" },
                { label: "Absent",  value: todayAttendance.absent,  color: "#dc2626" },
                { label: "Total",   value: todayAttendance.total,   color: "var(--muted)" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "var(--surface-soft)", borderRadius: "0.625rem", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { label: "Platform Ready", color: "#10b981", icon: "✓" },
                { label: "No attendance marked yet today", color: "var(--muted)", icon: "○" },
                { label: "Teachers mark via the app", color: "var(--muted-2)", icon: "→" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 0.875rem", background: "var(--surface-soft)", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.9rem", color: r.color, fontWeight: 700, width: 18 }}>{r.icon}</span>
                  <span style={{ fontSize: "0.8125rem", color: r.color, fontWeight: 600 }}>{r.label}</span>
                </div>
              ))}
              <div style={{ marginTop: "0.5rem", padding: "1rem", background: "var(--surface-soft)", borderRadius: "0.875rem", border: "1px dashed var(--border)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Attendance data appears here once teachers begin marking</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Top Learners ─────────────────────────────────── */}
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <SectionHeader
          icon={<Award size={17} strokeWidth={2.5} />}
          title="Top Learners"
          sub="Ranked by total points earned on the platform"
          color="#f59e0b"
        />
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "0.75rem" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} h={64} r={10} />)}
          </div>
        ) : topLearners.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "0.75rem" }}>
            {topLearners.map((user, idx) => {
              const colors = ["#f59e0b","#94a3b8","#b45309"];
              const gradients = [
                "linear-gradient(135deg,#f59e0b,#fbbf24)",
                "linear-gradient(135deg,#94a3b8,#cbd5e1)",
                "linear-gradient(135deg,#b45309,#d97706)",
              ];
              const medals = ["🥇","🥈","🥉"];
              const isTop3 = idx < 3;
              const maxPts = topLearners[0]?.points || 1;
              const pct = Math.round(((user.points || 0) / maxPts) * 100);

              return (
                <div
                  key={user.userId || idx}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    background: isTop3 ? `${colors[idx]}08` : "var(--surface-soft)",
                    borderRadius: "0.875rem",
                    border: `1px solid ${isTop3 ? `${colors[idx]}20` : "var(--border)"}`,
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: isTop3 ? gradients[idx] : "var(--surface)",
                    border: isTop3 ? "none" : "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isTop3 ? "1rem" : "0.75rem",
                    fontWeight: 800, color: isTop3 ? "#fff" : "var(--muted)",
                  }}>
                    {isTop3 ? medals[idx] : (idx + 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.fullName || "—"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: isTop3 ? gradients[idx] : "var(--admin-accent)", borderRadius: 99, transition: "width 0.6s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", flexShrink: 0 }}>
                        {(user.points || 0).toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            <Award size={36} strokeWidth={1.5} style={{ marginBottom: "0.75rem", opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No learners ranked yet. Data will appear once students complete quizzes.</p>
          </div>
        )}
      </div>

    </div>
  );
}
