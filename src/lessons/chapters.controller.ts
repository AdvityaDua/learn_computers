import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UserRole } from '../common/constants/roles.enum';
import { ChaptersService } from './chapters.service';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateChapterLessonDto } from './dto/create-chapter-lesson.dto';
import { ReorderChapterLessonsDto } from './dto/reorder-chapter-lessons.dto';
import { UpdateChapterLessonDto } from './dto/update-chapter-lesson.dto';

@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateChapterDto, @Req() req: Request & { user: AuthUser }) {
    return this.chaptersService.create(dto, req.user.sub);
  }

  @Get()
  findAll() {
    return this.chaptersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id);
  }

  @Post(':id/cover')
  @Roles(UserRole.Admin)
  @UseInterceptors(FileInterceptor('coverImage'))
  uploadChapterCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chaptersService.updateChapterCover(id, file);
  }

  @Post(':id/lessons/:lessonId/cover')
  @Roles(UserRole.Admin)
  @UseInterceptors(FileInterceptor('coverImage'))
  uploadLessonCover(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chaptersService.updateLessonCover(id, lessonId, file);
  }

  @Post(':id/lessons')
  @Roles(UserRole.Admin)
  addLesson(@Param('id') id: string, @Body() dto: CreateChapterLessonDto) {
    return this.chaptersService.addLesson(id, dto);
  }

  @Patch(':id/lessons/reorder')
  @Roles(UserRole.Admin)
  reorderLessons(
    @Param('id') id: string,
    @Body() dto: ReorderChapterLessonsDto,
  ) {
    return this.chaptersService.reorderLessons(id, dto);
  }

  @Patch(':id/lessons/:lessonId')
  @Roles(UserRole.Admin)
  updateLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateChapterLessonDto,
  ) {
    return this.chaptersService.updateLesson(id, lessonId, dto);
  }

  @Delete(':id/lessons/:lessonId')
  @Roles(UserRole.Admin)
  removeLesson(@Param('id') id: string, @Param('lessonId') lessonId: string) {
    return this.chaptersService.removeLesson(id, lessonId);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }
}
