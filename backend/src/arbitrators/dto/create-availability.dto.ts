import { IsNotEmpty, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  @IsNotEmpty()
  @IsString()
  startTime: string; // "09:00"

  @IsNotEmpty()
  @IsString()
  endTime: string; // "17:00"

  @IsNotEmpty()
  @IsBoolean()
  isAvailable: boolean;
} 