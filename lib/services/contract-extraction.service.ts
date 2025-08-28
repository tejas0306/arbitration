// Contract Extraction Service - AI-Powered Contract Analysis

/**
 * This service handles AI-powered contract data extraction and transformation.
 * 
 * FEATURES:
 * - OpenAI GPT-4 powered contract analysis
 * - Automatic party detection and information extraction
 * - Clause identification and categorization
 * - Legal document structure analysis
 * - Smart form pre-filling based on extracted data
 * 
 * Status: Fully integrated with OpenAI API
 */

import { getApiUrl } from '@/lib/config';

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
        cin?: string;
        pan?: string;
        gst?: string;
      };
      party2?: {
        name?: string;
        type?: 'individual' | 'company';
        address?: string;
        email?: string;
        phone?: string;
        designation?: string;
        cin?: string;
        pan?: string;
        gst?: string;
      };
      additionalParties?: Array<{
        name?: string;
        type?: 'individual' | 'company';
        role?: string;
        address?: string;
        email?: string;
        phone?: string;
        cin?: string;
        pan?: string;
        gst?: string;
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
    
    // Legal and Arbitration Clauses
    legal?: {
      governingLaw?: string;
      jurisdiction?: string;
      arbitrationClause?: string;
      arbitrationSeat?: string;
      arbitrationLanguage?: string;
      mediationClause?: string;
      penaltyClauses?: Array<{
        clauseNumber: string;
        description: string;
        penaltyDetails: string;
      }>;
      terminationClauses?: Array<{
        condition: string;
        noticePeriod?: string;
        penalties?: string;
      }>;
    };
    
    // Obligations and Responsibilities
    obligations?: {
      party1Obligations?: Array<{
        clauseNumber: string;
        description: string;
        clauseText: string;
        timeline?: string;
        deliverable?: string;
      }>;
      party2Obligations?: Array<{
        clauseNumber: string;
        description: string;
        clauseText: string;
        timeline?: string;
        deliverable?: string;
      }>;
    };
    
    // Additional Contract Details
    additional?: {
      confidentialityClause?: string;
      forceManjeureClause?: string;
      intellectualPropertyClauses?: string[];
      complianceRequirements?: string[];
      reportingRequirements?: string[];
    };
  };
  error?: string;
  fileId?: string; // OpenAI file ID for reference
}

interface AIContractData {
  agreementDate: string;
  placeOfSigning: string;
  supporting_documents: string[];
  parties: Array<{
    name: string;
    address: string;
    phone: string;
    email: string;
    CIN: string;
    PAN: string;
    GST: string;
    obligations: Array<{
      clauseNumber: string;
      description: string;
      clauseText: string;
    }>;
  }>;
  penalty_clauses: Array<{
    clauseNumber: string;
    description: string;
    penaltyDetails: string;
  }>;
  arbitration_clause: {
    amicable_settlement: string;
    arbitration: string;
    arbitral_tribunal: string;
    final_and_binding: string;
    seat_and_venue: string;
    language: string;
    costs: string;
  };
  clauses: Array<{
    clauseNumber: string;
    description: string;
    clauseText: string;
  }>;
}

interface ArbitrationFormData {
  type: string;
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gst?: string;
  pan?: string;
  cin?: string;
  arbitrationAgreement: {
    agreementDate: string;
    placeOfSigning: string;
    arbitrationClause: string;
    language: string;
    seatAndVenue: string;
  };
  disputeDetails: {
    natureOfDispute: string;
    amountInDispute: string;
    disputeDescription: string;
  };
  respondents: Array<{
    type: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    gst?: string;
    pan?: string;
    cin?: string;
  }>;
}

