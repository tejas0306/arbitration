import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { HearingType, HearingStatus } from '@prisma/client';

export class ScheduleHearingDto {
  @IsNotEmpty()
  @IsString()
  caseId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @IsNotEmpty()
  @IsNumber()
  duration: number; // Duration in minutes

  @IsNotEmpty()
  @IsEnum(HearingType)
  type: HearingType;

  @IsOptional()
  @IsEnum(HearingStatus)
  status?: HearingStatus;

  // For virtual hearings
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  // For physical hearings
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Hearing notes and outcomes
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;
} 