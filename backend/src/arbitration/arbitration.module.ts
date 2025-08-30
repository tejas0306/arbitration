import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArbitrationController } from './arbitration.controller';
import { ArbitrationService } from './arbitration.service';
import { ArbitrationCase } from './entities/arbitration-case.entity';
import { CaseResponse } from './entities/case-response.entity';
import { PrismaService } from '../services/prisma.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArbitrationCase, CaseResponse]),
  ],
  controllers: [ArbitrationController],
  providers: [ArbitrationService, PrismaService],
  exports: [ArbitrationService],
})
export class ArbitrationModule {}