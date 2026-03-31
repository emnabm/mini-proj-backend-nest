import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // tells Passport: look for the token in the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // if the token is expired → reject automatically
      ignoreExpiration: false,

      // the same secret used to sign → used to verify
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  // this runs AFTER the token signature is verified
  // payload = the decoded content { sub, email, role }
  // whatever you return here gets attached to req.user
  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });
    // return only what you need — password is excluded
    return { id: user.id, email: user.email, role: user.role };
  }
}