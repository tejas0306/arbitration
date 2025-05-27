import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class ScheduleReminderDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  caseId?: string;

  @IsDateString()
  scheduledFor: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = false;

  @IsString()
  @IsOptional()
  recurringPattern?: string; // "daily", "weekly", "monthly"
} 