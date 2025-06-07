import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from './entities/user.entity';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Convert to the right format for Prisma
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        role: createUserDto.role,
        organization: createUserDto.organization,
        mobile: createUserDto.mobile,
        status: createUserDto.status,
        paymentId: createUserDto.paymentId
      }
    });
    
    // Map Prisma User to TypeORM User entity
    return this.mapPrismaUserToEntity(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => this.mapPrismaUserToEntity(user));
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return this.mapPrismaUserToEntity(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) return null;
    
    return this.mapPrismaUserToEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findById(id); // Check if user exists
    
    // If updating password, hash it first
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        password: updateUserDto.password,
        role: updateUserDto.role,
        organization: updateUserDto.organization,
        mobile: updateUserDto.mobile,
        status: updateUserDto.status,
        paymentId: updateUserDto.paymentId
      }
    });
    
    return this.mapPrismaUserToEntity(updated);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );
    
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Hash and save new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword }
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetToken: ''
      }
    });
    
    return this.mapPrismaUserToEntity(updated);
  }

  async saveResetToken(id: string, resetToken: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { resetToken }
    });
    
    return this.mapPrismaUserToEntity(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // Check if user exists
    await this.prisma.user.delete({ where: { id } });
  }

  async findByRoleAndStatus(role: UserRole, status: UserStatus): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { 
        role,
        status: status.toString()
      }
    });
    
    return users.map(user => this.mapPrismaUserToEntity(user));
  }

  async findByRoles(roles: UserRole[]): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: roles }
      }
    });
    
    return users.map(user => this.mapPrismaUserToEntity(user));
  }

  async findByPaymentId(paymentId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { paymentId }
    });
    
    if (!user) return null;
    
    return this.mapPrismaUserToEntity(user);
  }
  
  // Helper method to map Prisma User to TypeORM User entity
  private mapPrismaUserToEntity(prismaUser: any): User {
    const user = new User();
    user.id = prismaUser.id;
    user.name = prismaUser.name;
    user.email = prismaUser.email;
    user.password = prismaUser.password;
    user.mobile = prismaUser.mobile || '';
    user.organization = prismaUser.organization;
    user.role = prismaUser.role as UserRole;
    user.status = (prismaUser.status as UserStatus) || UserStatus.PENDING_PAYMENT;
    user.expertise = prismaUser.expertise;
    user.qualifications = prismaUser.qualifications;
    user.hourlyRate = prismaUser.hourlyRate ? Number(prismaUser.hourlyRate) : 0;
    user.availability = prismaUser.availabilityInfo || '';
    user.documents = prismaUser.documents || [];
    user.resetToken = prismaUser.resetToken || '';
    user.temporaryPassword = prismaUser.temporaryPassword || '';
    user.paymentId = prismaUser.paymentId || '';
    user.createdAt = prismaUser.createdAt;
    user.updatedAt = prismaUser.updatedAt;
    return user;
  }
}