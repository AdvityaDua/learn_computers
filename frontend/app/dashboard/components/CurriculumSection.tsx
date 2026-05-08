"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  PlayCircle,
} from "lucide-react";
import type { Chapter, LessonProgressSummary } from "./types";
import { API_BASE } from "./types";

interface CurriculumSectionProps {
  chapters: Chapter[];
  lessonProgress: LessonProgressSummary;
  completedLessonSet: Set<string>;
}

export default function CurriculumSection({
  chapters,
  lessonProgress,
  completedLessonSet,
}: CurriculumSectionProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight">
            Course Curriculum
          </h2>
          <p className="theme-muted mt-1 text-sm">
            Your complete learning path — track progress chapter by chapter.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold">
          <span className="accent-text">
            {lessonProgress.completionPercentage}%
          </span>
          <span className="theme-muted">complete</span>
        </div>
      </div>

      {/* Macro progress bar */}
      <div className="panel rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-black text-lg">
              {lessonProgress.completionPercentage}% Complete
            </p>
            <p className="theme-muted text-xs mt-0.5">
              {lessonProgress.completedLessons} of {lessonProgress.totalLessons}{" "}
              lessons done
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold accent-text">
              {lessonProgress.pendingLessons} remaining
            </p>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-soft)] relative">
          <div
            className="h-full rounded-full bg-[var(--accent)] progress-bar-animated"
            style={{
              width: `${lessonProgress.completionPercentage}%`,
              ["--progress-target" as string]: `${lessonProgress.completionPercentage}%`,
            }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-xs theme-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            Pending
          </span>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-8">
        {chapters.length === 0 && (
          <div className="panel rounded-2xl p-10 text-center animate-fade-up">
            <BookOpen size={32} className="theme-muted mx-auto mb-3" />
            <p className="font-bold">No chapters published yet.</p>
          </div>
        )}
        {chapters.map((chapter, cidx) => {
          const chapterLessons = (chapter.lessons || []).slice();
          const chapterTotal = chapterLessons.length;
          const chapterDone = chapterLessons.filter((l) =>
            completedLessonSet.has(l._id)
          ).length;
          const chapterPct =
            chapterTotal > 0
              ? Math.round((chapterDone / chapterTotal) * 100)
              : 0;

          return (
            <article
              key={chapter._id}
              className="animate-fade-up"
              style={{ animationDelay: `${cidx * 80}ms` }}
            >
              {/* Chapter header */}
              <div className="flex flex-col md:flex-row md:items-center gap-5 mb-6 group/chapter">
                <div className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-[2rem] overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)] shadow-inner transition-transform duration-500 group-hover/chapter:scale-105">
                  {chapter.coverImageFilePath ? (
                    <img
                      src={`${API_BASE}${chapter.coverImageFilePath}`}
                      alt={chapter.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center accent-soft-bg">
                      <Layers size={32} className="accent-text" />
                    </div>
                  )}
                  {/* Progress ring overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 80 80"
                      className="chapter-progress-ring rotate-[-90deg]"
                      style={{ position: "absolute" }}
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="chapter-progress-ring-track"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="chapter-progress-ring-fill transition-all duration-1000 ease-out"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={226.2}
                        strokeDashoffset={
                          226.2 - (chapterPct / 100) * 226.2
                        }
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] theme-muted opacity-60">
                      Chapter {cidx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-colors duration-300 ${
                        chapterPct === 100
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20"
                          : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--border)]"
                      }`}
                    >
                      {chapterPct === 100
                        ? "Mastered"
                        : `${chapterDone}/${chapterTotal} Completed`}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter mb-1.5 transition-colors group-hover/chapter:text-[var(--accent)]">
                    {chapter.title}
                  </h3>
                  {chapter.description && (
                    <p className="theme-muted text-sm line-clamp-2 max-w-2xl leading-relaxed opacity-80 font-medium">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Lesson cards grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chapterLessons.map((lesson, lidx) => {
                  const isCompleted = completedLessonSet.has(lesson._id);
                  const itemCount = lesson.items?.length || 0;
                  return (
                    <Link
                      href={`/dashboard/lessons/${chapter._id}/${lesson._id}`}
                      key={lesson._id}
                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border theme-border bg-[var(--surface)] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fade-up"
                      style={{
                        animationDelay: `${(cidx * 4 + lidx) * 60 + 100}ms`,
                      }}
                    >
                      {/* Card Media */}
                      <div className="relative overflow-hidden aspect-[16/10]">
                        {lesson.coverImageFilePath ? (
                          <img
                            src={`${API_BASE}${lesson.coverImageFilePath}`}
                            alt={lesson.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center opacity-80"
                            style={{
                              background: `linear-gradient(135deg, hsl(${(cidx * 47 + lidx * 29) % 360},60%,90%) 0%, hsl(${(cidx * 47 + lidx * 29 + 40) % 360},50%,85%) 100%)`,
                            }}
                          >
                            <BookOpen
                              size={32}
                              style={{
                                color: `hsl(${(cidx * 47 + lidx * 29) % 360},50%,40%)`,
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-[var(--accent)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Status badge */}
                        <div className="absolute top-4 right-4 z-10">
                          {isCompleted ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 border border-emerald-400/20">
                              <CheckCircle2 size={12} /> COMPLETED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
                              PENDING
                            </span>
                          )}
                        </div>

                        {/* Hover play */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-2xl">
                            <PlayCircle
                              size={28}
                              className="text-[var(--accent)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h4 className="font-black text-base leading-tight tracking-tight mb-4 group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-2">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest theme-muted opacity-60">
                            <span className="flex items-center gap-1.5">
                              <FileText size={12} /> {itemCount}{" "}
                              {itemCount === 1 ? "item" : "items"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <BookOpen size={12} /> L{lidx + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black accent-text uppercase tracking-widest group/btn">
                            <span>Continue</span>
                            <ArrowRight
                              size={14}
                              className="transition-transform group-hover/btn:translate-x-1"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
