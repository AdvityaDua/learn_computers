import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentReviewsController } from './student-reviews.controller';
import { StudentReviewsService } from './student-reviews.service';
import { StudentReview, StudentReviewSchema } from './schemas/student-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentReview.name, schema: StudentReviewSchema },
    ]),
  ],
  controllers: [StudentReviewsController],
  providers: [StudentReviewsService],
  exports: [StudentReviewsService],
})
export class StudentReviewsModule {}
