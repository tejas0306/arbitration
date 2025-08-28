import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('🔑🔑🔑 JWT STRATEGY VALIDATE CALLED 🔑🔑🔑');
    console.log('🔑 JWT payload received:', JSON.stringify(payload, null, 2));
    console.log('🔑 Extracting user ID from payload.sub:', payload.sub);
    console.log('🔑 Payload keys:', Object.keys(payload));
    
    // Find the user by the sub (subject) claim in the JWT
    const userId = payload.sub || payload.id || payload.userId;
    console.log('🔑 Using userId:', userId);
    
    if (!userId) {
      console.log('🔑 ERROR: No user ID found in JWT payload');
      return null;
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Don't include the password in the returned user object
    const { password, ...result } = user;
    return result;
  }
} 