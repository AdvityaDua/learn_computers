"use client";

import React, { useState, useMemo } from "react";
import { Activity, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterBar from "./FilterBar";
import type { Chapter, ActivityItem, ContentLocation } from "./types";
import { fmtDate, badgeForDue } from "./types";

interface ActivitiesSectionProps {
  activities: ActivityItem[];
  chapters: Chapter[];
  contentMap: Map<string, ContentLocation>;
}

export default function ActivitiesSection({
  activities,
  chapters,
  contentMap,
}: ActivitiesSectionProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");

  const allChapters = useMemo(
    () =>
      Array.from(
        new Set(
          activities
            .map((a) => contentMap.get(a._id)?.chapterId)
            .filter(Boolean)
        )
      ) as string[],
    [activities, contentMap]
  );

  const lessonsForChapter = useMemo(
    () =>
      chapterFilter
        ? (Array.from(
            new Set(
              activities
                .filter(
                  (a) => contentMap.get(a._id)?.chapterId === chapterFilter
                )
                .map((a) => contentMap.get(a._id)?.lessonId)
                .filter(Boolean)
            )
          ) as string[])
        : [],
    [activities, contentMap, chapterFilter]
  );

  const filtered = useMemo(
    () =>
      activities.filter((a) => {
        const loc = contentMap.get(a._id);
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()))
          return false;
        if (chapterFilter && loc?.chapterId !== chapterFilter) return false;
        if (lessonFilter && loc?.lessonId !== lessonFilter) return false;
        return true;
      }),
    [activities, contentMap, search, chapterFilter, lessonFilter]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black tracking-tight">Class Activities</h2>
        <p className="theme-muted mt-1 text-sm">
          Hands-on practice tasks — click any card to open.
        </p>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search activities…"
        chapterFilter={chapterFilter}
        onChapterFilter={setChapterFilter}
        lessonFilter={lessonFilter}
        onLessonFilter={setLessonFilter}
        chapters={chapters}
        chapterIds={allChapters}
        lessonIds={lessonsForChapter}
        count={filtered.length}
        noun={`activit${filtered.length !== 1 ? "ies" : "y"}`}
      />

      {filtered.length === 0 && (
        <div className="panel rounded-2xl p-10 text-center theme-muted text-sm">
          No activities match your filters.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((a, idx) => {
          const loc = contentMap.get(a._id);
          const href = loc
            ? `/dashboard/lessons/${loc.chapterId}/${loc.lessonId}?ref=${a._id}`
            : undefined;
          const due = badgeForDue(a.dueDate);

          return (
            <article
              key={a._id}
              onClick={() => href && router.push(href)}
              className={`group relative overflow-hidden rounded-[2rem] border theme-border bg-[var(--surface)] p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 animate-fade-up ${
                href ? "cursor-pointer" : ""
              }`}
              style={{ animationDelay: `${idx * 45}ms` }}
            >
              {/* Accent glow on hover */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[2rem]" style={{ background: "radial-gradient(circle at 50% 0%, var(--accent)15, transparent 70%)" }} />

              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem-1px)] bg-[var(--surface)]">
                {/* Top stripe — accent color consistent with app theme */}
                <div className="h-1.5 w-full bg-[var(--accent)]" />

                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-6">
                    {/* Icon uses accent */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] shadow-inner transition-transform duration-500 group-hover:scale-110">
                      <Activity size={24} className="accent-text" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`admin-badge ${due.cls} font-black`}>
                        {due.label}
                      </span>
                      {a.points != null && (
                        <span className="text-[10px] font-black uppercase tracking-widest theme-muted opacity-60">
                          {a.points} Points
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 flex-1">
                    <h3 className="text-xl font-black leading-tight tracking-tight transition-colors group-hover:text-[var(--accent)]">
                      {a.title}
                    </h3>
                    <p className="theme-muted text-[10px] mt-2 font-black uppercase tracking-widest opacity-60">
                      {fmtDate(a.createdAt)}
                    </p>
                  </div>

                  {(a.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {(a.tags || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] text-[10px] font-black theme-muted border theme-border tracking-wider"
                        >
                          #{t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between mt-auto">
                    {loc ? (
                      <div className="flex items-center gap-2 text-[11px] font-bold min-w-0">
                        <span className="theme-muted truncate">
                          {loc.chapterTitle}
                        </span>
                        <span className="theme-muted/30">/</span>
                        <span className="accent-text truncate">
                          {loc.lessonTitle}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                        Unlinked
                      </span>
                    )}
                    {href && (
                      <div className="flex items-center gap-2 text-xs font-black accent-text group/btn flex-shrink-0 ml-4">
                        <span className="relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--accent)] after:transition-all after:duration-300 group-hover/btn:after:w-full">
                          Open
                        </span>
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-300 group-hover/btn:translate-x-1"
                        />
                      </div>
                    )}
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
