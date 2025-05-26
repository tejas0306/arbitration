import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Prevent internal roles from being registered through public API
    const internalRoles = ['ADMIN', 'CASE_MANAGER', 'TEAM_MEMBER'];
    if (internalRoles.includes(registerDto.role)) {
      throw new UnauthorizedException('This role cannot be registered through the public registration API. Please contact an administrator.');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create new user
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Return user without password
    const { password, ...result } = newUser;
    return result;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '1h' },
    );

    // In a real application, you would send an email with the reset link
    // For now, we'll just return the token
    await this.usersService.saveResetToken(user.id, resetToken);

    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.resetToken !== token) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}