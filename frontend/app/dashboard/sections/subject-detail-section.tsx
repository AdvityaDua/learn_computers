"use client";

import React from "react";
import { CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { useCurriculum } from "../../context/curriculum-context";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ProgressBar } from "../../components/ui/progress-bar";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { SubjectBadge } from "../../components/subject-badge";
import { SectionHeader } from "../section-header";
import { chapterCompletedCount, chapterLessonCount } from "../../lib/curriculum-utils";
import type { DashboardView } from "../view";

export function SubjectDetailSection({
  subjectId,
  onNavigate,
}: {
  subjectId: string;
  onNavigate: (view: DashboardView) => void;
}) {
  const { subjects, chaptersBySubject, progress, loading } = useCurriculum();
  const subject = subjects.find((s) => s._id === subjectId);
  const chapters = chaptersBySubject[subjectId] ?? [];
  const completedLessonIds = progress?.completedLessonIds ?? [];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title={subject?.name ?? "Subject"}
        subtitle={subject?.description || "Work through each course, step by step."}
        onBack={() => onNavigate({ name: "subjects" })}
        action={subject ? <SubjectBadge icon={subject.icon} /> : undefined}
      />

      {chapters.length === 0 ? (
        <EmptyState icon={Layers} title="No courses yet" description="This subject doesn't have any courses added yet." />
      ) : (
        <ol className="flex flex-col gap-4">
          {chapters.map((chapter, idx) => {
            const total = chapterLessonCount(chapter);
            const completed = chapterCompletedCount(chapter, completedLessonIds);
            const isDone = total > 0 && completed === total;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <li key={chapter._id}>
                <Card
                  interactive
                  className="flex items-center gap-4 p-5"
                  onClick={() => onNavigate({ name: "chapter", subjectId, chapterId: chapter._id })}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-lg font-extrabold ${
                      isDone ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={22} /> : idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-[family-name:var(--font-display)] text-base font-bold">{chapter.title}</p>
                      {isDone ? <Badge tone="success">Done</Badge> : null}
                    </div>
                    {chapter.description ? (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">{chapter.description}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={pct} className="max-w-[180px]" />
                      <span className="text-xs font-semibold text-muted">
                        {completed}/{total} lessons
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="shrink-0 text-muted" />
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
