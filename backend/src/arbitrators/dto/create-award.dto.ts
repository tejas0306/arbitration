import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAwardDto {
  @IsNotEmpty()
  @IsString()
  caseId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string; // Award content/decision

  @IsOptional()
  @IsString()
  filePath?: string; // Path to uploaded award document
} 