import { Module } from '@nestjs/common';
import { ArbitrationController } from '../controllers/arbitration.controller';
import { ArbitrationService } from '../services/arbitration.service';
import { PrismaService } from '../services/prisma.service';
import { DuplicateDetectionService } from '../services/duplicate-detection.service';

@Module({
  controllers: [ArbitrationController],
  providers: [ArbitrationService, PrismaService, DuplicateDetectionService],
  exports: [ArbitrationService, DuplicateDetectionService],
})
export class ArbitrationModule {} 