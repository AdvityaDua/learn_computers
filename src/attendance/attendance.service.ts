import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

function dayBounds(dateStr: string): { start: Date; end: Date } {
  const d = new Date(dateStr);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
  ) {}

  /** Bulk upsert: teacher marks attendance for a class on a date */
  async markAttendance(teacherId: string, dto: MarkAttendanceDto) {
    const { start } = dayBounds(dto.date);
    for (const r of dto.records) {
      const setFields: Record<string, any> = {
        teacherId: new Types.ObjectId(teacherId),
        classId: dto.classId,
        date: start,
        status: r.status,
        notes: r.notes ?? '',
      };
      if (dto.schoolId) setFields.schoolId = new Types.ObjectId(dto.schoolId);
      await this.attendanceModel.updateOne(
        { studentId: new Types.ObjectId(r.studentId), date: start },
        { $set: setFields },
        { upsert: true },
      );
    }
    return { marked: dto.records.length, date: start };
  }

  /** Get records with filters */
  async findAll(params: {
    classId?: string;
    date?: string;
    studentId?: string;
    schoolId?: string;
    month?: number;
    year?: number;
    teacherId?: string;
  }) {
    const filter: Record<string, any> = {};
    if (params.classId) filter.classId = params.classId;
    if (params.studentId) filter.studentId = new Types.ObjectId(params.studentId);
    if (params.schoolId) filter.schoolId = new Types.ObjectId(params.schoolId);
    if (params.teacherId) filter.teacherId = new Types.ObjectId(params.teacherId);

    if (params.date) {
      const { start, end } = dayBounds(params.date);
      filter.date = { $gte: start, $lt: end };
    } else if (params.month && params.year) {
      const start = new Date(Date.UTC(params.year, params.month - 1, 1));
      const end = new Date(Date.UTC(params.year, params.month, 1));
      filter.date = { $gte: start, $lt: end };
    }

    return this.attendanceModel
      .find(filter)
      .populate('studentId', 'fullName email profileImage classIds')
      .populate('teacherId', 'fullName email')
      .sort({ date: -1 })
      .lean();
  }

  /** Daily + monthly summary stats */
  async getSummary(params: {
    classId?: string;
    schoolId?: string;
    month?: number;
    year?: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.classId) filter.classId = params.classId;
    if (params.schoolId) filter.schoolId = new Types.ObjectId(params.schoolId);

    const now = new Date();
    const m = params.month ?? now.getUTCMonth() + 1;
    const y = params.year ?? now.getUTCFullYear();
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    filter.date = { $gte: start, $lt: end };

    const records = await this.attendanceModel.find(filter).lean();

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    // Group by date for trend
    const byDate: Record<string, { present: number; absent: number; late: number }> = {};
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { present: 0, absent: 0, late: 0 };
      if (r.status === 'present') byDate[key].present++;
      else if (r.status === 'absent') byDate[key].absent++;
      else if (r.status === 'late') byDate[key].late++;
    }

    const trend = Object.entries(byDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, present, absent, late, excused, rate, trend, month: m, year: y };
  }

  /** Admin: today's overall stats across all classes */
  async getTodayStats() {
    const today = new Date();
    const { start, end } = dayBounds(today.toISOString().slice(0, 10));
    const records = await this.attendanceModel.find({ date: { $gte: start, $lt: end } }).lean();
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const rate = total > 0 ? Math.round(((present) / total) * 100) : 0;
    return { total, present, absent, rate };
  }
}
