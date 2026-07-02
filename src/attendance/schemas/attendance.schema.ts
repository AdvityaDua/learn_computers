import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  classId: string;

  @Prop({ type: Types.ObjectId, ref: 'School' })
  schoolId?: Types.ObjectId;

  /** Stored as midnight UTC on the given day */
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, enum: ATTENDANCE_STATUSES, default: 'present' })
  status: AttendanceStatus;

  @Prop({ default: '' })
  notes: string;
}

export type AttendanceDocument = HydratedDocument<Attendance>;
export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// One record per student per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ classId: 1, date: 1 });
AttendanceSchema.index({ teacherId: 1, date: 1 });
