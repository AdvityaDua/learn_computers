import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherWorkController } from './teacher-work.controller';
import { TeacherWorkService } from './teacher-work.service';
import { TeacherWorkLog, TeacherWorkLogSchema } from './schemas/teacher-work-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherWorkLog.name, schema: TeacherWorkLogSchema },
    ]),
  ],
  controllers: [TeacherWorkController],
  providers: [TeacherWorkService],
  exports: [TeacherWorkService],
})
export class TeacherWorkModule {}
