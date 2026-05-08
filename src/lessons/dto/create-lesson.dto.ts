import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LessonType } from '../schemas/lesson.schema';

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsOptional()
  @IsString()
  externalVideoUrl?: string;

  /** JSON-encoded string[] — e.g. '["react","javascript"]' */
  @IsOptional()
  @IsString()
  tags?: string;
}
