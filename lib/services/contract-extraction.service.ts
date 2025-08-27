// Contract Extraction Service - Ready for Rakesh's API Integration
// This service provides a standardized interface for contract data extraction

export interface ContractExtractionResult {
  success: boolean;
  extractedData: {
    // Basic Contract Information
    contractType?: string;
    contractDate?: string;
    effectiveDate?: string;
    expirationDate?: string;
    
    // Parties Information
    parties?: {
      party1?: {
        name?: string;
        type?: 'individual' | 'company';
        address?: string;
        email?: string;
        phone?: string;
        designation?: string;
      };
      party2?: {
        name?: string;
        type?: 'individual' | 'company';
        address?: string;
        email?: string;
        phone?: string;
        designation?: string;
      };
      additionalParties?: Array<{
        name?: string;
        type?: 'individual' | 'company';
        role?: string;
        address?: string;
      }>;
    };
    
    // Financial Information
    financial?: {
      totalValue?: string;
      currency?: string;
      paymentTerms?: string;
      advanceAmount?: string;
      milestonePayments?: Array<{
        milestone: string;
        amount: string;
        dueDate?: string;
      }>;
    };
    
    // Dispute Resolution
    disputeResolution?: {
      hasArbitrationClause?: boolean;
      arbitrationClause?: string;
      arbitratorSelection?: 'mutual' | 'institutional' | 'specified';
      arbitrationSeat?: string;
      governingLaw?: string;
      jurisdiction?: string;
    };
    
    // Key Terms and Conditions
    keyTerms?: {
      deliverables?: string[];
      timeline?: string;
      responsibilities?: {
        party1?: string[];
        party2?: string[];
      };
      penalties?: string[];
      terminationClauses?: string[];
    };
    
    // Issues and Risk Areas
    potentialIssues?: Array<{
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      recommendation?: string;
    }>;
  };
  confidence: number; // 0-100
  processingTime: number; // milliseconds
  error?: string;
}

export interface ContractExtractionRequest {
  fileBuffer: Buffer;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'txt' | 'image';
  extractionOptions?: {
    focusAreas?: string[]; // ['parties', 'financial', 'disputes', 'terms']
    language?: string; // 'en', 'hi', etc.
    includeConfidence?: boolean;
    generateSummary?: boolean;
  };
}

class ContractExtractionService {
  private apiEndpoint: string;
  private apiKey: string;
  
  constructor() {
    // These will be set by Rakesh when API is ready
    this.apiEndpoint = process.env.CONTRACT_EXTRACTION_API_URL || 'https://api.contractextraction.com/v1';
    this.apiKey = process.env.CONTRACT_EXTRACTION_API_KEY || '';
  }

