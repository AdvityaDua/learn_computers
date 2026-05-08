export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type SectionId =
  | "Overview"
  | "Curriculum"
  | "Videos"
  | "Quizzes"
  | "Assignments"
  | "Activities"
  | "Leaderboard"
  | "Profile";

export interface UserData {
  _id?: string;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
}

export interface LeaderboardUser {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  role: string;
  score: number;
  contentCount: number;
  lessonCount: number;
  quizCount: number;
  assignmentCount: number;
  activityCount: number;
}

export interface ChapterLesson {
  _id: string;
  title: string;
  description?: string;
  items?: { type: string; refId: string; order: number }[];
  coverImageFilePath?: string;
}

export interface Chapter {
  _id: string;
  title: string;
  description?: string;
  lessons: ChapterLesson[];
  createdAt?: string;
  coverImageFilePath?: string;
}

export interface LessonProgressSummary {
  totalLessons: number;
  completedLessons: number;
  pendingLessons: number;
  completionPercentage: number;
  completedLessonIds: string[];
}

export interface VideoLesson {
  _id: string;
  title: string;
  tags: string[];
  thumbnailFilePath?: string;
  externalVideoUrl?: string;
  createdAt: string;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: { question: string }[];
  createdAt: string;
}

export interface Assignment {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
  createdAt: string;
}

/** Location of a content item within the curriculum */
export type ContentLocation = {
  chapterId: string;
  chapterTitle: string;
  lessonId: string;
  lessonTitle: string;
};

// ── Utilities ──────────────────────────────────────────────────────────────────

export function toItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function normalizeId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const raw = (value as { _id?: unknown })._id;
    return typeof raw === "string" ? raw : undefined;
  }
  return undefined;
}

export function badgeForDue(iso?: string) {
  if (!iso) return { cls: "admin-badge-gray", label: "No due date" };
  const due = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((due - now) / 86400000);
  if (days < 0)
    return { cls: "admin-badge-red", label: `Overdue ${Math.abs(days)}d` };
  if (days <= 3) return { cls: "admin-badge-yellow", label: `Due in ${days}d` };
  return { cls: "admin-badge-green", label: fmtDate(iso) };
}
