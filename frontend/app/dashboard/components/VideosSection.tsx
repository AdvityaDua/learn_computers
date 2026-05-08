"use client";

import React, { useState, useMemo } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterBar from "./FilterBar";
import type { Chapter, VideoLesson, ContentLocation } from "./types";
import { API_BASE, fmtDate } from "./types";

interface VideosSectionProps {
  videos: VideoLesson[];
  chapters: Chapter[];
  contentMap: Map<string, ContentLocation>;
}

export default function VideosSection({
  videos,
  chapters,
  contentMap,
}: VideosSectionProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");

  const allVidChapters = useMemo(
    () =>
      Array.from(
        new Set(
          videos
            .map((v) => contentMap.get(v._id)?.chapterId)
            .filter(Boolean)
        )
      ) as string[],
    [videos, contentMap]
  );

  const lessonsForChapter = useMemo(
    () =>
      chapterFilter
        ? (Array.from(
            new Set(
              videos
                .filter(
                  (v) => contentMap.get(v._id)?.chapterId === chapterFilter
                )
                .map((v) => contentMap.get(v._id)?.lessonId)
                .filter(Boolean)
            )
          ) as string[])
        : [],
    [videos, contentMap, chapterFilter]
  );

  const filtered = useMemo(
    () =>
      videos.filter((v) => {
        const loc = contentMap.get(v._id);
        if (
          search &&
          !v.title.toLowerCase().includes(search.toLowerCase()) &&
          !(v.tags || []).some((t) =>
            t.toLowerCase().includes(search.toLowerCase())
          )
        )
          return false;
        if (chapterFilter && loc?.chapterId !== chapterFilter) return false;
        if (lessonFilter && loc?.lessonId !== lessonFilter) return false;
        return true;
      }),
    [videos, contentMap, search, chapterFilter, lessonFilter]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black tracking-tight">Video Library</h2>
        <p className="theme-muted mt-1 text-sm">
          Browse lesson videos — click any card to watch.
        </p>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search videos or tags…"
        chapterFilter={chapterFilter}
        onChapterFilter={setChapterFilter}
        lessonFilter={lessonFilter}
        onLessonFilter={setLessonFilter}
        chapters={chapters}
        chapterIds={allVidChapters}
        lessonIds={lessonsForChapter}
        count={filtered.length}
        noun={`video${filtered.length !== 1 ? "s" : ""}`}
      />

      {filtered.length === 0 && (
        <div className="panel rounded-2xl p-10 text-center theme-muted text-sm">
          No videos match your filters.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v, idx) => {
          const loc = contentMap.get(v._id);
          const href = loc
            ? `/dashboard/lessons/${loc.chapterId}/${loc.lessonId}?ref=${v._id}`
            : undefined;
          const themeColor = `hsl(${(idx * 59 + 210) % 360}, 65%, 55%)`;
          return (
            <article
              key={v._id}
              onClick={() => href && router.push(href)}
              className={`group relative overflow-hidden rounded-[2.5rem] border theme-border bg-[var(--surface)] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fade-up ${
                href ? "cursor-pointer" : ""
              }`}
              style={{ animationDelay: `${idx * 45}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}05)`,
                  }}
                >
                  {v.thumbnailFilePath ? (
                    <img
                      src={`${API_BASE}${v.thumbnailFilePath}`}
                      alt={v.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <PlayCircle
                      size={48}
                      style={{ color: themeColor, opacity: 0.4 }}
                      className="transition-transform duration-500 group-hover:scale-125"
                    />
                  )}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ background: themeColor }}
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    <PlayCircle size={32} className="text-[var(--accent)]" />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--surface-soft)] theme-muted border theme-border">
                    VIDEO
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest theme-muted opacity-50 ml-auto">
                    {fmtDate(v.createdAt)}
                  </span>
                </div>
                <h3 className="text-lg font-black leading-tight tracking-tight mb-4 group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-2">
                  {v.title}
                </h3>

                <div className="pt-5 border-t border-[var(--border)] flex items-center justify-between">
                  {loc ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold min-w-0">
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
                    <div className="flex items-center gap-1.5 text-xs font-black accent-text group/btn flex-shrink-0 ml-4">
                      <span>Watch</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover/btn:translate-x-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
