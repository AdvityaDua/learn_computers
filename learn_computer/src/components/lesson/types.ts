export type VideoData = {
  _id: string;
  title: string;
  externalVideoUrl?: string;
  videoFilePath?: string;
  description?: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
};

export type QuizData = {
  _id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
};

export type TaskData = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  points?: number;
  requiresSubmission?: boolean;
  acceptedFileTypes?: string[];
};

export type TaskSubmissionReviewStatus = 'pending' | 'approved' | 'rejected' | 'resubmit_requested';

export type TaskSubmission = {
  originalName: string;
  submittedAt: string;
  reviewStatus: TaskSubmissionReviewStatus;
  reviewedAt?: string | null;
  reviewFeedback?: string;
};

export type LessonItem = {
  type: 'video' | 'quiz' | 'assignment' | 'activity';
  data: VideoData | QuizData | TaskData | null;
};

export type LessonDetail = {
  chapter: { _id: string; title: string };
  lesson: { _id: string; title: string; description?: string; items: LessonItem[] };
  progress: {
    completed: boolean;
    completedQuizzes: Record<string, number>;
    submittedTasks: Record<string, TaskSubmission>;
  };
};
