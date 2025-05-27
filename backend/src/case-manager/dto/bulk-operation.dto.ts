import { IsArray, IsString, IsOptional } from 'class-validator';

export class BulkOperationDto {
  @IsArray()
  caseIds: string[];

  @IsString()
  operation: string;

  @IsOptional()
  data?: any;

  @IsString()
  @IsOptional()
  notes?: string;
} 