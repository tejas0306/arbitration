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

  // Field-level responses for Accept/Reject system
  @IsOptional()
  @IsArray()
  fieldResponses?: FieldResponseDto[];
}

export class FieldResponseDto {
  @IsString()
  fieldId: string; // e.g., "1.1", "1.2", "2.1"

  @IsString()
  fieldName: string; // e.g., "Type", "Name", "Email"

  @IsString()
  fieldValue: string; // Original value from claimant

  @IsString()
  fieldType: string; // e.g., "text", "select", "file"

  @IsString()
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CORRECTED';

  @IsOptional()
  @IsString()
  respondentComment?: string; // Comment from respondent

  @IsOptional()
  @IsString()
  correctedValue?: string; // Corrected value if rejected

  @IsOptional()
  @IsObject()
  evidence?: any; // Supporting evidence
} 