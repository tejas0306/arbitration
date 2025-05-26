import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../services/prisma.service';
import { EmailService } from '../services/email.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, EmailService],
  exports: [AdminService],
})
export class AdminModule {} 