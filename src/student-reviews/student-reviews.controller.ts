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
import { StudentReviewsService } from './student-reviews.service';
import { CreateStudentReviewDto } from './dto/create-student-review.dto';
import { UpdateStudentReviewDto } from './dto/update-student-review.dto';

@Controller('student-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentReviewsController {
  constructor(private readonly reviewsService: StudentReviewsService) {}

  /** Teacher or Admin creates/updates a review */
  @Post()
  @Roles(UserRole.Instructor, UserRole.Admin)
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateStudentReviewDto,
  ) {
    return this.reviewsService.create(req.user.sub, dto);
  }

  /** List reviews with filters */
  @Get()
  @Roles(UserRole.Admin, UserRole.Instructor, UserRole.Student)
  findAll(
    @Req() req: Request & { user: AuthUser },
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const resolvedStudentId =
      req.user.role === UserRole.Student ? req.user.sub : studentId;
    const resolvedTeacherId =
      req.user.role === UserRole.Instructor ? req.user.sub : undefined;

    return this.reviewsService.findAll({
      classId,
      studentId: resolvedStudentId,
      teacherId: resolvedTeacherId,
      type,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      schoolId,
    });
  }

  /** Admin summary stats */
  @Get('admin/summary')
  @Roles(UserRole.Admin)
  getAdminSummary() {
    return this.reviewsService.getAdminSummary();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Instructor, UserRole.Student)
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Instructor, UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateStudentReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Instructor)
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
