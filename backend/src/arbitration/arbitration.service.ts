import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArbitrationCase } from './entities/arbitration-case.entity';
import { CaseResponse } from './entities/case-response.entity';
import { CreateArbitrationDto } from './dto/create-arbitration.dto';
import { CaseResponseDto } from './dto/case-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../services/prisma.service';
import { ProposeArbitratorDto, ProposedBy } from './dto/propose-arbitrator.dto';
import { RespondArbitratorProposalDto, ArbitratorProposalStatus } from './dto/respond-arbitrator-proposal.dto';
import { ArbitratorResponseDto } from './dto/arbitrator-response.dto';

// Store sequence in a JSON file to persist between restarts
const SEQUENCE_FILE = path.join(process.cwd(), 'data', 'case-sequence.json');

// Function to generate the next case ID with a sequential number
async function generateCaseId(): Promise<string> {
  try {
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read the current sequence number, or initialize if it doesn't exist
    let sequence = 1;
    if (fs.existsSync(SEQUENCE_FILE)) {
      const data = fs.readFileSync(SEQUENCE_FILE, 'utf8');
      const json = JSON.parse(data);
      sequence = json.sequence || 1;
    }
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Format the case ID: ADDS/ARB/{Year}/{Seven Digit Running Number}
    const caseId = `ADDS/ARB/${currentYear}/${String(sequence).padStart(7, '0')}`;
    
    // Update the sequence number for the next case
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ sequence: sequence + 1 }));
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    throw error;
  }
}

@Injectable()
export class ArbitrationService {
  constructor(
    @InjectRepository(ArbitrationCase)
    private arbitrationCaseRepository: Repository<ArbitrationCase>,
    @InjectRepository(CaseResponse)
    private caseResponseRepository: Repository<CaseResponse>,
    private prisma: PrismaService,
  ) {}

