import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { UpdateWorkflowDto, WorkflowStatus } from './dto/update-workflow.dto';
import { ScheduleReminderDto } from './dto/schedule-reminder.dto';
import { AssignTeamMemberDto } from './dto/assign-team-member.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';

@Injectable()
export class CaseManagerService {
  constructor(private prisma: PrismaService) {}

  // ===== DASHBOARD & WORKFLOW OVERVIEW =====
  async getDashboard(managerId: string) {
    const [
      totalManagedCases,
      pendingWorkflow,
      inProgress,
      overdueDeadlines,
      unreadNotifications,
      teamPerformance,
      todaySchedule,
      slaCompliance,
    ] = await Promise.all([
      // Total managed cases
      this.prisma.arbitration.count({
        where: { assignedManagerId: managerId },
      }),

      // Pending workflow cases
      this.prisma.arbitration.count({
        where: {
          assignedManagerId: managerId,
          workflowStatus: 'PENDING',
        },
      }),

      // In progress cases
      this.prisma.arbitration.count({
        where: {
          assignedManagerId: managerId,
          workflowStatus: 'IN_PROGRESS',
        },
      }),

      // Overdue deadlines
      this.prisma.caseTimeline.count({
        where: {
          dueDate: { lt: new Date() },
          isCompleted: false,
          case: { assignedManagerId: managerId },
        },
      }),

      // Unread notifications
      this.prisma.notification.count({
        where: {
          recipientId: managerId,
          status: 'UNREAD',
        },
      }),

      // Team performance metrics
      this.getTeamPerformanceOverview(managerId),

      // Today's schedule
      this.getTodaySchedule(managerId),

      // SLA compliance
      this.getSLAComplianceOverview(managerId),
    ]);

    return {
      stats: {
        totalManagedCases,
        pendingWorkflow,
        inProgress,
        overdueDeadlines,
        unreadNotifications,
      },
      teamPerformance,
      todaySchedule,
      slaCompliance,
      quickActions: [
        { name: 'Create Notification', url: '/case-manager/notifications/create' },
        { name: 'Schedule Hearing', url: '/case-manager/schedule/hearing' },
        { name: 'Bulk Operations', url: '/case-manager/bulk' },
        { name: 'QA Review', url: '/case-manager/qa' },
      ],
    };
  }

