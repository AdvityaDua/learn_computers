import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
