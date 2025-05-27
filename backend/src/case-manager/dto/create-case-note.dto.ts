import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateCaseNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = false;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  attachments?: string[];
} 