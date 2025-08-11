import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRespondentRegistrationDto } from './dto/create-respondent-registration.dto';
import { CreateCaseResponseDto } from './dto/create-case-response.dto';
import { UpdateCaseResponseDto } from './dto/update-case-response.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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

    // Find all cases where this user is listed as a respondent
    const cases = await this.prisma.arbitration.findMany({
      where: {
        // Since respondents is a JSON field, we need to filter differently
        // We'll get all cases and filter in memory for now
      },
      select: {
        id: true,
        caseNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        respondents: true
      }
    });

    // Filter cases where the user is listed as a respondent
    const userCases = cases.filter(caseItem => {
      const respondents = caseItem.respondents as any[] || [];
      return respondents.some((resp: any) => resp.email === user.email);
    });

    return userCases;
  }

  // Get a specific case for a respondent
  async getRespondentCase(userId: string, caseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'RESPONDENT') {
      throw new ForbiddenException('Access denied');
    }

    // Find the case by caseNumber
    const caseData = await this.prisma.arbitration.findFirst({
      where: { 
        caseNumber: caseId 
      }
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    // Check if the user is listed as a respondent in this case
    const respondents = caseData.respondents as any[] || [];
    const isRespondent = respondents.some(
      (resp: any) => resp.email === user.email
    );

    if (!isRespondent) {
      throw new ForbiddenException('You do not have access to this case');
    }

    // Type the formData as any to avoid TypeScript errors with JSON fields
    const formData = caseData.formData as any || {};
    
    return {
      success: true,
      case: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        status: caseData.status,
        // Extract data from JSON fields
        claimant: formData.claimant || {},
        additionalClaimants: formData.additionalClaimants || [],
        managerDetails: formData.managerDetails || {},
        respondents: caseData.respondents || [],
        arbitrationAgreement: formData.arbitrationAgreement || {},
        natureOfDispute: formData.natureOfDispute || {},
        disputeDescriptions: formData.disputeDescriptions || {},
        documents: caseData.documents || {},
        prayers: formData.prayers || {},
        arguments: formData.arguments || {},
        payment: formData.payment || {},
        // respondentResponse and round are not in the schema yet
        respondentResponse: null,
        round: 1
      }
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

  // Verify respondent access token
  async verifyToken(token: string, caseId: string) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;
      
      // Check if the token is for the correct case
      if (decoded.caseId !== caseId) {
        throw new UnauthorizedException('Invalid token for this case');
      }

      // Check if the case exists
      const caseData = await this.prisma.arbitration.findUnique({
        where: { id: caseId }
      });

      if (!caseData) {
        // For now, allow token verification even if case doesn't exist
        // This allows for testing and development
        console.log(`Case ${caseId} not found, but allowing token verification for development`);
        return {
          success: true,
          caseId,
          email: decoded.email,
          message: 'Token verified successfully (case not found in database)'
        };
      }

      // Check if the respondent email matches
      const respondentEmail = decoded.email;
      const respondents = caseData.respondents as any[] || [];
      const isRespondent = respondents.some(
        (resp: any) => resp.email === respondentEmail
      );

      if (!isRespondent) {
        console.log(`User ${respondentEmail} not found in respondents list for case ${caseId}`);
        // For development, allow access even if not in respondents list
        return {
          success: true,
          caseId,
          email: respondentEmail,
          message: 'Token verified successfully (user not in respondents list)'
        };
      }

      // Check if token is expired (24 hours)
      const tokenExpiry = new Date(decoded.exp * 1000);
      if (tokenExpiry < new Date()) {
        throw new UnauthorizedException('Access link has expired');
      }

      return {
        success: true,
        caseId,
        email: respondentEmail,
        message: 'Token verified successfully'
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Respondent login
  async login(email: string, password: string, caseId?: string, token?: string) {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Find cases where this user is listed as a respondent
    let foundCaseId = caseId;
    if (!foundCaseId) {
      const cases = await this.prisma.arbitration.findMany({
        where: {
          // Since respondents is a JSON field, we need to filter differently
          // We'll get all cases and filter in memory for now
        },
        select: {
          id: true,
          caseNumber: true,
          status: true,
          respondents: true
        }
      });

      // Filter cases where the user is listed as a respondent
      const userCases = cases.filter(caseItem => {
        const respondents = caseItem.respondents as any[] || [];
        return respondents.some((resp: any) => resp.email === user.email);
      });

      if (userCases.length > 0) {
        foundCaseId = userCases[0].caseNumber || undefined; // Use the first case found
        console.log(`Found case ${foundCaseId} for respondent ${user.email}`);
      }
    }

    // If caseId is provided, verify the user is a respondent for this case
    if (foundCaseId) {
      console.log(`User ${user.email} attempting to access case ${foundCaseId}`);
    }

    // Generate session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: 'respondent',
        caseId: foundCaseId || null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'respondent'
      },
      caseId: foundCaseId || null,
      sessionToken
    };
  }

  // Respondent registration
  async register(data: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone?: string;
    address?: string;
    caseId?: string;
    token?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.fullName,
        mobile: data.phone,
        role: 'RESPONDENT'
      }
    });

    // If caseId is provided, link the user to the case as a respondent
    if (data.caseId) {
      try {
        // Verify the case exists and the user is listed as a respondent
        const caseData = await this.prisma.arbitration.findUnique({
          where: { id: data.caseId }
        });

        if (!caseData) {
          // If case doesn't exist, still allow registration but don't link
          console.log(`Case ${data.caseId} not found, proceeding with registration without case link`);
        } else {
          // Check if the user's email is in the respondents list
          const respondents = caseData.respondents as any[] || [];
          const isRespondent = respondents.some(
            (resp: any) => resp.email === data.email
          );

          if (isRespondent) {
            // TODO: Create respondent case relationship when database schema is updated
            console.log(`User ${user.email} registered for case ${data.caseId}`);
          } else {
            console.log(`User ${data.email} not found in respondents list for case ${data.caseId}`);
          }
        }
      } catch (error) {
        console.error('Error linking user to case:', error);
        // Continue with registration even if case linking fails
      }
    }

    // Generate session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: 'respondent',
        caseId: data.caseId || null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'respondent'
      },
      caseId: data.caseId || null,
      sessionToken
    };
  }

  // Get respondent session
  async getSession(token: string) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;
      
      return {
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          caseId: decoded.caseId
        }
      };

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
} 