import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MaterialType = 'pdf' | 'video' | 'markdown' | 'other';

@Schema({ timestamps: true })
export class Material {
  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true, enum: ['pdf', 'video', 'markdown', 'other'] })
  type: MaterialType;

  @Prop({ default: 0 })
  sizeBytes: number;

  @Prop({ trim: true, default: '' })
  category: string; // e.g. 'assignment', 'activity', 'lecture', 'general'

  @Prop({ trim: true, default: '' })
  description: string;
}

export type MaterialDocument = HydratedDocument<Material>;
export const MaterialSchema = SchemaFactory.createForClass(Material);
