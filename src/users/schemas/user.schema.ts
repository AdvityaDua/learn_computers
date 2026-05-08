import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/constants/roles.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true, unique: true, sparse: true })
  firebaseUid?: string;

  @Prop({ trim: true, default: 'local' })
  authProvider: string;

  @Prop({ required: true, enum: Object.values(UserRole), default: UserRole.Student })
  role: UserRole;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true })
  profileImage?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
