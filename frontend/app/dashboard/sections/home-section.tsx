"use client";

import React, { useMemo } from "react";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, Flame, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { useCurriculum } from "../../context/curriculum-context";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ProgressRing } from "../../components/ui/progress-ring";
import { SkeletonCardGrid } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { SubjectBadge } from "../../components/subject-badge";
import { findNextLesson, resolveDeadlineTitles } from "../../lib/curriculum-utils";
import { useAsync } from "../../lib/use-async";
import { getStudentDeadlines } from "../../lib/data";
import type { DashboardView } from "../view";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeSection({ onNavigate }: { onNavigate: (view: DashboardView) => void }) {
  const { profile } = useAuth();
  const { subjects, chaptersBySubject, progress, loading } = useCurriculum();
  const { data: deadlines } = useAsync(() => getStudentDeadlines(), []);

  const nextLesson = useMemo(
    () => findNextLesson(subjects, chaptersBySubject, progress?.completedLessonIds ?? []),
    [subjects, chaptersBySubject, progress],
  );

  const upcomingDeadlines = useMemo(
    () => (deadlines ? resolveDeadlineTitles(chaptersBySubject, deadlines).slice(0, 3) : []),
    [deadlines, chaptersBySubject],
  );

  const firstName = (profile?.fullName ?? "there").split(" ")[0];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-28 animate-pulse rounded-lg bg-surface-soft" />
        <SkeletonCardGrid count={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
              <Sparkles size={16} /> {greeting()}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
              Hey {firstName}, ready to learn? 🚀
            </h1>
            <p className="mt-1 text-sm text-muted">Let&apos;s pick up right where you left off.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-warning-soft px-4 py-2 text-warning">
            <Flame size={18} />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">{profile?.points ?? 0}</span>
            <span className="text-sm font-semibold">points</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <ProgressRing value={progress?.completionPercentage ?? 0} size={64} strokeWidth={7} />
          <div>
            <p className="text-sm font-semibold text-muted">Overall progress</p>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              {progress?.completionPercentage ?? 0}% complete
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Lessons done</p>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              {progress?.completedLessons ?? 0} / {progress?.totalLessons ?? 0}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info-soft text-info">
            <Trophy size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">Quizzes aced</p>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              {progress?.completedQuizzes ?? 0} / {progress?.totalQuizzes ?? 0}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <p className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold">Continue learning</p>
          {nextLesson ? (
            <button
              onClick={() =>
                onNavigate({
                  name: "lesson",
                  subjectId: nextLesson.subject._id,
                  chapterId: nextLesson.chapter._id,
                  lessonId: nextLesson.lessonId,
                })
              }
              className="flex w-full items-center gap-4 rounded-lg border border-border bg-surface-soft p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <SubjectBadge icon={nextLesson.subject.icon} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">
                  {nextLesson.subject.name} · {nextLesson.chapter.title}
                </p>
                <p className="truncate font-[family-name:var(--font-display)] text-base font-bold">{nextLesson.lessonTitle}</p>
              </div>
              <ArrowRight size={20} className="shrink-0 text-primary" />
            </button>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description="Your teacher hasn't added any subjects for your class yet. Check back soon!"
            />
          ) : (
            <EmptyState icon={CheckCircle2} title="All caught up!" description="You've finished every lesson available right now. Amazing work!" />
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">Due soon</p>
            <button onClick={() => onNavigate({ name: "deadlines" })} className="text-xs font-semibold text-primary hover:underline">
              See all
            </button>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted">Nothing due right now — you&apos;re on top of it!</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingDeadlines.map((d) => (
                <li key={`${d.taskType}-${d.taskId}`} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                    <CalendarClock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="text-xs text-muted">Due {new Date(d.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {subjects.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">Your subjects</p>
            <Button variant="ghost" size="sm" onClick={() => onNavigate({ name: "subjects" })}>
              View all <ArrowRight size={15} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.slice(0, 3).map((subject) => (
              <button
                key={subject._id}
                onClick={() => onNavigate({ name: "subject", subjectId: subject._id })}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              >
                <SubjectBadge icon={subject.icon} size="sm" />
                <p className="truncate font-[family-name:var(--font-display)] font-bold">{subject.name}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
