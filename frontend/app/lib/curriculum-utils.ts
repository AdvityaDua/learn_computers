import type { Chapter, ChapterLessonItemType, Subject } from "./types";

export function chapterLessonCount(chapter: Chapter): number {
  return chapter.lessons.length;
}

export function chapterCompletedCount(chapter: Chapter, completedLessonIds: string[]): number {
  const completed = new Set(completedLessonIds);
  return chapter.lessons.filter((l) => completed.has(l._id)).length;
}

export function subjectLessonCount(chapters: Chapter[]): number {
  return chapters.reduce((sum, c) => sum + c.lessons.length, 0);
}

export function subjectCompletedCount(chapters: Chapter[], completedLessonIds: string[]): number {
  return chapters.reduce((sum, c) => sum + chapterCompletedCount(c, completedLessonIds), 0);
}

export type NextLesson = {
  subject: Subject;
  chapter: Chapter;
  lessonId: string;
  lessonTitle: string;
};

/** Walks subjects -> chapters -> lessons in order and returns the first lesson the student hasn't completed yet. */
export function findNextLesson(
  subjects: Subject[],
  chaptersBySubject: Record<string, Chapter[]>,
  completedLessonIds: string[],
): NextLesson | null {
  const completed = new Set(completedLessonIds);
  for (const subject of subjects) {
    const chapters = chaptersBySubject[subject._id] ?? [];
    for (const chapter of chapters) {
      const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
      for (const lesson of lessons) {
        if (!completed.has(lesson._id)) {
          return { subject, chapter, lessonId: lesson._id, lessonTitle: lesson.title };
        }
      }
    }
  }
  return null;
}

export type ResolvedDeadline = {
  taskId: string;
  taskType: ChapterLessonItemType;
  dueDate: string;
  title: string;
  subjectId?: string;
  chapterId?: string;
  lessonId?: string;
};

/** Deadlines only carry a taskId/taskType from the API — resolve a human title + location by scanning the curriculum already loaded for this student. */
export function resolveDeadlineTitles(
  chaptersBySubject: Record<string, Chapter[]>,
  deadlines: { taskId: string; taskType: ChapterLessonItemType; dueDate: string }[],
): ResolvedDeadline[] {
  const resolved: ResolvedDeadline[] = [];

  for (const deadline of deadlines) {
    let match: ResolvedDeadline | null = null;

    outer: for (const [subjectId, chapters] of Object.entries(chaptersBySubject)) {
      for (const chapter of chapters) {
        for (const lesson of chapter.lessons) {
          const item = lesson.items.find((it) => it.refId === deadline.taskId && it.type === deadline.taskType);
          if (item) {
            match = {
              ...deadline,
              title: lesson.title,
              subjectId,
              chapterId: chapter._id,
              lessonId: lesson._id,
            };
            break outer;
          }
        }
      }
    }

    resolved.push(
      match ?? {
        ...deadline,
        title: deadline.taskType === "quiz" ? "A quiz" : deadline.taskType === "assignment" ? "An assignment" : "An activity",
      },
    );
  }

  return resolved.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
