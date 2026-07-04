import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherContentAccessGuard } from './teacher-content-access.guard';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { Lesson, LessonSchema } from '../../lessons/schemas/lesson.schema';
import { Quiz, QuizSchema } from '../../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentSchema,
} from '../../assignments/schemas/assignment.schema';
import {
  Activity,
  ActivitySchema,
} from '../../activities/schemas/activity.schema';

const contentModels = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Lesson.name, schema: LessonSchema },
  { name: Quiz.name, schema: QuizSchema },
  { name: Assignment.name, schema: AssignmentSchema },
  { name: Activity.name, schema: ActivitySchema },
]);

/**
 * Shared by LessonsModule, QuizzesModule, AssignmentsModule, and ActivitiesModule so each can
 * guard its own routes without re-registering every content schema by hand. `contentModels` is
 * re-exported (not just the guard) because `@UseGuards(TeacherContentAccessGuard)` resolves the
 * guard's constructor dependencies against the *consuming* module's injector — without this,
 * Nest can't find the model tokens the guard needs even though the guard class itself is exported.
 */
@Module({
  imports: [contentModels],
  providers: [TeacherContentAccessGuard],
  exports: [TeacherContentAccessGuard, contentModels],
})
export class TeacherContentAccessModule {}
