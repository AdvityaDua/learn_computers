import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  /** JSON-encoded string[] — e.g. '["homework","week-1"]' */
  @IsOptional()
  @IsString()
  tags?: string;

  /** Points value sent as a numeric string from FormData */
  @IsOptional()
  @IsNumberString()
  points?: string;

  /** '1' | 'true' | '' | 'false' — from FormData */
  @IsOptional()
  @IsString()
  requiresSubmission?: string;

  /** JSON-encoded string[] — e.g. '["pdf","image"]' */
  @IsOptional()
  @IsString()
  acceptedFileTypes?: string;

  /** JSON-encoded string[] — e.g. '["Class 3"]' */
  @IsOptional()
  @IsString()
  classIds?: string;
}
