import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // JSON-encoded string[]
  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsNumberString()
  points?: string;

  @IsOptional()
  @IsString()
  requiresSubmission?: string;

  @IsOptional()
  @IsString()
  acceptedFileTypes?: string;

  // JSON-encoded string[]
  @IsOptional()
  @IsString()
  classIds?: string;
}
