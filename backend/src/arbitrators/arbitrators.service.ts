import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { UpdateArbitratorProfileDto } from './dto/update-arbitrator-profile.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CaseAssignmentResponseDto } from './dto/case-assignment-response.dto';
import { ScheduleHearingDto } from './dto/schedule-hearing.dto';
import { CreateAwardDto } from './dto/create-award.dto';

@Injectable()
export class ArbitratorsService {
  constructor(private prisma: PrismaService) {}

  // Get list of all arbitrators with optional filters
  async getAllArbitrators(filters: {
    expertise?: string;
    availability?: string;
    language?: string;
    location?: string;
    experience?: number;
  }) {
    const where: any = {
      role: 'ARBITRATOR',
      arbitratorStatus: 'ACTIVE',
    };

    if (filters.expertise) {
      where.expertise = {
        contains: filters.expertise,
        mode: 'insensitive',
      };
    }

    if (filters.language) {
      where.languages = {
        has: filters.language,
      };
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.experience) {
      where.experience = {
        gte: parseInt(filters.experience.toString()),
      };
    }

    const arbitrators = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        expertise: true,
        qualifications: true,
        experience: true,
        bio: true,
        languages: true,
        location: true,
        hourlyRate: true,
        arbitratorStatus: true,
        createdAt: true,
        _count: {
          select: {
            caseAssignments: {
              where: { status: 'COMPLETED' },
            },
            feedback: true,
          },
        },
      },
      orderBy: [
        { experience: 'desc' },
        { name: 'asc' },
      ],
    });

    // Calculate average rating for each arbitrator
    const arbitratorsWithRating = await Promise.all(
      arbitrators.map(async (arbitrator) => {
        const avgRating = await this.prisma.feedback.aggregate({
          where: { arbitratorId: arbitrator.id },
          _avg: { rating: true },
        });

        return {
          ...arbitrator,
          averageRating: avgRating._avg.rating || 0,
          completedCases: arbitrator._count.caseAssignments,
          totalFeedback: arbitrator._count.feedback,
        };
      })
    );

    return arbitratorsWithRating;
  }

  // Get detailed arbitrator profile
  async getArbitratorDetails(id: string) {
    const arbitrator = await this.prisma.user.findUnique({
      where: { 
        id,
        role: 'ARBITRATOR',
      },
      include: {
        availability: true,
        caseAssignments: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                type: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        feedback: {
          include: {
            case: {
              select: {
                caseNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            caseAssignments: {
              where: { status: 'COMPLETED' },
            },
            hearings: true,
            awards: true,
          },
        },
      },
    });

    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    // Calculate average rating
    const avgRating = await this.prisma.feedback.aggregate({
      where: { arbitratorId: id },
      _avg: { rating: true },
    });

    return {
      ...arbitrator,
      averageRating: avgRating._avg.rating || 0,
      completedCases: arbitrator._count.caseAssignments,
      totalHearings: arbitrator._count.hearings,
      totalAwards: arbitrator._count.awards,
    };
  }

  // Update arbitrator profile
  async updateArbitratorProfile(arbitratorId: string, updateData: UpdateArbitratorProfileDto) {
    const arbitrator = await this.prisma.user.findUnique({
      where: { id: arbitratorId, role: 'ARBITRATOR' },
    });

    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    return this.prisma.user.update({
      where: { id: arbitratorId },
      data: updateData,
    });
  }

  // Get arbitrator availability
  async getAvailability(arbitratorId: string) {
    return this.prisma.arbitratorAvailability.findMany({
      where: { arbitratorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  // Set/Update arbitrator availability
  async setAvailability(arbitratorId: string, availabilityData: CreateAvailabilityDto[]) {
    // Delete existing availability
    await this.prisma.arbitratorAvailability.deleteMany({
      where: { arbitratorId },
    });

    // Create new availability records
    const newAvailability = availabilityData.map(slot => ({
      ...slot,
      arbitratorId,
    }));

    return this.prisma.arbitratorAvailability.createMany({
      data: newAvailability,
    });
  }

  // Get case assignments for arbitrator
  async getCaseAssignments(arbitratorId: string) {
    return this.prisma.caseAssignment.findMany({
      where: { arbitratorId },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            type: true,
            name: true,
            status: true,
            disputeDetails: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Respond to case assignment (accept/reject)
  async respondToAssignment(
    assignmentId: string,
    arbitratorId: string,
    response: CaseAssignmentResponseDto
  ) {
    const assignment = await this.prisma.caseAssignment.findUnique({
      where: { id: assignmentId },
      include: { case: true },
    });

    if (!assignment) {
      throw new NotFoundException('Case assignment not found');
    }

    if (assignment.arbitratorId !== arbitratorId) {
      throw new BadRequestException('You are not assigned to this case');
    }

    if (assignment.status !== 'PENDING') {
      throw new BadRequestException('Assignment has already been responded to');
    }

    // Update assignment status
    const updatedAssignment = await this.prisma.caseAssignment.update({
      where: { id: assignmentId },
      data: {
        status: response.status,
        notes: response.notes,
        respondedAt: new Date(),
      },
    });

    // Update case status based on response
    if (response.status === 'ACCEPTED') {
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: { status: 'ARBITRATOR_ASSIGNED' },
      });
    } else if (response.status === 'REJECTED') {
      await this.prisma.arbitration.update({
        where: { id: assignment.caseId },
        data: { status: 'ARBITRATOR_REJECTED' },
      });
      // TODO: Trigger re-assignment process
    }

    return updatedAssignment;
  }

  // Get hearings for arbitrator
  async getArbitratorHearings(arbitratorId: string) {
    return this.prisma.hearing.findMany({
      where: { arbitratorId },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            type: true,
            name: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // Schedule a hearing
  async scheduleHearing(arbitratorId: string, hearingData: ScheduleHearingDto) {
    return this.prisma.hearing.create({
      data: {
        ...hearingData,
        arbitratorId,
      },
    });
  }

  // Update hearing
  async updateHearing(
    hearingId: string,
    arbitratorId: string,
    updateData: Partial<ScheduleHearingDto>
  ) {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: hearingId },
    });

    if (!hearing) {
      throw new NotFoundException('Hearing not found');
    }

    if (hearing.arbitratorId !== arbitratorId) {
      throw new BadRequestException('You are not authorized to update this hearing');
    }

    return this.prisma.hearing.update({
      where: { id: hearingId },
      data: updateData,
    });
  }

  // Create award
  async createAward(arbitratorId: string, awardData: CreateAwardDto) {
    // Verify the arbitrator is assigned to this case
    const assignment = await this.prisma.caseAssignment.findFirst({
      where: {
        caseId: awardData.caseId,
        arbitratorId,
        status: 'ACCEPTED',
      },
    });

    if (!assignment) {
      throw new BadRequestException('You are not authorized to create an award for this case');
    }

    const award = await this.prisma.award.create({
      data: {
        ...awardData,
        arbitratorId,
      },
    });

    // Update case status to completed
    await this.prisma.arbitration.update({
      where: { id: awardData.caseId },
      data: { status: 'AWARD_ISSUED' },
    });

    // Update assignment status
    await this.prisma.caseAssignment.update({
      where: { id: assignment.id },
      data: { status: 'COMPLETED' },
    });

    return award;
  }

  // Get arbitrator dashboard statistics
  async getArbitratorDashboardStats(arbitratorId: string) {
    const [
      totalAssignments,
      pendingAssignments,
      activeHearings,
      completedCases,
      totalAwards,
      avgRating,
    ] = await Promise.all([
      this.prisma.caseAssignment.count({
        where: { arbitratorId },
      }),
      this.prisma.caseAssignment.count({
        where: { arbitratorId, status: 'PENDING' },
      }),
      this.prisma.hearing.count({
        where: { 
          arbitratorId,
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
      }),
      this.prisma.caseAssignment.count({
        where: { arbitratorId, status: 'COMPLETED' },
      }),
      this.prisma.award.count({
        where: { arbitratorId },
      }),
      this.prisma.feedback.aggregate({
        where: { arbitratorId },
        _avg: { rating: true },
      }),
    ]);

    return {
      totalAssignments,
      pendingAssignments,
      activeHearings,
      completedCases,
      totalAwards,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  // Get arbitrator feedback/ratings
  async getArbitratorFeedback(arbitratorId: string) {
    const feedback = await this.prisma.feedback.findMany({
      where: { arbitratorId },
      include: {
        case: {
          select: {
            caseNumber: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = await this.prisma.feedback.aggregate({
      where: { arbitratorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      feedback,
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating,
    };
  }

  // Assign arbitrator to case (used by admin)
  async assignArbitratorToCase(caseId: string, arbitratorId: string) {
    // Check if case exists and is not already assigned
    const existingCase = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      throw new NotFoundException('Case not found');
    }

    // Check if arbitrator exists and is active
    const arbitrator = await this.prisma.user.findUnique({
      where: { 
        id: arbitratorId,
        role: 'ARBITRATOR',
        arbitratorStatus: 'ACTIVE',
      },
    });

    if (!arbitrator) {
      throw new NotFoundException('Active arbitrator not found');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.caseAssignment.findFirst({
      where: { caseId, arbitratorId },
    });

    if (existingAssignment) {
      throw new BadRequestException('Arbitrator is already assigned to this case');
    }

    // Create assignment
    const assignment = await this.prisma.caseAssignment.create({
      data: {
        caseId,
        arbitratorId,
        status: 'PENDING',
      },
    });

    // Update case status
    await this.prisma.arbitration.update({
      where: { id: caseId },
      data: { status: 'ARBITRATOR_PENDING' },
    });

    return assignment;
  }
} 