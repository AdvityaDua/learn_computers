import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolDocument = HydratedDocument<School>;

@Schema({ timestamps: true })
export class School {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  @Prop({ trim: true, default: '' })
  address: string;

  @Prop({ trim: true, default: '' })
  contactEmail: string;

  @Prop({ trim: true, default: '' })
  contactPhone: string;

  @Prop({ type: [String], default: [] })
  assignedClasses: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  teacherIds: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
SchoolSchema.index({ code: 1 }, { unique: true });
