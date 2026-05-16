import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, trim: true })
  name: string; // e.g. "Class 3"

  @Prop({ required: true })
  grade: number; // numeric grade e.g. 3

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'School' }], default: [] })
  schoolIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  teacherIds: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
ClassSchema.index({ grade: 1 });
