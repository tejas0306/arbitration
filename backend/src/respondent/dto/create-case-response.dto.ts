import { IsString, IsBoolean, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateCaseResponseDto {
  @IsOptional()
  @IsString()
  responseOverview?: string;

  @IsOptional()
  @IsBoolean()
  admitsClaimInFull?: boolean;

  @IsOptional()
  @IsBoolean()
  admitsClaimInPart?: boolean;

  @IsOptional()
  @IsBoolean()
  deniesClaimInFull?: boolean;

  @IsOptional()
  @IsArray()
  disputePointResponses?: any[];

  @IsOptional()
  @IsArray()
  counterClaims?: any[];

  @IsOptional()
  @IsArray()
  documents?: any[];

  @IsOptional()
  @IsArray()
  evidence?: any[];

  @IsOptional()
  @IsArray()
  witnessStatements?: any[];

  @IsOptional()
  @IsString()
  legalArguments?: string;

  @IsOptional()
  @IsArray()
  lawsReliedUpon?: any[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsArray()
  requestedReliefs?: any[];

  // Additional fields for respondent form data
  @IsOptional()
  @IsObject()
  responseData?: any;

  @IsOptional()
  @IsNumber()
  round?: number;
} 