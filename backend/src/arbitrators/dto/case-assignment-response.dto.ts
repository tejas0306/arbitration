import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { CaseAssignmentStatus } from '@prisma/client';

export class CaseAssignmentResponseDto {
  @IsNotEmpty()
  @IsEnum(CaseAssignmentStatus)
  status: CaseAssignmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
} 