import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Lesson, LessonSchema } from '../lessons/schemas/lesson.schema';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
