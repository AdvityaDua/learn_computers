import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import {
  LessonProgress,
  LessonProgressSchema,
} from './schemas/lesson-progress.schema';
import {
  QuizProgress,
  QuizProgressSchema,
} from './schemas/quiz-progress.schema';
import {
  SubmissionProgress,
  SubmissionProgressSchema,
} from './schemas/submission-progress.schema';
import { Chapter, ChapterSchema } from '../lessons/schemas/chapter.schema';
import { Lesson, LessonSchema } from '../lessons/schemas/lesson.schema';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentSchema,
} from '../assignments/schemas/assignment.schema';
import {
  Activity,
  ActivitySchema,
} from '../activities/schemas/activity.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  TeacherDeadline,
  TeacherDeadlineSchema,
} from './schemas/teacher-deadline.schema';
import { buildDiskStorage } from '../common/utils/file-upload.util';

@Module({
  imports: [
    MulterModule.register({ storage: buildDiskStorage('submissions') }),
    MongooseModule.forFeature([
      { name: LessonProgress.name, schema: LessonProgressSchema },
      { name: QuizProgress.name, schema: QuizProgressSchema },
      { name: SubmissionProgress.name, schema: SubmissionProgressSchema },
      { name: TeacherDeadline.name, schema: TeacherDeadlineSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
