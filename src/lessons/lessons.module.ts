import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { buildDiskStorage } from '../common/utils/file-upload.util';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    MulterModule.register({ storage: buildDiskStorage('chapters') }),
  ],
  controllers: [LessonsController, ChaptersController],
  providers: [LessonsService, ChaptersService],
  exports: [LessonsService, ChaptersService],
})
export class LessonsModule {}
