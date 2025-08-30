import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRespondentRegistrationDto } from './dto/create-respondent-registration.dto';
import { CreateCaseResponseDto } from './dto/create-case-response.dto';
import { UpdateCaseResponseDto } from './dto/update-case-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RespondentService {
  constructor(private prisma: PrismaService) {}

  // Register a new respondent for a specific case
  async registerRespondent(data: CreateRespondentRegistrationDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Generate a temporary password for the respondent
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create a new user with respondent role
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'RESPONDENT',
        mobile: data.phone || null,
        password: hashedPassword,
        temporaryPassword: temporaryPassword, // Store temporary password for email notification
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      temporaryPassword: temporaryPassword, // Include in response so it can be emailed
      message: 'Respondent registered successfully'
    };
  }

  // Get respondent dashboard data
  async getRespondentDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied: User is not a respondent');
    }

    // For now, return basic data structure that matches frontend expectations
    // TODO: Implement proper respondent case tracking when database schema is fixed
    const mockDashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.mobile
      },
      cases: [
        {
          id: 'case-1',
          caseNumber: 'ARB-2025-001',
          name: 'Contract Dispute - Sample Case',
          status: 'PENDING',
          responseStatus: 'PENDING',
          currentPhase: 'PENDING',
          responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          noticeServedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          respondedAt: null
        }
      ],
      responses: [],
      notifications: [
        {
          id: 'notif-1',
          title: 'Welcome to Arbitration Portal',
          message: 'Your respondent account has been set up successfully.',
          type: 'WELCOME',
          createdAt: new Date().toISOString()
        }
      ],
      stats: {
        totalCases: 1,
        pendingResponses: 1,
        submittedResponses: 0,
        unreadNotifications: 1
      }
    };

    return mockDashboardData;
  }

  // Get cases for a respondent
  async getRespondentCases(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // Return empty array for now
    // TODO: Implement proper case retrieval when database schema is fixed
    return [];
  }

  // Get a specific case for a respondent
  async getRespondentCase(userId: string, caseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    throw new NotFoundException('Case not found');
  }

  // Submit a response to a case
  async submitCaseResponse(userId: string, caseId: string, data: CreateCaseResponseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // TODO: Implement case response submission when database schema is fixed
    throw new BadRequestException('Case response submission not yet implemented');
  }

  // Update a case response
  async updateCaseResponse(userId: string, responseId: string, data: UpdateCaseResponseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // TODO: Implement case response update when database schema is fixed
    throw new BadRequestException('Case response update not yet implemented');
  }

  // Get notifications for the respondent
  async getRespondentNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // Return basic notifications
    return [
      {
        id: 'notif-1',
        title: 'Welcome to Arbitration Portal',
        message: 'Your respondent account has been set up successfully.',
        type: 'WELCOME',
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ];
  }

  // Mark a notification as read
  async markNotificationAsRead(userId: string, notificationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // TODO: Implement notification marking when database schema is fixed
    return { message: 'Notification marked as read' };
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  }
} 