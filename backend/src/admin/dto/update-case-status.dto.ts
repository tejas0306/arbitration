import { IsString, IsOptional } from 'class-validator';

export class UpdateCaseStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  priority?: string; // low, medium, high, urgent
} 