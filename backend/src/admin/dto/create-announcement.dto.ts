import { IsString, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string; // info, warning, error, success

  @IsOptional()
  @IsString()
  priority?: string; // low, medium, high

  @IsArray()
  targetRoles: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
} 