import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req, @Query() filters: any) {
    return this.notificationsService.getNotifications(req.user.id, filters);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    try {
      return await this.notificationsService.markAsRead(id, req.user.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  @Put('read-all')
  async markAllAsRead(@Request() req) {
    try {
      return await this.notificationsService.markAllAsRead(req.user.id);
    } catch (error) {
      throw new BadRequestException('Failed to mark all notifications as read');
    }
  }
} 