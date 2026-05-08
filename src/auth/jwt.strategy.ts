import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'change-me-in-env',
    });
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub).catch(() => null);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      profileImage: user.profileImage,
    };
  }
}
