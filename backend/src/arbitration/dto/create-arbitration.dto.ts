import { IsNotEmpty, IsString, IsOptional, IsArray, IsEmail, ValidateNested, Matches, Length } from 'class-validator';
import { Type } from 'class-transformer';

// Claimant details including type, address, and identification numbers
class ClaimantDetailsDto {
  // Type of claimant: individual, company, partnership, llp
  @IsNotEmpty()
  @IsString()
  type: string;
  // Full name of the claimant
  @IsNotEmpty()
  @IsString()
  name: string;
  // 6-digit pincode
  @IsNotEmpty()
  @Length(6, 6)
  pincode: string;
  // Address line 1
  @IsNotEmpty()
  @IsString()
  address1: string;
  // Address line 2 (optional)
  @IsOptional()
  @IsString()
  address2?: string;
  // City
  @IsNotEmpty()
  @IsString()
  city: string;
  // District
  @IsNotEmpty()
  @IsString()
  district: string;
  // State
  @IsNotEmpty()
  @IsString()
  state: string;
  // Country
  @IsNotEmpty()
  @IsString()
  country: string;
  // Email address (validated)
  @IsNotEmpty()
  @IsEmail()
  email: string;
  // 10-digit phone number
  @IsNotEmpty()
  @Matches(/^\d{10}$/)
  phone: string;
  // GST number (optional, validated)
  @IsOptional()
  @Matches(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/)
  gst?: string;
  // PAN number (optional, validated)
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  pan?: string;
  // CIN number (optional, validated)
  @IsOptional()
  @Matches(/^[A-Z0-9]{21}$/)
  cin?: string;
  // Certificate of Incorporation (optional, file reference)
  @IsOptional()
  @IsString()
  coi?: string;
  // PAN card file (optional, file reference)
  @IsOptional()
  @IsString()
  panCard?: string;
  // GST certificate file (optional, file reference)
  @IsOptional()
  @IsString()
  gstCert?: string;
}

// Additional claimant details (same structure as claimant)
class AdditionalClaimantDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @Length(6, 6)
  pincode: string;
  @IsNotEmpty()
  @IsString()
  address1: string;
  @IsOptional()
  @IsString()
  address2?: string;
  @IsNotEmpty()
  @IsString()
  city: string;
  @IsNotEmpty()
  @IsString()
  district: string;
  @IsNotEmpty()
  @IsString()
  state: string;
  @IsNotEmpty()
  @IsString()
  country: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @Matches(/^\d{10}$/)
  phone: string;
}

// Claimant manager details
class ManagerDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @Matches(/^\d{10}$/)
  phone: string;
}

// Respondent details including type and address
class RespondentDetailsDto {
  // Type of respondent: individual, company, partnership, llp
  @IsNotEmpty()
  @IsString()
  type: string;
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @Length(6, 6)
  pincode: string;
  @IsNotEmpty()
  @IsString()
  address1: string;
  @IsOptional()
  @IsString()
  address2?: string;
  @IsNotEmpty()
  @IsString()
  city: string;
  @IsNotEmpty()
  @IsString()
  district: string;
  @IsNotEmpty()
  @IsString()
  state: string;
  @IsNotEmpty()
  @IsString()
  country: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @Matches(/^\d{10}$/)
  phone: string;
}

// Arbitration agreement details
class ArbitrationAgreementDto {
  // Date of Arbitration Agreement / Agreement containing the arbitration clause
  @IsNotEmpty()
  @IsString()
  agreementDate: string;
  // Place where the Arbitration Agreement / Agreement containing the arbitration clause was signed
  @IsNotEmpty()
  @IsString()
  placeOfSigning: string;
  // Text of arbitration Agreement/clause
  @IsNotEmpty()
  @IsString()
  arbitrationText: string;
  // Percentage of the Agreement value / Amount of stamp duty paid on the Arbitration Agreement / Agreement containing the arbitration clause
  @IsNotEmpty()
  @IsString()
  stampDutyPercentage: string;
  // Number of Arbitrators as per Agreement
  @IsNotEmpty()
  @IsString()
  numberOfArbitrators: string;
}

// Dispute details
class DisputeDto {
  // Dispute category (e.g., commercial, corporate, etc.)
  @IsNotEmpty()
  @IsString()
  category: string;
  // Dispute sub-category
  @IsNotEmpty()
  @IsString()
  subCategory: string;
  // Nature of dispute
  @IsNotEmpty()
  @IsString()
  nature: string;
  // Date when right to claim arose (ISO string)
  @IsNotEmpty()
  @IsString()
  claimDate: string;
  // Standardized prayer clauses (optional)
  @IsOptional()
  @IsString()
  prayerClauses?: string;
  // Claim type (optional)
  @IsOptional()
  @IsString()
  claimType?: string;
  // Claim reason (optional)
  @IsOptional()
  @IsString()
  claimReason?: string;
  // Law relied upon (optional)
  @IsOptional()
  @IsString()
  lawRelied?: string;
  // Relevant clause number/page (optional)
  @IsOptional()
  @IsString()
  relevantClause?: string;
  // Clause supporting claim (optional)
  @IsOptional()
  @IsString()
  clauseSupporting?: string;
  // Clause (optional)
  @IsOptional()
  @IsString()
  clause?: string;
  // Document supporting claim (optional)
  @IsOptional()
  @IsString()
  documentSupporting?: string;
  // Relief sought (optional)
  @IsOptional()
  @IsString()
  reliefSought?: string;
}

// Document reference for uploads
class DocumentReferenceDto {
  // Document type (agreement, invoice, etc.)
  @IsNotEmpty()
  @IsString()
  type: string;
  // Document ID (optional, auto-generated)
  @IsOptional()
  @IsString()
  id?: string;
  // Relevant clause number/page (optional)
  @IsOptional()
  @IsString()
  relevantClauseNumber?: string;
  // Supporting claim number (optional)
  @IsOptional()
  @IsString()
  supportingClaimNumber?: string;
  // Date of issue/sign (optional)
  @IsOptional()
  @IsString()
  dateOfIssue?: string;
  // File reference (optional)
  @IsOptional()
  @IsString()
  file?: string;
}

// Main DTO for arbitration case creation
export class CreateArbitrationDto {
  // Main claimant details
  @ValidateNested()
  @Type(() => ClaimantDetailsDto)
  claimantDetails: ClaimantDetailsDto;
  // Additional claimants (optional)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalClaimantDto)
  additionalClaimants?: AdditionalClaimantDto[];
  // Claimant manager (optional)
  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerDto)
  manager?: ManagerDto;
  // Respondent details
  @ValidateNested()
  @Type(() => RespondentDetailsDto)
  respondentDetails: RespondentDetailsDto;
  // Arbitration agreement details
  @ValidateNested()
  @Type(() => ArbitrationAgreementDto)
  arbitrationAgreement: ArbitrationAgreementDto;
  // Dispute details
  @ValidateNested()
  @Type(() => DisputeDto)
  dispute: DisputeDto;
  // Documents (optional)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentReferenceDto)
  documents?: DocumentReferenceDto[];
  // Preferred arbitrator (optional)
  @IsOptional()
  @IsString()
  preferredArbitratorId?: string;
  // Preferred language (optional)
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
  // Preferred location (optional)
  @IsOptional()
  @IsString()
  preferredLocation?: string;
  // Additional notes (optional)
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}