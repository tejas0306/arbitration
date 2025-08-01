import { IsEmail, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRespondentRegistrationDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsString()
  invitationToken?: string;
} 