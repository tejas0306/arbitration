import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Define our own AxiosError interface since the imported one is causing issues
interface AxiosErrorResponse {
  response?: {
    status: number;
    data: any;
  };
  message: string;
  stack?: string;
}

// Define response interfaces for verification APIs
interface VerificationApiResponse {
  valid: boolean;
  message?: string;
  [key: string]: any; // Allow for additional properties
}

// Load environment variables
dotenv.config();

// API keys and endpoints would be stored in environment variables
const GST_API_KEY = process.env.GST_API_KEY || '';
const PAN_API_KEY = process.env.PAN_API_KEY || '';
const CIN_API_KEY = process.env.CIN_API_KEY || '';

// External API endpoints
const GST_API_ENDPOINT = process.env.GST_API_ENDPOINT || 'https://api.gstvalidation.com/v1/validate';
const PAN_API_ENDPOINT = process.env.PAN_API_ENDPOINT || 'https://api.panvalidation.com/v1/validate';
const CIN_API_ENDPOINT = process.env.CIN_API_ENDPOINT || 'https://api.cinvalidation.com/v1/validate';

// CIN Validation Regex
const CIN_REGEX = /^[LU][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  /**
   * Verify if a GST number is valid by checking with the GST Portal
   * Uses an external API service to validate the GST number
   */
  async verifyGST(gstNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying GST: ${gstNumber}`);
      
      // First, check format before making API call
      // GSTIN format: 2 digits (state code) + 10 chars (PAN) + 1 digit (entity) + 1 Z + 1 char (checksum)
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return { valid: false, message: 'Invalid GST format' };
      }
      
      // Validate state code (first 2 digits)
      const stateCode = parseInt(gstNumber.substring(0, 2));
      // Valid state codes range from 01 to 38
      if (stateCode < 1 || stateCode > 38) {
        return { valid: false, message: 'Invalid state code in GST number' };
      }
      
      // Extract and validate the PAN portion (characters 3-12)
      const panPortion = gstNumber.substring(2, 12);
      if (!this.validatePANFormat(panPortion)) {
        return { valid: false, message: 'Invalid PAN portion in GST number' };
      }
      
      // Check if checksum is valid (would require actual GST checksum algorithm implementation)
      // For now, we'll consider it valid if format checks pass and proceed to check with API if available
      
      // Check if in production mode with API key
      if (GST_API_KEY) {
        try {
          // Call the actual GST verification API
          const response = await axios.post<VerificationApiResponse>(GST_API_ENDPOINT, 
            { gstNumber }, 
            { 
              headers: { 
                'Authorization': `Bearer ${GST_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000 // 10 seconds timeout
            }
          );
          
          // Check response for validity - API response should include a valid field
          if (response.data && response.data.valid === true) {
            return { 
              valid: true, 
              message: 'GST number verified successfully'
            };
          } else {
            return { 
              valid: false, 
              message: response.data?.message || 'GST number verification failed'
            };
          }
        } catch (apiError: any) {
          // Handle API-specific errors by checking response property
          if (apiError.response) {
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
      } else {
        // In development mode or without API key, use enhanced validation logic
        this.logger.warn('No GST_API_KEY provided. Using fallback validation logic.');
        
        // Additional validation logic for checksum could be added here
        // In production, you should connect to a proper GSTIN verification service
        
        // Try to calculate the checksum (simplified implementation)
        // Note: This is a simplified version and not the official algorithm
        const checksumChar = gstNumber.charAt(14);
        const inputChars = gstNumber.substring(0, 14);
        
        // For now, returning valid if format is correct
        // A full implementation would verify with an actual government database
        return { 
          valid: true, 
          message: 'GST number format is valid'
        };
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
   * Uses an external API service to validate the PAN number
   */
  async verifyPAN(panNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying PAN: ${panNumber}`);
      
      // First, check format before making API call
      if (!this.validatePANFormat(panNumber)) {
        return { valid: false, message: 'Invalid PAN format' };
      }
      
      // Check if in production mode with API key
      if (PAN_API_KEY) {
        try {
          // Call the actual PAN verification API
          const response = await axios.post<VerificationApiResponse>(PAN_API_ENDPOINT,
            { panNumber },
            {
              headers: {
                'Authorization': `Bearer ${PAN_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000 // 10 seconds timeout
            }
          );
          
          // Check response for validity
          if (response.data && response.data.valid === true) {
            return {
              valid: true,
              message: 'PAN number verified successfully'
            };
          } else {
            return {
              valid: false,
              message: response.data?.message || 'PAN number verification failed'
            };
          }
        } catch (apiError: any) {
          // Handle API-specific errors by checking response property
          if (apiError.response) {
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
      } else {
        // In development mode or without API key, use enhanced validation logic
        this.logger.warn('No PAN_API_KEY provided. Using fallback validation logic.');
        
        // Perform additional PAN validation
        // For PAN, the 4th character has a specific meaning:
        // P: Individual, F: Firm, C: Company, H: HUF, etc.
        const entityCode = panNumber.charAt(3);
        const validEntityCodes = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
        
        if (!validEntityCodes.includes(entityCode)) {
          return { valid: false, message: 'Invalid entity code in PAN' };
        }
        
        // For now, returning valid if format is correct
        // A full implementation would verify with an actual government database
        return {
          valid: true,
          message: 'PAN number format is valid'
        };
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
   * Uses an external API service to validate the CIN number
   */
  async verifyCIN(cinNumber: string): Promise<{ valid: boolean; message?: string }> {
    try {
      this.logger.log(`Verifying CIN: ${cinNumber}`);
      
      // First, check format before making API call
      // CIN Format: 1 char (L/U) + 5 digits + 2 chars (state) + 4 digits (year) + 3 chars (company type) + 6 digits
      if (!CIN_REGEX.test(cinNumber)) {
        return { valid: false, message: 'Invalid CIN format' };
      }
      
      // Check if in production mode with API key
      if (CIN_API_KEY) {
        try {
          // Call the actual CIN verification API
          const response = await axios.post<VerificationApiResponse>(CIN_API_ENDPOINT,
            { cinNumber },
            {
              headers: {
                'Authorization': `Bearer ${CIN_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000 // 10 seconds timeout
            }
          );
          
          // Check response for validity
          if (response.data && response.data.valid === true) {
            return {
              valid: true,
              message: 'CIN number verified successfully'
            };
          } else {
            return {
              valid: false,
              message: response.data?.message || 'CIN number verification failed'
            };
          }
        } catch (apiError: any) {
          // Handle API-specific errors by checking response property
          if (apiError.response) {
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
      } else {
        // In development mode or without API key, use enhanced validation logic
        this.logger.warn('No CIN_API_KEY provided. Using fallback validation logic.');
        
        // 1. First char: Company type (U for unlisted/private, L for listed/public)
        const companyType = cinNumber.charAt(0);
        if (companyType !== 'U' && companyType !== 'L') {
          return { valid: false, message: 'Invalid company type in CIN' };
        }
        
        // 2. Next 5 digits: ROC code
        // We could validate ROC codes if we had a list, but skip for now
        
        // 3. Next 2 chars: State code
        const stateCode = cinNumber.substring(6, 8);
        const validStateCodes = ['MH', 'DL', 'KA', 'TN', 'WB', 'UP', 'GJ', 'AP', 'TG', 'HR', 
                                'MP', 'RJ', 'OR', 'KL', 'CH', 'PB', 'AS', 'JH', 'JK', 'HP', 
                                'UK', 'CT', 'BR', 'GA', 'NL', 'MN', 'ML', 'AR', 'TR', 'MZ', 
                                'SK', 'PY', 'LD', 'AN', 'DN'];
        
        if (!validStateCodes.includes(stateCode)) {
          return { valid: false, message: 'Invalid state code in CIN' };
        }
        
        // 4. Next 4 digits: Year of registration
        const yearOfRegistration = parseInt(cinNumber.substring(8, 12));
        const currentYear = new Date().getFullYear();
        
        if (yearOfRegistration < 1956 || yearOfRegistration > currentYear) {
          return { valid: false, message: 'Invalid registration year in CIN' };
        }
        
        // 5. Next 3 chars: Entity type
        const entityType = cinNumber.substring(12, 15);
        const validEntityTypes = ['PLC', 'PTC', 'NPL', 'FTC', 'SGC', 'GAP', 'FLC', 'ULL', 'GOI', 
                               'LLP', 'ULC', 'PVT', 'LTD', 'OPC'];
        
        if (!validEntityTypes.includes(entityType)) {
          return { valid: false, message: 'Invalid entity type in CIN' };
        }
        
        // For now, returning valid if format is correct
        // A full implementation would verify with an actual government database
        return {
          valid: true,
          message: 'CIN number format is valid'
        };
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

  /**
   * Helper method to validate PAN format
   * PAN Format: 5 letters + 4 digits + 1 letter
   */
  private validatePANFormat(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }
} 