import {
  IsArray, IsDateString, IsEnum, IsNotEmpty,
  IsOptional, IsString,
} from 'class-validator';
import { ATTENDANCE_STATUSES } from '../schemas/attendance.schema';

export class AttendanceRecordDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(ATTENDANCE_STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsArray()
  records: AttendanceRecordDto[];
}
