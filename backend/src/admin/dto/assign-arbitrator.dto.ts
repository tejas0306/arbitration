import { IsString, IsOptional } from 'class-validator';

export class AssignArbitratorDto {
  @IsString()
  arbitratorId: string;

  @IsOptional()
  @IsString()
  notes?: string;
} 