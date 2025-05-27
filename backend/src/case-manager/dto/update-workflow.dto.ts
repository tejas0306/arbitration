import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  ESCALATED = 'ESCALATED',
}

export class UpdateWorkflowDto {
  @IsEnum(WorkflowStatus)
  @IsOptional()
  workflowStatus?: WorkflowStatus;

  @IsString()
  @IsOptional()
  assignedManagerId?: string;

  @IsDateString()
  @IsOptional()
  estimatedCompletion?: string;

  @IsDateString()
  @IsOptional()
  slaDeadline?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  reason?: string;
} 