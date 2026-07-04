"use client";

import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { useCurriculum } from "../../context/curriculum-context";
import { Card } from "../../components/ui/card";
import { ProgressBar } from "../../components/ui/progress-bar";
import { SkeletonCardGrid } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/error-state";
import { SubjectBadge } from "../../components/subject-badge";
import { SectionHeader } from "../section-header";
import { subjectCompletedCount, subjectLessonCount } from "../../lib/curriculum-utils";
import type { DashboardView } from "../view";

export function SubjectsSection({ onNavigate }: { onNavigate: (view: DashboardView) => void }) {
  const { subjects, chaptersBySubject, progress, loading, error } = useCurriculum();

  return (
    <div>
      <SectionHeader title="My Subjects" subtitle="Pick a subject to see its courses and lessons." />

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" description="Your teacher hasn't added any subjects for your class yet. Check back soon!" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const chapters = chaptersBySubject[subject._id] ?? [];
            const total = subjectLessonCount(chapters);
            const completed = subjectCompletedCount(chapters, progress?.completedLessonIds ?? []);
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card
                key={subject._id}
                interactive
                className="flex flex-col gap-4 p-5"
                onClick={() => onNavigate({ name: "subject", subjectId: subject._id })}
              >
                <div className="flex items-start justify-between">
                  <SubjectBadge icon={subject.icon} />
                  <ChevronRight size={18} className="mt-2 text-muted" />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold">{subject.name}</p>
                  {subject.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{subject.description}</p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted">{chapters.length} course{chapters.length === 1 ? "" : "s"}</p>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
