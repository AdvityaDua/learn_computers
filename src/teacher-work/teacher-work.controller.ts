import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { TeacherWorkService } from './teacher-work.service';
import { CreateTeacherWorkDto, UpdateTeacherWorkDto } from './dto/create-teacher-work.dto';

@Controller('teacher-work')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherWorkController {
  constructor(private readonly teacherWorkService: TeacherWorkService) {}

  /** Teacher logs that they delivered an assignment/activity to a class */
  @Post()
  @Roles(UserRole.Instructor, UserRole.Admin)
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateTeacherWorkDto,
  ) {
    return this.teacherWorkService.create(req.user.sub, dto);
  }

  /** Update notes, studentCompletionCount, or status */
  @Patch(':id')
  @Roles(UserRole.Instructor, UserRole.Admin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherWorkDto,
  ) {
    return this.teacherWorkService.update(id, dto);
  }

  /** Mark a work log as completed */
  @Patch(':id/complete')
  @Roles(UserRole.Instructor, UserRole.Admin)
  complete(@Param('id') id: string) {
    return this.teacherWorkService.complete(id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.teacherWorkService.remove(id);
  }

  /** List work logs with filters */
  @Get()
  @Roles(UserRole.Admin, UserRole.Instructor)
  findAll(
    @Req() req: Request & { user: AuthUser },
    @Query('classId') classId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    const resolvedTeacherId =
      req.user.role === UserRole.Instructor ? req.user.sub : teacherId;

    return this.teacherWorkService.findAll({
      teacherId: resolvedTeacherId,
      classId,
      type,
      status,
      schoolId,
    });
  }

  /** Admin: summary stats across all teachers */
  @Get('admin/summary')
  @Roles(UserRole.Admin)
  getAdminSummary() {
    return this.teacherWorkService.getAdminSummary();
  }
}
