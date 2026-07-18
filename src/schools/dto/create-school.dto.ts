import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  assignedClasses?: string[];

  @IsOptional()
  @IsArray()
  teacherIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStudents?: number;
}
