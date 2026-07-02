import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeacherWorkLog, TeacherWorkLogDocument } from './schemas/teacher-work-log.schema';
import { CreateTeacherWorkDto, UpdateTeacherWorkDto } from './dto/create-teacher-work.dto';

@Injectable()
export class TeacherWorkService {
  constructor(
    @InjectModel(TeacherWorkLog.name)
    private readonly workModel: Model<TeacherWorkLogDocument>,
  ) {}

  async create(teacherId: string, dto: CreateTeacherWorkDto) {
    const doc = new this.workModel({
      teacherId: new Types.ObjectId(teacherId),
      classId: dto.classId,
      type: dto.type,
      contentId: new Types.ObjectId(dto.contentId),
      contentTitle: dto.contentTitle,
      notes: dto.notes ?? '',
      studentCompletionCount: dto.studentCompletionCount ?? 0,
      status: 'delivered',
      deliveredAt: new Date(),
      ...(dto.schoolId ? { schoolId: new Types.ObjectId(dto.schoolId) } : {}),
    });
    return doc.save();
  }

  async update(id: string, dto: UpdateTeacherWorkDto) {
    const log = await this.workModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!log) throw new NotFoundException('Work log not found');
    return log;
  }

  async complete(id: string) {
    const log = await this.workModel.findByIdAndUpdate(
      id,
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true },
    );
    if (!log) throw new NotFoundException('Work log not found');
    return log;
  }

  async remove(id: string) {
    await this.workModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async findAll(params: {
    teacherId?: string;
    classId?: string;
    type?: string;
    status?: string;
    schoolId?: string;
  }) {
    const filter: Record<string, any> = {};
    if (params.teacherId) filter.teacherId = new Types.ObjectId(params.teacherId);
    if (params.classId) filter.classId = params.classId;
    if (params.type) filter.type = params.type;
    if (params.status) filter.status = params.status;
    if (params.schoolId) filter.schoolId = new Types.ObjectId(params.schoolId);

    return this.workModel
      .find(filter)
      .populate('teacherId', 'fullName email')
      .sort({ deliveredAt: -1 })
      .lean();
  }

  async getAdminSummary() {
    const [byStatus, byType, recentActivity] = await Promise.all([
      this.workModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.workModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.workModel
        .find()
        .populate('teacherId', 'fullName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s._id] = s.count;

    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t._id] = t.count;

    return {
      delivered: statusMap['delivered'] ?? 0,
      inProgress: statusMap['in_progress'] ?? 0,
      completed: statusMap['completed'] ?? 0,
      assignments: typeMap['assignment'] ?? 0,
      activities: typeMap['activity'] ?? 0,
      recentActivity,
    };
  }
}
