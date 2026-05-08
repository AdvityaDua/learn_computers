import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { MaterialsService } from './materials.service';

const materialStorage = diskStorage({
  destination: './uploads/materials',
  filename: (_req, file, cb) => {
    const safe = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('upload')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FilesInterceptor('files', 200, {
      storage: materialStorage,
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB per file
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('category') category: string,
    @Body('description') description: string,
  ) {
    return this.materialsService.createMany(files, category, description);
  }

  @Get()
  @Roles(UserRole.Admin)
  findAll(@Query('category') category?: string) {
    return this.materialsService.findAll(category);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
