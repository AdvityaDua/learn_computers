import { IsString, IsOptional, IsArray, IsBoolean, IsEmail } from 'class-validator';

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
}
