import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { ArbitrationModule } from './modules/arbitration.module';
import { VerificationModule } from './modules/verification.module';
import { ArbitratorsModule } from './arbitrators/arbitrators.module';
import { AdminModule } from './admin/admin.module';
import { CaseManagerModule } from './case-manager/case-manager.module';
import { HearingsModule } from './hearings/hearings.module';
import { PrismaService } from './services/prisma.service';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentModule } from './payments/payment.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ArbitrationModule,
    VerificationModule,
    ArbitratorsModule,
    AdminModule,
    CaseManagerModule,
    HearingsModule,
    HealthModule,
    PaymentsModule,
    PaymentModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
