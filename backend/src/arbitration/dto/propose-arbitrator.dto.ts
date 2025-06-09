import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

// Use enum values that match the Prisma schema
export enum ProposedBy {
  CLAIMANT = 'CLAIMANT',
  RESPONDENT = 'RESPONDENT',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN'
}

export class ProposeArbitratorDto {
  @IsNotEmpty()
  @IsString()
  arbitratorId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ProposedBy)
  proposerRole?: ProposedBy; // Will be determined by the server based on the user's role if not provided
} 