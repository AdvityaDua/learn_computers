"use client";

import React from "react";
import {
  BarChart3,
  BookOpen,
  Flame,
  Layers,
  Award,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "./StatCard";
import type { LeaderboardUser } from "./types";

interface OverviewStats {
  totalContent: number;
  mixedItems: number;
  lessonItems: number;
  dueSoon: number;
  overdue: number;
  avgQuestions: number;
}

interface OverviewSectionProps {
  firstName: string;
  stats: OverviewStats;
  weeklyTrend: { label: string; count: number }[];
  contentMix: { name: string; value: number; color: string }[];
  dueBuckets: { name: string; value: number }[];
  leaderboard: LeaderboardUser[];
}

export default function OverviewSection({
  firstName,
  stats,
  weeklyTrend,
  contentMix,
  dueBuckets,
  leaderboard,
}: OverviewSectionProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6">
      <div className="mb-6 animate-fade-up">
        <h2 className="text-3xl font-black tracking-tight">
          Welcome back, {firstName} 👋
        </h2>
        <p className="theme-muted mt-1 text-sm">
          Here&apos;s your learning summary at a glance.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          delay={0}
          label="Total Content"
          value={stats.totalContent}
          subtitle="Across learning modules"
          icon={<BookOpen size={18} />}
        />
        <StatCard
          delay={80}
          label="Curriculum Nodes"
          value={stats.mixedItems}
          subtitle={`${stats.lessonItems} lessons mapped`}
          icon={<Layers size={18} />}
        />
        <StatCard
          delay={160}
          label="Due Soon"
          value={stats.dueSoon}
          subtitle={`${stats.overdue} overdue`}
          icon={<Flame size={18} />}
        />
        <StatCard
          delay={240}
          label="Avg Quiz Depth"
          value={stats.avgQuestions}
          subtitle="Questions per quiz"
          icon={<BarChart3 size={18} />}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="panel rounded-2xl p-4 xl:col-span-3">
          <h3 className="text-base font-black">Weekly Content Growth</h3>
          <p className="theme-muted mb-3 text-xs">
            New learning assets published in recent weeks
          </p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--accent)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip />
                <Area
                  dataKey="count"
                  stroke="var(--accent)"
                  fillOpacity={1}
                  fill="url(#growth)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel rounded-2xl p-4 xl:col-span-2">
          <h3 className="text-base font-black">Content Mix</h3>
          <p className="theme-muted mb-3 text-xs">
            Distribution by content type
          </p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={contentMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {contentMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="panel rounded-2xl p-4 xl:col-span-2">
          <h3 className="text-base font-black">Due Work Monitor</h3>
          <p className="theme-muted mb-3 text-xs">
            Track assignment and activity deadlines
          </p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={dueBuckets}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="var(--accent)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel rounded-2xl p-4 xl:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-black">Top Contributor Leaderboard</h3>
            <span className="admin-badge admin-badge-blue flex items-center gap-1">
              <Award size={12} /> Ranked by contribution
            </span>
          </div>
          <div className="space-y-2">
            {leaderboard.length === 0 && (
              <p className="theme-muted text-sm">No leaderboard data yet.</p>
            )}
            {leaderboard.map((row, idx) => (
              <div
                key={row.userId}
                className="theme-surface-soft flex items-center justify-between rounded-xl border theme-border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="accent-bg grid h-6 w-6 place-items-center rounded-full text-xs font-black">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{row.fullName}</p>
                    <p className="theme-muted text-xs">
                      {row.contentCount} assets
                    </p>
                  </div>
                </div>
                <p className="accent-text text-sm font-black">{row.score} pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
