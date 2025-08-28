import { Module } from '@nestjs/common';
import { ArbitrationController } from '../controllers/arbitration.controller';
import { ArbitrationService } from '../services/arbitration.service';
import { PrismaService } from '../services/prisma.service';
import { DuplicateDetectionService } from '../services/duplicate-detection.service';
import { RespondentModule } from '../respondent/respondent.module';

@Module({
  imports: [RespondentModule],
  controllers: [ArbitrationController],
  providers: [ArbitrationService, PrismaService, DuplicateDetectionService],
  exports: [ArbitrationService, DuplicateDetectionService],
})
export class ArbitrationModule {} 