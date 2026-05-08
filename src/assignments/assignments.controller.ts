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
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { buildDiskStorage } from '../common/utils/file-upload.util';
import { AuthUser } from '../common/types/auth-user.type';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

const IMAGE_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB per image

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * Inline image upload — called by the markdown editor toolbar.
   * Returns { url } that gets inserted as ![alt](url) in the markdown.
   */
  @Post('images')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('imageFile', {
      storage: buildDiskStorage('assignments/images'),
      limits: { fileSize: IMAGE_SIZE_LIMIT },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.assignmentsService.uploadImage(file);
  }

  @Post()
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'attachmentFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('assignments'),
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  create(
    @Body() dto: CreateAssignmentDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      attachmentFile?: Express.Multer.File[];
    },
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.assignmentsService.create(dto, files, req.user.sub);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;
    return this.assignmentsService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'descriptionFile', maxCount: 1 },
        { name: 'attachmentFile', maxCount: 1 },
      ],
      {
        storage: buildDiskStorage('assignments'),
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @UploadedFiles()
    files: {
      descriptionFile?: Express.Multer.File[];
      attachmentFile?: Express.Multer.File[];
    },
  ) {
    return this.assignmentsService.update(id, dto, files);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
