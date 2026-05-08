import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
}
