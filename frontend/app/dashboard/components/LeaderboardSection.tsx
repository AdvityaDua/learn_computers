"use client";

import React from "react";
import type { LeaderboardUser } from "./types";

interface LeaderboardSectionProps {
  leaderboard: LeaderboardUser[];
}

export default function LeaderboardSection({
  leaderboard,
}: LeaderboardSectionProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6">
      <div className="mb-6 animate-fade-up">
        <h2 className="text-3xl font-black tracking-tight">Leaderboard</h2>
        <p className="theme-muted mt-1 text-sm">
          Top users ranked by weighted content contribution.
        </p>
      </div>
      <div className="panel rounded-2xl p-4 animate-fade-up">
        <div className="space-y-2">
          {leaderboard.length === 0 && (
            <p className="theme-muted text-sm">
              No leaderboard data available yet.
            </p>
          )}
          {leaderboard.map((row, idx) => (
            <div
              key={row.userId}
              className="theme-surface-soft flex items-center justify-between rounded-xl border theme-border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-fade-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black flex-shrink-0 ${
                    idx === 0
                      ? "bg-amber-400 text-amber-900"
                      : idx === 1
                      ? "bg-slate-300 text-slate-700"
                      : idx === 2
                      ? "bg-orange-300 text-orange-900"
                      : "accent-bg"
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold">{row.fullName}</p>
                  <p className="theme-muted text-xs">
                    {row.lessonCount} lessons · {row.quizCount} quizzes ·{" "}
                    {row.assignmentCount} assignments · {row.activityCount}{" "}
                    activities
                  </p>
                </div>
              </div>
              <p className="accent-text text-sm font-black flex-shrink-0 ml-4">
                {row.score} pts
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
