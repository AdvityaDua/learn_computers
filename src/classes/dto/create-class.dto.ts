import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsNumber()
  grade: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  schoolIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  teacherIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
