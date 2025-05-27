import { IsString, IsOptional, IsArray } from 'class-validator';

export class AssignTeamMemberDto {
  @IsString()
  @IsOptional()
  teamMemberId?: string;

  @IsArray()
  @IsOptional()
  teamMemberIds?: string[];

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 