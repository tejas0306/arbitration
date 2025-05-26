import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
  ALERT = 'ALERT',
  MESSAGE = 'MESSAGE',
  ESCALATION = 'ESCALATION',
}

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.SYSTEM;

  @IsString()
  @IsOptional()
  recipientId?: string;

  @IsArray()
  @IsOptional()
  recipientIds?: string[];

  @IsString()
  @IsOptional()
  caseId?: string;

  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
} 