export class ContractExtractionService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = getApiUrl('');
  }

  /**
   * Upload file to AI for analysis
   */
  async uploadFileToAI(file: File): Promise<{ fileId: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/arbitration/uploadFileToAI', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file to AI:', error);
      throw error;
    }
  }

  /**
   * Generate AI analysis response for uploaded file
   */
  async generateAIResponse(fileId: string): Promise<AIContractData> {
    try {
      const response = await fetch('/api/arbitration/generateAIResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return typeof result === 'string' ? JSON.parse(result) : result;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Read AI analysis results from file
   */
  async readAIResponseFromFile(fileId: string): Promise<AIContractData> {
    try {
      const response = await fetch(`/api/arbitration/readAIResponse/${fileId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to read AI response: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error reading AI response from file:', error);
      throw error;
    }
  }

  /**
   * Complete AI-powered contract extraction workflow
   */
  async extractFromContract(file: File): Promise<ContractExtractionResult> {
    try {
      console.log('🤖 Starting AI-powered contract extraction...');
      
      // Step 1: Upload file to AI
      const uploadResult = await this.uploadFileToAI(file);
      console.log('📁 File uploaded to AI with ID:', uploadResult.fileId);

      // Step 2: Generate AI analysis
      let aiData: AIContractData;
      try {
        aiData = await this.generateAIResponse(uploadResult.fileId);
        console.log('🎯 AI analysis completed successfully');
      } catch (error) {
        console.warn('⚠️ AI analysis failed, trying to read from file...');
        aiData = await this.readAIResponseFromFile(uploadResult.fileId);
        console.log('📄 Retrieved AI analysis from file');
      }

      // Step 3: Transform AI data to our format
      const extractedData = this.transformAIDataToContractFormat(aiData);

      return {
        success: true,
        extractedData,
        fileId: uploadResult.fileId
      };

    } catch (error) {
      console.error('❌ Contract extraction failed:', error);
      return {
        success: false,
        extractedData: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Transform AI extracted data to our contract format
   */
  private transformAIDataToContractFormat(aiData: AIContractData): ContractExtractionResult['extractedData'] {
    const parties = aiData.parties || [];
    
    return {
      contractDate: aiData.agreementDate,
      parties: {
        party1: parties[0] ? {
          name: parties[0].name,
          type: this.detectPartyType(parties[0]),
          address: parties[0].address,
          email: parties[0].email,
          phone: parties[0].phone,
          cin: parties[0].CIN,
          pan: parties[0].PAN,
          gst: parties[0].GST,
        } : undefined,
        party2: parties[1] ? {
          name: parties[1].name,
          type: this.detectPartyType(parties[1]),
          address: parties[1].address,
          email: parties[1].email,
          phone: parties[1].phone,
          cin: parties[1].CIN,
          pan: parties[1].PAN,
          gst: parties[1].GST,
        } : undefined,
        additionalParties: parties.slice(2).map(party => ({
          name: party.name,
          type: this.detectPartyType(party),
          address: party.address,
          email: party.email,
          phone: party.phone,
          cin: party.CIN,
          pan: party.PAN,
          gst: party.GST,
          role: 'Additional Party'
        }))
      },
      legal: {
        arbitrationClause: aiData.arbitration_clause?.arbitration,
        arbitrationSeat: aiData.arbitration_clause?.seat_and_venue,
        arbitrationLanguage: aiData.arbitration_clause?.language,
        penaltyClauses: aiData.penalty_clauses || [],
        mediationClause: aiData.arbitration_clause?.amicable_settlement,
      },
      obligations: {
        party1Obligations: parties[0]?.obligations || [],
        party2Obligations: parties[1]?.obligations || [],
      },
      additional: {
        confidentialityClause: this.extractConfidentialityClause(aiData.clauses || []),
        forceManjeureClause: this.extractForceMajeureClause(aiData.clauses || []),
        intellectualPropertyClauses: this.extractIPClauses(aiData.clauses || []),
      }
    };
  }

  /**
   * Transform AI data to arbitration form format
   */
  transformToArbitrationForm(aiData: AIContractData): Partial<ArbitrationFormData> {
    console.log('🔄 Transforming AI data:', aiData);
    
    // Handle different JSON structures
    let parties: any[] = aiData.parties || [];
    let primaryParty: any = parties[0];
    
    console.log('🔍 Initial parties:', parties);
    console.log('🔍 Initial parties length:', parties.length);
    console.log('🔍 Initial primaryParty:', primaryParty);
    console.log('🔍 Initial primaryParty type:', typeof primaryParty);
    
    // If parties is not an array, try to extract from different structures
    if (!Array.isArray(parties)) {
      console.log('🔍 Parties is not an array, trying alternative structure');
      if (aiData.parties && typeof aiData.parties === 'object' && 'party1' in aiData.parties) {
        const partyData = aiData.parties as any;
        parties = [partyData.party1, partyData.party2].filter(Boolean);
        primaryParty = parties[0];
        console.log('🔍 Extracted from party1/party2 structure:', parties);
      } else {
        parties = [];
        primaryParty = undefined;
        console.log('🔍 No alternative structure found');
      }
    }
    
    console.log('🔍 Before cleaning - parties:', parties);
    console.log('🔍 Before cleaning - primaryParty:', primaryParty);
    
    // Clean up malformed party data
    console.log('🔍 Starting party cleaning process...');
    parties = parties.map((party, index) => {
      console.log(`🔍 Processing party ${index}:`, party);
      if (typeof party === 'object' && party !== null) {
        const cleanedParty: any = {};
        Object.entries(party).forEach(([key, value]) => {
          // Remove malformed keys like "phone:null,"
          if (!key.includes(':') && !key.includes(',')) {
            cleanedParty[key] = value;
          } else {
            console.log(`🔍 Skipping malformed key: "${key}"`);
          }
        });
        console.log(`🔍 Cleaned party ${index}:`, cleanedParty);
        return cleanedParty;
      }
      console.log(`🔍 Party ${index} is not an object or is null:`, party);
      return party;
    });
    
    // Update primaryParty reference after cleaning
    primaryParty = parties[0];
    
    console.log('🔍 After cleaning - parties:', parties);
    console.log('🔍 After cleaning - primaryParty:', primaryParty);
    
    if (!primaryParty) {
      console.log('⚠️ No primary party found in data');
      return {};
    }

    // Parse address for city, state extraction
    const addressParts = this.parseAddress(primaryParty.address || '');

    const result = {
      type: this.detectPartyType(primaryParty) === 'company' ? 'COMPANY' : 'INDIVIDUAL',
      name: primaryParty.name || 'Primary Party',
      email: primaryParty.email || '',
      phone: primaryParty.phone || '',
      address1: addressParts.address1 || primaryParty.address || '',
      address2: addressParts.address2 || '',
      city: addressParts.city || '',
      state: addressParts.state || '',
      country: addressParts.country || 'India',
      pincode: addressParts.pincode || '',
      gst: primaryParty.GST || primaryParty.gst || '',
      pan: primaryParty.PAN || primaryParty.pan || '',
      cin: primaryParty.CIN || primaryParty.cin || '',
      arbitrationAgreement: {
        agreementDate: aiData.agreementDate || '',
        placeOfSigning: aiData.placeOfSigning || '',
        arbitrationClause: this.extractArbitrationClause(aiData.arbitration_clause),
        language: this.extractArbitrationLanguage(aiData.arbitration_clause),
        seatAndVenue: this.extractArbitrationSeat(aiData.arbitration_clause),
      },
      disputeDetails: {
        natureOfDispute: this.extractDisputeNature(aiData.parties?.flatMap(party => party.obligations || []) || []),
        amountInDispute: this.extractDisputeAmount(aiData.parties?.flatMap(party => party.obligations || []) || []),
        disputeDescription: this.generateDisputeDescription(aiData),
      },
      respondents: parties.slice(1).map(party => ({
        type: this.detectPartyType(party) === 'company' ? 'COMPANY' : 'INDIVIDUAL',
        name: party.name || '',
        email: party.email || '',
        phone: party.phone || '',
        address: party.address || '',
        gst: party.GST || party.gst || '',
        pan: party.PAN || party.pan || '',
        cin: party.CIN || party.cin || '',
      }))
    };

    console.log('✅ Transformed data:', result);
    return result;
  }

  // Helper methods
  private detectPartyType(party: any): 'individual' | 'company' {
    return (party.CIN || party.GST) ? 'company' : 'individual';
  }

  private parseAddress(address: string) {
    if (!address || typeof address !== 'string') {
      return {
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      };
    }
    
    // Simple address parsing - can be enhanced
    const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      return {
        address1: address,
        address2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: ''
      };
    }
    
    return {
      address1: parts[0] || '',
      address2: parts[1] || '',
      city: parts[Math.max(0, parts.length - 3)] || '',
      state: parts[Math.max(0, parts.length - 2)] || '',
      country: parts[parts.length - 1] || 'India',
      pincode: address.match(/\d{6}/)?.[0] || ''
    };
  }

  private extractConfidentialityClause(clauses: any[]): string {
    return clauses.find(clause => 
      clause.description?.toLowerCase().includes('confidential') ||
      clause.clauseText?.toLowerCase().includes('confidential')
    )?.clauseText || '';
  }

  private extractForceMajeureClause(clauses: any[]): string {
    return clauses.find(clause => 
      clause.description?.toLowerCase().includes('force majeure') ||
      clause.clauseText?.toLowerCase().includes('force majeure')
    )?.clauseText || '';
  }

  private extractIPClauses(clauses: any[]): string[] {
    return clauses
      .filter(clause => 
        clause.description?.toLowerCase().includes('intellectual property') ||
        clause.description?.toLowerCase().includes('copyright') ||
        clause.description?.toLowerCase().includes('patent') ||
        clause.clauseText?.toLowerCase().includes('intellectual property')
      )
      .map(clause => clause.clauseText);
  }

  private extractDisputeNature(clauses: any[]): string {
    // Look for clauses that might indicate dispute types
    const disputeRelatedClauses = clauses.filter(clause =>
      clause.description?.toLowerCase().includes('breach') ||
      clause.description?.toLowerCase().includes('violation') ||
      clause.description?.toLowerCase().includes('default')
    );
    
    if (disputeRelatedClauses.length > 0) {
      return disputeRelatedClauses.map(clause => clause.description).join('; ');
    }
    
    return 'Contract dispute';
  }

  private extractDisputeAmount(clauses: any[]): string {
    // Look for financial amounts in clauses
    const amountRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i;
    
    for (const clause of clauses) {
      const match = clause.clauseText?.match(amountRegex);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  }

  private extractArbitrationClause(arbitrationClause: any): string {
    if (!arbitrationClause) return '';
    
    if (typeof arbitrationClause === 'string') {
      return arbitrationClause;
    }
    
    return arbitrationClause.arbitration || 
           arbitrationClause.arbitral_tribunal || 
           arbitrationClause.amicable_settlement || 
           '';
  }

  private extractArbitrationLanguage(arbitrationClause: any): string {
    if (!arbitrationClause || typeof arbitrationClause === 'string') {
      return 'English';
    }
    
    return arbitrationClause.language || 'English';
  }

  private extractArbitrationSeat(arbitrationClause: any): string {
    if (!arbitrationClause || typeof arbitrationClause === 'string') {
      return '';
    }
    
    return arbitrationClause.seat_and_venue || 
           arbitrationClause.seatAndVenue || 
           arbitrationClause.seat_and_venue || 
           '';
  }

  private generateDisputeDescription(aiData: AIContractData): string {
    const obligations = aiData.parties?.flatMap(party => party.obligations || []) || [];
    const penaltyClauses = aiData.penalty_clauses || [];
    
    let description = `Dispute arising from the agreement dated ${aiData.agreementDate}`;
    
    if (obligations.length > 0) {
      description += ` involving obligations related to: ${obligations.map(o => o.description).join(', ')}`;
    }
    
    if (penaltyClauses.length > 0) {
      description += ` with potential penalties under clauses: ${penaltyClauses.map(p => p.clauseNumber).join(', ')}`;
    }
    
    return description;
  }

  /**
   * Validate extracted data completeness
   */
  validateExtractedData(data: ContractExtractionResult['extractedData']): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Check essential fields
    if (!data.parties?.party1?.name) {
      missingFields.push('Primary party name');
    }
    
    if (!data.parties?.party1?.email) {
      warnings.push('Primary party email not found');
    }
    
    if (!data.legal?.arbitrationClause) {
      warnings.push('Arbitration clause not clearly identified');
    }
    
    if (!data.contractDate) {
      missingFields.push('Contract date');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  }
}

// Export singleton instance
export const contractExtractionService = new ContractExtractionService();