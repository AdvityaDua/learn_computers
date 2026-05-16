import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/constants/roles.enum';
import { Lesson, LessonDocument } from '../lessons/schemas/lesson.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentDocument,
} from '../assignments/schemas/assignment.schema';
import { Class, ClassDocument } from '../classes/class.schema';
import { School, SchoolDocument } from '../schools/school.schema';
import {
  Activity,
  ActivityDocument,
} from '../activities/schemas/activity.schema';

type LeaderboardRow = {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  role: UserRole;
  score: number;
  contentCount: number;
  lessonCount: number;
  quizCount: number;
  assignmentCount: number;
  activityCount: number;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(School.name)
    private readonly schoolModel: Model<SchoolDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Both Students and Teachers MUST have a schoolId
    if (dto.role === UserRole.Student || dto.role === UserRole.Instructor) {
      if (!dto.schoolId) {
        throw new BadRequestException(
          `Every ${dto.role} must be assigned to a school.`,
        );
      }
    }

    // Students MUST have a teacherId and at least one classId
    if (dto.role === UserRole.Student) {
      if (!dto.teacherId) {
        throw new BadRequestException(
          'Every student must be assigned to a teacher. Please select a teacher.',
        );
      }
      if (!dto.classIds || dto.classIds.length === 0) {
        throw new BadRequestException(
          'Every student must be assigned to at least one class.',
        );
      }
      // Validate teacher exists and is an instructor
      const teacher = await this.userModel.findById(dto.teacherId).lean();
      if (!teacher || (teacher as any).role !== UserRole.Instructor) {
        throw new BadRequestException('Selected teacher is not a valid instructor.');
      }
      // Optional: Verify teacher's school matches student's school
      if (String((teacher as any).schoolId) !== dto.schoolId) {
        throw new BadRequestException('Student and teacher must belong to the same school.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      role: dto.role,
      passwordHash,
      authProvider: 'local',
      schoolId: dto.schoolId ? new Types.ObjectId(dto.schoolId) : undefined,
      classIds: dto.classIds ?? [],
      phone: dto.phone,
      teacherId:
        dto.role === UserRole.Student && dto.teacherId
          ? new Types.ObjectId(dto.teacherId)
          : undefined,
    });

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid });
  }

  async createGoogleUser(params: {
    email: string;
    fullName: string;
    firebaseUid: string;
    profileImage?: string;
    role?: UserRole;
  }): Promise<UserDocument> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);

    return this.userModel.create({
      email: params.email.toLowerCase(),
      fullName: params.fullName,
      role: params.role ?? UserRole.Student,
      passwordHash,
      firebaseUid: params.firebaseUid,
      authProvider: 'google',
      profileImage: params.profileImage,
    });
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .populate('schoolId', 'name code');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    userId: string,
    data: Partial<User> & { password?: string },
  ): Promise<UserDocument> {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }

    const user = await this.userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async delete(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(role?: UserRole): Promise<UserDocument[]> {
    const filter = role ? { role } : {};
    return this.userModel
      .find(filter)
      .select('-passwordHash')
      .populate('schoolId', 'name code')
      .populate('teacherId', 'fullName email');
  }

  async getTeachers(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.Instructor })
      .populate('schoolId')
      .select('-passwordHash');
  }

  async getTeacherDashboard(teacherId: string) {
    const teacher = await this.userModel
      .findById(teacherId)
      .select('-passwordHash')
      .lean();
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Get classes the teacher is assigned to (classIds stores class names like "Class 3")
    const classNames = (teacher as any).classIds ?? [];
    const classes = await this.classModel
      .find({ name: { $in: classNames } })
      .populate('schoolIds', 'name code')
      .lean();

    // Get school if assigned
    let school: any = null;
    if ((teacher as any).schoolId) {
      school = await this.schoolModel
        .findById((teacher as any).schoolId)
        .lean();
    }

    // Get student counts per class
    const classStudentCounts: Record<string, number> = {};
    for (const cls of classes) {
      const count = await this.userModel.countDocuments({
        role: UserRole.Student,
        classIds: (cls as any).name,
        isActive: true,
      });
      classStudentCounts[String((cls as any)._id)] = count;
    }

    return {
      teacher: {
        _id: String(teacher._id),
        fullName: (teacher as any).fullName,
        email: (teacher as any).email,
        profileImage: (teacher as any).profileImage ?? null,
        phone: (teacher as any).phone ?? null,
      },
      school,
      classes: classes.map((cls: any) => ({
        _id: String(cls._id),
        name: cls.name,
        grade: cls.grade,
        description: cls.description,
        studentCount: classStudentCounts[String(cls._id)] ?? 0,
        schools: cls.schoolIds ?? [],
      })),
    };
  }

  async assignSchool(
    userId: string,
    schoolId: string | null,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { schoolId: schoolId ? new Types.ObjectId(schoolId) : null },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async assignClasses(
    userId: string,
    classIds: string[],
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { classIds },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const [users, lessonsAgg, quizzesAgg, assignmentsAgg, activitiesAgg] =
      await Promise.all([
        this.userModel
          .find()
          .select('fullName email profileImage role createdAt')
          .lean(),
        this.aggregateByCreator(this.lessonModel),
        this.aggregateByCreator(this.quizModel),
        this.aggregateByCreator(this.assignmentModel),
        this.aggregateByCreator(this.activityModel),
      ]);

    const lessonMap = new Map(
      lessonsAgg.map((row) => [String(row._id), row.count]),
    );
    const quizMap = new Map(
      quizzesAgg.map((row) => [String(row._id), row.count]),
    );
    const assignmentMap = new Map(
      assignmentsAgg.map((row) => [String(row._id), row.count]),
    );
    const activityMap = new Map(
      activitiesAgg.map((row) => [String(row._id), row.count]),
    );

    const rows = users
      .map((u) => {
        const userId = String(u._id);
        const lessonCount = lessonMap.get(userId) ?? 0;
        const quizCount = quizMap.get(userId) ?? 0;
        const assignmentCount = assignmentMap.get(userId) ?? 0;
        const activityCount = activityMap.get(userId) ?? 0;
        const contentCount =
          lessonCount + quizCount + assignmentCount + activityCount;

        const score =
          lessonCount * 8 +
          quizCount * 6 +
          assignmentCount * 5 +
          activityCount * 4;

        return {
          userId,
          fullName: u.fullName,
          email: u.email,
          profileImage: u.profileImage,
          role: u.role,
          score,
          contentCount,
          lessonCount,
          quizCount,
          assignmentCount,
          activityCount,
          createdAt: (u as { createdAt?: Date }).createdAt,
        };
      })
      .filter((row) => row.contentCount > 0);

    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.contentCount !== a.contentCount)
        return b.contentCount - a.contentCount;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    return rows.map(({ createdAt, ...rest }) => rest);
  }

  private aggregateByCreator(
    model: Model<
      LessonDocument | QuizDocument | AssignmentDocument | ActivityDocument
    >,
  ) {
    return model.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);
  }

  // ── Teacher-scoped student management ────────────────────────────────────

  /** Get students in teacher's assigned classes & school */
  async getTeacherStudents(teacherId: string) {
    const teacher = await this.userModel.findById(teacherId).lean();
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherClassIds = (teacher as any).classIds ?? [];
    const teacherSchoolId = (teacher as any).schoolId;

    const filter: any = {
      role: UserRole.Student,
      isActive: true,
      teacherId: new Types.ObjectId(teacherId),
    };
    if (teacherClassIds.length > 0) {
      filter.classIds = { $in: teacherClassIds };
    }
    if (teacherSchoolId) {
      filter.schoolId = teacherSchoolId;
    }

    const students = await this.userModel
      .find(filter)
      .select('-passwordHash')
      .populate('schoolId', 'name code')
      .populate('teacherId', 'fullName email')
      .sort({ fullName: 1 })
      .lean();

    return students.map((s: any) => ({
      _id: String(s._id),
      fullName: s.fullName,
      email: s.email,
      phone: s.phone ?? null,
      profileImage: s.profileImage ?? null,
      classIds: s.classIds ?? [],
      school: s.schoolId ?? null,
      teacher: s.teacherId ?? null,
      points: s.points ?? 0,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));
  }

  /** Teacher adds a student (checks school capacity limit) */
  async createStudentAsTeacher(
    teacherId: string,
    dto: {
      fullName: string;
      email: string;
      password: string;
      classId: string;
      phone?: string;
    },
  ) {
    const teacher = await this.userModel.findById(teacherId).lean();
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherClassIds: string[] = (teacher as any).classIds ?? [];
    const teacherSchoolId = (teacher as any).schoolId;

    // Verify teacher is assigned to this class
    if (!teacherClassIds.includes(dto.classId)) {
      throw new BadRequestException(
        `You are not assigned to ${dto.classId}. You can only add students to your own classes.`,
      );
    }

    // Check school capacity
    if (!teacherSchoolId) {
      throw new BadRequestException('You must be assigned to a school to add students.');
    }

    const school = await this.schoolModel.findById(teacherSchoolId).lean();
    if (school) {
      const maxStudents = (school as any).maxStudents ?? 0;
      if (maxStudents > 0) {
        const currentCount = await this.userModel.countDocuments({
          role: UserRole.Student,
          schoolId: teacherSchoolId,
          isActive: true,
        });
        if (currentCount >= maxStudents) {
          throw new BadRequestException(
            `School capacity limit reached (${maxStudents} students). Contact your administrator to increase the limit.`,
          );
        }
      }
    }

    // Check duplicate email
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const student = await this.userModel.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      role: UserRole.Student,
      passwordHash,
      authProvider: 'local',
      schoolId: teacherSchoolId || undefined,
      classIds: [dto.classId],
      phone: dto.phone || undefined,
      teacherId: new Types.ObjectId(teacherId),
    });

    return {
      _id: String(student._id),
      fullName: student.fullName,
      email: student.email,
      classIds: student.classIds,
      teacherId: teacherId,
    };
  }

  /** Teacher updates a student's profile (name, phone, password, class) */
  async updateStudentAsTeacher(
    teacherId: string,
    studentId: string,
    data: {
      fullName?: string;
      phone?: string;
      password?: string;
      classIds?: string[];
    },
  ) {
    const teacher = await this.userModel.findById(teacherId).lean();
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherClassIds: string[] = (teacher as any).classIds ?? [];
    const student = await this.userModel.findById(studentId).lean();
    if (!student) throw new NotFoundException('Student not found');

    // Verify student is in teacher's classes
    const studentClasses: string[] = (student as any).classIds ?? [];
    const hasOverlap = studentClasses.some((c) => teacherClassIds.includes(c));
    if (!hasOverlap) {
      throw new BadRequestException(
        'This student is not in any of your assigned classes.',
      );
    }

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.classIds) {
      // Validate teacher can only assign to their own classes
      for (const c of data.classIds) {
        if (!teacherClassIds.includes(c)) {
          throw new BadRequestException(`You are not assigned to ${c}.`);
        }
      }
      updateData.classIds = data.classIds;
    }

    const updated = await this.userModel
      .findByIdAndUpdate(studentId, updateData, { new: true })
      .select('-passwordHash');
    if (!updated) throw new NotFoundException('Student not found');

    // If class changed, auto-reassign teacherId
    if (data.classIds && data.classIds.length > 0) {
      await this.reassignTeacherOnClassChange(
        studentId,
        data.classIds,
        (student as any).schoolId,
      );
    }

    return this.userModel
      .findById(studentId)
      .select('-passwordHash')
      .populate('teacherId', 'fullName email')
      .populate('schoolId', 'name code');
  }

  /** Student: get their assigned teacher(s) info */
  async getStudentTeachers(studentId: string) {
    const student = await this.userModel.findById(studentId).lean();
    if (!student) throw new NotFoundException('Student not found');

    const studentClassIds: string[] = (student as any).classIds ?? [];
    const studentSchoolId = (student as any).schoolId;

    const filter: any = {
      role: UserRole.Instructor,
      isActive: true,
    };
    if (studentClassIds.length > 0) {
      filter.classIds = { $in: studentClassIds };
    }
    if (studentSchoolId) {
      filter.schoolId = studentSchoolId;
    }

    const teachers = await this.userModel
      .find(filter)
      .select('fullName email profileImage phone classIds')
      .lean();

    return teachers.map((t: any) => ({
      _id: String(t._id),
      fullName: t.fullName,
      email: t.email,
      profileImage: t.profileImage ?? null,
      phone: t.phone ?? null,
      classIds: t.classIds ?? [],
    }));
  }

  // ── Auto-reassign teacher when student class changes ───────────────────────

  /**
   * When a student's class changes, find a teacher who is assigned to the new class
   * and update the student's teacherId accordingly.
   */
  async reassignTeacherOnClassChange(
    studentId: string,
    newClassIds: string[],
    schoolId?: Types.ObjectId,
  ) {
    // Find a teacher assigned to one of the new classes
    const filter: any = {
      role: UserRole.Instructor,
      classIds: { $in: newClassIds },
      isActive: true,
    };
    if (schoolId) {
      filter.schoolId = schoolId;
    }

    const teacher = await this.userModel.findOne(filter).lean();
    if (teacher) {
      await this.userModel.findByIdAndUpdate(studentId, {
        teacherId: teacher._id,
      });
    }
    // If no teacher found for the class, keep the existing teacherId
  }

  // ── Admin: update a student (with class-change auto-reassignment) ─────────

  async updateStudentAsAdmin(
    studentId: string,
    data: {
      fullName?: string;
      phone?: string;
      password?: string;
      classIds?: string[];
      teacherId?: string;
      schoolId?: string;
    },
  ) {
    const student = await this.userModel.findById(studentId).lean();
    if (!student) throw new NotFoundException('Student not found');

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.classIds) {
      updateData.classIds = data.classIds;
    }
    if (data.teacherId) {
      updateData.teacherId = new Types.ObjectId(data.teacherId);
    }
    if (data.schoolId !== undefined) {
      updateData.schoolId = data.schoolId
        ? new Types.ObjectId(data.schoolId)
        : null;
    }

    await this.userModel.findByIdAndUpdate(studentId, updateData, {
      new: true,
    });

    // If class changed and no explicit teacher set, auto-reassign
    if (data.classIds && data.classIds.length > 0 && !data.teacherId) {
      await this.reassignTeacherOnClassChange(
        studentId,
        data.classIds,
        updateData.schoolId ?? (student as any).schoolId,
      );
    }

    return this.userModel
      .findById(studentId)
      .select('-passwordHash')
      .populate('teacherId', 'fullName email')
      .populate('schoolId', 'name code');
  }
}
