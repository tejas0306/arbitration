import { Module } from '@nestjs/common';
import { ArbitrationController } from '../controllers/arbitration.controller';
import { ArbitrationService } from '../services/arbitration.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [ArbitrationController],
  providers: [ArbitrationService, PrismaService],
  exports: [ArbitrationService],
})
export class ArbitrationModule {} 