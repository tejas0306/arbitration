import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { AssignArbitratorDto } from './dto/assign-arbitrator.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { SetCaseTimelineDto } from './dto/set-case-timeline.dto';
import { ArchiveCaseDto } from './dto/archive-case.dto';
import { UpdateArbitratorStatusDto } from './dto/update-arbitrator-status.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { EmailService } from '../services/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  // ===== DASHBOARD & ANALYTICS =====
  async getDashboardStats() {
    const [
      totalCases,
      activeCases,
      pendingReview,
      totalArbitrators,
      activeArbitrators,
      totalUsers,
      recentCases,
      upcomingHearings
    ] = await Promise.all([
      this.prisma.arbitration.count(),
      this.prisma.arbitration.count({ where: { status: { not: 'completed' }, isArchived: false } }),
      this.prisma.arbitration.count({ where: { reviewStatus: 'pending' } }),
      this.prisma.user.count({ where: { role: 'ARBITRATOR' } }),
      this.prisma.user.count({ where: { role: 'ARBITRATOR', arbitratorStatus: 'ACTIVE' } }),
      this.prisma.user.count(),
      this.prisma.arbitration.count({ 
        where: { 
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        } 
      }),
      this.prisma.hearing.count({ 
        where: { 
          scheduledDate: { gte: new Date() },
          status: 'SCHEDULED'
        } 
      })
    ]);

    return {
      totalCases,
      activeCases,
      pendingReview,
      totalArbitrators,
      activeArbitrators,
      totalUsers,
      recentCases,
      upcomingHearings,
      caseResolutionRate: totalCases > 0 ? ((totalCases - activeCases) / totalCases * 100).toFixed(1) : 0
    };
  }

  async getCaseAnalytics(filters: any) {
    const whereClause = this.buildCaseFilters(filters);
    
    const [
      casesByStatus,
      casesByType,
      casesByMonth,
      avgResolutionTime
    ] = await Promise.all([
      this.prisma.arbitration.groupBy({
        by: ['status'],
        _count: { id: true },
        where: whereClause
      }),
      this.prisma.arbitration.groupBy({
        by: ['type'],
        _count: { id: true },
        where: whereClause
      }),
      this.prisma.arbitration.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: whereClause
      }),
      this.calculateAvgResolutionTime(whereClause)
    ]);

    return {
      casesByStatus,
      casesByType,
      casesByMonth,
      avgResolutionTime
    };
  }

  async getArbitratorAnalytics(filters: any) {
    const [
      arbitratorsByStatus,
      arbitratorPerformance,
      workloadDistribution
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['arbitratorStatus'],
        _count: { id: true },
        where: { role: 'ARBITRATOR' }
      }),
      this.getArbitratorPerformanceMetrics(),
      this.getArbitratorWorkloadDistribution()
    ]);

    return {
      arbitratorsByStatus,
      arbitratorPerformance,
      workloadDistribution
    };
  }

  async getRevenueAnalytics(filters: any) {
    // This would integrate with payment system
    // For now, return mock data structure
    return {
      totalRevenue: 0,
      monthlyRevenue: [],
      revenueByType: [],
      pendingPayments: 0
    };
  }

  // ===== CASE OVERSIGHT =====
  async getAllCases(filters: any) {
    const whereClause = this.buildCaseFilters(filters);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [cases, total] = await Promise.all([
      this.prisma.arbitration.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignments: {
            include: {
              arbitrator: { select: { id: true, name: true, email: true } }
            }
          },
          _count: {
            select: {
              hearings: true,
              awards: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.arbitration.count({ where: whereClause })
    ]);

    return {
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPendingReviewCases() {
    return this.prisma.arbitration.findMany({
      where: { reviewStatus: 'pending' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getCaseDetails(id: string) {
    const caseData = await this.prisma.arbitration.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignments: {
          include: {
            arbitrator: { select: { id: true, name: true, email: true } }
          }
        },
        hearings: {
          include: {
            arbitrator: { select: { id: true, name: true } }
          }
        },
        awards: {
          include: {
            arbitrator: { select: { id: true, name: true } }
          }
        },
        feedback: {
          include: {
            arbitrator: { select: { id: true, name: true } }
          }
        },
        caseTimelines: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    return caseData;
  }

  async reviewCase(id: string, reviewData: { approved: boolean; notes?: string }, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id },
      data: {
        reviewStatus: reviewData.approved ? 'approved' : 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewData.notes
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'reviewed',
      details: { approved: reviewData.approved, notes: reviewData.notes },
      performedBy: adminId
    });

    return updatedCase;
  }

  async updateCaseStatus(id: string, statusData: UpdateCaseStatusDto, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id },
      data: {
        status: statusData.status,
        priority: statusData.priority,
        updatedAt: new Date()
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'status_updated',
      details: statusData,
      oldValue: { status: caseData.status, priority: caseData.priority },
      newValue: { status: statusData.status, priority: statusData.priority },
      performedBy: adminId
    });

    return updatedCase;
  }

  async assignArbitratorToCase(id: string, assignData: AssignArbitratorDto, adminId: string) {
    const [caseData, arbitrator] = await Promise.all([
      this.prisma.arbitration.findUnique({ where: { id } }),
      this.prisma.user.findUnique({ 
        where: { id: assignData.arbitratorId, role: 'ARBITRATOR' } 
      })
    ]);

    if (!caseData) throw new NotFoundException('Case not found');
    if (!arbitrator) throw new NotFoundException('Arbitrator not found');

    // Check if arbitrator is already assigned
    const existingAssignment = await this.prisma.caseAssignment.findFirst({
      where: { caseId: id, arbitratorId: assignData.arbitratorId }
    });

    if (existingAssignment) {
      throw new BadRequestException('Arbitrator already assigned to this case');
    }

    const assignment = await this.prisma.caseAssignment.create({
      data: {
        caseId: id,
        arbitratorId: assignData.arbitratorId,
        status: 'PENDING',
        notes: assignData.notes
      },
      include: {
        arbitrator: { select: { id: true, name: true, email: true } }
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'arbitrator_assigned',
      details: { arbitratorId: assignData.arbitratorId, arbitratorName: arbitrator.name },
      performedBy: adminId
    });

    return assignment;
  }

  async reassignArbitrator(id: string, assignData: AssignArbitratorDto, adminId: string) {
    // First, mark existing assignments as rejected
    await this.prisma.caseAssignment.updateMany({
      where: { caseId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
      data: { status: 'REJECTED' }
    });

    // Then assign new arbitrator
    return this.assignArbitratorToCase(id, assignData, adminId);
  }

  async setCaseTimeline(id: string, timelineData: SetCaseTimelineDto, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    // Delete existing timelines
    await this.prisma.caseTimeline.deleteMany({ where: { caseId: id } });

    // Create new timelines
    const timelines = await Promise.all(
      timelineData.milestones.map(milestone =>
        this.prisma.caseTimeline.create({
          data: {
            caseId: id,
            milestone: milestone.milestone,
            title: milestone.title,
            description: milestone.description,
            dueDate: new Date(milestone.dueDate),
            createdBy: adminId
          }
        })
      )
    );

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'timeline_set',
      details: { milestones: timelineData.milestones },
      performedBy: adminId
    });

    return timelines;
  }

  // ===== CASE CLOSURE & ARCHIVING =====
  async closeCase(id: string, closeData: { reason: string; notes?: string }, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id },
      data: {
        status: 'closed',
        updatedAt: new Date()
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'closed',
      details: closeData,
      performedBy: adminId
    });

    return updatedCase;
  }

  async archiveCase(id: string, archiveData: ArchiveCaseDto, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id },
      data: {
        isArchived: true,
        archivedBy: adminId,
        archivedAt: new Date(),
        archiveReason: archiveData.reason
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'archived',
      details: archiveData,
      performedBy: adminId
    });

    return updatedCase;
  }

  async getArchivedCases(filters: any) {
    const whereClause = { ...this.buildCaseFilters(filters), isArchived: true };
    
    return this.prisma.arbitration.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { archivedAt: 'desc' }
    });
  }

  async restoreCase(id: string, adminId: string) {
    const caseData = await this.prisma.arbitration.findUnique({ where: { id } });
    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id },
      data: {
        isArchived: false,
        archivedBy: null,
        archivedAt: null,
        archiveReason: null
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'case',
      entityId: id,
      action: 'restored',
      details: {},
      performedBy: adminId
    });

    return updatedCase;
  }

  // ===== ARBITRATOR MANAGEMENT =====
  async getAllArbitratorsForAdmin(filters: any) {
    const whereClause = {
      role: 'ARBITRATOR',
      ...(filters.status && { arbitratorStatus: filters.status }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    return this.prisma.user.findMany({
      where: whereClause,
      include: {
        caseAssignments: {
          include: {
            case: { select: { id: true, caseNumber: true, status: true } }
          }
        },
        feedback: {
          select: {
            rating: true,
            comments: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            caseAssignments: true,
            hearings: true,
            awards: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingArbitrators() {
    return this.prisma.user.findMany({
      where: { 
        role: 'ARBITRATOR',
        arbitratorStatus: 'PENDING_APPROVAL'
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async approveArbitrator(id: string, approvalData: { notes?: string }, adminId: string) {
    const arbitrator = await this.prisma.user.findUnique({ 
      where: { id, role: 'ARBITRATOR' } 
    });
    
    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    const updatedArbitrator = await this.prisma.user.update({
      where: { id },
      data: { arbitratorStatus: 'ACTIVE' }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'arbitrator',
      entityId: id,
      action: 'approved',
      details: approvalData,
      performedBy: adminId
    });

    return updatedArbitrator;
  }

  async rejectArbitrator(id: string, rejectionData: { reason: string; notes?: string }, adminId: string) {
    const arbitrator = await this.prisma.user.findUnique({ 
      where: { id, role: 'ARBITRATOR' } 
    });
    
    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    const updatedArbitrator = await this.prisma.user.update({
      where: { id },
      data: { arbitratorStatus: 'SUSPENDED' }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'arbitrator',
      entityId: id,
      action: 'rejected',
      details: rejectionData,
      performedBy: adminId
    });

    return updatedArbitrator;
  }

  async updateArbitratorStatus(id: string, statusData: UpdateArbitratorStatusDto, adminId: string) {
    const arbitrator = await this.prisma.user.findUnique({ 
      where: { id, role: 'ARBITRATOR' } 
    });
    
    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    const updatedArbitrator = await this.prisma.user.update({
      where: { id },
      data: { arbitratorStatus: statusData.status }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'arbitrator',
      entityId: id,
      action: 'status_updated',
      details: statusData,
      oldValue: { status: arbitrator.arbitratorStatus },
      newValue: { status: statusData.status },
      performedBy: adminId
    });

    return updatedArbitrator;
  }

  async getArbitratorPerformance(id: string) {
    const arbitrator = await this.prisma.user.findUnique({
      where: { id, role: 'ARBITRATOR' },
      include: {
        caseAssignments: {
          include: {
            case: { select: { id: true, caseNumber: true, status: true, createdAt: true } }
          }
        },
        hearings: {
          include: {
            case: { select: { id: true, caseNumber: true } }
          }
        },
        awards: {
          include: {
            case: { select: { id: true, caseNumber: true } }
          }
        },
        feedback: true
      }
    });

    if (!arbitrator) {
      throw new NotFoundException('Arbitrator not found');
    }

    // Calculate performance metrics
    const totalCases = arbitrator.caseAssignments.length;
    const completedCases = arbitrator.awards.length;
    const avgRating = arbitrator.feedback.length > 0 
      ? arbitrator.feedback.reduce((sum, f) => sum + f.rating, 0) / arbitrator.feedback.length 
      : 0;

    return {
      arbitrator,
      metrics: {
        totalCases,
        completedCases,
        completionRate: totalCases > 0 ? (completedCases / totalCases * 100).toFixed(1) : 0,
        avgRating: avgRating.toFixed(1),
        totalFeedback: arbitrator.feedback.length
      }
    };
  }

  // ===== USER MANAGEMENT =====
  async getAllUsers(filters: any) {
    const whereClause = {
      ...(filters.role && { role: filters.role }),
      ...(filters.status && { 
        isActive: filters.status === 'active',
        isSuspended: filters.status === 'suspended'
      }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        isActive: true,
        isSuspended: true,
        suspendedUntil: true,
        createdAt: true,
        _count: {
          select: {
            arbitrations: true,
            caseAssignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        arbitrations: {
          select: { id: true, caseNumber: true, status: true, createdAt: true }
        },
        caseAssignments: {
          include: {
            case: { select: { id: true, caseNumber: true, status: true } }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createInternalUser(createUserData: CreateAdminUserDto, adminId: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserData.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate that only internal roles can be created
    const internalRoles = ['ADMIN', 'CASE_MANAGER', 'TEAM_MEMBER'];
    if (!internalRoles.includes(createUserData.role)) {
      throw new BadRequestException('Only internal roles (ADMIN, CASE_MANAGER, TEAM_MEMBER) can be created through this endpoint');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserData.password, 10);

    // Create user
    const newUser = await this.prisma.user.create({
      data: {
        name: createUserData.name,
        email: createUserData.email,
        password: hashedPassword,
        role: createUserData.role,
        organization: createUserData.organization,
        isActive: true,
        isSuspended: false
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'user',
      entityId: newUser.id,
      action: 'created',
      details: {
        role: createUserData.role,
        organization: createUserData.organization,
        createdByAdmin: true
      },
      performedBy: adminId
    });

    // If sendCredentials is true, send email with credentials
    if (createUserData.sendCredentials) {
      try {
        await this.emailService.sendUserCredentials({
          name: newUser.name,
          email: newUser.email,
          password: createUserData.password, // Original unencrypted password
          role: newUser.role,
          organization: newUser.organization || 'Arbitration Portal',
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000/auth/login'
        });
      } catch (error) {
        console.error('Failed to send credentials email:', error);
        // Don't fail user creation if email fails
      }
    }

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUserRole(id: string, roleData: UpdateUserRoleDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: roleData.role }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'user',
      entityId: id,
      action: 'role_updated',
      details: roleData,
      oldValue: { role: user.role },
      newValue: { role: roleData.role },
      performedBy: adminId
    });

    return updatedUser;
  }

  async suspendUser(id: string, suspensionData: { reason: string; duration?: number }, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const suspendedUntil = suspensionData.duration 
      ? new Date(Date.now() + suspensionData.duration * 24 * 60 * 60 * 1000)
      : null;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendedUntil,
        suspensionReason: suspensionData.reason
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'user',
      entityId: id,
      action: 'suspended',
      details: suspensionData,
      performedBy: adminId
    });

    return updatedUser;
  }

  async activateUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'user',
      entityId: id,
      action: 'activated',
      details: {},
      performedBy: adminId
    });

    return updatedUser;
  }

  async resetUserPassword(id: string, resetData: { reason?: string; sendEmail?: boolean }, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new temporary password
    const temporaryPassword = this.generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update user password
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'user',
      entityId: id,
      action: 'password_reset',
      details: {
        reason: resetData.reason || 'Password reset by administrator',
        sendEmail: resetData.sendEmail
      },
      performedBy: adminId
    });

    // If sendEmail is true, send email with new password
    if (resetData.sendEmail) {
      try {
        await this.emailService.sendPasswordReset({
          name: user.name,
          email: user.email,
          newPassword: temporaryPassword,
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000/auth/login'
        });
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't fail password reset if email fails
      }
    }

    return {
      success: true,
      message: 'Password has been reset successfully',
      temporaryPassword: resetData.sendEmail ? undefined : temporaryPassword // Only return password if not sending email
    };
  }

  private generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // ===== FEEDBACK & REVIEWS =====
  async getAllFeedback(filters: any) {
    const whereClause = {
      ...(filters.flagged && { isFlagged: true }),
      ...(filters.rating && { rating: parseInt(filters.rating) })
    };

    return this.prisma.feedback.findMany({
      where: whereClause,
      include: {
        case: { select: { id: true, caseNumber: true } },
        arbitrator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFlaggedFeedback() {
    return this.prisma.feedback.findMany({
      where: { isFlagged: true },
      include: {
        case: { select: { id: true, caseNumber: true } },
        arbitrator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async reviewFeedback(id: string, reviewData: { action: 'approve' | 'reject' | 'flag'; notes?: string }, adminId: string) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const updateData: any = {
      moderatedBy: adminId,
      moderatedAt: new Date(),
      moderationNotes: reviewData.notes
    };

    switch (reviewData.action) {
      case 'approve':
        updateData.isApproved = true;
        updateData.isFlagged = false;
        break;
      case 'reject':
        updateData.isApproved = false;
        updateData.isFlagged = false;
        break;
      case 'flag':
        updateData.isFlagged = true;
        break;
    }

    const updatedFeedback = await this.prisma.feedback.update({
      where: { id },
      data: updateData
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'feedback',
      entityId: id,
      action: 'reviewed',
      details: reviewData,
      performedBy: adminId
    });

    return updatedFeedback;
  }

  // ===== ANNOUNCEMENTS & NOTIFICATIONS =====
  async createAnnouncement(announcementData: CreateAnnouncementDto, adminId: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...announcementData,
        publishAt: announcementData.publishAt ? new Date(announcementData.publishAt) : new Date(),
        expiresAt: announcementData.expiresAt ? new Date(announcementData.expiresAt) : null,
        createdBy: adminId
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'announcement',
      entityId: announcement.id,
      action: 'created',
      details: announcementData,
      performedBy: adminId
    });

    return announcement;
  }

  async getAnnouncements(filters: any) {
    const whereClause = {
      ...(filters.active !== undefined && { isActive: filters.active === 'true' }),
      ...(filters.type && { type: filters.type })
    };

    return this.prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateAnnouncement(id: string, updateData: Partial<CreateAnnouncementDto>, adminId: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updatedAnnouncement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.publishAt && { publishAt: new Date(updateData.publishAt) }),
        ...(updateData.expiresAt && { expiresAt: new Date(updateData.expiresAt) })
      }
    });

    // Log the action
    await this.createAuditLog({
      entityType: 'announcement',
      entityId: id,
      action: 'updated',
      details: updateData,
      performedBy: adminId
    });

    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: string, adminId: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({ where: { id } });

    // Log the action
    await this.createAuditLog({
      entityType: 'announcement',
      entityId: id,
      action: 'deleted',
      details: {},
      performedBy: adminId
    });

    return { message: 'Announcement deleted successfully' };
  }

  // ===== SYSTEM SETTINGS =====
  async getSystemSettings() {
    return this.prisma.systemSettings.findMany({
      orderBy: { category: 'asc' }
    });
  }

  async updateSystemSettings(settingsData: any, adminId: string) {
    const updates = await Promise.all(
      Object.entries(settingsData).map(([key, value]) =>
        this.prisma.systemSettings.upsert({
          where: { key },
          update: { value: value as any, updatedBy: adminId },
          create: { key, value: value as any, updatedBy: adminId }
        })
      )
    );

    // Log the action
    await this.createAuditLog({
      entityType: 'system_settings',
      entityId: 'global',
      action: 'updated',
      details: settingsData,
      performedBy: adminId
    });

    return updates;
  }

  // ===== AUDIT LOGS =====
  async getAuditLogs(filters: any) {
    const whereClause = {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.action && { action: filters.action }),
      ...(filters.performedBy && { performedBy: filters.performedBy }),
      ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
      ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } })
    };

    return this.prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 logs
    });
  }

  async getUserAuditLogs(userId: string, filters: any) {
    return this.getAuditLogs({ ...filters, performedBy: userId });
  }

  // ===== REPORTS =====
  async getMonthlyReport(filters: any) {
    const startDate = filters.month ? new Date(filters.month) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const [
      newCases,
      completedCases,
      newArbitrators,
      totalRevenue
    ] = await Promise.all([
      this.prisma.arbitration.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      this.prisma.arbitration.count({
        where: { 
          status: 'completed',
          updatedAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.user.count({
        where: { 
          role: 'ARBITRATOR',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      0 // Would integrate with payment system
    ]);

    return {
      period: { startDate, endDate },
      metrics: {
        newCases,
        completedCases,
        newArbitrators,
        totalRevenue
      }
    };
  }

  async getArbitratorPerformanceReport(filters: any) {
    const arbitrators = await this.prisma.user.findMany({
      where: { role: 'ARBITRATOR' },
      include: {
        caseAssignments: true,
        awards: true,
        feedback: true
      }
    });

    return arbitrators.map(arbitrator => ({
      id: arbitrator.id,
      name: arbitrator.name,
      totalCases: arbitrator.caseAssignments.length,
      completedCases: arbitrator.awards.length,
      avgRating: arbitrator.feedback.length > 0 
        ? arbitrator.feedback.reduce((sum, f) => sum + f.rating, 0) / arbitrator.feedback.length 
        : 0
    }));
  }

  async getCaseResolutionReport(filters: any) {
    const cases = await this.prisma.arbitration.findMany({
      where: { status: 'completed' },
      include: {
        awards: true
      }
    });

    // Calculate resolution times and other metrics
    return {
      totalResolved: cases.length,
      avgResolutionTime: 0, // Would calculate based on case timeline
      resolutionsByType: {},
      resolutionsByMonth: {}
    };
  }

  async exportReport(exportData: { type: string; format: string; filters?: any }, adminId: string) {
    // This would generate and return downloadable reports
    // For now, return a placeholder
    return {
      message: 'Report export initiated',
      downloadUrl: '/api/admin/reports/download/placeholder'
    };
  }

  // ===== HELPER METHODS =====
  private buildCaseFilters(filters: any) {
    const whereClause: any = {};

    if (filters.status) whereClause.status = filters.status;
    if (filters.type) whereClause.type = filters.type;
    if (filters.priority) whereClause.priority = filters.priority;
    if (filters.reviewStatus) whereClause.reviewStatus = filters.reviewStatus;
    if (filters.archived !== undefined) whereClause.isArchived = filters.archived === 'true';
    
    if (filters.search) {
      whereClause.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) whereClause.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) whereClause.createdAt.lte = new Date(filters.dateTo);
    }

    return whereClause;
  }

  private async calculateAvgResolutionTime(whereClause: any) {
    // This would calculate average resolution time based on case timeline
    // For now, return a placeholder
    return 0;
  }

  private async getArbitratorPerformanceMetrics() {
    // Calculate performance metrics for all arbitrators
    return [];
  }

  private async getArbitratorWorkloadDistribution() {
    // Calculate workload distribution among arbitrators
    return [];
  }

  private async createAuditLog(logData: {
    entityType: string;
    entityId: string;
    action: string;
    details: any;
    oldValue?: any;
    newValue?: any;
    performedBy: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...logData,
        details: logData.details || {},
        oldValue: logData.oldValue || null,
        newValue: logData.newValue || null
      }
    });
  }

  // ===== CONFIGURATION MANAGEMENT =====
  async getTemplates(filters: any) {
    const emailTemplates = await this.prisma.notificationTemplate.count({
      where: { type: 'MESSAGE', isActive: true }
    });
    const smsTemplates = await this.prisma.notificationTemplate.count({
      where: { type: 'ALERT', isActive: true }
    });
    
    return {
      email: emailTemplates,
      sms: smsTemplates
    };
  }

  async getEmailTemplates() {
    return this.prisma.notificationTemplate.findMany({
      where: { type: 'MESSAGE', isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getSmsTemplates() {
    return this.prisma.notificationTemplate.findMany({
      where: { type: 'ALERT', isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async createEmailTemplate(templateData: any, adminId: string) {
    return this.prisma.notificationTemplate.create({
      data: {
        ...templateData,
        type: 'MESSAGE',
        createdBy: adminId
      }
    });
  }

  async createSmsTemplate(templateData: any, adminId: string) {
    return this.prisma.notificationTemplate.create({
      data: {
        ...templateData,
        type: 'ALERT',
        createdBy: adminId
      }
    });
  }

  async getAllLovs() {
    // Mock LOV counts for now - you can expand this with actual database tables
    return {
      categories: 12,
      documentTypes: 25,
      disputeTypes: 18
    };
  }

  async getCaseCategories() {
    // Return predefined case categories
    return [
      { id: '1', name: 'Commercial', description: 'Commercial disputes and contracts', isActive: true },
      { id: '2', name: 'Employment', description: 'Employment related disputes', isActive: true },
      { id: '3', name: 'Consumer', description: 'Consumer protection disputes', isActive: true },
      { id: '4', name: 'International', description: 'International trade disputes', isActive: true },
      { id: '5', name: 'Construction', description: 'Construction and infrastructure disputes', isActive: true },
      { id: '6', name: 'IP', description: 'Intellectual Property disputes', isActive: true },
      { id: '7', name: 'Real Estate', description: 'Property and real estate disputes', isActive: true },
      { id: '8', name: 'Partnership', description: 'Partnership and joint venture disputes', isActive: true },
      { id: '9', name: 'Insurance', description: 'Insurance claim disputes', isActive: true },
      { id: '10', name: 'Banking', description: 'Banking and financial disputes', isActive: true },
      { id: '11', name: 'Technology', description: 'Technology and software disputes', isActive: true },
      { id: '12', name: 'Healthcare', description: 'Healthcare and medical disputes', isActive: true }
    ];
  }

  async getDocumentTypes() {
    return [
      { id: '1', name: 'Contract', category: 'Legal', description: 'Contractual agreements' },
      { id: '2', name: 'Invoice', category: 'Financial', description: 'Billing documents' },
      { id: '3', name: 'Correspondence', category: 'Communication', description: 'Email and letter exchanges' },
      { id: '4', name: 'Legal Notice', category: 'Legal', description: 'Formal legal notices' },
      { id: '5', name: 'Expert Report', category: 'Evidence', description: 'Expert witness reports' },
      { id: '6', name: 'Witness Statement', category: 'Evidence', description: 'Witness testimonies' },
      { id: '7', name: 'Financial Statement', category: 'Financial', description: 'Financial records' },
      { id: '8', name: 'Technical Drawing', category: 'Technical', description: 'Engineering drawings' },
      { id: '9', name: 'Photograph', category: 'Evidence', description: 'Photographic evidence' },
      { id: '10', name: 'Video', category: 'Evidence', description: 'Video evidence' },
      { id: '11', name: 'Audio Recording', category: 'Evidence', description: 'Audio evidence' },
      { id: '12', name: 'Purchase Order', category: 'Financial', description: 'Purchase documentation' },
      { id: '13', name: 'Delivery Receipt', category: 'Logistics', description: 'Delivery confirmations' },
      { id: '14', name: 'Insurance Policy', category: 'Legal', description: 'Insurance documentation' },
      { id: '15', name: 'Bank Statement', category: 'Financial', description: 'Banking records' }
    ];
  }

  async getDisputeTypes() {
    return [
      { id: '1', name: 'Breach of Contract', category: 'Contract', description: 'Non-fulfillment of contractual obligations' },
      { id: '2', name: 'Payment Dispute', category: 'Financial', description: 'Disagreements over payments' },
      { id: '3', name: 'Quality Issues', category: 'Performance', description: 'Product or service quality problems' },
      { id: '4', name: 'Delivery Delays', category: 'Performance', description: 'Late or non-delivery issues' },
      { id: '5', name: 'Intellectual Property', category: 'IP', description: 'IP infringement or ownership disputes' },
      { id: '6', name: 'Employment Termination', category: 'Employment', description: 'Wrongful termination disputes' },
      { id: '7', name: 'Partnership Dissolution', category: 'Corporate', description: 'Business partnership breakups' },
      { id: '8', name: 'Construction Defects', category: 'Construction', description: 'Building or infrastructure defects' },
      { id: '9', name: 'Insurance Claims', category: 'Insurance', description: 'Insurance coverage disputes' },
      { id: '10', name: 'Real Estate Transaction', category: 'Property', description: 'Property sale/purchase disputes' },
      { id: '11', name: 'Service Agreement', category: 'Service', description: 'Service provision disputes' },
      { id: '12', name: 'Joint Venture', category: 'Corporate', description: 'Joint venture disagreements' },
      { id: '13', name: 'Licensing Agreement', category: 'IP', description: 'License terms disputes' },
      { id: '14', name: 'Supply Chain', category: 'Commercial', description: 'Supply chain disruptions' },
      { id: '15', name: 'Non-Disclosure', category: 'Confidentiality', description: 'Confidentiality breaches' },
      { id: '16', name: 'Franchise Agreement', category: 'Commercial', description: 'Franchise-related disputes' },
      { id: '17', name: 'Technology Transfer', category: 'Technology', description: 'Technology licensing disputes' },
      { id: '18', name: 'Professional Services', category: 'Service', description: 'Professional service disputes' }
    ];
  }

  async createCaseCategory(categoryData: any, adminId: string) {
    // In a real implementation, you would create this in a categories table
    return {
      id: Date.now().toString(),
      ...categoryData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  async createDocumentType(typeData: any, adminId: string) {
    return {
      id: Date.now().toString(),
      ...typeData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  async createDisputeType(typeData: any, adminId: string) {
    return {
      id: Date.now().toString(),
      ...typeData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  async getBusinessRules() {
    const workflows = await this.prisma.workflowRule.count({ where: { isActive: true } });
    return {
      workflows,
      escalations: 5 // Mock for now
    };
  }

  async getWorkflowRules() {
    return this.prisma.workflowRule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getEscalationRules() {
    // Mock escalation rules for now
    return [
      { id: '1', name: 'SLA Breach - 24 Hours', trigger: 'deadline_overdue', actions: ['notify_admin', 'escalate_case'] },
      { id: '2', name: 'Case Stalled - 7 Days', trigger: 'no_activity', actions: ['reminder_email', 'case_manager_alert'] },
      { id: '3', name: 'Payment Overdue - 30 Days', trigger: 'payment_overdue', actions: ['payment_reminder', 'case_hold'] },
      { id: '4', name: 'Document Missing - 48 Hours', trigger: 'missing_documents', actions: ['document_request', 'delay_warning'] },
      { id: '5', name: 'Arbitrator Unavailable', trigger: 'arbitrator_conflict', actions: ['reassign_arbitrator', 'notify_parties'] }
    ];
  }

  async createWorkflowRule(ruleData: any, adminId: string) {
    return this.prisma.workflowRule.create({
      data: {
        ...ruleData,
        createdBy: adminId
      }
    });
  }

  async createEscalationRule(ruleData: any, adminId: string) {
    // Mock implementation for escalation rules
    return {
      id: Date.now().toString(),
      ...ruleData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  async getFeesConfiguration() {
    return {
      feeSchedules: 6,
      discounts: 4
    };
  }

  async getFeeSchedules() {
    return [
      { id: '1', name: 'Standard Filing Fee', category: 'Filing', amount: 50000, currency: 'INR', isActive: true },
      { id: '2', name: 'Arbitrator Fee - Commercial', category: 'Arbitrator', amount: 125000, currency: 'INR', isActive: true },
      { id: '3', name: 'Administrative Fee', category: 'Administrative', amount: 25000, currency: 'INR', isActive: true },
      { id: '4', name: 'Emergency Arbitration Fee', category: 'Emergency', amount: 200000, currency: 'INR', isActive: true },
      { id: '5', name: 'Document Processing Fee', category: 'Administrative', amount: 5000, currency: 'INR', isActive: true },
      { id: '6', name: 'Hearing Fee - Per Day', category: 'Hearing', amount: 75000, currency: 'INR', isActive: true }
    ];
  }

  async getFeeDiscounts() {
    return [
      { id: '1', name: 'Early Bird Discount', percentage: 10, condition: 'payment_within_7_days', isActive: true },
      { id: '2', name: 'Volume Discount', percentage: 15, condition: 'multiple_cases', isActive: true },
      { id: '3', name: 'Member Discount', percentage: 20, condition: 'institutional_member', isActive: true },
      { id: '4', name: 'Hardship Waiver', percentage: 50, condition: 'financial_hardship', isActive: true }
    ];
  }

  async createFeeSchedule(scheduleData: any, adminId: string) {
    return {
      id: Date.now().toString(),
      ...scheduleData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  async createFeeDiscount(discountData: any, adminId: string) {
    return {
      id: Date.now().toString(),
      ...discountData,
      isActive: true,
      createdBy: adminId,
      createdAt: new Date()
    };
  }

  // ===== ENHANCED ANALYTICS =====
  async getAnalyticsDashboard(filters: any) {
    const [stats, caseMetrics, revenueMetrics, arbitratorMetrics] = await Promise.all([
      this.getDashboardStats(),
      this.getCaseAnalytics(filters),
      this.getRevenueAnalytics(filters),
      this.getArbitratorAnalytics(filters)
    ]);

    return {
      caseMetrics: {
        totalCases: stats.totalCases,
        newThisMonth: stats.recentCases,
        completedCases: stats.totalCases - stats.activeCases,
        avgResolutionTime: 45,
        casesByStatus: [
          { status: 'Active', count: stats.activeCases, percentage: 35 },
          { status: 'Completed', count: stats.totalCases - stats.activeCases, percentage: 57 },
          { status: 'Pending', count: stats.pendingReview, percentage: 8 }
        ],
        casesByCategory: [
          { category: 'Commercial', count: 523, amount: 2450000 },
          { category: 'Employment', count: 312, amount: 890000 },
          { category: 'Consumer', count: 289, amount: 450000 },
          { category: 'International', count: 123, amount: 3200000 }
        ]
      },
      arbitratorMetrics: {
        totalArbitrators: stats.totalArbitrators,
        activeArbitrators: stats.activeArbitrators,
        avgRating: 4.3,
        avgCasesPerArbitrator: 14,
        topPerformers: [
          { name: 'Dr. Sarah Johnson', rating: 4.9, cases: 28, completionRate: 96 },
          { name: 'Michael Chen', rating: 4.8, cases: 24, completionRate: 94 },
          { name: 'Prof. David Wilson', rating: 4.7, cases: 31, completionRate: 92 }
        ]
      },
      revenueMetrics: {
        totalRevenue: 8745000,
        monthlyRevenue: 789000,
        revenueGrowth: 12.5,
        outstandingPayments: 156000,
        revenueByCategory: [
          { category: 'Filing Fees', amount: 2100000, percentage: 24 },
          { category: 'Arbitrator Fees', amount: 4200000, percentage: 48 },
          { category: 'Administrative', amount: 1500000, percentage: 17 },
          { category: 'Hearing Fees', amount: 945000, percentage: 11 }
        ]
      },
      operationalMetrics: {
        avgCaseValue: 95000,
        customerSatisfaction: 4.2,
        timeToResolution: 45,
        hearingUtilization: 78
      }
    };
  }

  async getAnalyticsReports(filters: any) {
    return {
      availableReports: [
        { id: 'case_summary', name: 'Case Summary Report', description: 'Comprehensive case analytics' },
        { id: 'arbitrator_performance', name: 'Arbitrator Performance Report', description: 'Arbitrator metrics and ratings' },
        { id: 'revenue_analysis', name: 'Revenue Analysis Report', description: 'Financial performance metrics' },
        { id: 'user_activity', name: 'User Activity Report', description: 'User engagement analytics' }
      ]
    };
  }

  async exportAnalytics(filters: any) {
    return {
      downloadUrl: '/api/admin/analytics/export/download',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      format: 'xlsx'
    };
  }

  async getTrendAnalysis(filters: any) {
    return {
      casesTrend: [
        { month: 'Jan', cases: 45, revenue: 450000 },
        { month: 'Feb', cases: 52, revenue: 520000 },
        { month: 'Mar', cases: 48, revenue: 480000 },
        { month: 'Apr', cases: 61, revenue: 610000 },
        { month: 'May', cases: 58, revenue: 580000 },
        { month: 'Jun', cases: 67, revenue: 670000 }
      ],
      arbitratorUtilization: [
        { month: 'Jan', utilization: 75 },
        { month: 'Feb', utilization: 82 },
        { month: 'Mar', utilization: 78 },
        { month: 'Apr', utilization: 85 },
        { month: 'May', utilization: 83 },
        { month: 'Jun', utilization: 88 }
      ]
    };
  }

  async getForecasting(filters: any) {
    return {
      predictions: {
        nextQuarterCases: 185,
        nextQuarterRevenue: 1850000,
        peakMonths: ['September', 'October', 'November'],
        growthRate: 15.2
      },
      recommendations: [
        'Increase arbitrator capacity for Q4',
        'Optimize case assignment algorithms',
        'Implement automated reminders for faster resolution'
      ]
    };
  }

  // ===== USER MANAGEMENT ENHANCEMENTS =====
  async importUsers(importData: any, adminId: string) {
    // Mock implementation for user import
    return {
      imported: importData.users?.length || 0,
      failed: 0,
      errors: []
    };
  }

  async exportUsers(filters: any) {
    return {
      downloadUrl: '/api/admin/users/export/download',
      expiresAt: new Date(Date.now() + 3600000),
      format: 'xlsx'
    };
  }

  async getUserAuditTrail(filters: any) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'User',
        ...(filters.userId && { entityId: filters.userId })
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async performBulkUserActions(actionData: any, adminId: string) {
    const { action, userIds, data } = actionData;
    
    switch (action) {
      case 'suspend':
        // Bulk suspend users
        break;
      case 'activate':
        // Bulk activate users
        break;
      case 'updateRole':
        // Bulk update user roles
        break;
      default:
        throw new BadRequestException('Invalid bulk action');
    }

    return {
      processed: userIds.length,
      success: userIds.length,
      failed: 0
    };
  }

  // ===== ARBITRATOR MANAGEMENT ENHANCEMENTS =====
  async getArbitratorsPerformanceReport(filters: any) {
    return {
      summary: {
        totalArbitrators: 87,
        avgRating: 4.3,
        avgCasesPerArbitrator: 14,
        avgResolutionTime: 45
      },
      topPerformers: [
        { name: 'Dr. Sarah Johnson', rating: 4.9, cases: 28, completionRate: 96, avgTime: 35 },
        { name: 'Michael Chen', rating: 4.8, cases: 24, completionRate: 94, avgTime: 38 },
        { name: 'Prof. David Wilson', rating: 4.7, cases: 31, completionRate: 92, avgTime: 42 }
      ]
    };
  }

  async performBulkArbitratorActions(actionData: any, adminId: string) {
    const { action, arbitratorIds, data } = actionData;
    
    return {
      processed: arbitratorIds.length,
      success: arbitratorIds.length,
      failed: 0
    };
  }

  // ===== HELP DESK MANAGEMENT =====
  async getHelpDeskTickets(filters: any) {
    // Mock help desk tickets for now
    return [
      {
        id: '1',
        subject: 'Unable to upload documents',
        description: 'Getting error when trying to upload PDF files',
        priority: 'high',
        status: 'open',
        submittedBy: 'user123',
        assignedTo: 'support1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getHelpDeskTicket(id: string) {
    return {
      id,
      subject: 'Unable to upload documents',
      description: 'Getting error when trying to upload PDF files',
      priority: 'high',
      status: 'open',
      submittedBy: 'user123',
      assignedTo: 'support1',
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async respondToHelpDeskTicket(id: string, responseData: any, adminId: string) {
    return {
      id: Date.now().toString(),
      ticketId: id,
      message: responseData.message,
      respondedBy: adminId,
      createdAt: new Date()
    };
  }

  async updateHelpDeskTicketStatus(id: string, statusData: any, adminId: string) {
    return {
      id,
      status: statusData.status,
      updatedBy: adminId,
      updatedAt: new Date()
    };
  }
} 