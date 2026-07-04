import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../common/constants/roles.enum';
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
      marks: dto.marks ?? [],
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
    } else if (dto.type === 'monthly') {
      const now = new Date();
      doc.month = dto.month ?? (now.getUTCMonth() + 1);
      doc.year = dto.year ?? now.getUTCFullYear();
    } else {
      doc.year = dto.year ?? new Date().getUTCFullYear();
    }

    // Upsert to allow re-reviewing (teacher updates their review for same period)
    const filter: Record<string, any> = { studentId: doc.studentId, type: doc.type };
    if (doc.type === 'daily') filter.date = doc.date;
    else if (doc.type === 'monthly') { filter.month = doc.month; filter.year = doc.year; }
    else filter.year = doc.year;

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
      .populate('studentId', 'fullName email profileImage classIds points')
      .populate('teacherId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string, actingUserId: string, actingRole: UserRole) {
    const doc = await this.reviewModel
      .findById(id)
      .populate('studentId', 'fullName email profileImage classIds points')
      .populate('teacherId', 'fullName email')
      .lean();
    if (!doc) throw new NotFoundException('Review not found');
    if (
      actingRole === UserRole.Student &&
      String((doc.studentId as any)?._id ?? doc.studentId) !== actingUserId
    ) {
      throw new ForbiddenException('This review is not yours');
    }
    return doc;
  }

  /**
   * A teacher may only edit/delete reviews they themselves wrote — admin can touch any of them.
   * (Previously unenforced: any instructor could edit or delete any other teacher's review.)
   */
  private async assertCanModify(
    id: string,
    actingUserId: string,
    actingRole: UserRole,
  ): Promise<StudentReviewDocument> {
    const doc = await this.reviewModel.findById(id);
    if (!doc) throw new NotFoundException('Review not found');
    if (
      actingRole !== UserRole.Admin &&
      String(doc.teacherId) !== actingUserId
    ) {
      throw new ForbiddenException('You can only edit reviews you wrote');
    }
    return doc;
  }

  async update(
    id: string,
    dto: UpdateStudentReviewDto,
    actingUserId: string,
    actingRole: UserRole,
  ) {
    await this.assertCanModify(id, actingUserId, actingRole);
    const doc = await this.reviewModel.findByIdAndUpdate(
      id, { $set: dto }, { new: true },
    );
    if (!doc) throw new NotFoundException('Review not found');
    return doc;
  }

  async remove(id: string, actingUserId: string, actingRole: UserRole) {
    await this.assertCanModify(id, actingUserId, actingRole);
    await this.reviewModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  /** Admin summary: totals, average ratings, average marks percentage, and a monthly trend. */
  async getAdminSummary() {
    const [totals, avgRatings, monthlyTrendRaw, marksAgg] = await Promise.all([
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
      // Daily reviews only carry `date`, monthly reviews carry `month`/`year`, and yearly reviews
      // carry only `year` — derive a shared month/year bucket from whichever is present (yearly
      // rows fall back to January of their year) so all three review types roll up into the same
      // trend line instead of landing in an undefined bucket.
      this.reviewModel.aggregate([
        {
          $addFields: {
            bucketMonth: { $ifNull: ['$month', { $ifNull: [{ $month: '$date' }, 1] }] },
            bucketYear: { $ifNull: ['$year', { $year: '$date' }] },
          },
        },
        {
          $group: {
            _id: { month: '$bucketMonth', year: '$bucketYear' },
            avgRating: { $avg: '$overallRating' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 24 },
      ]),
      this.reviewModel.aggregate([
        { $unwind: '$marks' },
        {
          $group: {
            _id: null,
            avgPercentage: {
              $avg: { $multiply: [{ $divide: ['$marks.obtained', '$marks.total'] }, 100] },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts: Record<string, number> = {};
    for (const t of totals) counts[t._id] = t.count;
    const totalDaily = counts['daily'] ?? 0;
    const totalMonthly = counts['monthly'] ?? 0;
    const totalYearly = counts['yearly'] ?? 0;
    const averages = avgRatings[0] ?? {};
    const marks = marksAgg[0] ?? { avgPercentage: null, entryCount: 0 };

    return {
      totalReviews: totalDaily + totalMonthly + totalYearly,
      totalDaily,
      totalMonthly,
      totalYearly,
      avgOverall: averages.avgOverall ?? null,
      avgAcademic: averages.avgAcademic ?? null,
      avgBehavior: averages.avgBehavior ?? null,
      avgParticipation: averages.avgParticipation ?? null,
      avgMarksPercentage: marks.avgPercentage ?? null,
      marksEntryCount: marks.entryCount,
      monthlyTrend: monthlyTrendRaw.map((row) => ({
        month: row._id.month,
        year: row._id.year,
        avgRating: row.avgRating,
        count: row.count,
      })),
    };
  }
}
