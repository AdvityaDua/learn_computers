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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  buildDiskStorage,
  fileSizeLimit,
} from '../common/utils/file-upload.util';
import { AuthUser } from '../common/types/auth-user.type';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'documentFile', maxCount: 1 },
        { name: 'videoFile', maxCount: 1 },
        { name: 'thumbnailFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('lessons'),
        limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
      },
    ),
  )
  create(
    @Body() dto: CreateLessonDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      documentFile?: Express.Multer.File[];
      videoFile?: Express.Multer.File[];
      thumbnailFile?: Express.Multer.File[];
    },
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.lessonsService.create(dto, files, req.user.sub);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;
    return this.lessonsService.findAll(pageNum, limitNum, search, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'documentFile', maxCount: 1 },
        { name: 'videoFile', maxCount: 1 },
        { name: 'thumbnailFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('lessons'),
        limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      documentFile?: Express.Multer.File[];
      videoFile?: Express.Multer.File[];
      thumbnailFile?: Express.Multer.File[];
    },
  ) {
    return this.lessonsService.update(id, dto, files);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }
}
