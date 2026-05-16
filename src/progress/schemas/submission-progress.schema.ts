import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const SUBMISSION_REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'resubmit_requested',
] as const;
export type SubmissionReviewStatus =
  (typeof SUBMISSION_REVIEW_STATUSES)[number];

@Schema({ timestamps: true })
export class SubmissionProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** 'assignment' | 'activity' */
  @Prop({ required: true })
  taskType: string;

  @Prop({ type: Types.ObjectId, required: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ type: String, enum: SUBMISSION_REVIEW_STATUSES, default: 'pending' })
  reviewStatus: SubmissionReviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ default: '' })
  reviewFeedback?: string;

  /** Points awarded by teacher/admin on approval */
  @Prop({ type: Number, default: 0, min: 0 })
  pointsAwarded: number;
}

export type SubmissionProgressDocument = HydratedDocument<SubmissionProgress>;
export const SubmissionProgressSchema =
  SchemaFactory.createForClass(SubmissionProgress);

// One submission per user per task (overwrite on re-submit)
SubmissionProgressSchema.index(
  { userId: 1, taskType: 1, taskId: 1 },
  { unique: true },
);
