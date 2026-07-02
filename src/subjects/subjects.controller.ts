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
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { AuthUser } from '../common/types/auth-user.type';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(
    @Body() dto: CreateSubjectDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.subjectsService.create(dto, req.user.sub);
  }

  @Get()
  findAll(@Query('classId') classId?: string) {
    return this.subjectsService.findAll(classId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
