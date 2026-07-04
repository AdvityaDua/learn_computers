import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../constants/roles.enum';
import { AuthUser } from '../types/auth-user.type';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Chapter, ChapterDocument } from '../../lessons/schemas/chapter.schema';
import { Subject, SubjectDocument } from '../../subjects/schemas/subject.schema';
import { Class, ClassDocument } from '../../classes/class.schema';

/**
 * Runs after RolesGuard already let Admin *or* Instructor through. Admin always passes.
 * An Instructor only passes if an admin has granted them `canEditCourses`, AND the chapter
 * being touched (existing, via `:id`, or about to be created, via the request body) belongs
 * to one of the classes they're actually assigned to teach — so the permission can't be used
 * to edit another teacher's class content.
 */
@Injectable()
export class TeacherCourseAccessGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
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
        'You do not have permission to edit courses',
      );
    }

    const teacherClassNames: string[] = teacher.classIds ?? [];
    const chapterId: string | undefined = request.params?.id;

    let targetClassNames: string[];
    if (chapterId) {
      const chapter = await this.chapterModel
        .findById(chapterId)
        .select('classIds subjectId')
        .lean();
      if (!chapter) throw new NotFoundException('Chapter not found');
      targetClassNames = await this.resolveClassNames(
        chapter.classIds ?? [],
        chapter.subjectId,
      );
    } else {
      const body = (request.body ?? {}) as {
        classIds?: string[];
        subjectId?: string;
      };
      targetClassNames = await this.resolveClassNames(
        body.classIds ?? [],
        body.subjectId,
      );
    }

    const allowed = targetClassNames.some((name) =>
      teacherClassNames.includes(name),
    );
    if (!allowed) {
      throw new ForbiddenException(
        "This course isn't in one of your assigned classes",
      );
    }

    return true;
  }

  private async resolveClassNames(
    classIds: string[],
    subjectId?: Types.ObjectId | string,
  ): Promise<string[]> {
    const names = new Set<string>(classIds);
    if (subjectId) {
      const subject = await this.subjectModel
        .findById(subjectId)
        .select('classId')
        .lean();
      if (subject?.classId) {
        const cls = await this.classModel
          .findById(subject.classId)
          .select('name')
          .lean();
        if (cls?.name) names.add(cls.name);
      }
    }
    return [...names];
  }
}
