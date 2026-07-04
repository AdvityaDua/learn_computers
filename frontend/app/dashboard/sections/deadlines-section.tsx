"use client";

import React, { useMemo } from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { SkeletonCardGrid } from "../../components/ui/skeleton";
import { ErrorState } from "../../components/ui/error-state";
import { EmptyState } from "../../components/ui/empty-state";
import { SectionHeader } from "../section-header";
import { ITEM_TYPE_META } from "../item-type-icon";
import { useAsync } from "../../lib/use-async";
import { getStudentDeadlines } from "../../lib/data";
import { useCurriculum } from "../../context/curriculum-context";
import { resolveDeadlineTitles } from "../../lib/curriculum-utils";
import type { DashboardView } from "../view";

function daysUntil(dueDate: string) {
  const diff = new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diff / 86_400_000);
}

function dueBadge(days: number) {
  if (days < 0) return { tone: "danger" as const, label: "Overdue" };
  if (days === 0) return { tone: "warning" as const, label: "Due today" };
  if (days === 1) return { tone: "warning" as const, label: "Due tomorrow" };
  return { tone: "neutral" as const, label: `${days} days left` };
}

export function DeadlinesSection({ onNavigate }: { onNavigate: (view: DashboardView) => void }) {
  const { chaptersBySubject, loading: curriculumLoading } = useCurriculum();
  const { data: deadlines, loading, error } = useAsync(() => getStudentDeadlines(), []);

  const resolved = useMemo(
    () => (deadlines ? resolveDeadlineTitles(chaptersBySubject, deadlines) : []),
    [deadlines, chaptersBySubject],
  );

  const isLoading = loading || curriculumLoading;

  return (
    <div>
      <SectionHeader title="Due Soon" subtitle="Quizzes, assignments, and activities with a deadline." />

      {isLoading ? (
        <SkeletonCardGrid count={3} />
      ) : error ? (
        <ErrorState message={error} />
      ) : resolved.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing due" description="You're all caught up — nothing on the calendar right now." />
      ) : (
        <ul className="flex flex-col gap-3">
          {resolved.map((d) => {
            const meta = ITEM_TYPE_META[d.taskType];
            const Icon = meta.icon;
            const badge = dueBadge(daysUntil(d.dueDate));
            const canNavigate = d.subjectId && d.chapterId && d.lessonId;
            return (
              <li key={`${d.taskType}-${d.taskId}`}>
                <Card
                  interactive={Boolean(canNavigate)}
                  className="flex items-center gap-4 p-4"
                  onClick={
                    canNavigate
                      ? () =>
                          onNavigate({
                            name: "lesson",
                            subjectId: d.subjectId!,
                            chapterId: d.chapterId!,
                            lessonId: d.lessonId!,
                          })
                      : undefined
                  }
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft ${meta.tone}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{d.title}</p>
                    <p className="text-xs text-muted">
                      {meta.label} · Due {new Date(d.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {canNavigate ? <ChevronRight size={18} className="shrink-0 text-muted" /> : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
