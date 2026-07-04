export type Subject = {
  _id: string;
  name: string;
  description: string;
  classId: string;
  color: string;
  icon: string;
  isActive: boolean;
};

export type ChapterLessonItemType = "video" | "quiz" | "assignment" | "activity";

export type ChapterLessonItem = {
  _id: string;
  type: ChapterLessonItemType;
  refId: string;
  order: number;
};

export type ChapterLesson = {
  _id: string;
  title: string;
  description: string;
  coverImageFilePath?: string;
  order: number;
  items: ChapterLessonItem[];
};

export type Chapter = {
  _id: string;
  title: string;
  description: string;
  coverImageFilePath?: string;
  subjectId?: string;
  lessons: ChapterLesson[];
};

export type LessonProgressSummary = {
  totalLessons: number;
  completedLessons: number;
  pendingLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  completionPercentage: number;
  completedLessonIds: string[];
  completedQuizIds: string[];
};

export type LessonVideoContent = {
  _id: string;
  title: string;
  type: "documentation" | "video";
  description: string;
  documentFilePath?: string;
  videoFilePath?: string;
  externalVideoUrl?: string;
  thumbnailFilePath?: string;
};

export type QuizQuestionSafe = {
  question: string;
  options: string[];
};

export type QuizContentSafe = {
  _id: string;
  title: string;
  description: string;
  questions: QuizQuestionSafe[];
  dueDate?: string;
};

export type TaskContent = {
  _id: string;
  title: string;
  description: string;
  points: number;
  dueDate?: string;
  requiresSubmission: boolean;
  acceptedFileTypes: string[];
  attachmentFilePath?: string;
  imageFilePaths?: string[];
};

export type LessonDetailItem =
  | { type: "video"; data: LessonVideoContent | null }
  | { type: "quiz"; data: QuizContentSafe | null }
  | { type: "assignment"; data: TaskContent | null }
  | { type: "activity"; data: TaskContent | null };

export type SubmittedTaskInfo = {
  filePath: string;
  originalName: string;
  submittedAt: string;
  reviewStatus: "pending" | "approved" | "rejected" | "resubmit_requested";
  reviewedAt: string | null;
  reviewFeedback: string;
};

export type LessonDetail = {
  chapter: { _id: string; title: string; lessons: { _id: string; title: string; order: number }[] };
  lesson: { _id: string; title: string; description: string; items: LessonDetailItem[] };
  progress: {
    completed: boolean;
    completedAt: string | null;
    lastAccessedAt: string | null;
    completedQuizzes: Record<string, number>;
    submittedTasks: Record<string, SubmittedTaskInfo>;
  };
};

export type QuizSubmitResult = {
  results: { questionIndex: number; userAnswer: number; correct: boolean; correctAnswerIndex: number }[];
  score: number;
  totalQuestions: number;
  correctCount: number;
};

export type LeaderboardEntry = {
  _id: string;
  userId: string;
  fullName: string;
  profileImage?: string | null;
  points: number;
  lessonCount: number;
  totalLessons: number;
  quizCount: number;
  totalQuizzes: number;
  completionPercentage: number;
  isTopLearner: boolean;
  rank: number;
};

export type StudentDeadline = {
  taskId: string;
  taskType: "assignment" | "activity" | "quiz";
  dueDate: string;
};

export type TeacherInfo = {
  _id: string;
  fullName: string;
  email: string;
  profileImage?: string;
};
