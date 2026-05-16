import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeacherDeadlineDocument = HydratedDocument<TeacherDeadline>;

/**
 * A teacher-scoped deadline. Each teacher can set their own due date
 * for a given task (assignment / activity / quiz) that only applies
 * to students assigned to them.  Global `dueDate` on the task document
 * is unaffected.
 */
@Schema({ timestamps: true })
export class TeacherDeadline {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  taskType: 'assignment' | 'activity' | 'quiz';

  @Prop({ type: Types.ObjectId, required: true, index: true })
  taskId: Types.ObjectId;

  /** The teacher's custom due date for their students */
  @Prop({ type: Date, required: true })
  dueDate: Date;

  /** Which class this deadline is for (class name like "Class 3") */
  @Prop({ required: true })
  classId: string;
}

export const TeacherDeadlineSchema =
  SchemaFactory.createForClass(TeacherDeadline);

// Compound unique index: one deadline per teacher+task+class
TeacherDeadlineSchema.index(
  { teacherId: 1, taskType: 1, taskId: 1, classId: 1 },
  { unique: true },
);
