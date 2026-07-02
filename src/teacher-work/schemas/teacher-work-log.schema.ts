import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const WORK_TYPES = ['assignment', 'activity'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const WORK_STATUSES = ['delivered', 'in_progress', 'completed'] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

@Schema({ timestamps: true })
export class TeacherWorkLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  classId: string;

  @Prop({ type: Types.ObjectId, ref: 'School' })
  schoolId?: Types.ObjectId;

  /** 'assignment' | 'activity' */
  @Prop({ type: String, enum: WORK_TYPES, required: true })
  type: WorkType;

  /** The assignment or activity document id */
  @Prop({ type: Types.ObjectId, required: true })
  contentId: Types.ObjectId;

  /** Cached title so it stays readable even if the content is deleted */
  @Prop({ required: true })
  contentTitle: string;

  @Prop({ type: String, enum: WORK_STATUSES, default: 'delivered' })
  status: WorkStatus;

  /** When the teacher delivered / assigned this to the class */
  @Prop({ type: Date, default: Date.now })
  deliveredAt: Date;

  /** When the teacher marked it as completed */
  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ default: '' })
  notes: string;

  /** Optional file the teacher uploaded alongside the content */
  @Prop({ default: '' })
  attachmentPath: string;

  /** How many students the teacher reports have completed this */
  @Prop({ type: Number, default: 0, min: 0 })
  studentCompletionCount: number;
}

export type TeacherWorkLogDocument = HydratedDocument<TeacherWorkLog>;
export const TeacherWorkLogSchema = SchemaFactory.createForClass(TeacherWorkLog);

TeacherWorkLogSchema.index({ teacherId: 1, classId: 1 });
TeacherWorkLogSchema.index({ status: 1 });
