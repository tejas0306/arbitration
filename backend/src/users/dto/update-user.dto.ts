import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  organization?: string;
  
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
  
  @IsOptional()
  @IsString()
  mobile?: string;
  
  @IsOptional()
  @IsString()
  paymentId?: string;
}