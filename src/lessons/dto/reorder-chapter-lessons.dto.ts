import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class ReorderChapterLessonsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  lessonIds: string[];
}
