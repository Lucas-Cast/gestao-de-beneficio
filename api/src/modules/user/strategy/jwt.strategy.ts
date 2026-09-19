import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDomain } from '../domain/user.domain';
import { UserRepository } from '../user.repository';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<UserDomain> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Usuario nao encontrado.',
      );
    }

    return UserDomain.fromPrisma(user);
  }
}
