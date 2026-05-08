"use client";

import React from "react";
import { Search } from "lucide-react";
import type { Chapter } from "./types";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  chapterFilter: string;
  onChapterFilter: (v: string) => void;
  lessonFilter: string;
  onLessonFilter: (v: string) => void;
  chapters: Chapter[];
  chapterIds: string[];
  lessonIds: string[];
  count: number;
  noun: string;
}

export default function FilterBar({
  search,
  onSearch,
  placeholder,
  chapterFilter,
  onChapterFilter,
  lessonFilter,
  onLessonFilter,
  chapters,
  chapterIds,
  lessonIds,
  count,
  noun,
}: FilterBarProps) {
  return (
    <div className="mb-5 panel rounded-2xl px-3 py-2.5 flex items-center gap-2 flex-wrap">
      <div className="relative" style={{ flex: "1 1 180px", minWidth: 160 }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
        <input
          className="input-theme text-sm"
          style={{
            paddingLeft: "2rem",
            paddingTop: "0.45rem",
            paddingBottom: "0.45rem",
            borderRadius: "0.625rem",
          }}
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <select
        className="input-theme text-sm"
        style={{
          flex: "0 1 170px",
          paddingTop: "0.45rem",
          paddingBottom: "0.45rem",
          borderRadius: "0.625rem",
        }}
        value={chapterFilter}
        onChange={(e) => {
          onChapterFilter(e.target.value);
          onLessonFilter("");
        }}
      >
        <option value="">All Chapters</option>
        {chapterIds.map((cid) => {
          const ch = chapters.find((c) => c._id === cid);
          return (
            <option key={cid} value={cid}>
              {ch?.title ?? cid}
            </option>
          );
        })}
      </select>
      {chapterFilter && lessonIds.length > 0 && (
        <select
          className="input-theme text-sm"
          style={{
            flex: "0 1 170px",
            paddingTop: "0.45rem",
            paddingBottom: "0.45rem",
            borderRadius: "0.625rem",
          }}
          value={lessonFilter}
          onChange={(e) => onLessonFilter(e.target.value)}
        >
          <option value="">All Lessons</option>
          {lessonIds.map((lid) => {
            const ch = chapters.find((c) => c._id === chapterFilter);
            const ls = ch?.lessons.find((l) => l._id === lid);
            return (
              <option key={lid} value={lid}>
                {ls?.title ?? lid}
              </option>
            );
          })}
        </select>
      )}
      {(search || chapterFilter) && (
        <button
          type="button"
          onClick={() => {
            onSearch("");
            onChapterFilter("");
            onLessonFilter("");
          }}
          className="text-xs font-bold theme-muted hover:text-[var(--foreground)] transition-colors flex-shrink-0 px-2"
        >
          Clear ✕
        </button>
      )}
      <span className="theme-muted text-xs font-semibold ml-auto flex-shrink-0">
        {count} {noun}
      </span>
    </div>
  );
}
