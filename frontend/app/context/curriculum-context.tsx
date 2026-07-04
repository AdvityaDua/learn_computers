"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { getChapters, getLessonProgress, getSubjects } from "../lib/data";
import type { Chapter, LessonProgressSummary, Subject } from "../lib/types";

type CurriculumContextValue = {
  classId: string | null;
  subjects: Subject[];
  chaptersBySubject: Record<string, Chapter[]>;
  progress: LessonProgressSummary | null;
  loading: boolean;
  error: string | null;
  reloadProgress: () => Promise<void>;
};

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const classId = profile?.classIds?.[0] ?? null;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chaptersBySubject, setChaptersBySubject] = useState<Record<string, Chapter[]>>({});
  const [progress, setProgress] = useState<LessonProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadProgress = useCallback(async () => {
    try {
      setProgress(await getLessonProgress());
    } catch {
      // non-fatal — stats will just stay stale until next successful load
    }
  }, []);

  useEffect(() => {
    if (!classId) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [subjectList, progressSummary] = await Promise.all([getSubjects(classId), getLessonProgress()]);
        if (!alive) return;
        setSubjects(subjectList);
        setProgress(progressSummary);

        const chapterLists = await Promise.all(subjectList.map((s) => getChapters(s._id)));
        if (!alive) return;
        const map: Record<string, Chapter[]> = {};
        subjectList.forEach((s, i) => {
          map[s._id] = chapterLists[i];
        });
        setChaptersBySubject(map);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Couldn't load your courses");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [classId]);

  return (
    <CurriculumContext.Provider value={{ classId, subjects, chaptersBySubject, progress, loading, error, reloadProgress }}>
      {children}
    </CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error("useCurriculum must be used within CurriculumProvider");
  return ctx;
}
