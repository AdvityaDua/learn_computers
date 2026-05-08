import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class LessonProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true, index: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  lessonId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastAccessedAt?: Date | null;
}

export type LessonProgressDocument = HydratedDocument<LessonProgress>;
export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);

LessonProgressSchema.index({ userId: 1, chapterId: 1, lessonId: 1 }, { unique: true });
