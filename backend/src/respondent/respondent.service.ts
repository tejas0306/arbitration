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
      const flat = caseItem as any;
      
      console.log('🔧 [RespondentService] Processing case:', caseItem.caseNumber);
      console.log('🔧 [RespondentService] Raw formData:', formData);
      console.log('🔧 [RespondentService] formData keys:', Object.keys(formData));
      console.log('🔧 [RespondentService] formData.natureOfDispute:', formData.natureOfDispute);
      console.log('🔧 [RespondentService] formData.disputeDescriptions:', formData.disputeDescriptions);
      console.log('🔧 [RespondentService] formData.prayers:', formData.prayers);
      console.log('🔧 [RespondentService] formData.arguments:', formData.arguments);
      
      // Try to get natureOfDispute and disputeDescriptions (prefer flattened fields first)
      let natureOfDispute: any[] = [];
      let disputeDescriptions: any[] = [];
      
      // First, try flattened string fields on the Arbitration row
      try {
        if (flat.natureOfDispute) {
          const parsed = JSON.parse(flat.natureOfDispute);
          natureOfDispute = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (_) {
        if (typeof flat.natureOfDispute === 'string') {
          natureOfDispute = [flat.natureOfDispute];
        }
      }

      try {
        if (flat.disputeDescription) {
          const parsed = JSON.parse(flat.disputeDescription);
          disputeDescriptions = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (_) {
        if (typeof flat.disputeDescription === 'string') {
          disputeDescriptions = [flat.disputeDescription];
        }
      }

      console.log('🔧 [RespondentService] Processing case:', caseItem.caseNumber);
      console.log('🔧 [RespondentService] Has flattened fields:', !!flat.natureOfDispute, !!flat.disputeDescription);
      console.log('🔧 [RespondentService] formData keys:', Object.keys(formData || {}));
      
      // Try to find natureOfDispute in formData (fallback if flattened field failed)
      if (natureOfDispute.length === 0 && formData.natureOfDispute) {
        natureOfDispute = Array.isArray(formData.natureOfDispute) ? formData.natureOfDispute : [formData.natureOfDispute];
      }
      
      // Try to find disputeDescriptions in formData (fallback if flattened field failed) 
      if (disputeDescriptions.length === 0 && formData.disputeDescriptions) {
        disputeDescriptions = Array.isArray(formData.disputeDescriptions) ? formData.disputeDescriptions : [formData.disputeDescriptions];
      }
      
      // If still empty, try disputeDetails as fallback
      if (natureOfDispute.length === 0 && caseItem.disputeDetails) {
        const disputeDetails = caseItem.disputeDetails as any;
        if (disputeDetails.natureOfDispute) {
          natureOfDispute = Array.isArray(disputeDetails.natureOfDispute) ? disputeDetails.natureOfDispute : [disputeDetails.natureOfDispute];
        }
      }
      
      if (disputeDescriptions.length === 0 && caseItem.disputeDetails) {
        const disputeDetails = caseItem.disputeDetails as any;
        if (disputeDetails.disputeDescriptions) {
          disputeDescriptions = Array.isArray(disputeDetails.disputeDescriptions) ? disputeDetails.disputeDescriptions : [disputeDetails.disputeDescriptions];
        }
      }
      
      // Try to get prayers and arguments (prefer flattened fields first)
      let prayers: any[] = [];
      let argumentsData: any[] = [];

      // Flattened fields first (strings that contain JSON objects)
      try {
        if (flat.prayers) {
          const parsed = JSON.parse(flat.prayers);
          // Expect format: {"prayers": [array of prayer objects]}
          prayers = parsed.prayers || [];
        }
      } catch (_) {
        console.log('🔧 [RespondentService] Failed to parse prayers string field');
      }

      try {
        if (flat.arguments) {
          const parsed = JSON.parse(flat.arguments);
          console.log('🔧 [RespondentService] Parsed arguments:', JSON.stringify(parsed, null, 2));
          // Expect format: {"argumentsPerPrayer": [array], "argumentsPerIssue": [array]}
          argumentsData = parsed.argumentsPerPrayer || parsed.argumentsPerIssue || [];
          console.log('🔧 [RespondentService] Extracted argumentsData:', argumentsData);
        }
      } catch (_) {
        console.log('🔧 [RespondentService] Failed to parse arguments string field');
      }
      
      // Handle prayers structure from formData as fallback
      if (prayers.length === 0 && formData.prayers && formData.prayers.prayers) {
        prayers = Array.isArray(formData.prayers.prayers) ? formData.prayers.prayers : [formData.prayers.prayers];
      }
      
      // Handle arguments structure from formData as fallback  
      if (argumentsData.length === 0 && formData.arguments) {
        argumentsData = formData.arguments.argumentsPerPrayer || formData.arguments.argumentsPerIssue || [];
      }
      
      console.log('🔧 [RespondentService] Final natureOfDispute:', natureOfDispute);
      console.log('🔧 [RespondentService] Final disputeDescriptions:', disputeDescriptions);
      console.log('🔧 [RespondentService] Final argumentsData:', argumentsData);
      console.log('🔧 [RespondentService] Final prayers:', prayers);
      
      return {
        id: caseItem.id,
        caseNumber: caseItem.caseNumber,
        status: caseItem.status,
        createdAt: caseItem.createdAt,
        updatedAt: caseItem.updatedAt,
        name: caseItem.name,
        userRole: 'RESPONDENT',
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
        
        // Manager details (Step 4) - try multiple sources
        managerDetails: caseItem.managerDetails || formData.step2?.managerDetails || formData.managerDetails || {},
        
        // Respondents (Step 5)
        respondents: caseItem.respondents || [],
        
        // Arbitration Agreement (Step 7)
        arbitrationAgreement: caseItem.arbitrationAgreement || {},
        
        // Form data from formData field if it exists
        natureOfDispute: natureOfDispute,
        disputeDetails: formData.disputeDetails || caseItem.disputeDetails || {},
        disputeDescriptions: disputeDescriptions,
        evidence: formData.documents || caseItem.documents || {},
        prayers: prayers,
        arguments: {
          argumentsPerIssue: argumentsData.filter(arg => typeof arg === 'string' && arg.trim() !== ''),
          argumentsPerPrayer: argumentsData.filter(arg => typeof arg === 'object' && arg.argument)
        },
        payment: formData.payment || {},
        summary: formData.review || {},
        
        // DEBUG: Raw database fields to see what's actually stored
        _rawFormData: formData,
        _rawFlattenedFields: {
          natureOfDispute: flat.natureOfDispute || null,
          disputeDescription: flat.disputeDescription || null,
          arguments: flat.arguments || null,
          prayers: flat.prayers || null,
          paymentAmount: flat.paymentAmount || null,
          paymentDetails: flat.paymentDetails || null
        },
        _rawDisputeDetails: caseItem.disputeDetails,
        _rawManagerDetails: caseItem.managerDetails
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
    let caseData = await this.prisma.arbitration.findUnique({ 
      where: { id: caseId },
      select: {
        id: true,
        caseNumber: true,
        status: true,
        respondents: true,
        formData: true,
        disputeDetails: true,
        documents: true,
        // NEW: Select the flattened fields directly
        natureOfDispute: true,
        disputeDescription: true,
        arguments: true,
        prayers: true,
        paymentAmount: true,
        paymentDetails: true
      }
    });
    if (!caseData) {
      console.log('[RespondentService] Case not found for id/caseNumber. Trying suffix match.', { caseId });
      caseData = await this.prisma.arbitration.findFirst({ 
        where: { caseNumber: caseId },
        select: {
          id: true,
          caseNumber: true,
          status: true,
          respondents: true,
          formData: true,
          disputeDetails: true,
          documents: true,
          // NEW: Select the flattened fields directly
          natureOfDispute: true,
          disputeDescription: true,
          arguments: true,
          prayers: true,
          paymentAmount: true,
          paymentDetails: true
        }
      });
    }
    // Fallback: try matching by trailing numeric sequence (e.g., 0000107)
    if (!caseData && caseId) {
      const parts = caseId.split('/');
      const suffix = parts[parts.length - 1];
      if (suffix) {
        caseData = await this.prisma.arbitration.findFirst({
          where: { caseNumber: { endsWith: suffix } },
          select: {
            id: true,
            caseNumber: true,
            status: true,
            respondents: true,
            formData: true,
            disputeDetails: true,
            documents: true,
            // NEW: Select the flattened fields directly
            natureOfDispute: true,
            disputeDescription: true,
            arguments: true,
            prayers: true,
            paymentAmount: true,
            paymentDetails: true
          }
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
    
    console.log('🔧 [RespondentService] getRespondentCase - Raw caseData:', caseData);
    console.log('🔧 [RespondentService] getRespondentCase - formData:', formData);
    
    // Extract data from formData and other sources
    let natureOfDispute: any[] = [];
    let disputeDescriptions: any[] = [];
    let prayers: any[] = [];
    let argumentsData: any[] = [];
    
    // Try to get data from flattened fields first, then formData 
    const flat = caseData as any;
    
    // First try flattened string fields
    try {
      if (flat.natureOfDispute) {
        const parsed = JSON.parse(flat.natureOfDispute);
        natureOfDispute = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (_) {
      // If parse fails, try formData
      if (formData.natureOfDispute) {
        natureOfDispute = Array.isArray(formData.natureOfDispute) ? formData.natureOfDispute : [formData.natureOfDispute];
      }
    }
    
    try {
      if (flat.disputeDescription) {
        const parsed = JSON.parse(flat.disputeDescription);
        disputeDescriptions = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (_) {
      // If parse fails, try formData
      if (formData.disputeDescriptions) {
        disputeDescriptions = Array.isArray(formData.disputeDescriptions) ? formData.disputeDescriptions : [formData.disputeDescriptions];
      }
    }
    
    // Handle prayers - try flattened field first
    try {
      if (flat.prayers) {
        const parsed = JSON.parse(flat.prayers);
        prayers = parsed.prayers || [];
      }
    } catch (_) {
      // If parse fails, try formData
      if (formData.prayers && formData.prayers.prayers) {
        prayers = Array.isArray(formData.prayers.prayers) ? formData.prayers.prayers : [formData.prayers.prayers];
      }
    }
    
    // Handle arguments - try flattened field first  
    try {
      if (flat.arguments) {
        const parsed = JSON.parse(flat.arguments);
        argumentsData = parsed.argumentsPerPrayer || parsed.argumentsPerIssue || [];
      }
    } catch (_) {
      // If parse fails, try formData
      if (formData.arguments) {
        argumentsData = formData.arguments.argumentsPerPrayer || formData.arguments.argumentsPerIssue || [];
      }
    }
    
    // If still empty, try disputeDetails as fallback
    if (natureOfDispute.length === 0 && caseData.disputeDetails) {
      const disputeDetails = caseData.disputeDetails as any;
      if (disputeDetails.natureOfDispute) {
        natureOfDispute = Array.isArray(disputeDetails.natureOfDispute) ? disputeDetails.natureOfDispute : [disputeDetails.natureOfDispute];
      }
    }
    
    if (disputeDescriptions.length === 0 && caseData.disputeDetails) {
      const disputeDetails = caseData.disputeDetails as any;
      if (disputeDetails.disputeDescriptions) {
        disputeDescriptions = Array.isArray(disputeDetails.disputeDescriptions) ? disputeDetails.disputeDescriptions : [disputeDetails.disputeDescriptions];
      }
    }

    console.log('🔧 [RespondentService] getRespondentCase - Final values:', {
      natureOfDispute,
      disputeDescriptions,
      arguments: argumentsData,
      prayers: prayers
    });
    
    return {
      success: true,
      case: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        status: caseData.status,
        // Extract data from JSON fields
        claimant: formData.claimant || {},
        additionalClaimants: formData.additionalClaimants || [],
        managerDetails: formData.step2?.managerDetails || formData.managerDetails || {},
        respondents: caseData.respondents || [],
        arbitrationAgreement: formData.arbitrationAgreement || {},
        natureOfDispute: natureOfDispute,
        disputeDescriptions: disputeDescriptions,
        documents: caseData.documents || {},
        prayers: prayers,
        arguments: {
          argumentsPerIssue: argumentsData.filter(arg => typeof arg === 'string' && arg.trim() !== ''),
          argumentsPerPrayer: argumentsData.filter(arg => typeof arg === 'object' && arg.argument)
        },
        payment: null, // formData.payment || {},
        // respondentResponse and round are not in the schema yet
        respondentResponse: null,
        round: 1
      }
    };
  }

  // Submit a response to a case
  async submitCaseResponse(userId: string, caseId: string, data: CreateCaseResponseDto) {
    console.log('🔧 submitCaseResponse called with userId:', userId, 'caseId:', caseId);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('🔧 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found');

    if (!user || user.role !== 'RESPONDENT') {
      console.log('🔧 Access denied - user not found or not RESPONDENT role');
      throw new ForbiddenException('Access denied');
    }

    // Find the case
    const arbitrationCase = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
      include: {
        respondentCases: true
      }
    });

    console.log('🔧 Case found:', arbitrationCase ? { id: arbitrationCase.id, caseNumber: arbitrationCase.caseNumber } : 'Not found');
    console.log('🔧 Respondent cases:', arbitrationCase?.respondentCases);

    if (!arbitrationCase) {
      console.log('🔧 Case not found');
      throw new NotFoundException('Case not found');
    }

    // Check if the user is a respondent for this case
    let isRespondent = arbitrationCase.respondentCases.some(
      (respCase) => respCase.respondentId === userId
    );

    console.log('🔧 Is user a respondent for this case?', isRespondent);

    // If user is not in respondentCases but is a RESPONDENT user, try to create the relationship
    if (!isRespondent && user.role === 'RESPONDENT') {
      console.log('🔧 User is RESPONDENT but not linked to case. Attempting to create RespondentCase record...');
      
      try {
        // Check if the case has respondents data
        const caseRespondents = arbitrationCase.respondents as any[] || [];
        const userEmail = user.email;
        
        // Check if user's email matches any respondent in the case
        const matchingRespondent = caseRespondents.find(resp => resp.email === userEmail);
        
        if (matchingRespondent) {
          console.log('🔧 Found matching respondent in case data. Creating RespondentCase record...');
          
          // Create the RespondentCase record
          const responseDeadline = new Date();
          responseDeadline.setDate(responseDeadline.getDate() + 21); // 21 days to respond
          
          await this.prisma.respondentCase.create({
            data: {
              caseId,
              respondentId: userId,
              respondentType: matchingRespondent.type || 'Individual',
              respondentName: matchingRespondent.name || user.name,
              respondentEmail: userEmail,
              respondentPhone: matchingRespondent.phone || user.phone,
              respondentAddress: matchingRespondent.address || {},
              responseDeadline,
              notificationStatus: 'UNREAD',
              responseStatus: 'PENDING',
              currentPhase: 'NOTICE_SENT'
            }
          });
          
          isRespondent = true;
          console.log('🔧 Successfully created RespondentCase record. User is now authorized.');
        } else {
          console.log('🔧 User email not found in case respondents list');
        }
      } catch (error) {
        console.error('🔧 Error creating RespondentCase record:', error);
      }
    }

    if (!isRespondent) {
      console.log('🔧 FORBIDDEN: User is not authorized to respond to this case');
      console.log('🔧 Available respondent cases:', arbitrationCase.respondentCases.map(rc => ({ id: rc.id, respondentId: rc.respondentId })));
      throw new ForbiddenException('You are not authorized to respond to this case');
    }

    // Create or update the case response
    const existingResponse = await this.prisma.caseResponse.findFirst({
      where: {
        caseId: caseId,
        respondentId: userId
      }
    });

    let caseResponse;
    
    if (existingResponse) {
      // Update existing response
      caseResponse = await this.prisma.caseResponse.update({
        where: { id: existingResponse.id },
        data: {
          // Store response data in JSON fields that exist in schema
          disputePointResponses: data.responseData?.fieldResponses || [],
          counterClaims: data.responseData?.newIssues || [],
          status: 'SUBMITTED',
          submittedAt: new Date(),
          round: data.round || 1,
          responseOverview: data.responseOverview || 'Respondent response submitted',
          legalArguments: data.legalArguments || '',
          additionalNotes: data.additionalNotes || '',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new response
      caseResponse = await this.prisma.caseResponse.create({
        data: {
          caseId: caseId,
          respondentId: userId,
          // Store response data in JSON fields that exist in schema
          disputePointResponses: data.responseData?.fieldResponses || [],
          counterClaims: data.responseData?.newIssues || [],
          status: 'SUBMITTED',
          submittedAt: new Date(),
          round: data.round || 1,
          responseOverview: data.responseOverview || 'Respondent response submitted',
          legalArguments: data.legalArguments || '',
          additionalNotes: data.additionalNotes || '',
          documents: [],
          evidence: [],
          witnessStatements: [],
          lawsReliedUpon: [],
          requestedReliefs: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Update the respondent case status
    await this.prisma.respondentCase.updateMany({
      where: {
        caseId: caseId,
        respondentId: userId
      },
      data: {
        responseStatus: 'SUBMITTED',
        respondedAt: new Date(),
        currentPhase: 'RESPONSE_SUBMITTED',
        updatedAt: new Date()
      }
    });

    // Update the main arbitration case status if all respondents have responded
    const allRespondentCases = await this.prisma.respondentCase.findMany({
      where: { caseId: caseId }
    });

    const allResponded = allRespondentCases.every(
      (respCase) => respCase.responseStatus === 'SUBMITTED'
    );

    if (allResponded) {
      await this.prisma.arbitration.update({
        where: { id: caseId },
        data: {
          status: 'RESPONSE_SUBMITTED',
          updatedAt: new Date()
        }
      });
    }

    return {
      success: true,
      message: 'Response submitted successfully',
      responseId: caseResponse.id,
      caseId: caseId,
      status: 'SUBMITTED'
    };
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
        role: 'RESPONDENT',
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
        role: 'RESPONDENT'
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
                role: 'RESPONDENT',
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
                role: 'RESPONDENT',
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
        role: 'RESPONDENT',
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
        role: 'RESPONDENT'
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
