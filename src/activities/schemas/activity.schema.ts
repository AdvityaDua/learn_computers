import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  descriptionFilePath: string;

  @Prop({ default: '' })
  attachmentFilePath?: string;

  @Prop({ type: [String], default: [] })
  imageFilePaths: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Number, min: 0, default: null })
  points?: number;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  requiresSubmission: boolean;

  /** e.g. ['pdf','image','zip','document','code','any'] */
  @Prop({ type: [String], default: [] })
  acceptedFileTypes: string[];
}

export type ActivityDocument = HydratedDocument<Activity>;
export const ActivitySchema = SchemaFactory.createForClass(Activity);