  /**
   * Extract contract data using Rakesh's API
   * This is the main integration point
   */
  async extractContractData(request: ContractExtractionRequest): Promise<ContractExtractionResult> {
    try {
      const startTime = Date.now();
      
      // TODO: Replace this mock implementation with actual API call to Rakesh's service
      if (this.apiKey && this.apiEndpoint.includes('contractextraction.com')) {
        // Real API integration
        return await this.callRakeshAPI(request);
      } else {
        // Mock implementation for development
        return await this.mockExtraction(request);
      }
      
    } catch (error) {
      console.error('Contract extraction failed:', error);
      return {
        success: false,
        extractedData: {},
        confidence: 0,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Actual API call to Rakesh's service
   * This method will be implemented once Rakesh provides the API details
   */
  private async callRakeshAPI(request: ContractExtractionRequest): Promise<ContractExtractionResult> {
    const formData = new FormData();
    
    // Convert buffer to blob for API upload
    const blob = new Blob([request.fileBuffer], { 
      type: this.getMimeType(request.fileType) 
    });
    
    formData.append('file', blob, request.fileName);
    formData.append('options', JSON.stringify(request.extractionOptions || {}));

    const response = await fetch(`${this.apiEndpoint}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        // Note: Don't set Content-Type when using FormData
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json();
    
    // Transform Rakesh's API response to our standard format
    return this.transformAPIResponse(apiResult);
  }

  /**
   * Development implementation - processes actual documents using OCR
   * This will be replaced with Rakesh's API once available
   */
  private async mockExtraction(request: ContractExtractionRequest): Promise<ContractExtractionResult> {
    const startTime = Date.now();
    
    try {
      // For now, return a structured response indicating that Rakesh's API is needed
      return {
        success: false,
        extractedData: {},
        confidence: 0,
        processingTime: Date.now() - startTime,
        error: 'Contract extraction API not configured. Please provide Rakesh\'s API endpoint and credentials in environment variables.'
      };
    } catch (error) {
      return {
        success: false,
        extractedData: {},
        confidence: 0,
        processingTime: Date.now() - startTime,
        error: 'Contract extraction failed. API integration required.'
      };
    }
  }

  /**
   * Transform Rakesh's API response format to our standard format
   */
  private transformAPIResponse(apiResponse: any): ContractExtractionResult {
    // This will be implemented based on Rakesh's actual API response format
    // For now, assuming the API response matches our format
    return {
      success: apiResponse.success || true,
      extractedData: apiResponse.data || apiResponse.extractedData || {},
      confidence: apiResponse.confidence || 90,
      processingTime: apiResponse.processingTime || 0,
      error: apiResponse.error
    };
  }

  /**
   * Generate questionnaire pre-fill suggestions based on extracted data
   */
  async generateQuestionnaireSuggestions(extractedData: any): Promise<{
    suggestions: Record<string, any>;
    fieldsToReview: string[];
    confidence: number;
  }> {
    const suggestions: Record<string, any> = {};
    const fieldsToReview: string[] = [];
    
    // Map extracted data to arbitration form fields
    if (extractedData.parties?.party1) {
      suggestions['claimant.name'] = extractedData.parties.party1.name;
      suggestions['claimant.email'] = extractedData.parties.party1.email;
      suggestions['claimant.phone'] = extractedData.parties.party1.phone;
      suggestions['claimant.address'] = extractedData.parties.party1.address;
      suggestions['claimant.type'] = extractedData.parties.party1.type === 'company' ? 'Corporate' : 'Individual';
    }

    if (extractedData.parties?.party2) {
      suggestions['respondents.0.name'] = extractedData.parties.party2.name;
      suggestions['respondents.0.email'] = extractedData.parties.party2.email;
      suggestions['respondents.0.phone'] = extractedData.parties.party2.phone;
      suggestions['respondents.0.address'] = extractedData.parties.party2.address;
      suggestions['respondents.0.type'] = extractedData.parties.party2.type === 'company' ? 'Corporate' : 'Individual';
    }

    if (extractedData.disputeResolution?.hasArbitrationClause) {
      suggestions['arbitrationAgreement.agreementType'] = 'contractual';
      suggestions['arbitrationAgreement.clauseText'] = extractedData.disputeResolution.arbitrationClause;
      suggestions['arbitrationAgreement.arbitratorSelection'] = extractedData.disputeResolution.arbitratorSelection;
    }

    if (extractedData.financial?.totalValue) {
      suggestions['payment.totalClaimAmount'] = extractedData.financial.totalValue.replace(/[₹,]/g, '');
    }

    // Suggest dispute categories based on contract type
    if (extractedData.contractType) {
      if (extractedData.contractType.toLowerCase().includes('service')) {
        suggestions['natureOfDispute.category'] = 'service_related';
      } else if (extractedData.contractType.toLowerCase().includes('purchase')) {
        suggestions['natureOfDispute.category'] = 'commercial';
      }
    }

    // Identify fields that need review
    if (extractedData.potentialIssues?.length > 0) {
      fieldsToReview.push('disputeDescriptions');
      fieldsToReview.push('prayers');
    }

    if (!extractedData.disputeResolution?.hasArbitrationClause) {
      fieldsToReview.push('arbitrationAgreement');
    }

    return {
      suggestions,
      fieldsToReview,
      confidence: extractedData.confidence || 80
    };
  }

  /**
   * Generate primary facie advice based on contract analysis
   */
  async generatePrimaryFacieAdvice(extractedData: any): Promise<{
    advice: string[];
    legalIssues: string[];
    strengthsWeaknesses: {
      strengths: string[];
      weaknesses: string[];
    };
    recommendedActions: string[];
  }> {
    const advice: string[] = [];
    const legalIssues: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendedActions: string[] = [];

    // Analyze arbitration clause
    if (extractedData.disputeResolution?.hasArbitrationClause) {
      strengths.push('Contract contains an arbitration clause, which supports arbitral proceedings');
      advice.push('The arbitration clause in your contract provides a strong legal basis for arbitral proceedings');
    } else {
      weaknesses.push('No arbitration clause found in the contract');
      legalIssues.push('Absence of arbitration clause may require establishing jurisdiction through other means');
      recommendedActions.push('Consider whether parties have agreed to arbitration through other documents or conduct');
    }

    // Analyze payment terms
    if (extractedData.financial?.paymentTerms) {
      if (extractedData.financial.paymentTerms.includes('vague') || 
          extractedData.financial.paymentTerms.includes('unclear')) {
        weaknesses.push('Payment terms are not clearly defined');
        recommendedActions.push('Gather additional evidence of agreed payment terms');
      } else {
        strengths.push('Contract has defined payment terms');
      }
    }

    // Analyze potential issues
    if (extractedData.potentialIssues?.length > 0) {
      extractedData.potentialIssues.forEach((issue: any) => {
        legalIssues.push(`${issue.category}: ${issue.description}`);
        if (issue.recommendation) {
          recommendedActions.push(issue.recommendation);
        }
      });
    }

    // General advice based on contract type
    if (extractedData.contractType) {
      advice.push(`This appears to be a ${extractedData.contractType}. Ensure all relevant documentation related to this type of agreement is included in your submission.`);
    }

    return {
      advice,
      legalIssues,
      strengthsWeaknesses: { strengths, weaknesses },
      recommendedActions
    };
  }

  private getMimeType(fileType: string): string {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'image': 'image/jpeg'
    };
    return mimeTypes[fileType] || 'application/octet-stream';
  }
}

export const contractExtractionService = new ContractExtractionService();
