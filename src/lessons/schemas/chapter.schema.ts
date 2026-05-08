import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ChapterLessonItemType {
  Video = 'video',
  Quiz = 'quiz',
  Assignment = 'assignment',
  Activity = 'activity',
}

@Schema({ _id: true })
export class ChapterLessonItem {
  @Prop({ required: true, enum: Object.values(ChapterLessonItemType) })
  type: ChapterLessonItemType;

  @Prop({ type: Types.ObjectId, required: true })
  refId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  order: number;
}

export const ChapterLessonItemSchema = SchemaFactory.createForClass(ChapterLessonItem);

@Schema({ _id: true })
export class ChapterLesson {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ trim: true, default: '' })
  descriptionFilePath: string;

  @Prop({ trim: true, default: '' })
  coverImageFilePath: string;

  @Prop({ type: Number, required: true, min: 0 })
  order: number;

  @Prop({ type: [ChapterLessonItemSchema], default: [] })
  items: ChapterLessonItem[];
}

export const ChapterLessonSchema = SchemaFactory.createForClass(ChapterLesson);

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ trim: true, default: '' })
  descriptionFilePath: string;

  @Prop({ trim: true, default: '' })
  coverImageFilePath: string;

  @Prop({ type: [ChapterLessonSchema], default: [] })
  lessons: ChapterLesson[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type ChapterDocument = HydratedDocument<Chapter>;
export const ChapterSchema = SchemaFactory.createForClass(Chapter);
