import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DisputePointResponseDto {
  @IsNotEmpty()
  @IsString()
  point: string;

  @IsNotEmpty()
  @IsBoolean()
  admitted: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}

class CounterClaimDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  basis?: string;
}

class DocumentReferenceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CaseResponseDto {
  @IsNotEmpty()
  @IsString()
  responseOverview: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisputePointResponseDto)
  disputePointResponses: DisputePointResponseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterClaimDto)
  counterClaims?: CounterClaimDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentReferenceDto)
  documents?: DocumentReferenceDto[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}