import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

// Define our own AxiosError interface since the imported one is causing issues
interface AxiosErrorResponse {
  response?: {
    status: number;
    data: any;
  };
  message: string;
  stack?: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  /**
   * Verify if a GST number is valid by checking with the GST Portal
   * Note: This is a placeholder. You need to register with GST API services 
   * and replace with actual API credentials
   */
  async verifyGST(gstNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying GST: ${gstNumber}`);
      
      // First, check format before making API call
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return { valid: false, message: 'Invalid GST format' };
      }
      
      // Simulate API call for development
      try {
        // GST validation logic:
        // 1. First 2 digits: State code (valid range 01-38)
        const stateCode = parseInt(gstNumber.substring(0, 2));
        if (stateCode < 1 || stateCode > 38) {
          return { valid: false, message: 'Invalid state code in GST number' };
        }
        
        // 2. Check if PAN portion is valid (positions 3-12)
        const panPortion = gstNumber.substring(2, 12);
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panPortion)) {
          return { valid: false, message: 'Invalid PAN portion in GST number' };
        }
        
        // For development, return success for well-formed GST numbers
        return { valid: true, message: 'GST number verified successfully' };
      } catch (apiError: any) {
        // Handle API-specific errors by checking response property
        if (apiError && apiError.response) {
          const status = apiError.response.status;
          
          if (status === 429) {
            return { valid: false, message: 'Too many verification requests. Please try again later.' };
          } else if (status === 404) {
            return { valid: false, message: 'GST number not found in the database' };
          } else if (status === 401 || status === 403) {
            this.logger.error('API authentication error', apiError.stack);
            return { valid: false, message: 'Verification service authentication error' };
          } else {
            this.logger.error(`API error: ${apiError.message}`, apiError.stack);
            return { valid: false, message: 'External verification service error' };
          }
        }
        
        throw apiError; // Re-throw unexpected errors
      }
    } catch (error: any) {
      this.logger.error(`GST verification error: ${error.message}`, error.stack);
      
      // Provide more specific error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return { valid: false, message: 'Unable to connect to verification service. Please try again later.' };
      } else if (error.code === 'ETIMEDOUT') {
        return { valid: false, message: 'Verification service timeout. Please try again later.' };
      }
      
      return { valid: false, message: 'Verification service unavailable. Please try again later.' };
    }
  }

  /**
   * Verify if a PAN number is valid by checking with the NSDL/Income Tax database
   * Note: This is a placeholder. You need to register with Pan verification services
   * and replace with actual API credentials
   */
  async verifyPAN(panNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying PAN: ${panNumber}`);
      
      // First, check format before making API call
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber)) {
        return { valid: false, message: 'Invalid PAN format' };
      }
      
      // Simulate API call for development
      try {
        // PAN validation logic:
        // For development, check 4th character which has meaning:
        // P: Individual, F: Firm, C: Company, H: HUF, etc.
        const entityCode = panNumber.charAt(3);
        const validEntityCodes = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
        
        if (!validEntityCodes.includes(entityCode)) {
          return { valid: false, message: 'Invalid entity code in PAN' };
        }
        
        // For development, return success for well-formed PAN numbers
        return { valid: true, message: 'PAN number verified successfully' };
      } catch (apiError: any) {
        // Handle API-specific errors by checking response property
        if (apiError && apiError.response) {
          const status = apiError.response.status;
          
          if (status === 429) {
            return { valid: false, message: 'Too many verification requests. Please try again later.' };
          } else if (status === 404) {
            return { valid: false, message: 'PAN number not found in the database' };
          } else if (status === 401 || status === 403) {
            this.logger.error('API authentication error', apiError.stack);
            return { valid: false, message: 'Verification service authentication error' };
          } else {
            this.logger.error(`API error: ${apiError.message}`, apiError.stack);
            return { valid: false, message: 'External verification service error' };
          }
        }
        
        throw apiError; // Re-throw unexpected errors
      }
    } catch (error: any) {
      this.logger.error(`PAN verification error: ${error.message}`, error.stack);
      
      // Provide more specific error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return { valid: false, message: 'Unable to connect to verification service. Please try again later.' };
      } else if (error.code === 'ETIMEDOUT') {
        return { valid: false, message: 'Verification service timeout. Please try again later.' };
      }
      
      return { valid: false, message: 'Verification service unavailable. Please try again later.' };
    }
  }

  /**
   * Verify if a CIN number is valid by checking with the MCA database
   * Note: This is a placeholder. You need to register with MCA services
   * and replace with actual API credentials
   */
  async verifyCIN(cinNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying CIN: ${cinNumber}`);
      
      // First, check format before making API call
      const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
      if (!cinRegex.test(cinNumber)) {
        return { valid: false, message: 'Invalid CIN format' };
      }
      
      // Simulate API call for development
      try {
        // CIN validation logic:
        // 1. First char: Company type (U for private, L for public)
        const companyType = cinNumber.charAt(0);
        if (companyType !== 'U' && companyType !== 'L') {
          return { valid: false, message: 'Invalid company type in CIN' };
        }
        
        // 2. Next 5 digits: ROC code
        // 3. Next 2 chars: State code
        const stateCode = cinNumber.substring(6, 8);
        const validStateCodes = ['MH', 'DL', 'KA', 'TN', 'WB', 'UP', 'GJ', 'AP', 'TG', 'HR'];
        
        if (!validStateCodes.includes(stateCode)) {
          return { valid: false, message: 'Invalid state code in CIN' };
        }
        
        // 4. Next 4 digits: Year of registration
        const yearOfRegistration = parseInt(cinNumber.substring(8, 12));
        const currentYear = new Date().getFullYear();
        
        if (yearOfRegistration < 1990 || yearOfRegistration > currentYear) {
          return { valid: false, message: 'Invalid registration year in CIN' };
        }
        
        // 5. Next 3 chars: Entity type
        const entityType = cinNumber.substring(12, 15);
        const validEntityTypes = ['PLC', 'PTC', 'NPL', 'FTC', 'SGC', 'GAP', 'FLC'];
        
        if (!validEntityTypes.includes(entityType)) {
          return { valid: false, message: 'Invalid entity type in CIN' };
        }
        
        // For development, return success for well-formed CIN numbers
        return { valid: true, message: 'CIN number verified successfully' };
      } catch (apiError: any) {
        // Handle API-specific errors by checking response property
        if (apiError && apiError.response) {
          const status = apiError.response.status;
          
          if (status === 429) {
            return { valid: false, message: 'Too many verification requests. Please try again later.' };
          } else if (status === 404) {
            return { valid: false, message: 'CIN number not found in the database' };
          } else if (status === 401 || status === 403) {
            this.logger.error('API authentication error', apiError.stack);
            return { valid: false, message: 'Verification service authentication error' };
          } else {
            this.logger.error(`API error: ${apiError.message}`, apiError.stack);
            return { valid: false, message: 'External verification service error' };
          }
        }
        
        throw apiError; // Re-throw unexpected errors
      }
    } catch (error: any) {
      this.logger.error(`CIN verification error: ${error.message}`, error.stack);
      
      // Provide more specific error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return { valid: false, message: 'Unable to connect to verification service. Please try again later.' };
      } else if (error.code === 'ETIMEDOUT') {
        return { valid: false, message: 'Verification service timeout. Please try again later.' };
      }
      
      return { valid: false, message: 'Verification service unavailable. Please try again later.' };
    }
  }
} 