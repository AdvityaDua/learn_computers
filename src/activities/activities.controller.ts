import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TeacherContentAccessGuard } from '../common/guards/teacher-content-access.guard';
import { ContentModel } from '../common/decorators/content-model.decorator';
import { buildDiskStorage } from '../common/utils/file-upload.util';
import { AuthUser } from '../common/types/auth-user.type';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

const IMAGE_SIZE_LIMIT = 20 * 1024 * 1024;

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly teacherContentAccessGuard: TeacherContentAccessGuard,
  ) {}

  @Post('images')
  @Roles(UserRole.Admin, UserRole.Instructor)
  @UseGuards(TeacherContentAccessGuard)
  @UseInterceptors(
    FileInterceptor('imageFile', {
      storage: buildDiskStorage('activities/images'),
      limits: { fileSize: IMAGE_SIZE_LIMIT },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.activitiesService.uploadImage(file);
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.Instructor)
  @UseGuards(TeacherContentAccessGuard)
  @ContentModel('activity')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'attachmentFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('activities'),
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  async create(
    @Body() dto: CreateActivityDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      attachmentFile?: Express.Multer.File[];
    },
    @Req() req: Request & { user: AuthUser },
  ) {
    await this.teacherContentAccessGuard.assertClassAccessForCreate(
      req.user,
      dto.classIds,
    );
    return this.activitiesService.create(dto, files, req.user.sub);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;
    return this.activitiesService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Instructor)
  @UseGuards(TeacherContentAccessGuard)
  @ContentModel('activity')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'attachmentFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('activities'),
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      attachmentFile?: Express.Multer.File[];
    },
  ) {
    return this.activitiesService.update(id, dto, files);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Instructor)
  @UseGuards(TeacherContentAccessGuard)
  @ContentModel('activity')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Patch(':id/due-date')
  @Roles(UserRole.Admin, UserRole.Instructor)
  updateDueDate(@Param('id') id: string, @Body('dueDate') dueDate: string) {
    return this.activitiesService.updateDueDate(id, dueDate);
  }
}
