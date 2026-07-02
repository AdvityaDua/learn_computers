import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentReview, StudentReviewDocument } from './schemas/student-review.schema';
import { CreateStudentReviewDto } from './dto/create-student-review.dto';
import { UpdateStudentReviewDto } from './dto/update-student-review.dto';

@Injectable()
export class StudentReviewsService {
  constructor(
    @InjectModel(StudentReview.name)
    private readonly reviewModel: Model<StudentReviewDocument>,
  ) {}

  async create(teacherId: string, dto: CreateStudentReviewDto) {
    const doc: Record<string, any> = {
      studentId: new Types.ObjectId(dto.studentId),
      teacherId: new Types.ObjectId(teacherId),
      classId: dto.classId,
      type: dto.type,
      overallRating: dto.overallRating,
      notes: dto.notes ?? '',
      strengths: dto.strengths ?? [],
      areasForImprovement: dto.areasForImprovement ?? [],
    };

    if (dto.schoolId) doc.schoolId = new Types.ObjectId(dto.schoolId);
    if (dto.academicRating) doc.academicRating = dto.academicRating;
    if (dto.behaviorRating) doc.behaviorRating = dto.behaviorRating;
    if (dto.participationRating) doc.participationRating = dto.participationRating;

    if (dto.type === 'daily') {
      doc.date = dto.date ? new Date(dto.date) : new Date();
      doc.date = new Date(Date.UTC(
        doc.date.getUTCFullYear(),
        doc.date.getUTCMonth(),
        doc.date.getUTCDate(),
      ));
    } else {
      const now = new Date();
      doc.month = dto.month ?? (now.getUTCMonth() + 1);
      doc.year = dto.year ?? now.getUTCFullYear();
    }

    // Upsert to allow re-reviewing (teacher updates their review for same period)
    const filter: Record<string, any> = { studentId: doc.studentId, type: doc.type };
    if (doc.type === 'daily') filter.date = doc.date;
    else { filter.month = doc.month; filter.year = doc.year; }

    const result = await this.reviewModel.findOneAndUpdate(
      filter,
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return result;
  }

  async findAll(params: {
    classId?: string;
    studentId?: string;
    teacherId?: string;
    type?: string;
    month?: number;
    year?: number;
    schoolId?: string;
  }) {
    const filter: Record<string, any> = {};
    if (params.classId) filter.classId = params.classId;
    if (params.studentId) filter.studentId = new Types.ObjectId(params.studentId);
    if (params.teacherId) filter.teacherId = new Types.ObjectId(params.teacherId);
    if (params.type) filter.type = params.type;
    if (params.schoolId) filter.schoolId = new Types.ObjectId(params.schoolId);
    if (params.month) filter.month = params.month;
    if (params.year) filter.year = params.year;

    return this.reviewModel
      .find(filter)
      .populate('studentId', 'fullName email profileImage classIds')
      .populate('teacherId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    const doc = await this.reviewModel
      .findById(id)
      .populate('studentId', 'fullName email')
      .populate('teacherId', 'fullName email')
      .lean();
    if (!doc) throw new NotFoundException('Review not found');
    return doc;
  }

  async update(id: string, dto: UpdateStudentReviewDto) {
    const doc = await this.reviewModel.findByIdAndUpdate(
      id, { $set: dto }, { new: true },
    );
    if (!doc) throw new NotFoundException('Review not found');
    return doc;
  }

  async remove(id: string) {
    await this.reviewModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  /** Admin summary: average ratings, total counts, monthly trend */
  async getAdminSummary() {
    const [totals, avgRatings, monthlyTrend] = await Promise.all([
      this.reviewModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.reviewModel.aggregate([
        {
          $group: {
            _id: null,
            avgOverall: { $avg: '$overallRating' },
            avgAcademic: { $avg: '$academicRating' },
            avgBehavior: { $avg: '$behaviorRating' },
            avgParticipation: { $avg: '$participationRating' },
          },
        },
      ]),
      this.reviewModel.aggregate([
        {
          $group: {
            _id: { month: '$month', year: '$year', type: '$type' },
            avgRating: { $avg: '$overallRating' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 24 },
      ]),
    ]);

    const counts: Record<string, number> = {};
    for (const t of totals) counts[t._id] = t.count;

    return {
      totalDaily: counts['daily'] ?? 0,
      totalMonthly: counts['monthly'] ?? 0,
      averages: avgRatings[0] ?? {},
      monthlyTrend,
    };
  }
}
