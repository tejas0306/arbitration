import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { RegisterDto, LoginDto, UserRole } from '../dto/auth.dto';
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
} 