import { IsNotEmpty, IsBoolean, IsOptional, IsString } from 'class-validator';

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