import { Module } from '@nestjs/common';
import { ArbitratorsController } from './arbitrators.controller';
import { ArbitratorsService } from './arbitrators.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  imports: [],
  controllers: [ArbitratorsController],
  providers: [ArbitratorsService, PrismaService],
  exports: [ArbitratorsService],
})
export class ArbitratorsModule {} 