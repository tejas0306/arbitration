import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class SetCaseTimelineDto {
  @IsArray()
  milestones: {
    milestone: string;
    title: string;
    description?: string;
    dueDate: string; // ISO date string
  }[];
} 