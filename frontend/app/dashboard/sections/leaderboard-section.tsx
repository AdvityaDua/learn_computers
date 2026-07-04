"use client";

import React from "react";
import { Crown, Trophy } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { ProgressBar } from "../../components/ui/progress-bar";
import { SkeletonCardGrid } from "../../components/ui/skeleton";
import { ErrorState } from "../../components/ui/error-state";
import { EmptyState } from "../../components/ui/empty-state";
import { SectionHeader } from "../section-header";
import { useAsync } from "../../lib/use-async";
import { getLeaderboard } from "../../lib/data";
import { useAuth } from "../../context/auth-context";
import { useCurriculum } from "../../context/curriculum-context";
import { resolveAssetUrl } from "../../lib/asset-url";

const MEDAL: Record<number, { tone: "gold" | "silver" | "bronze"; icon: typeof Crown }> = {
  1: { tone: "gold", icon: Crown },
  2: { tone: "silver", icon: Trophy },
  3: { tone: "bronze", icon: Trophy },
};

export function LeaderboardSection() {
  const { profile } = useAuth();
  const { classId } = useCurriculum();
  const { data: entries, loading, error } = useAsync(() => getLeaderboard(classId ?? undefined), [classId], !classId);

  return (
    <div>
      <SectionHeader title="Leaderboard" subtitle="See how you rank against your classmates." />

      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : error ? (
        <ErrorState message={error} />
      ) : !entries || entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No rankings yet" description="Complete lessons and quizzes to appear on the leaderboard!" />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {entries.map((entry) => {
            const isMe = entry.userId === profile?._id;
            const medal = MEDAL[entry.rank];
            return (
              <div
                key={entry._id}
                className={`flex items-center gap-4 px-5 py-3.5 ${isMe ? "bg-primary-soft" : ""}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {medal ? (
                    <medal.icon size={22} style={{ color: `var(--color-${medal.tone})` }} />
                  ) : (
                    <span className="font-[family-name:var(--font-display)] text-base font-bold text-muted">{entry.rank}</span>
                  )}
                </div>
                <Avatar name={entry.fullName} src={resolveAssetUrl(entry.profileImage)} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {entry.fullName} {isMe ? <span className="text-primary">(You)</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.lessonCount}/{entry.totalLessons} lessons · {entry.quizCount}/{entry.totalQuizzes} quizzes
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={entry.completionPercentage} className="max-w-[140px]" />
                    <span className="shrink-0 text-[11px] font-semibold text-muted">{entry.completionPercentage}%</span>
                  </div>
                </div>
                {entry.isTopLearner ? <Badge tone="success">Top Learner</Badge> : null}
                <p className="font-[family-name:var(--font-display)] text-base font-extrabold text-primary">{entry.points}</p>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
