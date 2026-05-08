import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum LessonType {
  Documentation = 'documentation',
  Video = 'video',
}

@Schema({ timestamps: true })
export class Lesson {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, enum: Object.values(LessonType) })
  type: LessonType;

  @Prop({ required: true })
  descriptionFilePath: string;

  @Prop({ default: '' })
  documentFilePath?: string;

  @Prop({ default: '' })
  videoFilePath?: string;

  @Prop({ trim: true, default: '' })
  externalVideoUrl?: string;

  @Prop({ trim: true, default: '' })
  thumbnailFilePath?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type LessonDocument = HydratedDocument<Lesson>;
export const LessonSchema = SchemaFactory.createForClass(Lesson);
