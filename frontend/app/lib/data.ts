import { apiFetch } from "./api";
import type {
  Chapter,
  LeaderboardEntry,
  LessonDetail,
  LessonProgressSummary,
  QuizSubmitResult,
  StudentDeadline,
  Subject,
  TeacherInfo,
} from "./types";

export const getSubjects = (classId: string): Promise<Subject[]> =>
  apiFetch(`/subjects?classId=${encodeURIComponent(classId)}`);

export const getChapters = (subjectId: string): Promise<Chapter[]> =>
  apiFetch(`/chapters?subjectId=${encodeURIComponent(subjectId)}`);

export const getChapter = (chapterId: string): Promise<Chapter> =>
  apiFetch(`/chapters/${chapterId}`);

export const getLessonProgress = (): Promise<LessonProgressSummary> =>
  apiFetch("/progress/lessons");

export const getLessonDetail = (chapterId: string, lessonId: string): Promise<LessonDetail> =>
  apiFetch(`/progress/lesson-detail/${chapterId}/${lessonId}`);

export const markLessonAccessed = (chapterId: string, lessonId: string) =>
  apiFetch(`/progress/lessons/${chapterId}/${lessonId}/access`, { method: "POST" });

export const markLessonCompleted = (chapterId: string, lessonId: string): Promise<LessonProgressSummary> =>
  apiFetch(`/progress/lessons/${chapterId}/${lessonId}/complete`, { method: "POST" });

export const submitQuiz = (
  chapterId: string,
  lessonId: string,
  quizId: string,
  answers: number[],
): Promise<QuizSubmitResult> =>
  apiFetch(`/progress/lessons/${chapterId}/${lessonId}/quizzes/${quizId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

export const submitTask = (
  chapterId: string,
  lessonId: string,
  taskType: "assignment" | "activity",
  taskId: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("submissionFile", file);
  return apiFetch(`/progress/lessons/${chapterId}/${lessonId}/tasks/${taskType}/${taskId}/submit`, {
    method: "POST",
    body: formData,
  });
};

export const getLeaderboard = (classId?: string): Promise<LeaderboardEntry[]> =>
  apiFetch(`/progress/leaderboard${classId ? `?classId=${encodeURIComponent(classId)}` : ""}`);

export const getStudentDeadlines = (): Promise<StudentDeadline[]> => apiFetch("/progress/student/deadlines");

export const getMyTeachers = (): Promise<TeacherInfo[]> => apiFetch("/users/my-teachers");

export const updateProfile = (data: FormData | { fullName?: string; phone?: string }) => {
  const isFormData = data instanceof FormData;
  return apiFetch("/users/profile", {
    method: "PATCH",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
  });
};
