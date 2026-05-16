import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  Body,
  Request,
  Param,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Get()
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile_data')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async updateProfile(
    @Request() req,
    @Body() body: { fullName?: string; phone?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: any = { ...body };
    if (file) {
      updateData.profileImage = `/uploads/profiles/${file.filename}`;
    }
    return this.usersService.update(req.user.sub, updateData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Instructor)
  @Get('teacher/dashboard')
  async getTeacherDashboard(@Request() req) {
    return this.usersService.getTeacherDashboard(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Get('teachers')
  async getTeachers() {
    return this.usersService.getTeachers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Patch(':id/school')
  async assignTeacherToSchool(
    @Param('id') id: string,
    @Body('schoolId') schoolId: string,
  ) {
    return this.usersService.assignSchool(id, schoolId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Patch(':id/classes')
  async assignTeacherToClasses(
    @Param('id') id: string,
    @Body('classIds') classIds: string[],
  ) {
    return this.usersService.assignClasses(id, classIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  // ── Admin: update student with class-change auto-reassignment ──────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Patch('admin/students/:id')
  async updateStudentAsAdmin(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      password?: string;
      classIds?: string[];
      teacherId?: string;
      schoolId?: string;
    },
  ) {
    return this.usersService.updateStudentAsAdmin(id, body);
  }

  // ── Teacher-scoped student management ──────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Instructor)
  @Get('teacher/students')
  async getTeacherStudents(@Request() req) {
    return this.usersService.getTeacherStudents(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Instructor)
  @Post('teacher/students')
  async createStudentAsTeacher(
    @Request() req,
    @Body()
    body: {
      fullName: string;
      email: string;
      password: string;
      classId: string;
      phone?: string;
    },
  ) {
    return this.usersService.createStudentAsTeacher(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Instructor)
  @Patch('teacher/students/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async updateStudentAsTeacher(
    @Request() req,
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      password?: string;
      classIds?: string[];
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: any = { ...body };
    if (body.classIds && typeof body.classIds === 'string') {
      try {
        updateData.classIds = JSON.parse(body.classIds as string);
      } catch {
        updateData.classIds = [body.classIds];
      }
    }
    // First update profile data
    const updated = await this.usersService.updateStudentAsTeacher(
      req.user.sub,
      id,
      updateData,
    );
    // If an image was uploaded, update the profileImage field
    if (file) {
      const profileImage = `/uploads/profiles/${file.filename}`;
      await this.usersService.update(id, { profileImage } as any);
    }
    return updated;
  }

  // ── Student: get assigned teacher(s) ──────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('my-teachers')
  async getMyTeachers(@Request() req) {
    return this.usersService.getStudentTeachers(req.user.sub);
  }
}