  async createCase(
    createArbitrationDto: CreateArbitrationDto,
    userId: string,
    isDraft: boolean,
  ) {
    const newCase = this.arbitrationCaseRepository.create({
      ...createArbitrationDto,
      claimantId: userId,
      status: isDraft ? 'DRAFT' : 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.arbitrationCaseRepository.save(newCase);
  }

  async getCasesByUser(userId: string, filters: any) {
    console.log('🔍 ArbitrationService.getCasesByUser called with:', {
      userId,
      filters,
      userIdType: typeof userId
    });

    const query = this.arbitrationCaseRepository.createQueryBuilder('case')
      .where('(case.claimantId = :userId OR case.respondentId = :userId)', { userId })
      .andWhere('case.status != :draftStatus', { draftStatus: 'DRAFT' }); // Exclude drafts

    if (filters.status) {
      query.andWhere('case.status = :status', { status: filters.status });
    }

    if (filters.category) {
      query.andWhere('case.category = :category', { category: filters.category });
    }

    const results = await query.getMany();
    console.log('🔍 ArbitrationService.getCasesByUser results:', {
      userId,
      resultsCount: results.length,
      resultIds: results.map(r => ({ id: r.id, claimantId: r.claimantId, respondentId: r.respondentId, status: r.status }))
    });

    return results;
  }

  async getCaseById(id: string) {
    const arbitrationCase = await this.arbitrationCaseRepository.findOne({
      where: { id },
      relations: ['responses', 'documents', 'hearings'],
    });

    if (!arbitrationCase) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }

    return arbitrationCase;
  }

  async updateCaseStatus(id: string, status: string) {
    const arbitrationCase = await this.getCaseById(id);
    arbitrationCase.status = status;
    arbitrationCase.updatedAt = new Date();

    return this.arbitrationCaseRepository.save(arbitrationCase);
  }

  async submitResponse(id: string, caseResponseDto: CaseResponseDto, userId: string) {
    const arbitrationCase = await this.getCaseById(id);

    // Ensure the user is the respondent
    if (arbitrationCase.respondentId !== userId) {
      throw new Error('Only the respondent can submit a response');
    }

    const response = this.caseResponseRepository.create({
      ...caseResponseDto,
      caseId: id,
      respondentId: userId,
      createdAt: new Date(),
    });

    const savedResponse = await this.caseResponseRepository.save(response);

    // Update case status
    arbitrationCase.status = 'RESPONSE_SUBMITTED';
    arbitrationCase.updatedAt = new Date();
    await this.arbitrationCaseRepository.save(arbitrationCase);

    return savedResponse;
  }

  async assignArbitrator(id: string, arbitratorId: string) {
    const arbitrationCase = await this.getCaseById(id);
    arbitrationCase.arbitratorId = arbitratorId;
    arbitrationCase.status = 'ARBITRATOR_ASSIGNED';
    arbitrationCase.updatedAt = new Date();

    return this.arbitrationCaseRepository.save(arbitrationCase);
  }

  async submitDraft(id: string, userId: string) {
    // Find the draft
    const draft = await this.arbitrationCaseRepository.findOne({
      where: { id, claimantId: userId, status: 'DRAFT' },
    });

    if (!draft) {
      throw new NotFoundException(`Draft with ID ${id} not found or not accessible`);
    }

    // Update the draft status to submitted
    draft.status = 'SUBMITTED';
    draft.updatedAt = new Date();
    
    // Generate a case number if not already present
    if (!draft.caseNumber) {
      draft.caseNumber = await generateCaseId();
    }

    return this.arbitrationCaseRepository.save(draft);
  }

  async getDraftsByUser(userId: string) {
    return this.arbitrationCaseRepository.find({
      where: { claimantId: userId, status: 'DRAFT' },
      order: { updatedAt: 'DESC' },
    });
  }

  async getDraftById(id: string, userId: string) {
    const draft = await this.arbitrationCaseRepository.findOne({
      where: { id, claimantId: userId, status: 'DRAFT' },
    });

    if (!draft) {
      throw new NotFoundException(`Draft with ID ${id} not found or not accessible`);
    }

    return draft;
  }

  async getAllCasesForDebug() {
    console.log('🧪 getAllCasesForDebug called - returning all cases');
    return this.arbitrationCaseRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Arbitrator assignment flow methods
  
  // Propose an arbitrator for a case
  async proposeArbitrator(caseId: string, proposalData: ProposeArbitratorDto, userId: string) {
    // Get the case
    const caseData = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
      include: {
        user: true,
      },
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    // Get existing case assignments to check sequence
    const existingAssignments = await this.prisma.caseAssignment.findMany({
      where: { caseId },
      orderBy: { assignedAt: 'desc' },
      take: 1,
    });

    // Get the user making the proposal
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is the claimant or a respondent for this case
    const isClaimant = caseData.userId === userId;
    const isRespondent = caseData.respondents && 
      Array.isArray(caseData.respondents) && 
      caseData.respondents.some((resp: any) => resp.email === user.email);

    if (!isClaimant && !isRespondent && user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to propose an arbitrator for this case');
    }

    // Determine the proposer role
    let proposerRole = proposalData.proposerRole;
    if (!proposerRole) {
      if (isClaimant) {
        proposerRole = ProposedBy.CLAIMANT;
      } else if (isRespondent) {
        proposerRole = ProposedBy.RESPONDENT;
      } else if (user.role === 'ADMIN') {
        proposerRole = ProposedBy.ADMIN;
      } else {
        proposerRole = ProposedBy.SYSTEM;
      }
    }

    // Validate turn-based flow
    // If this is the first proposal, it must come from the claimant
    if (existingAssignments.length === 0 && proposerRole !== ProposedBy.CLAIMANT && user.role !== 'ADMIN') {
      throw new BadRequestException('The first arbitrator proposal must come from the claimant');
    }

    // If there are existing assignments, check whose turn it is
    if (existingAssignments.length > 0 && user.role !== 'ADMIN') {
      const lastAssignment = existingAssignments[0];
      
      // If the last proposal is pending, the other party cannot propose until it's resolved
      if (lastAssignment.status === 'PENDING') {
        throw new BadRequestException('There is already a pending arbitrator proposal');
      }
      
      // Add logic for turn-based proposals if needed
      // This would need to be adapted based on how you track which party made the proposal
    }

    // Verify the proposed arbitrator exists and is active
    const arbitrator = await this.prisma.user.findUnique({
      where: {
        id: proposalData.arbitratorId,
        role: 'ARBITRATOR',
        isActive: true,
      },
    });

    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found or is not active');
    }

    // Create the case assignment (proposal)
    const assignment = await this.prisma.caseAssignment.create({
      data: {
        caseId,
        arbitratorId: proposalData.arbitratorId,
        status: 'PENDING',
        notes: proposalData.notes,
      },
      include: {
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
            expertise: true,
            qualifications: true,
            experience: true,
          },
        },
      },
    });

