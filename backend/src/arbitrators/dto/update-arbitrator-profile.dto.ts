import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsDecimal } from 'class-validator';
import { ArbitratorStatus } from '@prisma/client';

export class UpdateArbitratorProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDecimal()
  hourlyRate?: number;

  @IsOptional()
  @IsEnum(ArbitratorStatus)
  arbitratorStatus?: ArbitratorStatus;
} 