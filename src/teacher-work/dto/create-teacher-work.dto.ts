import {
  IsEnum, IsInt, IsNotEmpty, IsOptional,
  IsString, Min,
} from 'class-validator';
import { WORK_TYPES } from '../schemas/teacher-work-log.schema';
import { WORK_STATUSES } from '../schemas/teacher-work-log.schema';

export class CreateTeacherWorkDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsEnum(WORK_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  contentTitle: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  studentCompletionCount?: number;
}

export class UpdateTeacherWorkDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  studentCompletionCount?: number;

  @IsOptional()
  @IsEnum(WORK_STATUSES)
  status?: string;
}