    // Update the case status to show arbitrator selection is in progress
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: {
        status: 'ARBITRATOR_SELECTION_IN_PROGRESS',
      },
    });

    // TODO: Send notifications to the other party

    return assignment;
  }

  // Respond to an arbitrator proposal
  async respondToArbitratorProposal(
    assignmentId: string,
    responseData: RespondArbitratorProposalDto,
    userId: string
  ) {
    // Get the assignment
    const assignment = await this.prisma.caseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        case: true,
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== 'PENDING') {
      throw new BadRequestException('This assignment has already been responded to');
    }

    // Get the user responding to the proposal
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is authorized to respond
    const isClaimant = assignment.case.userId === userId;
    const isRespondent = assignment.case.respondents && 
      Array.isArray(assignment.case.respondents) && 
      assignment.case.respondents.some((resp: any) => resp.email === user.email);

    if (!isClaimant && !isRespondent && user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to respond to this proposal');
    }

    // Map the status from ArbitratorProposalStatus to CaseAssignmentStatus
    const mappedStatus = 
      responseData.status === ArbitratorProposalStatus.ACCEPTED ? 'ACCEPTED' : 
      responseData.status === ArbitratorProposalStatus.REJECTED ? 'REJECTED' : 
      'PENDING';

    // Update the assignment
    const updatedAssignment = await this.prisma.caseAssignment.update({
      where: { id: assignmentId },
      data: {
        status: mappedStatus,
        respondedAt: new Date(),
        notes: responseData.notes,
      },
      include: {
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If the proposal was accepted, we need to notify the arbitrator
    if (mappedStatus === 'ACCEPTED') {
      // Update case status
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: {
          status: 'ARBITRATOR_SELECTION_COMPLETED',
        },
      });

      // TODO: Send notification to the arbitrator
    } else {
      // Update case status for rejection
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: {
          status: 'ARBITRATOR_SELECTION_IN_PROGRESS',
        },
      });

      // TODO: Send notification to the proposer
    }

    return updatedAssignment;
  }

  // Arbitrator responds to a case assignment
  async arbitratorRespondsToAssignment(
    assignmentId: string, 
    responseData: ArbitratorResponseDto,
    arbitratorId: string
  ) {
    // Get the assignment
    const assignment = await this.prisma.caseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        case: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.arbitratorId !== arbitratorId) {
      throw new ForbiddenException('You are not the arbitrator for this assignment');
    }

    if (assignment.status !== 'ACCEPTED') {
      throw new BadRequestException('This assignment has not been accepted by both parties');
    }

    // Map to CaseAssignmentStatus
    const status = responseData.accepted ? 'ACCEPTED' : 'REJECTED';

    // Update the assignment with the arbitrator's response
    const updatedAssignment = await this.prisma.caseAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        respondedAt: new Date(),
        notes: responseData.notes,
      },
    });

    // Update the case status based on the arbitrator's response
    if (responseData.accepted) {
      // Update case status
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: {
          status: 'ARBITRATOR_ASSIGNED',
        },
      });
      
      // Update the case using the repository to set the arbitratorId
      const case_entity = await this.arbitrationCaseRepository.findOne({
        where: { id: assignment.caseId },
      });
      
      if (case_entity) {
        case_entity.arbitratorId = arbitratorId;
        await this.arbitrationCaseRepository.save(case_entity);
      }

      // TODO: Send notifications to all parties
    } else {
      // If the arbitrator rejected, reset the selection process
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: {
          status: 'ARBITRATOR_REJECTED',
        },
      });

      // TODO: Send notifications to all parties
    }

    return updatedAssignment;
  }

  // Get arbitrator proposals for a case
  async getArbitratorProposals(caseId: string) {
    return this.prisma.caseAssignment.findMany({
      where: { caseId },
      include: {
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
            expertise: true,
            qualifications: true,
            experience: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // Get pending arbitrator assignments for an arbitrator
  async getArbitratorAssignments(arbitratorId: string) {
    return this.prisma.caseAssignment.findMany({
      where: {
        arbitratorId,
        status: 'PENDING',
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            name: true,
            type: true,
            disputeDetails: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }
}