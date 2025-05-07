import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';

enum HearingType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical',
}

export class CreateHearingDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(15) // Minimum duration in minutes
  @Max(480) // Maximum duration (8 hours)
  duration: number;

  @IsNotEmpty()
  @IsEnum(HearingType)
  type: HearingType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}