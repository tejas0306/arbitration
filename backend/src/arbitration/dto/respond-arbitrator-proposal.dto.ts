import { IsNotEmpty, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

// Use string literal for enum instead of importing from Prisma
export enum ArbitratorProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export class RespondArbitratorProposalDto {
  @IsNotEmpty()
  @IsEnum(ArbitratorProposalStatus)
  status: ArbitratorProposalStatus; // ACCEPTED or REJECTED
  
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ArbitratorResponseDto {
  @IsNotEmpty()
  @IsBoolean()
  accepted: boolean;
  
  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  disclosureDocuments?: any; // This will handle file uploads or document references
} 