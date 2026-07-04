import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '../constants/roles.enum';
import { AuthUser } from '../types/auth-user.type';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentDocument,
} from '../../assignments/schemas/assignment.schema';
import {
  Activity,
  ActivityDocument,
} from '../../activities/schemas/activity.schema';
import {
  CONTENT_MODEL_KEY,
  ContentModelKind,
} from '../decorators/content-model.decorator';

/**
 * Same shape as TeacherCourseAccessGuard but for the standalone content documents (video
 * lessons, quizzes, assignments, activities) rather than chapters. Each of those models carries
 * its own `classIds: string[]` directly (no subject indirection needed here), so scoping is a
 * straight intersection against the teacher's own classIds.
 *
 * Routes without an `@ContentModel(...)` decorator (e.g. the inline-image upload utilities) skip
 * the class check entirely and only require the canEditCourses flag.
 */
@Injectable()
export class TeacherContentAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user as AuthUser | undefined;
    if (!authUser) throw new ForbiddenException('Not authenticated');
    if (authUser.role === UserRole.Admin) return true;
    if (authUser.role !== UserRole.Instructor) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    const teacher = await this.userModel
      .findById(authUser.sub)
      .select('canEditCourses classIds')
      .lean();
    if (!teacher?.canEditCourses) {
      throw new ForbiddenException(
        'You do not have permission to edit course content',
      );
    }

    const kind = this.reflector.get<ContentModelKind | undefined>(
      CONTENT_MODEL_KEY,
      context.getHandler(),
    );
    if (!kind) return true;

    const id: string | undefined = request.params?.id;
    if (!id) {
      // Guards run before interceptors, so on a multipart create (lessons/assignments/
      // activities) Multer hasn't parsed `classIds` into the body yet — `request.body` is
      // empty here regardless of what the client sent. Role + canEditCourses are already
      // confirmed above; the class-scoping check for these routes happens in the controller
      // via assertClassAccessForCreate(), once the DTO is actually populated.
      const contentType = String(request.headers?.['content-type'] ?? '');
      if (contentType.includes('multipart/form-data')) return true;

      const targetClassNames = this.parseClassIds(request.body?.classIds);
      this.assertAllowed(targetClassNames, teacher.classIds ?? []);
      return true;
    }

    const targetClassNames = await this.classNamesForExisting(kind, id);
    this.assertAllowed(targetClassNames, teacher.classIds ?? []);
    return true;
  }

  /** Called directly from a multipart create() controller method, after Multer/the DTO pipe have populated `dto.classIds`, to do the class-scoping check the guard itself couldn't. */
  async assertClassAccessForCreate(
    authUser: AuthUser,
    rawClassIds: unknown,
  ): Promise<void> {
    if (authUser.role === UserRole.Admin) return;
    const teacher = await this.userModel
      .findById(authUser.sub)
      .select('classIds')
      .lean();
    this.assertAllowed(
      this.parseClassIds(rawClassIds),
      teacher?.classIds ?? [],
    );
  }

  private assertAllowed(targetClassNames: string[], teacherClassNames: string[]) {
    const allowed = targetClassNames.some((name) =>
      teacherClassNames.includes(name),
    );
    if (!allowed) {
      throw new ForbiddenException(
        "This isn't in one of your assigned classes",
      );
    }
  }

  private async classNamesForExisting(
    kind: ContentModelKind,
    id: string,
  ): Promise<string[]> {
    let doc: { classIds?: string[] } | null;
    switch (kind) {
      case 'lesson':
        doc = await this.lessonModel.findById(id).select('classIds').lean();
        break;
      case 'quiz':
        doc = await this.quizModel.findById(id).select('classIds').lean();
        break;
      case 'assignment':
        doc = await this.assignmentModel
          .findById(id)
          .select('classIds')
          .lean();
        break;
      case 'activity':
        doc = await this.activityModel.findById(id).select('classIds').lean();
        break;
    }
    if (!doc) throw new NotFoundException(`${kind} not found`);
    return doc.classIds ?? [];
  }

  private parseClassIds(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}
