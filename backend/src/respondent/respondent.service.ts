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
    // Validate user & role
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // Fetch cases where this respondent's email appears in the respondents JSON array
    // NOTE: Prisma JSON filter support is still experimental; using raw query for flexibility
    const cases = await this.prisma.arbitration.findMany({
      where: {
        AND: [
          { isDraft: false },
          {
            // Check if respondents JSON array contains an object with the same email
            // This utilises the contains filter which works for simple JSON scalars;
            // in case of object array we fallback to post-processing filter below
            OR: [
              { respondents: { path: ["email"], equals: user.email } },
              { respondents: { equals: user.email } }, // safeguard if stored as string[]
            ],
          },
        ],
      },
    });

    // Post-filter for DBs that cannot query deep JSON (e.g. SQLite)
    const filteredCases = cases.filter((c: any) => {
      if (Array.isArray(c.respondents)) {
        return c.respondents.some((r: any) => r?.email === user.email);
      }
      return false;
    });

    // Map to lightweight DTO expected by the frontend
    return filteredCases.map((c: any) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      name: c.claimantDetails?.name || 'Unknown',
      userRole: 'RESPONDENT',
      currentRespondentEmail: user.email,
      claimant: c.claimantDetails,
      additionalClaimants: c.additionalClaimants,
      managerDetails: c.managerDetails,
      respondents: c.respondents,
      arbitrationAgreement: c.arbitrationAgreement,
      // Support legacy and new storage locations
      disputeDetails: c.disputeDetails || c.formData?.disputeDetails || {},
      natureOfDispute:
        c.disputeDetails?.natureOfDispute ||
        c.formData?.natureOfDispute ||
        c.formData?.disputeDetails?.natureOfDispute ||
        [],
      disputeDescriptions:
        c.disputeDetails?.disputeDescriptions ||
        c.formData?.disputeDescriptions ||
        c.formData?.disputeDetails?.disputeDescriptions ||
        [],
      evidence: c.documents || {},
      prayers: c.prayers || c.formData?.prayers || {},
      arguments: c.arguments || c.formData?.arguments || {},
      payment: c.payment || c.formData?.payment || {},
      summary: c.summary || c.formData?.summary || {},
    }));
  }

  // Get a specific case for a respondent
  async getRespondentCase(userId: string, caseId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    const arbitration = await this.prisma.arbitration.findUnique({ where: { id: caseId } });

    if (!arbitration) {
      throw new NotFoundException('Case not found');
    }

    // Verify respondent email belongs to this case
    if (
      !Array.isArray(arbitration.respondents) ||
      !arbitration.respondents.some((r: any) => r?.email === user.email)
    ) {
      throw new ForbiddenException('You do not have access to this case');
    }

    return {
      id: arbitration.id,
      caseNumber: arbitration.caseNumber,
      status: arbitration.status,
      createdAt: arbitration.createdAt,
      updatedAt: arbitration.updatedAt,
      name: arbitration.claimantDetails?.name || 'Unknown',
      userRole: 'RESPONDENT',
      currentRespondentEmail: user.email,
      claimant: arbitration.claimantDetails,
      additionalClaimants: arbitration.additionalClaimants,
      managerDetails: arbitration.managerDetails,
      respondents: arbitration.respondents,
      arbitrationAgreement: arbitration.arbitrationAgreement,
      natureOfDispute: arbitration.disputeDetails?.natureOfDispute || [],
      disputeDetails: arbitration.disputeDetails || {},
      disputeDescriptions: arbitration.disputeDetails?.disputeDescriptions || [],
      evidence: arbitration.documents || {},
      prayers: arbitration.prayers || {},
      arguments: arbitration.arguments || {},
      payment: arbitration.payment || {},
      summary: arbitration.summary || {},
    };
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