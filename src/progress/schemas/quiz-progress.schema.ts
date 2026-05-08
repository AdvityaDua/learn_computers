import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class QuizProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  lessonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ default: 0 })
  score: number;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;
}

export type QuizProgressDocument = HydratedDocument<QuizProgress>;
export const QuizProgressSchema = SchemaFactory.createForClass(QuizProgress);

QuizProgressSchema.index({ userId: 1, quizId: 1 }, { unique: true });
