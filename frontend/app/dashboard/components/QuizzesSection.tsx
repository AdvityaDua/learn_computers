"use client";

import React, { useState, useMemo } from "react";
import { ArrowRight, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterBar from "./FilterBar";
import type { Chapter, Quiz, ContentLocation } from "./types";
import { fmtDate } from "./types";

interface QuizzesSectionProps {
  quizzes: Quiz[];
  chapters: Chapter[];
  contentMap: Map<string, ContentLocation>;
}

export default function QuizzesSection({
  quizzes,
  chapters,
  contentMap,
}: QuizzesSectionProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");

  const allChapters = useMemo(
    () =>
      Array.from(
        new Set(
          quizzes
            .map((q) => contentMap.get(q._id)?.chapterId)
            .filter(Boolean)
        )
      ) as string[],
    [quizzes, contentMap]
  );

  const lessonsForChapter = useMemo(
    () =>
      chapterFilter
        ? (Array.from(
            new Set(
              quizzes
                .filter(
                  (q) => contentMap.get(q._id)?.chapterId === chapterFilter
                )
                .map((q) => contentMap.get(q._id)?.lessonId)
                .filter(Boolean)
            )
          ) as string[])
        : [],
    [quizzes, contentMap, chapterFilter]
  );

  const filtered = useMemo(
    () =>
      quizzes.filter((q) => {
        const loc = contentMap.get(q._id);
        if (search && !q.title.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (chapterFilter && loc?.chapterId !== chapterFilter) return false;
        if (lessonFilter && loc?.lessonId !== lessonFilter) return false;
        return true;
      }),
    [quizzes, contentMap, search, chapterFilter, lessonFilter]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black tracking-tight">Quiz Bank</h2>
        <p className="theme-muted mt-1 text-sm">
          Practice-ready quizzes — click any card to start.
        </p>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search quizzes…"
        chapterFilter={chapterFilter}
        onChapterFilter={setChapterFilter}
        lessonFilter={lessonFilter}
        onLessonFilter={setLessonFilter}
        chapters={chapters}
        chapterIds={allChapters}
        lessonIds={lessonsForChapter}
        count={filtered.length}
        noun={`quiz${filtered.length !== 1 ? "zes" : ""}`}
      />

      {filtered.length === 0 && (
        <div className="panel rounded-2xl p-10 text-center theme-muted text-sm">
          No quizzes match your filters.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((q, idx) => {
          const loc = contentMap.get(q._id);
          const href = loc
            ? `/dashboard/lessons/${loc.chapterId}/${loc.lessonId}?ref=${q._id}`
            : undefined;
          const qCount = q.questions?.length || 0;
          const scorePct = Math.min(100, Math.round((qCount / 10) * 100));
          return (
            <article
              key={q._id}
              onClick={() => href && router.push(href)}
              className={`group relative overflow-hidden rounded-[2rem] border theme-border bg-[var(--surface)] p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 animate-fade-up ${
                href ? "cursor-pointer" : ""
              }`}
              style={{ animationDelay: `${idx * 45}ms` }}
            >
              {/* Accent glow on hover */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[2rem]" style={{ background: `radial-gradient(circle at 50% 0%, var(--accent)15, transparent 70%)` }} />

              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem-1px)] bg-[var(--surface)]">
                {/* Top stripe — accent */}
                <div className="h-1.5 w-full bg-[var(--accent)]" />

                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] shadow-inner transition-transform duration-500 group-hover:scale-110">
                      <HelpCircle size={24} className="accent-text" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest theme-muted mb-1 opacity-60">
                        Status
                      </span>
                      <span className="admin-badge admin-badge-blue">
                        {qCount} Questions
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 flex-1">
                    <h3 className="text-xl font-black leading-tight tracking-tight mb-2 line-clamp-2 transition-colors group-hover:text-[var(--accent)]">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="theme-muted text-xs line-clamp-2 leading-relaxed opacity-80">
                        {q.description}
                      </p>
                    )}
                  </div>

                  {/* Depth bar */}
                  <div className="mb-8 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest theme-muted opacity-60">
                        Depth Index
                      </span>
                      <span className="text-xs font-black accent-text">
                        {scorePct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-[1.5s] ease-out"
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border)] mt-auto">
                    <div className="flex items-center justify-between gap-4">
                      {loc ? (
                        <div className="flex items-center gap-2 text-[11px] font-bold min-w-0">
                          <span className="theme-muted truncate max-w-[80px]">
                            {loc.chapterTitle}
                          </span>
                          <span className="theme-muted/30">/</span>
                          <span className="accent-text truncate max-w-[80px]">
                            {loc.lessonTitle}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                          Unlinked
                        </span>
                      )}
                      {href && (
                        <div className="flex items-center gap-2 text-xs font-black accent-text group/btn flex-shrink-0">
                          <span className="relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--accent)] after:transition-all after:duration-300 group-hover/btn:after:w-full">
                            Start Quiz
                          </span>
                          <ArrowRight
                            size={16}
                            className="transition-transform duration-300 group-hover/btn:translate-x-1"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="theme-muted text-[10px] font-black uppercase tracking-widest opacity-50">
                        {fmtDate(q.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
