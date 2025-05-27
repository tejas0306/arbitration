import { Module } from '@nestjs/common';
import { CaseManagerController } from './case-manager.controller';
import { CaseManagerService } from './case-manager.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [CaseManagerController],
  providers: [CaseManagerService, PrismaService],
  exports: [CaseManagerService],
})
export class CaseManagerModule {} 