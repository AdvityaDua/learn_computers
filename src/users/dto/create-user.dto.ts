import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { UserRole } from '../../common/constants/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsArray()
  classIds?: string[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}
