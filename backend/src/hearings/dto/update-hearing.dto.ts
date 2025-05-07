import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';

enum HearingType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical',
}

export class UpdateHearingDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsNumber()
  @Min(15) // Minimum duration in minutes
  @Max(480) // Maximum duration (8 hours)
  duration?: number;

  @IsOptional()
  @IsEnum(HearingType)
  type?: HearingType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}