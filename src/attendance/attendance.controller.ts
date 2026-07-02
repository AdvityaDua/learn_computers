import {
  Body, Controller, Get, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** Teacher or Admin: bulk mark attendance for a class on a date */
  @Post('mark')
  @Roles(UserRole.Instructor, UserRole.Admin)
  markAttendance(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(req.user.sub, dto);
  }

  /** Get attendance records with optional filters */
  @Get()
  @Roles(UserRole.Admin, UserRole.Instructor, UserRole.Student)
  findAll(
    @Req() req: Request & { user: AuthUser },
    @Query('classId') classId?: string,
    @Query('date') date?: string,
    @Query('studentId') studentId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    // Students can only see their own records
    const resolvedStudentId =
      req.user.role === UserRole.Student ? req.user.sub : studentId;

    // Teachers see only their classes
    const resolvedTeacherId =
      req.user.role === UserRole.Instructor ? req.user.sub : undefined;

    return this.attendanceService.findAll({
      classId,
      date,
      studentId: resolvedStudentId,
      schoolId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      teacherId: resolvedTeacherId,
    });
  }

  /** Attendance summary / trend for a month */
  @Get('summary')
  @Roles(UserRole.Admin, UserRole.Instructor)
  getSummary(
    @Query('classId') classId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getSummary({
      classId,
      schoolId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
    });
  }

  /** Admin: today's quick stats */
  @Get('today')
  @Roles(UserRole.Admin)
  getTodayStats() {
    return this.attendanceService.getTodayStats();
  }
}
