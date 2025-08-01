import { Module } from '@nestjs/common';
import { RespondentController } from './respondent.controller';
import { RespondentService } from './respondent.service';
import { RespondentNotificationService } from './respondent-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../services/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [RespondentController],
  providers: [RespondentService, RespondentNotificationService, EmailService],
  exports: [RespondentService, RespondentNotificationService],
})
export class RespondentModule {} 