import { IsString, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsString()
  role: UserRole;

  @IsOptional()
  @IsString()
  notes?: string;
} 