import { Controller, Get, Param, Post, Body, ValidationPipe, Query } from '@nestjs/common';
import { VerificationService } from '../services/verification.service';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

class VerifyGSTDto {
  @IsString()
  @IsNotEmpty()
  @Length(15, 15)
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
  gstNumber: string;
}

class VerifyPANDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  panNumber: string;
}

class VerifyCINDto {
  @IsString()
  @IsNotEmpty()
  @Length(21, 21)
  @Matches(/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/)
  cinNumber: string;
}

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('gst')
  async verifyGST(@Body(ValidationPipe) dto: VerifyGSTDto) {
    return this.verificationService.verifyGST(dto.gstNumber);
  }

  @Get('gst')
  async verifyGSTGet(@Query('number') gstNumber: string) {
    if (!gstNumber) {
      return { valid: false, message: 'GST number is required' };
    }
    
    // Basic format validation before passing to service
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      return { valid: false, message: 'Invalid GST format' };
    }
    
    return this.verificationService.verifyGST(gstNumber);
  }

  @Post('pan')
  async verifyPAN(@Body(ValidationPipe) dto: VerifyPANDto) {
    return this.verificationService.verifyPAN(dto.panNumber);
  }

  @Get('pan')
  async verifyPANGet(@Query('number') panNumber: string) {
    if (!panNumber) {
      return { valid: false, message: 'PAN number is required' };
    }
    
    // Basic format validation before passing to service
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return { valid: false, message: 'Invalid PAN format' };
    }
    
    return this.verificationService.verifyPAN(panNumber);
  }

  @Post('cin')
  async verifyCIN(@Body(ValidationPipe) dto: VerifyCINDto) {
    return this.verificationService.verifyCIN(dto.cinNumber);
  }

  @Get('cin')
  async verifyCINGet(@Query('number') cinNumber: string) {
    if (!cinNumber) {
      return { valid: false, message: 'CIN number is required' };
    }
    
    // Basic format validation before passing to service
    const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    if (!cinRegex.test(cinNumber)) {
      return { valid: false, message: 'Invalid CIN format' };
    }
    
    return this.verificationService.verifyCIN(cinNumber);
  }
} 