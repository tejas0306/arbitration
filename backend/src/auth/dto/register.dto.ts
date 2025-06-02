import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, IsArray, MinLength, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsPhoneNumber('IN')
  mobile: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsEnum(UserRole)
  role: UserRole;

  // Arbitrator specific fields
  @IsString()
  @IsOptional()
  qualifications?: string;

  @IsString()
  @IsOptional()
  expertise?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsString()
  @IsOptional()
  availability?: string;

  @IsArray()
  @IsOptional()
  documents?: {
    type: string;
    file: Express.Multer.File;
  }[];
}