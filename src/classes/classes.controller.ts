import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Instructor)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.classesService.findAll(
      page ? +page : 1,
      limit ? +limit : 20,
      search,
    );
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Instructor)
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(
    @Param('id') id: string,
    @Body() updateClassDto: Partial<CreateClassDto>,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Post(':id/teachers/:teacherId')
  @Roles(UserRole.Admin)
  assignTeacher(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.classesService.assignTeacher(id, teacherId);
  }

  @Delete(':id/teachers/:teacherId')
  @Roles(UserRole.Admin)
  removeTeacher(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.classesService.removeTeacher(id, teacherId);
  }
}
