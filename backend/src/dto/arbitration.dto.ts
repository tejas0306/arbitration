import { IsString, IsOptional, IsEmail, IsArray, IsObject } from 'class-validator';

export class ArbitrationDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  pincode: string;

  @IsString()
  address1: string;

  @IsString()
  @IsOptional()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsEmail()
  email: string;

  @IsString()
  phoneCountryCode: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  gst?: string;

  @IsString()
  @IsOptional()
  pan?: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsArray()
  additionalClaimants: any[];

  @IsArray()
  respondents: any[];

  @IsObject()
  arbitrationAgreement: any;

  @IsObject()
  disputeDetails: any;

  @IsObject()
  @IsOptional()
  documents?: any;
} 