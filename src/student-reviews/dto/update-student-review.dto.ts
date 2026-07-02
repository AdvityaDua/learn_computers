import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentReviewDto } from './create-student-review.dto';

export class UpdateStudentReviewDto extends PartialType(CreateStudentReviewDto) {}
