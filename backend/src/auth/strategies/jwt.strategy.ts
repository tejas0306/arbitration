import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'arbitration-portal-secret',
    });
  }

  async validate(payload: any) {
    console.log('🔑🔑🔑 JWT STRATEGY VALIDATE CALLED 🔑🔑🔑');
    console.log('🔑 JWT payload received:', JSON.stringify(payload, null, 2));
    console.log('🔑 Extracting user ID from payload.sub:', payload.sub);
    console.log('🔑 User email from payload:', payload.email);
    console.log('🔑 User role from payload:', payload.role);
    
    const user = { id: payload.sub, email: payload.email, role: payload.role };
    console.log('🔑 Returning user object:', JSON.stringify(user, null, 2));
    return user;
  }
}