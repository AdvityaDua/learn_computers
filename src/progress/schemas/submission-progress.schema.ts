import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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
}

export type SubmissionProgressDocument = HydratedDocument<SubmissionProgress>;
export const SubmissionProgressSchema =
  SchemaFactory.createForClass(SubmissionProgress);

// One submission per user per task (overwrite on re-submit)
SubmissionProgressSchema.index(
  { userId: 1, taskType: 1, taskId: 1 },
  { unique: true },
);
