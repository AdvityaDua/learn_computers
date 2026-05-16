import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from '../common/types/auth-user.type';
import { GoogleLoginDto } from './dto/google-login.dto';
import { getFirebaseAuthClient } from './firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      profileImage: user.profileImage,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      profileImage: user.profileImage,
    });
  }

  async googleLogin(dto: GoogleLoginDto) {
    let decodedToken;

    try {
      decodedToken = await getFirebaseAuthClient().verifyIdToken(dto.idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    if (!decodedToken.email || decodedToken.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    if (decodedToken.firebase?.sign_in_provider !== 'google.com') {
      throw new UnauthorizedException(
        'Only Google sign-in is allowed for this endpoint',
      );
    }

    const normalizedEmail = decodedToken.email.toLowerCase();
    const googlePicture: string | undefined = decodedToken.picture || undefined;
    let user = await this.usersService.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      const existingByEmail =
        await this.usersService.findByEmail(normalizedEmail);

      if (existingByEmail) {
        if (
          existingByEmail.firebaseUid &&
          existingByEmail.firebaseUid !== decodedToken.uid
        ) {
          throw new UnauthorizedException(
            'Email is already linked to another Google account',
          );
        }

        existingByEmail.firebaseUid = decodedToken.uid;
        existingByEmail.authProvider = 'google';
        // Update photo if Google provides one and user doesn't have a custom upload
        if (
          googlePicture &&
          !existingByEmail.profileImage?.startsWith('/uploads/')
        ) {
          existingByEmail.profileImage = googlePicture;
        }
        user = await existingByEmail.save();
      } else {
        const fullName =
          decodedToken.name?.trim() ||
          normalizedEmail.split('@')[0] ||
          'Student';

        try {
          user = await this.usersService.createGoogleUser({
            email: normalizedEmail,
            fullName,
            firebaseUid: decodedToken.uid,
            profileImage: googlePicture,
          });
        } catch {
          throw new InternalServerErrorException(
            'Unable to create Google user',
          );
        }
      }
    } else {
      // Existing Google user — refresh their photo if they haven't uploaded a custom one
      if (googlePicture && !user.profileImage?.startsWith('/uploads/')) {
        user = await this.usersService.update(user.id, {
          profileImage: googlePicture,
        });
      }
    }

    return this.buildAuthResponse({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      profileImage: user.profileImage,
    });
  }

  private buildAuthResponse(payload: AuthUser) {
    return {
      accessToken: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
