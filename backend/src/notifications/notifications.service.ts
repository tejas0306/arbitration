import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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
        sender: { select: { id: true, name: true } },
        case: { select: { id: true, caseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit) : 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    // First check if notification exists and belongs to the user
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found or you do not have access to it');
    }

    // Mark as read
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    // Find all unread notifications for the user
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return {
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
    };
  }
} 