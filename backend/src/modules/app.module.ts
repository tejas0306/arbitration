import { Module } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { WorkflowService } from '../services/workflow.service';

// Import controllers
import { CasesPublicController } from '../cases/cases-public.controller';
import { CasesResponseController } from '../cases/cases-response.controller';
import { RespondentController } from '../respondent/respondent.controller';

// Import existing modules
import { AuthModule } from '../auth/auth.module';
import { ArbitrationModule } from '../arbitration/arbitration.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminModule } from '../admin/admin.module';
import { CaseManagerModule } from '../case-manager/case-manager.module';
import { HearingsModule } from '../hearings/hearings.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [
    AuthModule,
    ArbitrationModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    CaseManagerModule,
    HearingsModule,
    HealthModule,
  ],
  controllers: [
    CasesPublicController,
    CasesResponseController,
    RespondentController,
  ],
  providers: [
    PrismaService,
    EmailService,
    NotificationService,
    WorkflowService,
  ],
  exports: [
    PrismaService,
    EmailService,
    NotificationService,
    WorkflowService,
  ],
})
export class AppModule {}
