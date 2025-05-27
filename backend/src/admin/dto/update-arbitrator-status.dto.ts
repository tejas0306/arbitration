import { IsString, IsOptional } from 'class-validator';
import { ArbitratorStatus } from '@prisma/client';

export class UpdateArbitratorStatusDto {
  @IsString()
  status: ArbitratorStatus;

  @IsOptional()
  @IsString()
  notes?: string;
} 