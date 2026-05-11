import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import {
  LessonProgress,
  LessonProgressDocument,
} from './schemas/lesson-progress.schema';
import {
  QuizProgress,
  QuizProgressDocument,
} from './schemas/quiz-progress.schema';
import {
  SubmissionProgress,
  SubmissionProgressDocument,
  SubmissionReviewStatus,
} from './schemas/submission-progress.schema';
import { Chapter, ChapterDocument } from '../lessons/schemas/chapter.schema';
import { Lesson, LessonDocument } from '../lessons/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentDocument,
} from '../assignments/schemas/assignment.schema';
import { Activity, ActivityDocument } from '../activities/schemas/activity.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/constants/roles.enum';

type ChapterLessonItem = {
  type: 'video' | 'quiz' | 'assignment' | 'activity';
  refId: Types.ObjectId;
  order: number;
};

type ChapterLesson = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  descriptionFilePath?: string;
  order: number;
  items?: ChapterLessonItem[];
};

function normalizeReviewStatus(status?: string | null): SubmissionReviewStatus {
  if (status === 'pending' || status === 'approved' || status === 'rejected' || status === 'resubmit_requested') {
    return status;
  }

  // Preserve existing submissions as approved until they are re-submitted into the review flow.
  return 'approved';
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(LessonProgress.name)
    private readonly progressModel: Model<LessonProgressDocument>,
    @InjectModel(QuizProgress.name)
    private readonly quizProgressModel: Model<QuizProgressDocument>,
    @InjectModel(SubmissionProgress.name)
    private readonly submissionProgressModel: Model<SubmissionProgressDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getLessonProgress(userId: string) {
    this.ensureObjectId(userId, 'Invalid user id format');

    const chapters = await this.chapterModel.find().lean();

    const allLessonIds: string[] = [];
    const allQuizRefIds: string[] = [];

    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        allLessonIds.push(String(lesson._id));
        for (const item of lesson.items ?? []) {
          if (item.type === 'quiz') {
            allQuizRefIds.push(String(item.refId));
          }
        }
      }
    }

    const totalLessons = allLessonIds.length;
    const totalQuizzes = allQuizRefIds.length;

    const [completedLessonRows, completedQuizRows] = await Promise.all([
      this.progressModel
        .find({ userId: new Types.ObjectId(userId), completedAt: { $ne: null } })
        .select('lessonId')
        .lean(),
      this.quizProgressModel
        .find({ userId: new Types.ObjectId(userId), completedAt: { $ne: null } })
        .select('quizId')
        .lean(),
    ]);

    const allLessonIdSet = new Set(allLessonIds);
    const allQuizRefIdSet = new Set(allQuizRefIds);

    const completedLessonSet = new Set(
      completedLessonRows
        .map((row) => String(row.lessonId))
        .filter((id) => allLessonIdSet.has(id)),
    );
    const completedQuizSet = new Set(
      completedQuizRows
        .map((row) => String(row.quizId))
        .filter((id) => allQuizRefIdSet.has(id)),
    );

    const lessonRatio = totalLessons > 0 ? completedLessonSet.size / totalLessons : 0;
    const quizRatio = totalQuizzes > 0 ? completedQuizSet.size / totalQuizzes : 1;

    let completionPercentage: number;
    if (totalQuizzes === 0) {
      completionPercentage = Math.round(lessonRatio * 100);
    } else {
      completionPercentage = Math.round((lessonRatio * 0.5 + quizRatio * 0.5) * 100);
    }

    return {
      totalLessons,
      completedLessons: completedLessonSet.size,
      pendingLessons: Math.max(0, totalLessons - completedLessonSet.size),
      totalQuizzes,
      completedQuizzes: completedQuizSet.size,
      completionPercentage,
      completedLessonIds: Array.from(completedLessonSet),
      completedQuizIds: Array.from(completedQuizSet),
    };
  }

  async markLessonCompleted(userId: string, chapterId: string, lessonId: string) {
    await this.assertLessonBelongsToChapter(chapterId, lessonId);

    const now = new Date();

    await this.progressModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        chapterId: new Types.ObjectId(chapterId),
        lessonId: new Types.ObjectId(lessonId),
      },
      {
        $set: {
          completedAt: now,
          lastAccessedAt: now,
        },
      },
      { upsert: true },
    );

    return this.getLessonProgress(userId);
  }

  async markLessonAccessed(userId: string, chapterId: string, lessonId: string) {
    await this.assertLessonBelongsToChapter(chapterId, lessonId);

    await this.progressModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        chapterId: new Types.ObjectId(chapterId),
        lessonId: new Types.ObjectId(lessonId),
      },
      {
        $set: {
          lastAccessedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return { ok: true };
  }

  async getLessonDetail(userId: string, chapterId: string, lessonId: string) {
    this.ensureObjectId(userId, 'Invalid user id format');
    this.ensureObjectId(chapterId, 'Invalid chapter id format');
    this.ensureObjectId(lessonId, 'Invalid lesson id format');

    const chapter = await this.chapterModel.findById(chapterId).lean();
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const lessons = ((chapter as any).lessons ?? [])
      .slice()
      .sort((a: ChapterLesson, b: ChapterLesson) => a.order - b.order);

    const lesson = lessons.find((entry: ChapterLesson) => String(entry._id) === lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found in chapter');
    }

    const progressRow = await this.progressModel
      .findOne({
        userId: new Types.ObjectId(userId),
        chapterId: new Types.ObjectId(chapterId),
        lessonId: new Types.ObjectId(lessonId),
      })
      .lean();

    const detailedItems = await Promise.all(
      (lesson.items ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(async (item) => {
          const id = String(item.refId);
          if (item.type === 'video') {
            const video = await this.lessonModel.findById(id).lean();
            const resolvedVideo = video
              ? {
                  ...video,
                  description: await this.resolveMarkdownText(
                    (video as any).descriptionFilePath,
                    '',
                  ),
                }
              : null;
            return {
              type: 'video',
              data: resolvedVideo,
            };
          }
          if (item.type === 'quiz') {
            const quiz = await this.quizModel.findById(id).lean();
            const resolvedQuiz = quiz
              ? {
                  ...quiz,
                  description: await this.resolveMarkdownText(
                    (quiz as any).descriptionFilePath,
                    (quiz as any).description ?? '',
                  ),
                  // Strip correctAnswerIndex — never expose to client
                  questions: ((quiz as any).questions ?? []).map((q: any) => ({
                    question: q.question,
                    options: q.options,
                  })),
                }
              : null;
            return {
              type: 'quiz',
              data: resolvedQuiz,
            };
          }
          if (item.type === 'assignment') {
            const assignment = await this.assignmentModel.findById(id).lean();
            const resolvedAssignment = assignment
              ? {
                  ...assignment,
                  description: await this.resolveMarkdownText(
                    (assignment as any).descriptionFilePath,
                    '',
                  ),
                }
              : null;
            return {
              type: 'assignment',
              data: resolvedAssignment,
            };
          }

          const activity = await this.activityModel.findById(id).lean();
          const resolvedActivity = activity
            ? {
                ...activity,
                description: await this.resolveMarkdownText(
                  (activity as any).descriptionFilePath,
                  '',
                ),
              }
            : null;
          return {
            type: 'activity',
            data: resolvedActivity,
          };
        }),
    );

    const lessonDescription = await this.resolveMarkdownText(
      lesson.descriptionFilePath,
      lesson.description ?? '',
    );

    // Collect quiz IDs from lesson items so we can query completion
    const quizRefIds = (lesson.items ?? [])
      .filter((item: any) => item.type === 'quiz')
      .map((item: any) => new Types.ObjectId(String(item.refId)));

    const completedQuizRows = await this.quizProgressModel
      .find({
        userId: new Types.ObjectId(userId),
        quizId: { $in: quizRefIds },
        completedAt: { $ne: null },
      })
      .select('quizId score')
      .lean();

    const completedQuizMap: Record<string, number> = Object.fromEntries(
      completedQuizRows.map((r) => [String(r.quizId), r.score]),
    );

    // Collect assignment/activity IDs that require submission
    const taskRefIds = (lesson.items ?? [])
      .filter((item: any) => item.type === 'assignment' || item.type === 'activity')
      .map((item: any) => ({ taskType: item.type, taskId: new Types.ObjectId(String(item.refId)) }));

    const submissionRows = await this.submissionProgressModel
      .find({
        userId: new Types.ObjectId(userId),
        $or: taskRefIds.length > 0
          ? taskRefIds.map(({ taskType, taskId }) => ({ taskType, taskId }))
          : [{ taskId: new Types.ObjectId() }], // no-match placeholder
      })
      .select('taskType taskId filePath originalName submittedAt reviewStatus reviewedAt reviewFeedback')
      .lean();

    const submittedTaskMap: Record<string, {
      filePath: string;
      originalName: string;
      submittedAt: Date;
      reviewStatus: SubmissionReviewStatus;
      reviewedAt: Date | null;
      reviewFeedback: string;
    }> =
      Object.fromEntries(
        submissionRows.map((r) => [
          String(r.taskId),
          {
            filePath: r.filePath,
            originalName: r.originalName,
            submittedAt: r.submittedAt,
            reviewStatus: normalizeReviewStatus((r as any).reviewStatus),
            reviewedAt: (r as any).reviewedAt ?? null,
            reviewFeedback: (r as any).reviewFeedback ?? '',
          },
        ]),
      );

    return {
      chapter: {
        _id: chapter._id,
        title: chapter.title,
        lessons: lessons.map((entry: ChapterLesson) => ({
          _id: entry._id,
          title: entry.title,
          order: entry.order,
        })),
      },
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lessonDescription,
        items: detailedItems,
      },
      progress: {
        completed: Boolean(progressRow?.completedAt),
        completedAt: progressRow?.completedAt ?? null,
        lastAccessedAt: progressRow?.lastAccessedAt ?? null,
        completedQuizzes: completedQuizMap,
        submittedTasks: submittedTaskMap,
      },
    };
  }

  async submitTask(
    userId: string,
    chapterId: string,
    lessonId: string,
    taskType: 'assignment' | 'activity',
    taskId: string,
    file: Express.Multer.File,
  ) {
    this.ensureObjectId(userId, 'Invalid user id');
    this.ensureObjectId(chapterId, 'Invalid chapter id');
    this.ensureObjectId(lessonId, 'Invalid lesson id');
    this.ensureObjectId(taskId, 'Invalid task id');

    if (!file) {
      throw new BadRequestException('Submission file is required');
    }

    // Validate task exists and requires submission
    let task: any;
    if (taskType === 'assignment') {
      task = await this.assignmentModel.findById(taskId).lean();
      if (!task) throw new NotFoundException('Assignment not found');
    } else {
      task = await this.activityModel.findById(taskId).lean();
      if (!task) throw new NotFoundException('Activity not found');
    }

    if (!task.requiresSubmission) {
      throw new BadRequestException('This task does not require a file submission');
    }

    // Validate accepted file types
    const acceptedTypes: string[] = task.acceptedFileTypes ?? [];
    if (acceptedTypes.length > 0 && !acceptedTypes.includes('any')) {
      const ext = extname(file.originalname).toLowerCase().slice(1); // e.g. 'pdf'
      const typeMap: Record<string, string[]> = {
        pdf: ['pdf'],
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        document: ['doc', 'docx', 'pdf'],
        zip: ['zip', 'tar', 'gz', 'rar', '7z'],
        code: ['js', 'ts', 'py', 'java', 'c', 'cpp', 'cs', 'rb', 'go', 'html', 'css', 'jsx', 'tsx'],
      };
      const allowed = acceptedTypes.flatMap((t) => typeMap[t] ?? [t]);
      if (!allowed.includes(ext)) {
        throw new BadRequestException(
          `File type .${ext} is not accepted. Accepted: ${acceptedTypes.join(', ')}`,
        );
      }
    }

    const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;

    await this.submissionProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        taskType,
        taskId: new Types.ObjectId(taskId),
      },
      {
        $set: {
          chapterId: new Types.ObjectId(chapterId),
          lessonId: new Types.ObjectId(lessonId),
          filePath,
          originalName: file.originalname,
          submittedAt: new Date(),
          reviewStatus: 'pending',
          reviewedAt: null,
          reviewedBy: null,
          reviewFeedback: '',
        },
      },
      { upsert: true, new: true },
    );

    return {
      ok: true,
      filePath,
      originalName: file.originalname,
      submittedAt: new Date(),
      reviewStatus: 'pending' as const,
      reviewedAt: null,
      reviewFeedback: '',
    };
  }

  async reviewTaskSubmission(
    userId: string,
    taskType: 'assignment' | 'activity',
    taskId: string,
    reviewerId: string,
    reviewStatus?: 'approved' | 'rejected' | 'resubmit_requested',
    reviewFeedback?: string,
  ) {
    this.ensureObjectId(userId, 'Invalid user id format');
    this.ensureObjectId(taskId, 'Invalid task id format');
    this.ensureObjectId(reviewerId, 'Invalid reviewer id format');

    if (
      reviewStatus !== 'approved' &&
      reviewStatus !== 'rejected' &&
      reviewStatus !== 'resubmit_requested'
    ) {
      throw new BadRequestException(
        'reviewStatus must be approved, rejected, or resubmit_requested',
      );
    }

    // Get existing submission to check if it was previously approved (avoid double-awarding)
    const existingSubmission = await this.submissionProgressModel
      .findOne({ userId: new Types.ObjectId(userId), taskType, taskId: new Types.ObjectId(taskId) })
      .lean();

    const submission = await this.submissionProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        taskType,
        taskId: new Types.ObjectId(taskId),
      },
      {
        $set: {
          reviewStatus,
          reviewFeedback: reviewFeedback?.trim() ?? '',
          reviewedAt: new Date(),
          reviewedBy: new Types.ObjectId(reviewerId),
        },
      },
      { new: true },
    ).lean();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Award points when transitioning to approved (only if not already approved)
    if (reviewStatus === 'approved' && (existingSubmission as any)?.reviewStatus !== 'approved') {
      let task: any = null;
      if (taskType === 'assignment') {
        task = await this.assignmentModel.findById(taskId).select('points').lean();
      } else {
        task = await this.activityModel.findById(taskId).select('points').lean();
      }
      const taskPoints = (task?.points ?? 0) as number;
      if (taskPoints > 0) {
        await this.userModel.findByIdAndUpdate(userId, { $inc: { points: taskPoints } });
      }
    }

    return {
      ok: true,
      taskType: submission.taskType,
      taskId: String(submission.taskId),
      reviewStatus: normalizeReviewStatus((submission as any).reviewStatus),
      reviewedAt: (submission as any).reviewedAt ?? null,
      reviewFeedback: (submission as any).reviewFeedback ?? '',
    };
  }

  async submitQuiz(
    userId: string,
    chapterId: string,
    lessonId: string,
    quizId: string,
    answers: number[],
  ) {
    this.ensureObjectId(userId, 'Invalid user id format');
    this.ensureObjectId(chapterId, 'Invalid chapter id format');
    this.ensureObjectId(lessonId, 'Invalid lesson id format');
    this.ensureObjectId(quizId, 'Invalid quiz id format');

    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = (quiz as any).questions ?? [];
    const results = questions.map((q: any, i: number) => ({
      questionIndex: i,
      userAnswer: answers[i] ?? -1,
      correct: (answers[i] ?? -1) === q.correctAnswerIndex,
      correctAnswerIndex: q.correctAnswerIndex,
    }));

    const correctCount = results.filter((r: any) => r.correct).length;
    const score =
      questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // Check if already completed to avoid double-awarding points
    const existingQuizProgress = await this.quizProgressModel
      .findOne({ userId: new Types.ObjectId(userId), quizId: new Types.ObjectId(quizId) })
      .select('completedAt')
      .lean();
    const wasAlreadyCompleted = !!existingQuizProgress?.completedAt;

    await this.quizProgressModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        quizId: new Types.ObjectId(quizId),
      },
      {
        $set: {
          chapterId: new Types.ObjectId(chapterId),
          lessonId: new Types.ObjectId(lessonId),
          score,
          completedAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Award points proportional to quiz score (first attempt only)
    if (!wasAlreadyCompleted) {
      const pointsEarned = Math.round(score / 10); // 100% = 10 pts, 50% = 5 pts
      if (pointsEarned > 0) {
        await this.userModel.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });
      }
    }

    return {
      results,
      score,
      totalQuestions: questions.length,
      correctCount,
    };
  }

  private async assertLessonBelongsToChapter(chapterId: string, lessonId: string) {
    this.ensureObjectId(chapterId, 'Invalid chapter id format');
    this.ensureObjectId(lessonId, 'Invalid lesson id format');

    const chapter = await this.chapterModel.findById(chapterId).select('lessons').lean();
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const exists = (chapter as any).lessons?.some(
      (lesson: { _id: Types.ObjectId }) => String(lesson._id) === lessonId,
    );

    if (!exists) {
      throw new NotFoundException('Lesson not found in chapter');
    }
  }

  private ensureObjectId(id: string, message: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(message);
    }
  }

  private async resolveMarkdownText(path: string | undefined, fallback: string) {
    if (!path) return fallback;
    try {
      const absolutePath = join(process.cwd(), path.replace(/^\//, ''));
      return await readFile(absolutePath, 'utf8');
    } catch {
      return fallback;
    }
  }

  async getAdminUserProgress(userId: string) {
    this.ensureObjectId(userId, 'Invalid user id format');

    const userOid = new Types.ObjectId(userId);

    const chapters = await this.chapterModel.find().lean();

    // Build a map of lessonId → { chapterTitle, lessonTitle }
    const lessonMeta: Record<string, { chapterTitle: string; lessonTitle: string; chapterOrder: number }> = {};
    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        lessonMeta[String(lesson._id)] = {
          chapterTitle: (chapter as any).title,
          lessonTitle: lesson.title,
          chapterOrder: (chapter as any).order ?? 0,
        };
      }
    }

    const [lessonRows, quizRows, submissionRows] = await Promise.all([
      this.progressModel
        .find({ userId: userOid, completedAt: { $ne: null } })
        .select('lessonId chapterId completedAt lastAccessedAt')
        .lean(),
      this.quizProgressModel
        .find({ userId: userOid })
        .select('quizId score totalQuestions completedAt')
        .lean(),
      this.submissionProgressModel
        .find({ userId: userOid })
        .select('taskType taskId originalName submittedAt reviewStatus reviewedAt reviewFeedback')
        .lean(),
    ]);

    const completedLessons = lessonRows.map((r) => {
      const meta = lessonMeta[String(r.lessonId)] ?? {};
      return {
        lessonId: String(r.lessonId),
        chapterId: String(r.chapterId),
        chapterTitle: meta.chapterTitle ?? 'Unknown Chapter',
        lessonTitle: meta.lessonTitle ?? 'Unknown Lesson',
        completedAt: r.completedAt,
        lastAccessedAt: r.lastAccessedAt,
      };
    }).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    // Enrich quiz rows with quiz titles
    const quizIds = quizRows.map((r) => r.quizId);
    const quizDocs = await this.quizModel.find({ _id: { $in: quizIds } }).select('title').lean();
    const quizTitleMap: Record<string, string> = Object.fromEntries(quizDocs.map((q) => [String(q._id), (q as any).title]));

    const quizAttempts = quizRows.map((r: any) => ({
      quizId: String(r.quizId),
      title: quizTitleMap[String(r.quizId)] ?? 'Untitled Quiz',
      score: r.score ?? 0,
      totalQuestions: r.totalQuestions ?? 0,
      completedAt: r.completedAt,
    })).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    // Enrich submission rows with assignment/activity titles
    const assignmentIds = submissionRows.filter((r) => r.taskType === 'assignment').map((r) => r.taskId);
    const activityIds = submissionRows.filter((r) => r.taskType === 'activity').map((r) => r.taskId);

    const [assignmentDocs, activityDocs] = await Promise.all([
      this.assignmentModel.find({ _id: { $in: assignmentIds } }).select('title').lean(),
      this.activityModel.find({ _id: { $in: activityIds } }).select('title').lean(),
    ]);

    const taskTitleMap: Record<string, string> = {
      ...Object.fromEntries(assignmentDocs.map((d) => [String(d._id), (d as any).title])),
      ...Object.fromEntries(activityDocs.map((d) => [String(d._id), (d as any).title])),
    };

    const submissions = submissionRows.map((r) => ({
      taskType: r.taskType,
      taskId: String(r.taskId),
      title: taskTitleMap[String(r.taskId)] ?? 'Untitled Task',
      originalName: r.originalName,
      submittedAt: r.submittedAt,
      reviewStatus: normalizeReviewStatus((r as any).reviewStatus),
      reviewedAt: (r as any).reviewedAt ?? null,
      reviewFeedback: (r as any).reviewFeedback ?? '',
    })).sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());

    const totalLessons = Object.keys(lessonMeta).length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

    return {
      completionPercentage,
      completedLessons,
      quizAttempts,
      submissions,
    };
  }

  async getQuizStats(schoolId?: string, classId?: string) {
    // Basic implementation: fetch all quiz progress and group
    const match: any = {};
    if (schoolId) match['user.schoolId'] = new Types.ObjectId(schoolId);
    if (classId) match['user.classIds'] = classId;

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match } as any);
    }

    pipeline.push(
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz',
        },
      } as any,
      { $unwind: '$quiz' },
      {
        $group: {
          _id: { quizId: '$quizId', title: '$quiz.title' },
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
        },
      } as any,
      {
        $project: {
          _id: 0,
          quizId: '$_id.quizId',
          title: '$_id.title',
          attempts: 1,
          avgScore: { $round: ['$avgScore', 1] },
          maxScore: 1,
        },
      } as any,
      { $sort: { title: 1 } } as any,
    );

    return this.quizProgressModel.aggregate(pipeline);
  }

  /**
   * Get the Top Learners leaderboard for a specific class and/or school.
   * Only students who have completed ALL lessons AND ALL quizzes qualify.
   * Results are ranked by accumulated points descending.
   */
  async getLeaderboard(classId?: string, schoolId?: string) {
    // Find students matching class/school filters
    const userFilter: any = { role: UserRole.Student, isActive: true };
    if (classId) userFilter.classIds = classId;
    if (schoolId) {
      if (!Types.ObjectId.isValid(schoolId)) throw new BadRequestException('Invalid schoolId');
      userFilter.schoolId = new Types.ObjectId(schoolId);
    }

    const students = await this.userModel
      .find(userFilter)
      .select('fullName profileImage points classIds schoolId')
      .lean();

    if (students.length === 0) return [];

    // Build global curriculum info: all lesson IDs and quiz IDs
    const chapters = await this.chapterModel.find().lean();
    const allLessonIds: string[] = [];
    const allQuizIds: string[] = [];

    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        allLessonIds.push(String(lesson._id));
        for (const item of (lesson.items ?? []) as ChapterLessonItem[]) {
          if (item.type === 'quiz') {
            allQuizIds.push(String(item.refId));
          }
        }
      }
    }

    if (allLessonIds.length === 0) return [];

    const studentIds = students.map((s) => new Types.ObjectId(String(s._id)));

    // Fetch all lesson + quiz completions for matching students in bulk
    const [lessonRows, quizRows] = await Promise.all([
      this.progressModel
        .find({ userId: { $in: studentIds }, completedAt: { $ne: null } })
        .select('userId lessonId')
        .lean(),
      this.quizProgressModel
        .find({ userId: { $in: studentIds }, completedAt: { $ne: null } })
        .select('userId quizId')
        .lean(),
    ]);

    // Group by userId
    const lessonsByUser = new Map<string, Set<string>>();
    for (const row of lessonRows) {
      const uid = String(row.userId);
      if (!lessonsByUser.has(uid)) lessonsByUser.set(uid, new Set());
      lessonsByUser.get(uid)!.add(String(row.lessonId));
    }

    const quizzesByUser = new Map<string, Set<string>>();
    for (const row of quizRows) {
      const uid = String(row.userId);
      if (!quizzesByUser.has(uid)) quizzesByUser.set(uid, new Set());
      quizzesByUser.get(uid)!.add(String(row.quizId));
    }

    const allLessonSet = new Set(allLessonIds);
    const allQuizSet = new Set(allQuizIds);
    const totalLessons = allLessonIds.length;
    const totalQuizzes = allQuizIds.length;

    // Filter to fully completed students only, then rank by points
    const qualified = students
      .map((s) => {
        const uid = String(s._id);
        const completedLessons = lessonsByUser.get(uid) ?? new Set<string>();
        const completedQuizzes = quizzesByUser.get(uid) ?? new Set<string>();

        const completedLessonCount = [...completedLessons].filter((id) => allLessonSet.has(id)).length;
        const completedQuizCount = [...completedQuizzes].filter((id) => allQuizSet.has(id)).length;

        const allLessonsComplete = completedLessonCount >= totalLessons;
        const allQuizzesComplete = totalQuizzes === 0 || completedQuizCount >= totalQuizzes;

        return {
          userId: uid,
          fullName: (s as any).fullName,
          profileImage: (s as any).profileImage ?? null,
          points: (s as any).points ?? 0,
          completedLessons: completedLessonCount,
          totalLessons,
          completedQuizzes: completedQuizCount,
          totalQuizzes,
          isTopLearner: allLessonsComplete && allQuizzesComplete,
        };
      })
      .filter((s) => s.isTopLearner)
      .sort((a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName));

    return qualified.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }

  /**
   * Teacher/admin deducts points from a student with a required reason.
   */
  async deductStudentPoints(
    teacherId: string,
    studentId: string,
    points: number,
    reason: string,
  ) {
    this.ensureObjectId(teacherId, 'Invalid teacher id');
    this.ensureObjectId(studentId, 'Invalid student id');

    if (!Number.isInteger(points) || points <= 0) {
      throw new BadRequestException('points must be a positive integer');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('reason is required for point deduction');
    }

    const student = await this.userModel.findById(studentId).select('points fullName').lean();
    if (!student) throw new NotFoundException('Student not found');

    const currentPoints = (student as any).points ?? 0;
    const newPoints = Math.max(0, currentPoints - points);

    await this.userModel.findByIdAndUpdate(studentId, { $set: { points: newPoints } });

    return {
      ok: true,
      studentId,
      fullName: (student as any).fullName,
      pointsDeducted: currentPoints - newPoints,
      previousPoints: currentPoints,
      newPoints,
      reason: reason.trim(),
      deductedBy: teacherId,
      deductedAt: new Date(),
    };
  }
}
