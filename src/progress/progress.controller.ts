import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { UserRole } from '../common/constants/roles.enum';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('lessons')
  getLessonProgress(@Req() req: Request & { user: AuthUser }) {
    return this.progressService.getLessonProgress(req.user.sub);
  }

  @Post('lessons/:chapterId/:lessonId/complete')
  markLessonCompleted(
    @Req() req: Request & { user: AuthUser },
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.markLessonCompleted(req.user.sub, chapterId, lessonId);
  }

  @Post('lessons/:chapterId/:lessonId/access')
  markLessonAccessed(
    @Req() req: Request & { user: AuthUser },
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.markLessonAccessed(req.user.sub, chapterId, lessonId);
  }

  @Get('lesson-detail/:chapterId/:lessonId')
  getLessonDetail(
    @Req() req: Request & { user: AuthUser },
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getLessonDetail(req.user.sub, chapterId, lessonId);
  }

  @Post('lessons/:chapterId/:lessonId/quizzes/:quizId/submit')
  submitQuiz(
    @Req() req: Request & { user: AuthUser },
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @Param('quizId') quizId: string,
    @Body() body: { answers: number[] },
  ) {
    return this.progressService.submitQuiz(
      req.user.sub,
      chapterId,
      lessonId,
      quizId,
      body.answers ?? [],
    );
  }

  @Post('lessons/:chapterId/:lessonId/tasks/:taskType/:taskId/submit')
  @UseInterceptors(FileInterceptor('submissionFile'))
  submitTask(
    @Req() req: Request & { user: AuthUser },
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
    @Param('taskType') taskType: 'assignment' | 'activity',
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.progressService.submitTask(
      req.user.sub,
      chapterId,
      lessonId,
      taskType,
      taskId,
      file,
    );
  }

  @Get('admin/users/:userId')
  @Roles(UserRole.Admin)
  getAdminUserProgress(@Param('userId') userId: string) {
    return this.progressService.getAdminUserProgress(userId);
  }

  @Patch('admin/users/:userId/tasks/:taskType/:taskId/review')
  @Roles(UserRole.Admin, UserRole.Instructor)
  reviewTaskSubmission(
    @Req() req: Request & { user: AuthUser },
    @Param('userId') userId: string,
    @Param('taskType') taskType: 'assignment' | 'activity',
    @Param('taskId') taskId: string,
    @Body() body: { reviewStatus?: 'approved' | 'rejected' | 'resubmit_requested'; reviewFeedback?: string },
  ) {
    return this.progressService.reviewTaskSubmission(
      userId,
      taskType,
      taskId,
      req.user.sub,
      body.reviewStatus,
      body.reviewFeedback,
    );
  }

  @Get('admin/quiz-stats')
  @Roles(UserRole.Admin)
  getQuizStats(
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.progressService.getQuizStats(schoolId, classId);
  }

  /** Top Learners leaderboard — students who completed all lessons + quizzes, ranked by points */
  @Get('leaderboard')
  getLeaderboard(
    @Query('classId') classId?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.progressService.getLeaderboard(classId, schoolId);
  }

  /** Teacher/admin deducts points from a student */
  @Post('students/:studentId/deduct-points')
  @Roles(UserRole.Admin, UserRole.Instructor)
  deductStudentPoints(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Body() body: { points: number; reason: string },
  ) {
    return this.progressService.deductStudentPoints(
      req.user.sub,
      studentId,
      body.points,
      body.reason,
    );
  }
}
