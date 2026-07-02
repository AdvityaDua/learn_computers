import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const REVIEW_TYPES = ['daily', 'monthly'] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

@Schema({ timestamps: true })
export class StudentReview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  classId: string;

  @Prop({ type: Types.ObjectId, ref: 'School' })
  schoolId?: Types.ObjectId;

  @Prop({ type: String, enum: REVIEW_TYPES, required: true })
  type: ReviewType;

  /** For daily reviews: the specific date */
  @Prop({ type: Date })
  date?: Date;

  /** For monthly reviews: 1-12 */
  @Prop({ type: Number, min: 1, max: 12 })
  month?: number;

  @Prop({ type: Number, min: 2000, max: 2100 })
  year?: number;

  /** Star rating 1–5 */
  @Prop({ type: Number, required: true, min: 1, max: 5 })
  overallRating: number;

  @Prop({ type: Number, min: 1, max: 5 })
  academicRating?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  behaviorRating?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  participationRating?: number;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  areasForImprovement: string[];
}

export type StudentReviewDocument = HydratedDocument<StudentReview>;
export const StudentReviewSchema = SchemaFactory.createForClass(StudentReview);

// Unique: one daily review per student per date; one monthly per student per month+year
StudentReviewSchema.index({ studentId: 1, type: 1, date: 1 }, { unique: true, sparse: true });
StudentReviewSchema.index({ studentId: 1, type: 1, month: 1, year: 1 }, { unique: true, sparse: true });
StudentReviewSchema.index({ classId: 1, type: 1 });
