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
        phone: data.phone || null,
        password: hashedPassword
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
        phone: user.phone
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
    console.log('🔧 getRespondentCases called with userId:', userId);
    
    // Find the actual authenticated user
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('🔧 Found user:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found');

    if (!user || user.role !== 'RESPONDENT') {
      console.log('🔧 User not found or not a respondent, returning empty array');
      return [];
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
        respondents: true,
        // Include ALL form data for respondent view
        type: true,
        name: true,
        email: true,
        phone: true,
        phoneCountryCode: true,
        address1: true,
        address2: true,
        city: true,
        district: true,
        state: true,
        country: true,
        pincode: true,
        gst: true,
        pan: true,
        cin: true,
        additionalClaimants: true,
        managerDetails: true,
        arbitrationAgreement: true,
        disputeDetails: true,
        documents: true,
        formData: true // This contains the complete structured form data
      }
    });

    // Filter cases where the user is listed as a respondent
    const userCases = cases.filter(caseItem => {
      const respondents = caseItem.respondents as any[] || [];
      return respondents.some((resp: any) => resp.email === user.email);
    });

    // Format cases for frontend with all necessary data
    const formattedCases = userCases.map(caseItem => {
      const formData = caseItem.formData as any || {};
      
      return {
        id: caseItem.id,
        caseNumber: caseItem.caseNumber,
        status: caseItem.status,
        createdAt: caseItem.createdAt,
        updatedAt: caseItem.updatedAt,
        name: caseItem.name,
        userRole: 'respondent',
        currentRespondentEmail: user.email,
        
        // Claimant data (Step 1)
        claimant: {
          type: caseItem.type,
          name: caseItem.name,
          email: caseItem.email,
          phone: caseItem.phone,
          phoneCountryCode: caseItem.phoneCountryCode,
          address1: caseItem.address1,
          address2: caseItem.address2,
          city: caseItem.city,
          district: caseItem.district,
          state: caseItem.state,
          country: caseItem.country,
          pincode: caseItem.pincode,
          gst: caseItem.gst,
          pan: caseItem.pan,
          cin: caseItem.cin,
          coi: null, // Files need to be handled separately
          panCard: null,
          gstCert: null
        },
        
        // Additional claimants (Step 3)
        additionalClaimants: caseItem.additionalClaimants || [],
        
        // Manager details (Step 4)
        managerDetails: caseItem.managerDetails,
        
        // Respondents (Step 5)
        respondents: caseItem.respondents || [],
        
        // Arbitration Agreement (Step 7)
        arbitrationAgreement: caseItem.arbitrationAgreement || {},
        
        // Form data from formData field if it exists
        natureOfDispute: formData.natureOfDispute || {},
        disputeDetails: formData.disputeDetails || caseItem.disputeDetails || {},
        disputeDescriptions: formData.disputeDescriptions || [],
        evidence: formData.documents || caseItem.documents || {},
        prayers: formData.prayers || {},
        arguments: formData.arguments || {},
        payment: formData.payment || {},
        summary: formData.review || {}
      };
    });

    return formattedCases;
  }

  // Get a specific case for a respondent
  async getRespondentCase(userId: string, caseId: string) {
    console.log('[RespondentService] getRespondentCase called with', { userId, caseId });
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('[RespondentService] ERROR: User not found', { userId });
      throw new ForbiddenException('User not found');
    }
    
    // Enforce RESPONDENT role requirement
    if (user.role !== 'RESPONDENT') {
      console.log('[RespondentService] ERROR: Access denied, wrong role', { userId, role: user.role });
      throw new ForbiddenException('Access denied - respondent role required');
    }
    
    console.log('[RespondentService] User role verified:', { id: user.id, email: user.email, role: user.role });

    // Accept both DB id (UUID) and caseNumber
    let caseData = await this.prisma.arbitration.findUnique({ where: { id: caseId } });
    if (!caseData) {
      console.log('[RespondentService] Case not found for id/caseNumber. Trying suffix match.', { caseId });
      caseData = await this.prisma.arbitration.findFirst({ where: { caseNumber: caseId } });
    }
    // Fallback: try matching by trailing numeric sequence (e.g., 0000107)
    if (!caseData && caseId) {
      const parts = caseId.split('/');
      const suffix = parts[parts.length - 1];
      if (suffix) {
        caseData = await this.prisma.arbitration.findFirst({
          where: { caseNumber: { endsWith: suffix } },
        });
      }
    }

    if (!caseData) {
      console.log('[RespondentService] Case still not found after all strategies.', { caseId });
      throw new NotFoundException('Case not found');
    }

    // Check if the user is listed as a respondent in this case
    console.log('[RespondentService] Checking respondent authorization...');
    const respondents = caseData.respondents as any[] || [];
    console.log('[RespondentService] Case respondents:', respondents.map(r => ({ email: r?.email, name: r?.name })));
    console.log('[RespondentService] Current user email:', user.email);
    
    const isRespondent = respondents.some(
      (resp: any) => resp.email === user.email
    );
    
    console.log('[RespondentService] Is user authorized respondent?', isRespondent);

    if (!isRespondent) {
      console.log('[RespondentService] User not listed as respondent', { userEmail: user.email, respondentsCount: respondents.length });
      throw new ForbiddenException('You do not have access to this case');
    }
    
    console.log('[RespondentService] Authorization successful!');

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
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Check if the token is for the correct case
      if (decoded.caseId !== caseId) {
        throw new UnauthorizedException('Invalid token for this case');
      }

      // Check if the case exists (caseId here refers to caseNumber, not DB UUID)
      const caseData = await this.prisma.arbitration.findFirst({
        where: { caseNumber: caseId }
      });

      if (!caseData) {
        throw new NotFoundException(`Case ${caseId} not found`);
      }

      // Check if the respondent email matches
      const respondentEmail = decoded.email;
      const respondents = (caseData?.respondents as any[]) || [];
      const isRespondent = respondents.some(
        (resp: any) => resp.email === respondentEmail
      );

      if (caseData && !isRespondent) {
        console.log(`User ${respondentEmail} not found in respondents list for case ${caseId}`);
      }

      // Check if token is expired (24 hours)
      const tokenExpiry = new Date(decoded.exp * 1000);
      if (tokenExpiry < new Date()) {
        throw new UnauthorizedException('Access link has expired');
      }

      // Ensure a respondent user exists for this email
      let user = await this.prisma.user.findUnique({ where: { email: respondentEmail } });
      if (!user) {
        const tempPassword = this.generateTemporaryPassword();
        const hashed = await bcrypt.hash(tempPassword, 12);
        user = await this.prisma.user.create({
          data: {
            email: respondentEmail,
            password: hashed,
            name: respondentEmail.split('@')[0],
            role: 'RESPONDENT',
          },
        });
      } else if (user.role !== 'RESPONDENT') {
        // Ensure role is respondent for access
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: 'RESPONDENT' },
        });
      }

      return {
        success: true,
        caseId,
        email: respondentEmail,
        message: 'Token verified successfully. Please login or register to proceed.',
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
    console.log('🔧 REGISTER: Received data:', JSON.stringify(data, null, 2));
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      // If an invitation token is provided, allow attaching respondent role and resetting password
      // to convert this into a seamless onboarding instead of an error.
      if (data.token) {
        try {
          
          // For production, validate the actual JWT token
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(data.token, secret) as any;

          if (decoded && decoded.email === existingUser.email) {
            // Update password and role for the existing user
            const hashedPasswordForExisting = await bcrypt.hash(data.password, 12);

            await this.prisma.user.update({
              where: { id: existingUser.id },
              data: {
                password: hashedPasswordForExisting,
                // Ensure respondent role; if your schema uses enum/string, this will set it
                role: 'RESPONDENT',
                phone: data.phone ?? existingUser.phone ?? undefined,
                name: data.fullName ?? existingUser.name ?? undefined,
              },
            });

            // Generate session token
            const sessionTokenForExisting = jwt.sign(
              {
                userId: existingUser.id,
                email: existingUser.email,
                role: 'respondent',
                caseId: data.caseId || null,
              },
              secret,
              { expiresIn: '24h' },
            );

            return {
              success: true,
              message: 'Registration successful',
              user: {
                id: existingUser.id,
                email: existingUser.email,
                name: data.fullName || existingUser.name,
                role: 'respondent',
              },
              caseId: data.caseId || null,
              sessionToken: sessionTokenForExisting,
            };
          }
        } catch (error) {
          console.log('🔧 Backend: Token verification failed:', error.message);
          // If token is invalid, fall through to the default error below
        }
      }


      
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
        phone: data.phone,
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