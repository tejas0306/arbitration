import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { RegisterDto, LoginDto, UserRole, UpdateProfileDto, ChangePasswordDto } from '../dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { 
      email, 
      password, 
      name, 
      role = UserRole.CLAIMANT,
      organization,
      expertise,
      qualifications,
      experience,
      bio
    } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role and additional fields if provided
    const userData = {
      email,
      password: hashedPassword,
      name,
      role,
      organization,
      // Only include arbitrator fields if they're provided and role is ARBITRATOR
      ...(role === UserRole.ARBITRATOR ? {
        expertise,
        qualifications,
        experience,
        bio
      } : {})
    };

    const user = await this.prisma.user.create({
      data: userData,
    });

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from returned user object
    const { password, ...userProfile } = user;
    return userProfile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check if it's already taken by another user
    if (updateProfileDto.email && updateProfileDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });

    // Remove password from returned user object
    const { password, ...userProfile } = updatedUser;
    return userProfile;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }
} 