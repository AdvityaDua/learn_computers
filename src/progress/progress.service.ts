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
import {
  Activity,
  ActivityDocument,
} from '../activities/schemas/activity.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Subject, SubjectDocument } from '../subjects/schemas/subject.schema';
import { Class, ClassDocument } from '../classes/class.schema';
import { UserRole } from '../common/constants/roles.enum';
import {
  TeacherDeadline,
  TeacherDeadlineDocument,
} from './schemas/teacher-deadline.schema';

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
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'rejected' ||
    status === 'resubmit_requested'
  ) {
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
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(TeacherDeadline.name)
    private readonly teacherDeadlineModel: Model<TeacherDeadlineDocument>,
  ) {}

  /**
   * A class's curriculum is the chapters whose subject belongs to that class (subjects
   * carry the class relationship via a real Class ObjectId). Chapters also carry a legacy
   * `classIds` field of class *names* (e.g. "Class 3") from before subjects existed, which is
   * also how `User.classIds` stores a student's class — so `classId` here may arrive as either
   * a Class ObjectId or a class name, and both are resolved. Without this scoping, a student's
   * totals were computed against every chapter in the whole school.
   */
  private async getCurriculumScope(
    classId?: string,
  ): Promise<{ lessonIds: string[]; quizIds: string[] }> {
    const chapterFilter: Record<string, unknown> = {};
    if (classId) {
      const resolvedClassId = Types.ObjectId.isValid(classId)
        ? classId
        : (await this.classModel.findOne({ name: classId }).select('_id').lean())?._id;

      const subjects = resolvedClassId
        ? await this.subjectModel.find({ classId: resolvedClassId }).select('_id').lean()
        : [];
      const subjectIds = subjects.map((s) => s._id);
      chapterFilter.$or = [
        { subjectId: { $in: subjectIds } },
        { classIds: classId },
      ];
    }

    const chapters = await this.chapterModel.find(chapterFilter).lean();
    const lessonIds: string[] = [];
    const quizIds: string[] = [];

    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        lessonIds.push(String(lesson._id));
        for (const item of (lesson.items ?? []) as ChapterLessonItem[]) {
          if (item.type === 'quiz') quizIds.push(String(item.refId));
        }
      }
    }

    return { lessonIds, quizIds };
  }

  async getLessonProgress(userId: string) {
    this.ensureObjectId(userId, 'Invalid user id format');

    const user = await this.userModel.findById(userId).select('classIds').lean();
    const classId = user?.classIds?.[0];
    const { lessonIds: allLessonIds, quizIds: allQuizRefIds } =
      await this.getCurriculumScope(classId);

    const totalLessons = allLessonIds.length;
    const totalQuizzes = allQuizRefIds.length;

    const [completedLessonRows, completedQuizRows] = await Promise.all([
      this.progressModel
        .find({
          userId: new Types.ObjectId(userId),
          completedAt: { $ne: null },
        })
        .select('lessonId')
        .lean(),
      this.quizProgressModel
        .find({
          userId: new Types.ObjectId(userId),
          completedAt: { $ne: null },
        })
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

    const lessonRatio =
      totalLessons > 0 ? completedLessonSet.size / totalLessons : 0;
    const quizRatio =
      totalQuizzes > 0 ? completedQuizSet.size / totalQuizzes : 1;

    let completionPercentage: number;
    if (totalQuizzes === 0) {
      completionPercentage = Math.round(lessonRatio * 100);
    } else {
      completionPercentage = Math.round(
        (lessonRatio * 0.5 + quizRatio * 0.5) * 100,
      );
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

  async markLessonCompleted(
    userId: string,
    chapterId: string,
    lessonId: string,
  ) {
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

  async markLessonAccessed(
    userId: string,
    chapterId: string,
    lessonId: string,
  ) {
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

    const lesson = lessons.find(
      (entry: ChapterLesson) => String(entry._id) === lessonId,
    );
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
      .filter(
        (item: any) => item.type === 'assignment' || item.type === 'activity',
      )
      .map((item: any) => ({
        taskType: item.type,
        taskId: new Types.ObjectId(String(item.refId)),
      }));

    const submissionRows = await this.submissionProgressModel
      .find({
        userId: new Types.ObjectId(userId),
        $or:
          taskRefIds.length > 0
            ? taskRefIds.map(({ taskType, taskId }) => ({ taskType, taskId }))
            : [{ taskId: new Types.ObjectId() }], // no-match placeholder
      })
      .select(
        'taskType taskId filePath originalName submittedAt reviewStatus reviewedAt reviewFeedback',
      )
      .lean();

    const submittedTaskMap: Record<
      string,
      {
        filePath: string;
        originalName: string;
        submittedAt: Date;
        reviewStatus: SubmissionReviewStatus;
        reviewedAt: Date | null;
        reviewFeedback: string;
      }
    > = Object.fromEntries(
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
      throw new BadRequestException(
        'This task does not require a file submission',
      );
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
        code: [
          'js',
          'ts',
          'py',
          'java',
          'c',
          'cpp',
          'cs',
          'rb',
          'go',
          'html',
          'css',
          'jsx',
          'tsx',
        ],
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
    pointsAwarded?: number,
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
      .findOne({
        userId: new Types.ObjectId(userId),
        taskType,
        taskId: new Types.ObjectId(taskId),
      })
      .lean();

    const submission = await this.submissionProgressModel
      .findOneAndUpdate(
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
            ...(reviewStatus === 'approved' && pointsAwarded != null
              ? { pointsAwarded }
              : {}),
          },
        },
        { new: true },
      )
      .lean();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Award points when transitioning to approved (only if not already approved)
    if (
      reviewStatus === 'approved' &&
      (existingSubmission as any)?.reviewStatus !== 'approved'
    ) {
      // Use explicit pointsAwarded if provided, otherwise fall back to task default points
      let awardPoints = pointsAwarded ?? 0;
      if (awardPoints === 0) {
        let task: any = null;
        if (taskType === 'assignment') {
          task = await this.assignmentModel
            .findById(taskId)
            .select('points')
            .lean();
        } else {
          task = await this.activityModel
            .findById(taskId)
            .select('points')
            .lean();
        }
        awardPoints = (task?.points ?? 0) as number;
      }
      if (awardPoints > 0) {
        await this.userModel.findByIdAndUpdate(userId, {
          $inc: { points: awardPoints },
        });
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
      questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

    // Check if already completed to avoid double-awarding points
    const existingQuizProgress = await this.quizProgressModel
      .findOne({
        userId: new Types.ObjectId(userId),
        quizId: new Types.ObjectId(quizId),
      })
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
        await this.userModel.findByIdAndUpdate(userId, {
          $inc: { points: pointsEarned },
        });
      }
    }

    return {
      results,
      score,
      totalQuestions: questions.length,
      correctCount,
    };
  }

  private async assertLessonBelongsToChapter(
    chapterId: string,
    lessonId: string,
  ) {
    this.ensureObjectId(chapterId, 'Invalid chapter id format');
    this.ensureObjectId(lessonId, 'Invalid lesson id format');

    const chapter = await this.chapterModel
      .findById(chapterId)
      .select('lessons')
      .lean();
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

  private async resolveMarkdownText(
    path: string | undefined,
    fallback: string,
  ) {
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
    const lessonMeta: Record<
      string,
      { chapterTitle: string; lessonTitle: string; chapterOrder: number }
    > = {};
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
        .select(
          'taskType taskId originalName submittedAt reviewStatus reviewedAt reviewFeedback',
        )
        .lean(),
    ]);

    const completedLessons = lessonRows
      .map((r) => {
        const meta = lessonMeta[String(r.lessonId)] ?? {};
        return {
          lessonId: String(r.lessonId),
          chapterId: String(r.chapterId),
          chapterTitle: meta.chapterTitle ?? 'Unknown Chapter',
          lessonTitle: meta.lessonTitle ?? 'Unknown Lesson',
          completedAt: r.completedAt,
          lastAccessedAt: r.lastAccessedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      );

    // Enrich quiz rows with quiz titles
    const quizIds = quizRows.map((r) => r.quizId);
    const quizDocs = await this.quizModel
      .find({ _id: { $in: quizIds } })
      .select('title')
      .lean();
    const quizTitleMap: Record<string, string> = Object.fromEntries(
      quizDocs.map((q) => [String(q._id), (q as any).title]),
    );

    const quizAttempts = quizRows
      .map((r: any) => ({
        quizId: String(r.quizId),
        title: quizTitleMap[String(r.quizId)] ?? 'Untitled Quiz',
        score: r.score ?? 0,
        totalQuestions: r.totalQuestions ?? 0,
        completedAt: r.completedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      );

    // Enrich submission rows with assignment/activity titles
    const assignmentIds = submissionRows
      .filter((r) => r.taskType === 'assignment')
      .map((r) => r.taskId);
    const activityIds = submissionRows
      .filter((r) => r.taskType === 'activity')
      .map((r) => r.taskId);

    const [assignmentDocs, activityDocs] = await Promise.all([
      this.assignmentModel
        .find({ _id: { $in: assignmentIds } })
        .select('title')
        .lean(),
      this.activityModel
        .find({ _id: { $in: activityIds } })
        .select('title')
        .lean(),
    ]);

    const taskTitleMap: Record<string, string> = {
      ...Object.fromEntries(
        assignmentDocs.map((d) => [String(d._id), (d as any).title]),
      ),
      ...Object.fromEntries(
        activityDocs.map((d) => [String(d._id), (d as any).title]),
      ),
    };

    const submissions = submissionRows
      .map((r) => ({
        taskType: r.taskType,
        taskId: String(r.taskId),
        title: taskTitleMap[String(r.taskId)] ?? 'Untitled Task',
        originalName: r.originalName,
        submittedAt: r.submittedAt,
        reviewStatus: normalizeReviewStatus((r as any).reviewStatus),
        reviewedAt: (r as any).reviewedAt ?? null,
        reviewFeedback: (r as any).reviewFeedback ?? '',
      }))
      .sort(
        (a, b) =>
          new Date(b.submittedAt!).getTime() -
          new Date(a.submittedAt!).getTime(),
      );

    const totalLessons = Object.keys(lessonMeta).length;
    const completionPercentage =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0;

    return {
      completionPercentage,
      totalLessons,
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
   * Get the global leaderboard for a specific class and/or school.
   * All active students are ranked by accumulated points descending.
   */
  async getLeaderboard(classId?: string, schoolId?: string) {
    // Find students matching class/school filters
    const userFilter: any = { role: UserRole.Student, isActive: true };
    if (classId) userFilter.classIds = classId;
    if (schoolId) {
      if (!Types.ObjectId.isValid(schoolId))
        throw new BadRequestException('Invalid schoolId');
      userFilter.schoolId = new Types.ObjectId(schoolId);
    }

    const students = await this.userModel
      .find(userFilter)
      .select('fullName profileImage points classIds schoolId')
      .lean();

    if (students.length === 0) return [];

    // A class with no assigned subjects yet still has a roster — show it ranked by points
    // instead of hiding the whole leaderboard just because there's nothing to complete yet.
    const { lessonIds: allLessonIds, quizIds: allQuizIds } =
      await this.getCurriculumScope(classId);

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

        const completedLessonCount = [...completedLessons].filter((id) =>
          allLessonSet.has(id),
        ).length;
        const completedQuizCount = [...completedQuizzes].filter((id) =>
          allQuizSet.has(id),
        ).length;

        const allLessonsComplete = completedLessonCount >= totalLessons;
        const allQuizzesComplete =
          totalQuizzes === 0 || completedQuizCount >= totalQuizzes;
        const totalItems = totalLessons + totalQuizzes;
        const completionPercentage =
          totalItems > 0
            ? Math.round(
                ((completedLessonCount + completedQuizCount) / totalItems) *
                  100,
              )
            : 0;

        return {
          _id: uid,
          userId: uid,
          fullName: (s as any).fullName,
          profileImage: (s as any).profileImage ?? null,
          points: (s as any).points ?? 0,
          lessonCount: completedLessonCount,
          totalLessons,
          quizCount: completedQuizCount,
          totalQuizzes,
          completionPercentage,
          // Nobody is a "top learner" for finishing a curriculum that doesn't exist yet.
          isTopLearner: totalLessons > 0 && allLessonsComplete && allQuizzesComplete,
        };
      })
      .sort(
        (a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName),
      );

    return qualified.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }

  /**
   * Teacher-specific: get detailed results for all students in a class.
   * Includes quiz scores, assignment/activity submission stats, lesson completion.
   */
  async getTeacherClassResults(classId: string, schoolId?: string, teacherId?: string) {
    // classId here is the class name like "Class 3"
    const userFilter: any = {
      role: UserRole.Student,
      isActive: true,
      classIds: classId,
    };
    if (schoolId && Types.ObjectId.isValid(schoolId)) {
      userFilter.schoolId = new Types.ObjectId(schoolId);
    }
    if (teacherId && Types.ObjectId.isValid(teacherId)) {
      userFilter.teacherId = new Types.ObjectId(teacherId);
    }

    const students = await this.userModel
      .find(userFilter)
      .select('fullName email profileImage points classIds schoolId')
      .lean();

    if (students.length === 0)
      return {
        students: [],
        summary: { totalStudents: 0, avgCompletion: 0, avgPoints: 0 },
      };

    const { lessonIds: allLessonIds, quizIds: allQuizIds } =
      await this.getCurriculumScope(classId);

    const totalLessons = allLessonIds.length;
    const totalQuizzes = allQuizIds.length;
    const studentIds = students.map((s) => new Types.ObjectId(String(s._id)));

    const [lessonRows, quizRows, submissionRows] = await Promise.all([
      this.progressModel
        .find({ userId: { $in: studentIds }, completedAt: { $ne: null } })
        .select('userId lessonId')
        .lean(),
      this.quizProgressModel
        .find({ userId: { $in: studentIds } })
        .select('userId quizId score completedAt')
        .lean(),
      this.submissionProgressModel
        .find({ userId: { $in: studentIds } })
        .select('userId taskType taskId reviewStatus submittedAt')
        .lean(),
    ]);

    // Group by user
    const lessonsByUser = new Map<string, Set<string>>();
    for (const row of lessonRows) {
      const uid = String(row.userId);
      if (!lessonsByUser.has(uid)) lessonsByUser.set(uid, new Set());
      lessonsByUser.get(uid)!.add(String(row.lessonId));
    }

    const quizzesByUser = new Map<
      string,
      { score: number; completed: boolean }[]
    >();
    for (const row of quizRows) {
      const uid = String(row.userId);
      if (!quizzesByUser.has(uid)) quizzesByUser.set(uid, []);
      quizzesByUser
        .get(uid)!
        .push({
          score: (row as any).score ?? 0,
          completed: !!(row as any).completedAt,
        });
    }

    const submissionsByUser = new Map<
      string,
      { pending: number; approved: number; rejected: number; total: number }
    >();
    for (const row of submissionRows) {
      const uid = String(row.userId);
      if (!submissionsByUser.has(uid))
        submissionsByUser.set(uid, {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0,
        });
      const stats = submissionsByUser.get(uid)!;
      stats.total++;
      const status = (row as any).reviewStatus ?? 'pending';
      if (status === 'approved') stats.approved++;
      else if (status === 'rejected') stats.rejected++;
      else stats.pending++;
    }

    const allLessonSet = new Set(allLessonIds);

    const studentResults = students
      .map((s) => {
        const uid = String(s._id);
        const completedLessons = lessonsByUser.get(uid) ?? new Set<string>();
        const validCompletedLessons = [...completedLessons].filter((id) =>
          allLessonSet.has(id),
        ).length;
        const quizData = quizzesByUser.get(uid) ?? [];
        const completedQuizzes = quizData.filter((q) => q.completed).length;
        const avgQuizScore =
          quizData.length > 0
            ? Math.round(
                quizData.reduce((acc, q) => acc + q.score, 0) / quizData.length,
              )
            : 0;
        const lessonCompletion =
          totalLessons > 0
            ? Math.round((validCompletedLessons / totalLessons) * 100)
            : 0;
        const submissions = submissionsByUser.get(uid) ?? {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0,
        };

        return {
          userId: uid,
          fullName: (s as any).fullName,
          email: (s as any).email,
          profileImage: (s as any).profileImage ?? null,
          points: (s as any).points ?? 0,
          completedLessons: validCompletedLessons,
          totalLessons,
          lessonCompletion,
          completedQuizzes,
          totalQuizzes,
          avgQuizScore,
          submissions,
        };
      })
      .sort(
        (a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName),
      );

    const avgCompletion =
      studentResults.length > 0
        ? Math.round(
            studentResults.reduce((acc, s) => acc + s.lessonCompletion, 0) /
              studentResults.length,
          )
        : 0;
    const avgPoints =
      studentResults.length > 0
        ? Math.round(
            studentResults.reduce((acc, s) => acc + s.points, 0) /
              studentResults.length,
          )
        : 0;

    return {
      students: studentResults,
      summary: {
        totalStudents: studentResults.length,
        avgCompletion,
        avgPoints,
        totalLessons,
        totalQuizzes,
      },
    };
  }

  /**
   * Teacher leaderboard — ALL students ranked by points (not filtered to fully-completed only).
   */
  async getTeacherLeaderboard(classId?: string, schoolId?: string, teacherId?: string) {
    const userFilter: any = { role: UserRole.Student, isActive: true };
    if (classId) userFilter.classIds = classId;
    if (schoolId && Types.ObjectId.isValid(schoolId)) {
      userFilter.schoolId = new Types.ObjectId(schoolId);
    }
    if (teacherId && Types.ObjectId.isValid(teacherId)) {
      userFilter.teacherId = new Types.ObjectId(teacherId);
    }

    const students = await this.userModel
      .find(userFilter)
      .select('fullName profileImage points classIds schoolId')
      .lean();

    if (students.length === 0) return [];

    const { lessonIds: allLessonIds, quizIds: allQuizIds } =
      await this.getCurriculumScope(classId);

    const totalLessons = allLessonIds.length;
    const totalQuizzes = allQuizIds.length;
    const studentIds = students.map((s) => new Types.ObjectId(String(s._id)));

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

    const ranked = students
      .map((s) => {
        const uid = String(s._id);
        const completedLessons = lessonsByUser.get(uid) ?? new Set<string>();
        const completedQuizzes = quizzesByUser.get(uid) ?? new Set<string>();
        const completedLessonCount = [...completedLessons].filter((id) =>
          allLessonSet.has(id),
        ).length;
        const completedQuizCount = [...completedQuizzes].filter((id) =>
          allQuizSet.has(id),
        ).length;

        return {
          userId: uid,
          fullName: (s as any).fullName,
          profileImage: (s as any).profileImage ?? null,
          points: (s as any).points ?? 0,
          completedLessons: completedLessonCount,
          totalLessons,
          completedQuizzes: completedQuizCount,
          totalQuizzes,
        };
      })
      .sort(
        (a, b) => b.points - a.points || a.fullName.localeCompare(b.fullName),
      );

    return ranked.map((s, idx) => ({ ...s, rank: idx + 1 }));
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

    const student = await this.userModel
      .findById(studentId)
      .select('points fullName')
      .lean();
    if (!student) throw new NotFoundException('Student not found');

    const currentPoints = (student as any).points ?? 0;
    const newPoints = Math.max(0, currentPoints - points);

    await this.userModel.findByIdAndUpdate(studentId, {
      $set: { points: newPoints },
    });

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

  /** Teacher: get submissions from students in their classes */
  async getTeacherSubmissions(teacherId: string, statusFilter?: string) {
    // Get teacher's classes and school
    const teacher = await this.userModel.findById(teacherId).lean();
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherClassIds: string[] = (teacher as any).classIds ?? [];
    const teacherSchoolId = (teacher as any).schoolId;

    // Get student IDs in teacher's scope (must be directly assigned)
    const studentFilter: any = {
      role: UserRole.Student,
      isActive: true,
      teacherId: new Types.ObjectId(teacherId),
    };
    if (teacherClassIds.length > 0)
      studentFilter.classIds = { $in: teacherClassIds };
    if (teacherSchoolId) studentFilter.schoolId = teacherSchoolId;

    const students = await this.userModel
      .find(studentFilter)
      .select('_id fullName email classIds')
      .lean();
    const studentIds = students.map((s: any) => s._id);
    const studentMap = new Map(students.map((s: any) => [String(s._id), s]));

    if (studentIds.length === 0) return [];

    // Get submissions
    const subFilter: any = { userId: { $in: studentIds } };
    if (
      statusFilter &&
      ['pending', 'approved', 'rejected', 'resubmit_requested'].includes(
        statusFilter,
      )
    ) {
      subFilter.reviewStatus = statusFilter;
    }

    const submissions = await this.submissionProgressModel
      .find(subFilter)
      .sort({ submittedAt: -1 })
      .lean();

    // Enrich with task titles
    const assignmentIds = submissions
      .filter((s) => s.taskType === 'assignment')
      .map((s) => s.taskId);
    const activityIds = submissions
      .filter((s) => s.taskType === 'activity')
      .map((s) => s.taskId);

    const [assignmentsArr, activitiesArr] = await Promise.all([
      assignmentIds.length > 0
        ? this.assignmentModel
            .find({ _id: { $in: assignmentIds } })
            .select('title points')
            .lean()
        : [],
      activityIds.length > 0
        ? this.activityModel
            .find({ _id: { $in: activityIds } })
            .select('title points')
            .lean()
        : [],
    ]);

    const taskMap = new Map<string, { title: string; points?: number }>();
    for (const a of assignmentsArr)
      taskMap.set(String(a._id), { title: a.title, points: (a as any).points });
    for (const a of activitiesArr)
      taskMap.set(String(a._id), { title: a.title, points: (a as any).points });

    return submissions.map((sub: any) => {
      const student = studentMap.get(String(sub.userId));
      const task = taskMap.get(String(sub.taskId));
      return {
        _id: String(sub._id),
        userId: String(sub.userId),
        studentName: (student as any)?.fullName ?? 'Unknown',
        studentEmail: (student as any)?.email ?? '',
        studentClass: ((student as any)?.classIds ?? [])[0] ?? '',
        taskType: sub.taskType,
        taskId: String(sub.taskId),
        taskTitle: task?.title ?? 'Unknown Task',
        taskPoints: task?.points ?? 0,
        filePath: sub.filePath,
        originalName: sub.originalName,
        submittedAt: sub.submittedAt,
        reviewStatus: normalizeReviewStatus(sub.reviewStatus),
        reviewFeedback: sub.reviewFeedback ?? '',
        pointsAwarded: sub.pointsAwarded ?? 0,
        reviewedAt: sub.reviewedAt ?? null,
      };
    });
  }

  /** Admin: get all submissions across the platform */
  async getAdminSubmissions(statusFilter?: string) {
    const filter: any = {};
    if (statusFilter) {
      if (statusFilter === 'pending') {
        filter.$or = [
          { reviewStatus: 'pending' },
          { reviewStatus: { $exists: false } },
        ];
      } else {
        filter.reviewStatus = statusFilter;
      }
    }

    const rawSubmissions = await this.submissionProgressModel
      .find(filter)
      .sort({ submittedAt: -1 })
      .lean();
    if (rawSubmissions.length === 0) return [];

    const studentIds = [
      ...new Set(rawSubmissions.map((s: any) => String(s.userId))),
    ].map((id) => new Types.ObjectId(id));
    const taskIds = [
      ...new Set(rawSubmissions.map((s: any) => String(s.taskId))),
    ].map((id) => new Types.ObjectId(id));

    const students = await this.userModel
      .find({ _id: { $in: studentIds } } as any)
      .select('_id fullName email classIds')
      .lean();
    const studentMap = new Map(students.map((s: any) => [String(s._id), s]));

    const [assignments, activities] = await Promise.all([
      this.assignmentModel
        .find({ _id: { $in: taskIds } } as any)
        .select('_id title points')
        .lean(),
      this.activityModel
        .find({ _id: { $in: taskIds } } as any)
        .select('_id title points')
        .lean(),
    ]);

    const taskMap = new Map();
    assignments.forEach((a: any) => taskMap.set(String(a._id), a));
    activities.forEach((a: any) => taskMap.set(String(a._id), a));

    return rawSubmissions.map((sub: any) => {
      const student = studentMap.get(String(sub.userId));
      const task = taskMap.get(String(sub.taskId));
      return {
        _id: String(sub._id),
        userId: String(sub.userId),
        studentName: (student as any)?.fullName ?? 'Unknown',
        studentEmail: (student as any)?.email ?? '',
        studentClass: ((student as any)?.classIds ?? [])[0] ?? '',
        taskType: sub.taskType,
        taskId: String(sub.taskId),
        taskTitle: task?.title ?? 'Unknown Task',
        taskPoints: task?.points ?? 0,
        filePath: sub.filePath,
        originalName: sub.originalName,
        submittedAt: sub.submittedAt,
        reviewStatus: normalizeReviewStatus(sub.reviewStatus),
        reviewFeedback: sub.reviewFeedback ?? '',
        pointsAwarded: sub.pointsAwarded ?? 0,
        reviewedAt: sub.reviewedAt ?? null,
      };
    });
  }

  // ── Teacher-scoped Deadline Management ──────────────────────────────────

  async setTeacherDeadline(
    teacherId: string,
    taskType: 'assignment' | 'activity' | 'quiz',
    taskId: string,
    classId: string,
    dueDate: string | null,
  ) {
    this.ensureObjectId(teacherId, 'Invalid teacher id');
    this.ensureObjectId(taskId, 'Invalid task id');

    if (!dueDate) {
      // Remove deadline
      await this.teacherDeadlineModel.deleteOne({
        teacherId: new Types.ObjectId(teacherId),
        taskType,
        taskId: new Types.ObjectId(taskId),
        classId,
      });
      return { ok: true, removed: true };
    }

    const deadline = await this.teacherDeadlineModel.findOneAndUpdate(
      {
        teacherId: new Types.ObjectId(teacherId),
        taskType,
        taskId: new Types.ObjectId(taskId),
        classId,
      },
      {
        $set: { dueDate: new Date(dueDate) },
      },
      { upsert: true, new: true },
    );

    return {
      ok: true,
      deadline: {
        _id: String(deadline._id),
        teacherId,
        taskType,
        taskId,
        classId,
        dueDate: deadline.dueDate,
      },
    };
  }

  async getTeacherDeadlines(teacherId: string, classId?: string) {
    this.ensureObjectId(teacherId, 'Invalid teacher id');
    const filter: any = { teacherId: new Types.ObjectId(teacherId) };
    if (classId) filter.classId = classId;

    const deadlines = await this.teacherDeadlineModel.find(filter).lean();

    // Enrich with task titles
    const assignmentIds = deadlines.filter(d => d.taskType === 'assignment').map(d => d.taskId);
    const activityIds = deadlines.filter(d => d.taskType === 'activity').map(d => d.taskId);
    const quizIds = deadlines.filter(d => d.taskType === 'quiz').map(d => d.taskId);

    const [assignments, activities, quizzes] = await Promise.all([
      assignmentIds.length > 0 ? this.assignmentModel.find({ _id: { $in: assignmentIds } }).select('title').lean() : [],
      activityIds.length > 0 ? this.activityModel.find({ _id: { $in: activityIds } }).select('title').lean() : [],
      quizIds.length > 0 ? this.quizModel.find({ _id: { $in: quizIds } }).select('title').lean() : [],
    ]);

    const titleMap = new Map<string, string>();
    for (const a of assignments) titleMap.set(String(a._id), (a as any).title);
    for (const a of activities) titleMap.set(String(a._id), (a as any).title);
    for (const q of quizzes) titleMap.set(String(q._id), (q as any).title);

    return deadlines.map((d: any) => ({
      _id: String(d._id),
      teacherId: String(d.teacherId),
      taskType: d.taskType,
      taskId: String(d.taskId),
      taskTitle: titleMap.get(String(d.taskId)) ?? 'Unknown',
      classId: d.classId,
      dueDate: d.dueDate,
    }));
  }

  // ── Curriculum Tree (for teacher view) ──────────────────────────────────

  async getStudentDeadlines(userId: string) {
    this.ensureObjectId(userId, 'Invalid user id');
    const user = await this.userModel.findById(userId).select('classIds').lean();
    if (!user || !user.classIds || user.classIds.length === 0) {
      return [];
    }
    const classId = user.classIds[0];
    const deadlines = await this.teacherDeadlineModel.find({ classId }).lean();
    return deadlines.map((d: any) => ({
      taskId: String(d.taskId),
      taskType: d.taskType,
      dueDate: d.dueDate,
    }));
  }

  async getCurriculumTree() {
    const chapters = await this.chapterModel.find().sort({ order: 1, createdAt: 1 }).lean();

    const allLessonIds: string[] = [];
    const allQuizIds: string[] = [];
    const allAssignmentIds: string[] = [];
    const allActivityIds: string[] = [];

    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        for (const item of lesson.items ?? []) {
          if (item.type === 'video' || item.type === 'documentation') allLessonIds.push(String(item.refId));
          if (item.type === 'quiz') allQuizIds.push(String(item.refId));
          if (item.type === 'assignment') allAssignmentIds.push(String(item.refId));
          if (item.type === 'activity') allActivityIds.push(String(item.refId));
        }
      }
    }

    const [lessonsDocs, assignments, activities, quizzes] = await Promise.all([
      allLessonIds.length > 0 ? this.lessonModel.find({ _id: { $in: allLessonIds } }).select('title').lean() : [],
      allAssignmentIds.length > 0 ? this.assignmentModel.find({ _id: { $in: allAssignmentIds } }).select('title requiresSubmission').lean() : [],
      allActivityIds.length > 0 ? this.activityModel.find({ _id: { $in: allActivityIds } }).select('title requiresSubmission').lean() : [],
      allQuizIds.length > 0 ? this.quizModel.find({ _id: { $in: allQuizIds } }).select('title').lean() : [],
    ]);

    const titleMap = new Map<string, string>();
    const submissionMap = new Map<string, boolean>();

    for (const l of lessonsDocs) titleMap.set(String(l._id), (l as any).title);
    for (const a of assignments) {
      titleMap.set(String(a._id), (a as any).title);
      submissionMap.set(String(a._id), (a as any).requiresSubmission);
    }
    for (const a of activities) {
      titleMap.set(String(a._id), (a as any).title);
      submissionMap.set(String(a._id), (a as any).requiresSubmission);
    }
    for (const q of quizzes) titleMap.set(String(q._id), (q as any).title);

    return chapters.map((chapter: any) => {
      const lessons = [...(chapter.lessons ?? [])]
        .sort((a: any, b: any) => a.order - b.order)
        .map((lesson: any) => {
          const items = [...(lesson.items ?? [])]
            .sort((a: any, b: any) => a.order - b.order)
            .map((item: any) => {
              const refId = String(item.refId);
              return {
                type: item.type,
                refId,
                order: item.order,
                title: titleMap.get(refId) ?? undefined,
                submissionRequired: submissionMap.get(refId) ?? false,
              };
            });

          return {
            _id: String(lesson._id),
            title: lesson.title,
            order: lesson.order,
            itemCount: items.length,
            items,
          };
        });

      return {
        _id: String(chapter._id),
        title: chapter.title,
        order: chapter.order ?? 0,
        coverImageFilePath: chapter.coverImageFilePath ?? null,
        lessonCount: lessons.length,
        lessons,
      };
    });
  }

  // ── Teacher: detailed student progress with all submission statuses ────

  async getTeacherStudentDetail(teacherId: string, studentId: string) {
    this.ensureObjectId(teacherId, 'Invalid teacher id');
    this.ensureObjectId(studentId, 'Invalid student id');

    // Verify teacher owns this student
    const teacher = await this.userModel.findById(teacherId).lean();
    if (!teacher) throw new NotFoundException('Teacher not found');
    const teacherClassIds: string[] = (teacher as any).classIds ?? [];

    const student = await this.userModel.findById(studentId)
      .select('-passwordHash')
      .populate('schoolId', 'name code')
      .populate('teacherId', 'fullName email')
      .lean();
    if (!student) throw new NotFoundException('Student not found');

    const studentClassIds: string[] = (student as any).classIds ?? [];
    const hasOverlap = studentClassIds.some(c => teacherClassIds.includes(c));
    if (!hasOverlap || String((student as any).teacherId?._id || (student as any).teacherId) !== teacherId) {
      throw new BadRequestException('This student is not assigned to you.');
    }

    // Get curriculum
    const chapters = await this.chapterModel.find().lean();
    const allLessonIds: string[] = [];
    const allQuizIds: string[] = [];
    const allAssignmentIds: string[] = [];
    const allActivityIds: string[] = [];

    for (const chapter of chapters) {
      for (const lesson of (chapter as any).lessons ?? []) {
        allLessonIds.push(String(lesson._id));
        for (const item of lesson.items ?? []) {
          if (item.type === 'quiz') allQuizIds.push(String(item.refId));
          if (item.type === 'assignment') allAssignmentIds.push(String(item.refId));
          if (item.type === 'activity') allActivityIds.push(String(item.refId));
        }
      }
    }

    const studentOid = new Types.ObjectId(studentId);

    const [lessonRows, quizRows, submissionRows] = await Promise.all([
      this.progressModel
        .find({ userId: studentOid, completedAt: { $ne: null } })
        .select('lessonId chapterId completedAt')
        .lean(),
      this.quizProgressModel
        .find({ userId: studentOid })
        .select('quizId score completedAt')
        .lean(),
      this.submissionProgressModel
        .find({ userId: studentOid })
        .select('taskType taskId originalName submittedAt reviewStatus reviewFeedback reviewedAt pointsAwarded')
        .lean(),
    ]);

    const completedLessonSet = new Set(lessonRows.map(r => String(r.lessonId)));
    const quizMap = new Map(quizRows.map(r => [String(r.quizId), { score: (r as any).score ?? 0, completedAt: r.completedAt }]));
    const submissionMap = new Map(submissionRows.map((r: any) => [
      `${r.taskType}:${String(r.taskId)}`,
      {
        submittedAt: r.submittedAt,
        originalName: r.originalName,
        reviewStatus: r.reviewStatus ?? 'pending',
        reviewFeedback: r.reviewFeedback ?? '',
        reviewedAt: r.reviewedAt ?? null,
        pointsAwarded: r.pointsAwarded ?? 0,
      },
    ]));

    // Enrich task titles
    const taskIds = [...new Set([...allAssignmentIds, ...allActivityIds])];
    const quizIdSet = [...new Set(allQuizIds)];
    const [assignmentDocs, activityDocs, quizDocs] = await Promise.all([
      allAssignmentIds.length > 0 ? this.assignmentModel.find({ _id: { $in: allAssignmentIds.map(id => new Types.ObjectId(id)) } }).select('title points dueDate requiresSubmission').lean() : [],
      allActivityIds.length > 0 ? this.activityModel.find({ _id: { $in: allActivityIds.map(id => new Types.ObjectId(id)) } }).select('title points dueDate requiresSubmission').lean() : [],
      allQuizIds.length > 0 ? this.quizModel.find({ _id: { $in: allQuizIds.map(id => new Types.ObjectId(id)) } }).select('title questions').lean() : [],
    ]);

    const assignmentMap = new Map<string, any>(assignmentDocs.map((d: any) => [String(d._id), d] as [string, any]));
    const activityMap = new Map<string, any>(activityDocs.map((d: any) => [String(d._id), d] as [string, any]));
    const quizDocMap = new Map<string, any>(quizDocs.map((d: any) => [String(d._id), d] as [string, any]));

    // Build per-chapter, per-lesson detail
    const chapterDetails = chapters.map((chapter: any) => {
      const lessons = [...(chapter.lessons ?? [])]
        .sort((a: any, b: any) => a.order - b.order)
        .map((lesson: any) => {
          const lessonId = String(lesson._id);
          const completed = completedLessonSet.has(lessonId);

          const items = [...(lesson.items ?? [])]
            .sort((a: any, b: any) => a.order - b.order)
            .map((item: any) => {
              const refId = String(item.refId);
              let status: any = { type: item.type, refId, title: 'Unknown' };

              if (item.type === 'quiz') {
                const doc = quizDocMap.get(refId);
                const progress = quizMap.get(refId);
                status = {
                  ...status,
                  title: doc?.title ?? 'Unknown Quiz',
                  totalQuestions: (doc?.questions ?? []).length,
                  completed: !!progress?.completedAt,
                  score: progress?.score ?? null,
                };
              } else if (item.type === 'assignment') {
                const doc = assignmentMap.get(refId);
                const sub = submissionMap.get(`assignment:${refId}`);
                status = {
                  ...status,
                  title: doc?.title ?? 'Unknown Assignment',
                  points: doc?.points ?? 0,
                  requiresSubmission: doc?.requiresSubmission ?? false,
                  submitted: !!sub,
                  submittedAt: sub?.submittedAt ?? null,
                  reviewStatus: sub?.reviewStatus ?? 'not_submitted',
                  reviewFeedback: sub?.reviewFeedback ?? '',
                  pointsAwarded: sub?.pointsAwarded ?? 0,
                };
              } else if (item.type === 'activity') {
                const doc = activityMap.get(refId);
                const sub = submissionMap.get(`activity:${refId}`);
                status = {
                  ...status,
                  title: doc?.title ?? 'Unknown Activity',
                  points: doc?.points ?? 0,
                  requiresSubmission: doc?.requiresSubmission ?? false,
                  submitted: !!sub,
                  submittedAt: sub?.submittedAt ?? null,
                  reviewStatus: sub?.reviewStatus ?? 'not_submitted',
                  reviewFeedback: sub?.reviewFeedback ?? '',
                  pointsAwarded: sub?.pointsAwarded ?? 0,
                };
              }

              return status;
            });

          return {
            _id: lessonId,
            title: lesson.title,
            order: lesson.order,
            completed,
            items,
          };
        });

      return {
        _id: String(chapter._id),
        title: chapter.title,
        order: chapter.order ?? 0,
        lessons,
      };
    });

    const totalLessons = allLessonIds.length;
    const completedLessons = [...completedLessonSet].filter(id => allLessonIds.includes(id)).length;
    const totalQuizzes = allQuizIds.length;
    const completedQuizzes = [...quizMap.entries()].filter(([id, v]) => allQuizIds.includes(id) && v.completedAt).length;
    const totalTasks = allAssignmentIds.length + allActivityIds.length;
    const submittedTasks = submissionRows.length;
    const approvedTasks = submissionRows.filter((r: any) => r.reviewStatus === 'approved').length;
    const pendingTasks = submissionRows.filter((r: any) => r.reviewStatus === 'pending' || !r.reviewStatus).length;
    const rejectedTasks = submissionRows.filter((r: any) => r.reviewStatus === 'rejected').length;

    const completionPct = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return {
      student: {
        _id: String(student._id),
        fullName: (student as any).fullName,
        email: (student as any).email,
        phone: (student as any).phone ?? null,
        profileImage: (student as any).profileImage ?? null,
        classIds: (student as any).classIds ?? [],
        school: (student as any).schoolId ?? null,
        teacher: (student as any).teacherId ?? null,
        points: (student as any).points ?? 0,
      },
      summary: {
        completionPct,
        completedLessons,
        totalLessons,
        completedQuizzes,
        totalQuizzes,
        submittedTasks,
        totalTasks,
        approvedTasks,
        pendingTasks,
        rejectedTasks,
      },
      chapters: chapterDetails,
    };
  }
}