  async getWorkflowOverview(filters: any = {}) {
    const where: any = {};

    if (filters.managerId) {
      where.assignedManagerId = filters.managerId;
    }

    if (filters.status) {
      where.workflowStatus = filters.status;
    }

    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    const [cases, statusCounts] = await Promise.all([
      this.prisma.arbitration.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          caseTimelines: { where: { isCompleted: false } },
          assignments: { include: { arbitrator: { select: { name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: filters.limit || 20,
      }),

      // Status distribution
      this.prisma.arbitration.groupBy({
        by: ['workflowStatus'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      cases,
      statusDistribution: statusCounts.reduce((acc, item) => {
        acc[item.workflowStatus] = item._count.id;
        return acc;
      }, {}),
    };
  }

  async getWorkloadDistribution() {
    const managers = await this.prisma.user.findMany({
      where: { role: 'CASE_MANAGER' },
      select: {
        id: true,
        name: true,
        managedCases: true,
      },
    });

    const workloadData = await Promise.all(
      managers.map(async (manager) => {
        const [totalCases, activeCases, pendingTasks] = await Promise.all([
          this.prisma.arbitration.count({
            where: { assignedManagerId: manager.id },
          }),

          this.prisma.arbitration.count({
            where: {
              assignedManagerId: manager.id,
              workflowStatus: { in: ['IN_PROGRESS', 'PENDING'] },
            },
          }),

          this.prisma.caseTimeline.count({
            where: {
              case: { assignedManagerId: manager.id },
              isCompleted: false,
              dueDate: { gte: new Date() },
            },
          }),
        ]);

        return {
          manager: { id: manager.id, name: manager.name },
          totalCases,
          activeCases,
          pendingTasks,
          utilization: totalCases > 0 ? (activeCases / totalCases) * 100 : 0,
        };
      })
    );

    return workloadData;
  }

  // ===== CASE WORKFLOW MANAGEMENT =====
  async getMyCases(managerId: string, filters: any = {}) {
    const where: any = { assignedManagerId: managerId };

    if (filters.status) {
      where.workflowStatus = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    const cases = await this.prisma.arbitration.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        caseTimelines: { where: { isCompleted: false } },
        caseNotes: { orderBy: { createdAt: 'desc' }, take: 3 },
        assignments: { include: { arbitrator: { select: { name: true } } } },
      },
      orderBy: filters.sortBy === 'priority' ? { priority: 'desc' } : { updatedAt: 'desc' },
    });

    return cases;
  }

  async getWorkflowPendingCases(filters: any = {}) {
    const where: any = {
      workflowStatus: { in: ['PENDING', 'BLOCKED'] },
    };

    if (filters.managerId) {
      where.assignedManagerId = filters.managerId;
    }

    const cases = await this.prisma.arbitration.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        caseTimelines: { where: { isCompleted: false } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return cases;
  }

  async updateCaseWorkflow(caseId: string, workflowData: UpdateWorkflowDto, managerId: string) {
    const caseRecord = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    const updateData: any = {};

    if (workflowData.workflowStatus) {
      updateData.workflowStatus = workflowData.workflowStatus;
    }

    if (workflowData.assignedManagerId) {
      updateData.assignedManagerId = workflowData.assignedManagerId;
    }

    if (workflowData.estimatedCompletion) {
      updateData.estimatedCompletion = new Date(workflowData.estimatedCompletion);
    }

    if (workflowData.slaDeadline) {
      updateData.slaDeadline = new Date(workflowData.slaDeadline);
    }

    if (workflowData.priority) {
      updateData.priority = workflowData.priority;
    }

    const updatedCase = await this.prisma.arbitration.update({
      where: { id: caseId },
      data: updateData,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'case',
        entityId: caseId,
        action: 'workflow_updated',
        details: {
          changes: JSON.parse(JSON.stringify(workflowData)),
          notes: workflowData.notes,
        },
        performedBy: managerId,
      },
    });

    // Send notification if workflow status changed
    if (workflowData.workflowStatus && caseRecord.userId) {
      await this.createNotification(
        {
          title: 'Case Workflow Updated',
          message: `Your case ${caseRecord.caseNumber} workflow status has been updated to ${workflowData.workflowStatus}`,
          type: NotificationType.SYSTEM,
          recipientId: caseRecord.userId,
          caseId,
        },
        managerId
      );
    }

    return updatedCase;
  }

  async assignTeamMember(caseId: string, assignData: AssignTeamMemberDto, managerId: string) {
    const caseRecord = await this.prisma.arbitration.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    // Create case note for assignment
    await this.createCaseNote(
      caseId,
      {
        title: 'Team Member Assignment',
        content: `Team member(s) assigned to case. Notes: ${assignData.notes || 'None'}`,
        isPrivate: true,
        tags: ['assignment', 'team'],
      },
      managerId
    );

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'case',
        entityId: caseId,
        action: 'team_assigned',
        details: JSON.parse(JSON.stringify(assignData)),
        performedBy: managerId,
      },
    });

    return { success: true, message: 'Team member assigned successfully' };
  }

  async escalateCase(caseId: string, escalationData: any, managerId: string) {
    const updatedCase = await this.prisma.arbitration.update({
      where: { id: caseId },
      data: {
        workflowStatus: 'ESCALATED',
        priority: escalationData.priority || 'high',
      },
    });

    // Create case note
    await this.createCaseNote(
      caseId,
      {
        title: 'Case Escalated',
        content: `Reason: ${escalationData.reason}. Notes: ${escalationData.notes || 'None'}`,
        isPrivate: true,
        tags: ['escalation', 'priority'],
      },
      managerId
    );

    // Notify admin/senior managers
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'CASE_MANAGER'] } },
    });

    for (const admin of admins) {
      if (admin.id !== managerId) {
        await this.createNotification(
          {
            title: 'Case Escalated',
            message: `Case ${updatedCase.caseNumber} has been escalated. Reason: ${escalationData.reason}`,
            type: NotificationType.ESCALATION,
            recipientId: admin.id,
            caseId,
          },
          managerId
        );
      }
    }

    return updatedCase;
  }

  async handoffCase(caseId: string, handoffData: any, managerId: string) {
    const caseRecord = await this.prisma.arbitration.update({
      where: { id: caseId },
      data: {
        assignedManagerId: handoffData.toManagerId,
      },
    });

    // Create case note
    await this.createCaseNote(
      caseId,
      {
        title: 'Case Handoff',
        content: `Case handed off to new manager. Notes: ${handoffData.notes || 'None'}`,
        isPrivate: true,
        tags: ['handoff', 'transfer'],
      },
      managerId
    );

    // Notify new manager
    await this.createNotification(
      {
        title: 'Case Assigned to You',
        message: `Case ${caseRecord.caseNumber} has been assigned to you via handoff`,
        type: NotificationType.SYSTEM,
        recipientId: handoffData.toManagerId,
        caseId,
      },
      managerId
    );

    return caseRecord;
  }

  // ===== CASE NOTES & COLLABORATION =====
  async getCaseNotes(caseId: string) {
    return this.prisma.caseNote.findMany({
      where: { caseId },
      include: {
        author: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCaseNote(caseId: string, noteData: CreateCaseNoteDto, authorId: string) {
    return this.prisma.caseNote.create({
      data: {
        caseId,
        authorId,
        title: noteData.title,
        content: noteData.content,
        isPrivate: noteData.isPrivate || false,
        tags: noteData.tags || [],
        attachments: noteData.attachments || [],
      },
      include: {
        author: { select: { name: true, role: true } },
      },
    });
  }

  async updateCaseNote(noteId: string, updateData: Partial<CreateCaseNoteDto>, authorId: string) {
    const note = await this.prisma.caseNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Case note not found');
    }

    if (note.authorId !== authorId) {
      throw new BadRequestException('You can only edit your own notes');
    }

    return this.prisma.caseNote.update({
      where: { id: noteId },
      data: updateData,
      include: {
        author: { select: { name: true, role: true } },
      },
    });
  }

  async deleteCaseNote(noteId: string, authorId: string) {
    const note = await this.prisma.caseNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Case note not found');
    }

    if (note.authorId !== authorId) {
      throw new BadRequestException('You can only delete your own notes');
    }

    await this.prisma.caseNote.delete({
      where: { id: noteId },
    });

    return { success: true, message: 'Case note deleted successfully' };
  }

  // ===== SCHEDULING & CALENDAR MANAGEMENT =====
  async getCalendar(filters: any = {}) {
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date();
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [hearings, reminders, deadlines] = await Promise.all([
      this.prisma.hearing.findMany({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          case: { select: { caseNumber: true } },
          arbitrator: { select: { name: true } },
        },
      }),

      this.prisma.reminder.findMany({
        where: {
          scheduledFor: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
        include: {
          case: { select: { caseNumber: true } },
          user: { select: { name: true } },
        },
      }),

      this.prisma.caseTimeline.findMany({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
          isCompleted: false,
        },
        include: {
          case: { select: { caseNumber: true } },
        },
      }),
    ]);

    return {
      hearings,
      reminders,
      deadlines,
    };
  }

  async getScheduleConflicts() {
    const conflicts = await this.prisma.$queryRaw`
      SELECT h1.id, h1."scheduledDate", h1."arbitratorId", u.name as arbitrator_name,
             array_agg(h2.id) as conflicting_hearings
      FROM "Hearing" h1
      JOIN "Hearing" h2 ON h1."arbitratorId" = h2."arbitratorId" 
        AND h1.id != h2.id
        AND ABS(EXTRACT(EPOCH FROM (h1."scheduledDate" - h2."scheduledDate"))) < 3600
      JOIN "User" u ON h1."arbitratorId" = u.id
      WHERE h1.status = 'SCHEDULED' AND h2.status = 'SCHEDULED'
      GROUP BY h1.id, h1."scheduledDate", h1."arbitratorId", u.name
    `;

    return conflicts;
  }

  async scheduleHearing(hearingData: any, managerId: string) {
    // Check for conflicts
    const conflicts = await this.prisma.hearing.findMany({
      where: {
        arbitratorId: hearingData.arbitratorId,
        scheduledDate: {
          gte: new Date(new Date(hearingData.scheduledDate).getTime() - 60 * 60 * 1000),
          lte: new Date(new Date(hearingData.scheduledDate).getTime() + 60 * 60 * 1000),
        },
        status: 'SCHEDULED',
      },
    });

    if (conflicts.length > 0) {
      throw new BadRequestException('Arbitrator has a conflicting hearing scheduled');
    }

    const hearing = await this.prisma.hearing.create({
      data: {
        caseId: hearingData.caseId,
        arbitratorId: hearingData.arbitratorId,
        title: hearingData.title,
        description: hearingData.description,
        scheduledDate: new Date(hearingData.scheduledDate),
        duration: hearingData.duration || 120,
        type: hearingData.type || 'VIRTUAL',
        meetingLink: hearingData.meetingLink,
        location: hearingData.location,
      },
    });

    // Send notifications
    const [caseRecord, arbitrator] = await Promise.all([
      this.prisma.arbitration.findUnique({
        where: { id: hearingData.caseId },
        select: { userId: true, caseNumber: true },
      }),
      this.prisma.user.findUnique({
        where: { id: hearingData.arbitratorId },
        select: { id: true, name: true },
      }),
    ]);

    if (caseRecord && arbitrator) {
      await Promise.all([
        this.createNotification(
          {
            title: 'Hearing Scheduled',
            message: `A hearing has been scheduled for case ${caseRecord.caseNumber}`,
            type: NotificationType.SYSTEM,
            recipientId: caseRecord.userId,
            caseId: hearingData.caseId,
          },
          managerId
        ),
        this.createNotification(
          {
            title: 'Hearing Assignment',
            message: `You have been assigned to a hearing for case ${caseRecord.caseNumber}`,
            type: NotificationType.SYSTEM,
            recipientId: arbitrator.id,
            caseId: hearingData.caseId,
          },
          managerId
        ),
      ]);
    }

    return hearing;
  }

  async scheduleReminder(reminderData: ScheduleReminderDto, managerId: string) {
    return this.prisma.reminder.create({
      data: {
        title: reminderData.title,
        message: reminderData.message,
        userId: reminderData.userId || managerId,
        caseId: reminderData.caseId,
        scheduledFor: new Date(reminderData.scheduledFor),
        isRecurring: reminderData.isRecurring || false,
        recurringPattern: reminderData.recurringPattern,
        createdBy: managerId,
      },
    });
  }

  async getUpcomingEvents(filters: any = {}) {
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const events = await Promise.all([
      // Upcoming hearings
      this.prisma.hearing.findMany({
        where: {
          scheduledDate: { gte: now, lte: nextWeek },
          status: 'SCHEDULED',
        },
        include: {
          case: { select: { caseNumber: true } },
          arbitrator: { select: { name: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      }),

      // Upcoming deadlines
      this.prisma.caseTimeline.findMany({
        where: {
          dueDate: { gte: now, lte: nextWeek },
          isCompleted: false,
        },
        include: {
          case: { select: { caseNumber: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Pending reminders
      this.prisma.reminder.findMany({
        where: {
          scheduledFor: { gte: now, lte: nextWeek },
          isActive: true,
        },
        include: {
          case: { select: { caseNumber: true } },
        },
        orderBy: { scheduledFor: 'asc' },
      }),
    ]);

    return {
      hearings: events[0],
      deadlines: events[1],
      reminders: events[2],
    };
  }

  // ===== NOTIFICATION MANAGEMENT =====
  async getNotifications(userId: string, filters: any = {}) {
    const where: any = { recipientId: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.notification.findMany({
      where,
      include: {
        sender: { select: { name: true } },
        case: { select: { caseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }

  async createNotification(notificationData: CreateNotificationDto, senderId: string) {
    const notifications: any[] = [];

    // Handle single recipient
    if (notificationData.recipientId) {
      const notification = await this.prisma.notification.create({
        data: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || NotificationType.SYSTEM,
          senderId,
          recipientId: notificationData.recipientId,
          caseId: notificationData.caseId,
          metadata: notificationData.metadata,
          actionUrl: notificationData.actionUrl,
          scheduledFor: notificationData.scheduledFor ? new Date(notificationData.scheduledFor) : null,
          sentAt: notificationData.scheduledFor ? null : new Date(),
        },
      });
      notifications.push(notification);
    }

    // Handle multiple recipients
    if (notificationData.recipientIds && notificationData.recipientIds.length > 0) {
      const bulkNotifications = await this.prisma.notification.createMany({
        data: notificationData.recipientIds.map(recipientId => ({
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || NotificationType.SYSTEM,
          senderId,
          recipientId,
          caseId: notificationData.caseId,
          metadata: notificationData.metadata,
          actionUrl: notificationData.actionUrl,
          scheduledFor: notificationData.scheduledFor ? new Date(notificationData.scheduledFor) : null,
          sentAt: notificationData.scheduledFor ? null : new Date(),
        })),
      });
      notifications.push(bulkNotifications);
    }

    return notifications;
  }

  async sendBulkNotifications(bulkData: any, senderId: string) {
    return this.prisma.notification.createMany({
      data: bulkData.recipientIds.map((recipientId: string) => ({
        title: `Bulk Message: ${bulkData.type}`,
        message: bulkData.message,
        type: bulkData.type || NotificationType.MESSAGE,
        senderId,
        recipientId,
        sentAt: new Date(),
      })),
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async getNotificationTemplates() {
    return this.prisma.notificationTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createNotificationTemplate(templateData: any, createdBy: string) {
    return this.prisma.notificationTemplate.create({
      data: {
        ...templateData,
        createdBy,
      },
    });
  }

  // ===== DEADLINE & MILESTONE TRACKING =====
  async getUpcomingDeadlines(filters: any = {}) {
    const now = new Date();
    const futureDate = new Date(Date.now() + (filters.days || 30) * 24 * 60 * 60 * 1000);

    return this.prisma.caseTimeline.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        isCompleted: false,
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            assignedManagerId: true,
            priority: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getOverdueDeadlines() {
    return this.prisma.caseTimeline.findMany({
      where: {
        dueDate: { lt: new Date() },
        isCompleted: false,
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            assignedManagerId: true,
            priority: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async extendDeadline(extensionData: any, managerId: string) {
    const timeline = await this.prisma.caseTimeline.update({
      where: { id: extensionData.timelineId },
      data: {
        dueDate: new Date(extensionData.newDate),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'timeline',
        entityId: extensionData.timelineId,
        action: 'deadline_extended',
        details: {
          reason: extensionData.reason,
          newDate: extensionData.newDate,
        },
        performedBy: managerId,
      },
    });

    return timeline;
  }

  async completeMilestone(milestoneId: string, completionData: any, managerId: string) {
    return this.prisma.caseTimeline.update({
      where: { id: milestoneId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  // ===== TEAM COORDINATION =====
  async getTeamMembers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['CASE_MANAGER', 'TEAM_MEMBER'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedCases: true,
      },
    });
  }

  async getTeamAvailability(filters: any = {}) {
    // This would integrate with calendar systems or availability tracking
    const teamMembers = await this.getTeamMembers();

    const availability = await Promise.all(
      teamMembers.map(async (member) => {
        const activeCases = await this.prisma.arbitration.count({
          where: {
            assignedManagerId: member.id,
            workflowStatus: { in: ['IN_PROGRESS', 'PENDING'] },
          },
        });

        return {
          ...member,
          activeCases,
          availability: activeCases < 10 ? 'available' : activeCases < 20 ? 'busy' : 'overloaded',
        };
      })
    );

    return availability;
  }

  async assignCasesToTeam(assignmentData: any, managerId: string) {
    const { caseIds, teamMemberIds } = assignmentData;

    // Distribute cases evenly among team members
    const assignments: Array<{ caseId: string; teamMemberId: string }> = [];
    for (let i = 0; i < caseIds.length; i++) {
      const teamMemberId = teamMemberIds[i % teamMemberIds.length];
      assignments.push({
        caseId: caseIds[i],
        teamMemberId,
      });
    }

    // Update cases
    const updatePromises = assignments.map(({ caseId, teamMemberId }) =>
      this.prisma.arbitration.update({
        where: { id: caseId },
        data: { assignedManagerId: teamMemberId },
      })
    );

    await Promise.all(updatePromises);

    return { success: true, assignments };
  }

  async getTeamPerformance(filters: any = {}) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const teamMembers = await this.getTeamMembers();

    const performance = await Promise.all(
      teamMembers.map(async (member) => {
        const [completedCases, averageResolutionTime, slaCompliance] = await Promise.all([
          this.prisma.arbitration.count({
            where: {
              assignedManagerId: member.id,
              workflowStatus: 'COMPLETED',
              updatedAt: { gte: dateFrom, lte: dateTo },
            },
          }),

          // Average resolution time calculation would go here
          0,

          // SLA compliance calculation would go here
          95,
        ]);

        return {
          member,
          completedCases,
          averageResolutionTime,
          slaCompliance,
        };
      })
    );

    return performance;
  }

  // ===== REPORTING & ANALYTICS =====
  async getCaseFlowReport(filters: any = {}) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const [
      totalCases,
      completedCases,
      statusDistribution,
      averageResolutionTime,
    ] = await Promise.all([
      this.prisma.arbitration.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),

      this.prisma.arbitration.count({
        where: {
          workflowStatus: 'COMPLETED',
          updatedAt: { gte: dateFrom, lte: dateTo },
        },
      }),

      this.prisma.arbitration.groupBy({
        by: ['workflowStatus'],
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _count: { id: true },
      }),

      // Calculate average resolution time
      this.calculateAverageResolutionTime(dateFrom, dateTo),
    ]);

    return {
      totalCases,
      completedCases,
      completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0,
      statusDistribution,
      averageResolutionTime,
    };
  }

  async getBottleneckAnalysis() {
    // Analyze where cases are getting stuck
    const bottlenecks = await this.prisma.$queryRaw`
      SELECT 
        "workflowStatus",
        COUNT(*) as case_count,
        AVG(EXTRACT(EPOCH FROM (NOW() - "updatedAt"))) / 86400 as avg_days_in_status
      FROM "Arbitration"
      WHERE "workflowStatus" IN ('PENDING', 'BLOCKED', 'IN_PROGRESS')
      GROUP BY "workflowStatus"
      ORDER BY avg_days_in_status DESC
    `;

    return bottlenecks;
  }

  async getEfficiencyMetrics(filters: any = {}) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    // Calculate various efficiency metrics
    const metrics = {
      caseVelocity: await this.calculateCaseVelocity(dateFrom, dateTo),
      resourceUtilization: await this.calculateResourceUtilization(dateFrom, dateTo),
      qualityScore: await this.calculateQualityScore(dateFrom, dateTo),
      clientSatisfaction: await this.calculateClientSatisfaction(dateFrom, dateTo),
    };

    return metrics;
  }

  async getSLACompliance(filters: any = {}) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const [totalCases, onTimeCases, slaBreaches] = await Promise.all([
      this.prisma.arbitration.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          slaDeadline: { not: null },
        },
      }),

      // Note: This query has limitations, would need a proper implementation
      this.prisma.arbitration.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          workflowStatus: 'COMPLETED',
          slaDeadline: { not: null },
        },
      }),

      this.prisma.arbitration.findMany({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          slaDeadline: { lt: new Date() },
          workflowStatus: { not: 'COMPLETED' },
        },
        select: {
          id: true,
          caseNumber: true,
          slaDeadline: true,
          workflowStatus: true,
        },
      }),
    ]);

    return {
      totalCases,
      onTimeCases,
      complianceRate: totalCases > 0 ? (onTimeCases / totalCases) * 100 : 0,
      slaBreaches,
    };
  }

  // ===== BULK OPERATIONS =====
  async bulkAssignArbitrators(bulkData: BulkOperationDto, managerId: string) {
    const { caseIds, data } = bulkData;

    const assignments = await Promise.all(
      caseIds.map(caseId =>
        this.prisma.caseAssignment.create({
          data: {
            caseId,
            arbitratorId: data.arbitratorId,
            status: 'PENDING',
          },
        })
      )
    );

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'bulk_operation',
        entityId: 'bulk_assign_arbitrators',
        action: 'bulk_assign_arbitrators',
        details: { caseIds, arbitratorId: data.arbitratorId },
        performedBy: managerId,
      },
    });

    return assignments;
  }

  async bulkUpdateStatus(bulkData: BulkOperationDto, managerId: string) {
    const { caseIds, data } = bulkData;

    await this.prisma.arbitration.updateMany({
      where: { id: { in: caseIds } },
      data: { workflowStatus: data.status },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'bulk_operation',
        entityId: 'bulk_update_status',
        action: 'bulk_update_status',
        details: { caseIds, newStatus: data.status },
        performedBy: managerId,
      },
    });

    return { success: true, updatedCount: caseIds.length };
  }

  async bulkSendReminders(bulkData: any, managerId: string) {
    const { caseIds, message, type } = bulkData;

    const cases = await this.prisma.arbitration.findMany({
      where: { id: { in: caseIds } },
      select: { id: true, userId: true, caseNumber: true },
    });

    const notifications = await this.prisma.notification.createMany({
      data: cases.map(caseItem => ({
        title: `Reminder: ${type}`,
        message: `${message} (Case: ${caseItem.caseNumber})`,
        type: NotificationType.REMINDER,
        senderId: managerId,
        recipientId: caseItem.userId,
        caseId: caseItem.id,
        sentAt: new Date(),
      })),
    });

    return notifications;
  }

  // ===== INTEGRATION & AUTOMATION =====
  async getAutomationRules() {
    return this.prisma.workflowRule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createAutomationRule(ruleData: any, createdBy: string) {
    return this.prisma.workflowRule.create({
      data: {
        ...ruleData,
        createdBy,
      },
    });
  }

  async syncExternalCalendar(userId: string) {
    // Placeholder for external calendar integration
    return { success: true, message: 'Calendar sync initiated' };
  }

  async sendEmail(emailData: any, senderId: string) {
    // Placeholder for email integration
    // This would integrate with email service providers
    return { success: true, message: 'Email sent successfully' };
  }

  // ===== QUALITY ASSURANCE =====
  async getPendingQAReview() {
    return this.prisma.arbitration.findMany({
      where: {
        workflowStatus: 'COMPLETED',
        qaReviews: { none: {} },
      },
      include: {
        user: { select: { name: true } },
        assignments: { include: { arbitrator: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    });
  }

  async conductQAReview(caseId: string, reviewData: any, reviewerId: string) {
    return this.prisma.qAReview.create({
      data: {
        caseId,
        reviewerId,
        score: reviewData.score,
        feedback: reviewData.feedback,
        recommendations: reviewData.recommendations,
        criteria: reviewData.criteria || {},
      },
    });
  }

  async getQAMetrics(filters: any = {}) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const [
      totalReviews,
      averageScore,
      scoreDistribution,
    ] = await Promise.all([
      this.prisma.qAReview.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),

      this.prisma.qAReview.aggregate({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _avg: { score: true },
      }),

      this.prisma.qAReview.groupBy({
        by: ['score'],
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _count: { id: true },
      }),
    ]);

    return {
      totalReviews,
      averageScore: averageScore._avg.score || 0,
      scoreDistribution,
    };
  }

  // ===== HELPER METHODS =====
  private async getTeamPerformanceOverview(managerId: string) {
    // Get team members managed by this manager
    const teamMembers = await this.prisma.user.findMany({
      where: { managedCases: { has: managerId } },
    });

    // Calculate team metrics
    const metrics = {
      teamSize: teamMembers.length,
      averageEfficiency: 85, // Placeholder calculation
      totalCasesHandled: 50, // Placeholder calculation
    };

    return metrics;
  }

  private async getTodaySchedule(managerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.hearing.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        case: { assignedManagerId: managerId },
      },
      include: {
        case: { select: { caseNumber: true } },
        arbitrator: { select: { name: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  private async getSLAComplianceOverview(managerId: string) {
    const cases = await this.prisma.arbitration.findMany({
      where: { assignedManagerId: managerId },
      select: { slaDeadline: true, workflowStatus: true, updatedAt: true },
    });

    const compliant = cases.filter(c => 
      c.workflowStatus === 'COMPLETED' && 
      c.slaDeadline && 
      c.updatedAt <= c.slaDeadline
    ).length;

    return {
      totalCases: cases.length,
      compliantCases: compliant,
      complianceRate: cases.length > 0 ? (compliant / cases.length) * 100 : 0,
    };
  }

  private async calculateAverageResolutionTime(dateFrom: Date, dateTo: Date): Promise<number> {
    // This would calculate the average time from case creation to completion
    return 15; // Placeholder: 15 days
  }

  private async calculateCaseVelocity(dateFrom: Date, dateTo: Date): Promise<number> {
    // Cases completed per time period
    const completedCases = await this.prisma.arbitration.count({
      where: {
        workflowStatus: 'COMPLETED',
        updatedAt: { gte: dateFrom, lte: dateTo },
      },
    });

    const days = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? completedCases / days : 0;
  }

  private async calculateResourceUtilization(dateFrom: Date, dateTo: Date): Promise<number> {
    // Percentage of available resources being used
    return 78; // Placeholder
  }

  private async calculateQualityScore(dateFrom: Date, dateTo: Date): Promise<number> {
    const avgScore = await this.prisma.qAReview.aggregate({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      _avg: { score: true },
    });

    return avgScore._avg.score || 0;
  }

  private async calculateClientSatisfaction(dateFrom: Date, dateTo: Date): Promise<number> {
    const avgRating = await this.prisma.feedback.aggregate({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        isApproved: true,
      },
      _avg: { rating: true },
    });

    return avgRating._avg.rating || 0;
  }
} 