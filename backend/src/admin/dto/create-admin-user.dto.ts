import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum InternalUserRole {
  ADMIN = 'ADMIN',
  CASE_MANAGER = 'CASE_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER'
}

export class CreateAdminUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsEnum(InternalUserRole)
  role: InternalUserRole;

  @IsNotEmpty()
  @IsString()
  organization: string;

  @IsOptional()
  @IsBoolean()
  sendCredentials?: boolean;

  @IsOptional()
  @IsBoolean()
  isProvisioned?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;
} 