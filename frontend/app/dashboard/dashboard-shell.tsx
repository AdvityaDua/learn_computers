"use client";

import React, { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { navKeyFor, type DashboardView } from "./view";
import { HomeSection } from "./sections/home-section";
import { SubjectsSection } from "./sections/subjects-section";
import { SubjectDetailSection } from "./sections/subject-detail-section";
import { CourseSection } from "./sections/course-section";
import { QuizSection } from "./sections/quiz-section";
import { LeaderboardSection } from "./sections/leaderboard-section";
import { DeadlinesSection } from "./sections/deadlines-section";
import { ProfileSection } from "./sections/profile-section";

export function DashboardShell() {
  const [view, setView] = useState<DashboardView>({ name: "home" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (next: DashboardView) => setView(next);

  // Course/lesson/quiz get their own immersive, full-width screen — the main app
  // sidebar and nav chrome step aside so the course's own curriculum sidebar is
  // the only navigation on screen, like a dedicated course player.
  if (view.name === "chapter" || view.name === "lesson" || view.name === "quiz") {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
          <button
            onClick={() => navigate({ name: "subject", subjectId: view.subjectId })}
            aria-label="Exit course"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-surface-soft"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <GraduationCap size={15} />
            </div>
            <p className="font-[family-name:var(--font-display)] text-base font-extrabold">Learn Computers</p>
          </div>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl animate-pop-in">
            {(view.name === "chapter" || view.name === "lesson") && (
              <CourseSection
                subjectId={view.subjectId}
                chapterId={view.chapterId}
                initialLessonId={view.name === "lesson" ? view.lessonId : undefined}
                onNavigate={navigate}
              />
            )}
            {view.name === "quiz" && (
              <QuizSection
                subjectId={view.subjectId}
                chapterId={view.chapterId}
                lessonId={view.lessonId}
                quizId={view.quizId}
                onNavigate={navigate}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden shrink-0 lg:block">
        <Sidebar active={navKeyFor(view)} onNavigate={navigate} />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10 animate-pop-in">
            <Sidebar active={navKeyFor(view)} onNavigate={navigate} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-surface-soft"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="font-[family-name:var(--font-display)] text-base font-extrabold">Learn Computers</p>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl animate-pop-in">
            {view.name === "home" && <HomeSection onNavigate={navigate} />}
            {view.name === "subjects" && <SubjectsSection onNavigate={navigate} />}
            {view.name === "subject" && <SubjectDetailSection subjectId={view.subjectId} onNavigate={navigate} />}
            {view.name === "leaderboard" && <LeaderboardSection />}
            {view.name === "deadlines" && <DeadlinesSection onNavigate={navigate} />}
            {view.name === "profile" && <ProfileSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
