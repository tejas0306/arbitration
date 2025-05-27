import { Module } from '@nestjs/common';
import { HearingsController } from './hearings.controller';
import { HearingsService } from './hearings.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [HearingsController],
  providers: [HearingsService, PrismaService],
})
export class HearingsModule {}