import { UserRole } from '../constants/roles.enum';

export type AuthUser = {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  profileImage?: string;
};
