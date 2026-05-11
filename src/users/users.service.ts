import {
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
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      role: dto.role,
      passwordHash,
      authProvider: 'local',
      schoolId: dto.schoolId ? new Types.ObjectId(dto.schoolId) : undefined,
      classIds: dto.classIds ?? ['Class 3'],
      phone: dto.phone,
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
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(userId: string, data: Partial<User> & { password?: string }): Promise<UserDocument> {
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

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash');
  }

  async getTeachers(): Promise<UserDocument[]> {
    return this.userModel.find({ role: UserRole.Instructor }).populate('schoolId').select('-passwordHash');
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
}
