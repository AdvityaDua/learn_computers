import {
  IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty,
  IsNumber, IsOptional, IsString, Max, Min,
} from 'class-validator';
import { REVIEW_TYPES } from '../schemas/student-review.schema';

export class CreateStudentReviewDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsEnum(REVIEW_TYPES)
  type: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  academicRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  behaviorRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  participationRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasForImprovement?: string[];
}
