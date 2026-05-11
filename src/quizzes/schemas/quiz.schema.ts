import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

class QuizQuestion {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true })
  correctAnswerIndex: number;
}

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ trim: true })
  descriptionFilePath?: string;

  @Prop({ type: [QuizQuestion], required: true })
  questions: QuizQuestion[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [String], default: ['Class 3'] })
  classIds: string[];
}

export type QuizDocument = HydratedDocument<Quiz>;
export const QuizSchema = SchemaFactory.createForClass(Quiz);
