import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export enum UserRole {
  CLAIMANT = 'CLAIMANT',
  RESPONDENT = 'RESPONDENT',
  ARBITRATOR = 'ARBITRATOR',
  ADMIN = 'ADMIN'
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.CLAIMANT;

  @IsString()
  @IsOptional()
  organization?: string;

  // Fields specific to arbitrators
  @IsString()
  @IsOptional()
  expertise?: string;

  @IsString()
  @IsOptional()
  qualifications?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  experience?: number;

  @IsString()
  @IsOptional()
  bio?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  // Fields specific to arbitrators
  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  experience?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
} 