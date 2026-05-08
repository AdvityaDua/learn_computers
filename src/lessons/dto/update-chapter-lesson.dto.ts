import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChapterLessonItemType } from '../schemas/chapter.schema';

export class ChapterLessonItemDto {
  @IsEnum(ChapterLessonItemType)
  type: ChapterLessonItemType;

  @IsMongoId()
  refId: string;
}

export class UpdateChapterLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterLessonItemDto)
  items?: ChapterLessonItemDto[];
}
