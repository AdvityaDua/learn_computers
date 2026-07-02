import { IsArray, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @IsOptional()
  @IsMongoId()
  subjectId?: string;
}
