import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DuplicateDetectionService, DuplicateCheckRequest, DuplicateCheckResult } from './duplicate-detection.service';
import { RespondentNotificationService } from '../respondent/respondent-notification.service';
import * as fs from 'fs';
import * as path from 'path';

// Store sequence in a JSON file to persist between restarts
const SEQUENCE_FILE = path.join(process.cwd(), 'data', 'case-sequence.json');

// Function to generate the next case ID with a sequential number
async function generateCaseId(): Promise<string> {
  try {
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read the current sequence number, or initialize if it doesn't exist
    let sequence = 1;
    if (fs.existsSync(SEQUENCE_FILE)) {
      const data = fs.readFileSync(SEQUENCE_FILE, 'utf8');
      const json = JSON.parse(data);
      sequence = json.sequence || 1;
    }
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Format the case ID: ADDS/ARB/{Year}/{Seven Digit Running Number}
    const caseId = `ADDS/ARB/${currentYear}/${String(sequence).padStart(7, '0')}`;
    
    // Update the sequence number for the next case
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ sequence: sequence + 1 }));
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    throw error;
  }
}

@Injectable()
export class ArbitrationService {
  constructor(
    private prisma: PrismaService,
    private duplicateDetectionService: DuplicateDetectionService,
    private respondentNotificationService: RespondentNotificationService
  ) {}

  // New method to check for duplicates before case creation
  async checkDuplicates(formData: any, userId: string): Promise<DuplicateCheckResult> {
    try {
      // Extract relevant data for duplicate checking
      const claimant = formData.claimant || {};
      const respondents = formData.respondents || [];
      const disputeDetails = formData.disputeDetails || {};
      
      // Use the first respondent for checking (most common case)
      const primaryRespondent = respondents[0] || {};
      
      const request: DuplicateCheckRequest = {
        claimantEmail: claimant.email,
        claimantName: claimant.name,
        claimantPhone: claimant.phone,
        respondentEmail: primaryRespondent.email,
        respondentName: primaryRespondent.name,
        respondentPhone: primaryRespondent.phone,
        disputeCategory: disputeDetails.disputeCategory,
        disputeSubCategory: disputeDetails.disputeSubCategory,
        disputeAmount: disputeDetails.disputeAmount ? parseFloat(disputeDetails.disputeAmount) : undefined,
        disputeDescription: disputeDetails.disputeDescription,
        userId: userId,
      };

      return await this.duplicateDetectionService.checkForDuplicates(request);
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // Don't fail the submission if duplicate check fails, just log and continue
      return {
        isDuplicate: false,
        score: 0,
        matchingCases: [],
        threshold: 0.8,
      };
    }
  }

  async create(data: any, userId: string, skipDuplicateCheck: boolean = false) {
    try {
      console.log('Processing arbitration data:', {
        ...data,
        files: data.files ? 'Files included' : 'No files'
      });
      
      // Check for duplicates unless explicitly skipped
      if (!skipDuplicateCheck) {
        const duplicateResult = await this.checkDuplicates(data, userId);
        
        if (duplicateResult.isDuplicate) {
          const error = new BadRequestException({
            message: 'Potential duplicate case detected',
            duplicateCheck: duplicateResult,
            code: 'DUPLICATE_CASE_DETECTED'
          });
          throw error;
        }
      }
      
      // Generate case number using the sequential function
      const caseNumber = await generateCaseId();
      
      // Extract file references from data.files
      const fileReferences = data.files || {};
      
      // Create documents structure to store file references
      const documents = {
        // File references related to claimant company documents
        companyDocs: {
          coi: fileReferences.coi || null,
          panCard: fileReferences.panCard || null, 
          gstCert: fileReferences.gstCert || null
        },
        // Supporting documents
        supportingDocuments: Object.keys(fileReferences)
          .filter(key => key.startsWith('supportingDocuments_'))
          .map(key => fileReferences[key]),
        // Evidence files
        evidenceFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('evidenceFiles_'))
          .map(key => fileReferences[key]),
        // Additional Claimants document files
        additionalClaimantsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('additionalClaimants.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Manager Details document files  
        managerDetailsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('managerDetails.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Respondent Details document files
        respondentsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('respondents.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {})
      };
      
      // Create the arbitration agreement structure
      const arbitrationAgreement = {
        ...data.arbitrationAgreement,
        agreementFile: fileReferences.agreementFile || null
      };
      
      // Create the final processed data structure that matches the Prisma schema
      // IMPORTANT: Persist full form structure and flattened fields for respondent views
      const processedData = {
        type: data.type,
        name: data.name,
        pincode: data.pincode,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        district: data.district,
        state: data.state,
        country: data.country,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phone: data.phone,
        gst: data.gst,
        pan: data.pan,
        cin: data.cin,
        additionalClaimants: data.additionalClaimants,
        respondents: data.respondents,
        arbitrationAgreement: arbitrationAgreement,
        // Keep disputeDetails and also store step-based fields below
        disputeDetails: data.disputeDetails || {},
        documents: documents,
        caseNumber,
        status: data.status || 'pending',
        isDraft: false, // When created through submit, it's not a draft
        lastEditedAt: new Date(),
        userId: userId, // Link to the user who created it
        // Persist respondent-facing JSON fields
        managerDetails: data.managerDetails || {},
        payment: data.payment || {},
        // Flattened String? fields for quick reads (store JSON where applicable)
        natureOfDispute: data.natureOfDispute ? JSON.stringify(data.natureOfDispute) : null,
        disputeDescription: data.disputeDescriptions ? JSON.stringify(data.disputeDescriptions) : null,
        // Note: Prisma schema has String? for these; store JSON string to preserve structure
        arguments: data.arguments ? JSON.stringify(data.arguments) : null,
        prayers: data.prayers ? JSON.stringify(data.prayers) : null,
        paymentAmount: (data.payment && data.payment.amount != null) ? String(data.payment.amount) : null,
        paymentDetails: (data.payment && data.payment.details != null) ? String(data.payment.details) : null,
        // Store complete form structure for flexible reads
        formData: {
          claimant: data.claimant || {
            type: data.type,
            name: data.name,
            email: data.email,
            phone: data.phone,
            phoneCountryCode: data.phoneCountryCode,
            address1: data.address1,
            address2: data.address2,
            city: data.city,
            district: data.district,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            gst: data.gst,
            pan: data.pan,
            cin: data.cin,
          },
          additionalClaimants: data.additionalClaimants || [],
          managerDetails: data.managerDetails || {},
          respondents: data.respondents || [],
          arbitrationAgreement: data.arbitrationAgreement || {},
          disputeDetails: data.disputeDetails || {},
          natureOfDispute: data.natureOfDispute || [],
          disputeDescriptions: data.disputeDescriptions || [],
          documents: data.documents || documents || {},
          prayers: data.prayers || {},
          arguments: data.arguments || {},
          payment: data.payment || {},
        },
      };
      
      console.log('Saving arbitration case with data:', {
        ...processedData,
        documents: 'Documents object included',
        status: processedData.status
      });
      
      const createdCase = await this.prisma.arbitration.create({
        data: processedData,
      });
      
      // After creating the case, send notifications to all respondents
      if (data.respondents && Array.isArray(data.respondents)) {
        console.log(`🔧 Creating RespondentCase entries for ${data.respondents.length} respondents`);
        
        for (const respondent of data.respondents) {
          if (respondent.email && respondent.name) {
            try {
              console.log(`🔧 Sending case notice to respondent: ${respondent.email}`);
              await this.respondentNotificationService.sendCaseNotice(
                createdCase.id,
                respondent.email,
                respondent.name
              );
            } catch (error) {
              console.error(`🔧 Error sending notice to respondent ${respondent.email}:`, error);
              // Don't fail the case creation if notification fails
            }
          }
        }
      }
      
      return createdCase;
    } catch (error) {
      console.error('Error creating arbitration case:', error);
      throw error;
    }
  }

  async saveDraft(data: any, userId: string) {
    try {
      // Extract file references from data.files
      const fileReferences = data.files || {};
      
      // Create documents structure to store file references
      const documents = {
        // File references related to claimant company documents
        companyDocs: {
          coi: fileReferences.coi || null,
          panCard: fileReferences.panCard || null, 
          gstCert: fileReferences.gstCert || null
        },
        // Supporting documents
        supportingDocuments: Object.keys(fileReferences)
          .filter(key => key.startsWith('supportingDocuments_'))
          .map(key => fileReferences[key]),
        // Evidence files
        evidenceFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('evidenceFiles_'))
          .map(key => fileReferences[key]),
        // NEW: DocumentsTabs files
        scannedDocuments: Object.keys(fileReferences)
          .filter(key => key.startsWith('scannedDoc_'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        affidavits: Object.keys(fileReferences)
          .filter(key => key.startsWith('affidavit_'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        electronicEvidence: Object.keys(fileReferences)
          .filter(key => key.startsWith('certificate_') || key.startsWith('supporting_files_'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Additional Claimants document files
        additionalClaimantsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('additionalClaimants.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Manager Details document files  
        managerDetailsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('managerDetails.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Respondent Details document files
        respondentsFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('respondents.'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // LEGACY: Documents evidence files
        documentsEvidenceFiles: Object.keys(fileReferences)
          .filter(key => key.startsWith('documentsEvidence_'))
          .reduce((acc, key) => {
            acc[key] = fileReferences[key];
            return acc;
          }, {}),
        // Store all file references for easy access
        allFiles: fileReferences,
        // Include any existing documents from form
        ...(data.documents || {})
      };
      
      // Create the arbitration agreement structure
      const arbitrationAgreement = data.arbitrationAgreement 
        ? {
            ...data.arbitrationAgreement,
            agreementFile: fileReferences.agreementFile || null
          }
        : {};
      
      // Extract claimant data from nested structure
      const claimant = data.claimant || {};
      
      // Check if this is an update to an existing draft
      if (data.id) {
        // Get the existing draft to update its version
        const existingDraft = await this.prisma.arbitration.findUnique({
          where: { id: data.id },
        });
        
        if (!existingDraft) {
          throw new NotFoundException(`Draft with ID ${data.id} not found`);
        }
        
        // Ensure the user owns this draft
        if (existingDraft.userId !== userId) {
          throw new Error('You do not have permission to edit this draft');
        }
        
        // Store the complete form data structure in a JSON field
        const processedData = {
          // Store claimant data at top level for backward compatibility
          type: claimant.type || data.type || '',
          name: claimant.name || data.name || '',
          pincode: claimant.pincode || data.pincode || '',
          address1: claimant.address1 || data.address1 || '',
          address2: claimant.address2 || data.address2 || '',
          city: claimant.city || data.city || '',
          district: claimant.district || data.district || '',
          state: claimant.state || data.state || '',
          country: claimant.country || data.country || '',
          email: claimant.email || data.email || '',
          phoneCountryCode: claimant.phoneCountryCode || data.phoneCountryCode || '+91',
          phone: claimant.phone || data.phone || '',
          gst: claimant.gst || data.gst || '',
          pan: claimant.pan || data.pan || '',
          cin: claimant.cin || data.cin || '',
          // Store the complete nested structure
          additionalClaimants: data.additionalClaimants || [],
          respondents: data.respondents || [],
          arbitrationAgreement: arbitrationAgreement,
          disputeDetails: data.disputeDetails || {},
          documents: documents,
          managerDetails: data.managerDetails || {},
          prayers: data.prayers || {},
          payment: data.payment || {},
          arguments: data.arguments || {},
          // Add a formData field to store the complete structure
          formData: {
            claimant: data.claimant,
            additionalClaimants: data.additionalClaimants,
            managerDetails: data.managerDetails,
            respondents: data.respondents,
            arbitrationAgreement: data.arbitrationAgreement,
            disputeDetails: data.disputeDetails,
            // Include new dispute structure fields
            natureOfDispute: data.natureOfDispute,
            disputeDescriptions: data.disputeDescriptions,
            documentsEvidence: data.documentsEvidence,
            prayers: data.prayers,
            documents: data.documents,
            payment: data.payment,
            arguments: data.arguments,
          },
          status: 'draft',
          isDraft: true,
          lastEditedAt: new Date(),
          version: existingDraft.version + 1,
        };
        
        console.log('Updating draft with structured data');
        
        return this.prisma.arbitration.update({
          where: { id: data.id },
          data: processedData,
        });
      } else {
        // Create a new draft (drafts don't need case numbers)
        
        const processedData = {
          // Store claimant data at top level for backward compatibility
          type: claimant.type || data.type || '',
          name: claimant.name || data.name || '',
          pincode: claimant.pincode || data.pincode || '',
          address1: claimant.address1 || data.address1 || '',
          address2: claimant.address2 || data.address2 || '',
          city: claimant.city || data.city || '',
          district: claimant.district || data.district || '',
          state: claimant.state || data.state || '',
          country: claimant.country || data.country || '',
          email: claimant.email || data.email || '',
          phoneCountryCode: claimant.phoneCountryCode || data.phoneCountryCode || '+91',
          phone: claimant.phone || data.phone || '',
          gst: claimant.gst || data.gst || '',
          pan: claimant.pan || data.pan || '',
          cin: claimant.cin || data.cin || '',
          // Store the complete nested structure
          additionalClaimants: data.additionalClaimants || [],
          respondents: data.respondents || [],
          arbitrationAgreement: arbitrationAgreement,
          disputeDetails: data.disputeDetails || {},
          documents: documents,
          managerDetails: data.managerDetails || {},
          prayers: data.prayers || {},
          payment: data.payment || {},
          arguments: data.arguments || {},
          // Add a formData field to store the complete structure
          formData: {
            claimant: data.claimant,
            additionalClaimants: data.additionalClaimants,
            managerDetails: data.managerDetails,
            respondents: data.respondents,
            arbitrationAgreement: data.arbitrationAgreement,
            disputeDetails: data.disputeDetails,
            // Include new dispute structure fields
            natureOfDispute: data.natureOfDispute,
            disputeDescriptions: data.disputeDescriptions,
            documentsEvidence: data.documentsEvidence,
            prayers: data.prayers,
            documents: data.documents,
            payment: data.payment,
            arguments: data.arguments,
          },
          caseNumber: null, // Drafts don't have case numbers until submitted
          status: 'draft',
          isDraft: true,
          lastEditedAt: new Date(),
          userId: userId,
        };
        
        console.log('Creating new draft with structured data');
        
        return this.prisma.arbitration.create({
          data: processedData,
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.arbitration.findMany({
      orderBy: { lastEditedAt: 'desc' },
    });
  }

  async findUserCases(userId: string) {
    console.log('🔧 ArbitrationService.findUserCases called for user:', userId);
    
    // Find cases where user is claimant (owner) and exclude drafts
    const cases = await this.prisma.arbitration.findMany({
      where: {
        userId: userId,
        isDraft: false, // Exclude draft cases
      },
      orderBy: { lastEditedAt: 'desc' },
    });
    
    console.log(`🔧 Found ${cases.length} submitted cases for user ${userId}`);
    return cases;
  }

  async findUserDrafts(userId: string) {
    return this.prisma.arbitration.findMany({
      where: { 
        userId: userId,
        isDraft: true 
      },
      orderBy: { lastEditedAt: 'desc' },
    });
  }

  async getDraftById(id: string, userId: string) {
    const draft = await this.prisma.arbitration.findUnique({
      where: { id },
    });

    if (!draft) {
      throw new NotFoundException(`Draft with ID ${id} not found`);
    }

    if (draft.userId !== userId) {
      throw new Error('You do not have permission to access this draft');
    }

    if (!draft.isDraft) {
      throw new Error('This is not a draft');
    }

    // CRITICAL FIX: Transform file metadata for frontend consumption
    const transformedDraft = {
      ...draft,
      // Convert file metadata to a format the frontend can use
      fileMetadata: this.extractFileMetadata(draft.documents),
      // Ensure documents structure is properly formatted
      documents: this.formatDocumentsForFrontend(draft.documents),
    };

    return transformedDraft;
  }

  // Helper method to extract file metadata from documents
  private extractFileMetadata(documents: any): Record<string, any> {
    if (!documents || typeof documents !== 'object') {
      return {};
    }

    const fileMetadata: Record<string, any> = {};

    // Extract company documents
    if (documents.companyDocs) {
      if (documents.companyDocs.coi) {
        fileMetadata['claimant.coi'] = {
          name: documents.companyDocs.coi.originalName || documents.companyDocs.coi.filename,
          path: documents.companyDocs.coi.path,
          size: documents.companyDocs.coi.size,
          type: documents.companyDocs.coi.mimetype,
        };
      }
      if (documents.companyDocs.panCard) {
        fileMetadata['claimant.panCard'] = {
          name: documents.companyDocs.panCard.originalName || documents.companyDocs.panCard.filename,
          path: documents.companyDocs.panCard.path,
          size: documents.companyDocs.panCard.size,
          type: documents.companyDocs.panCard.mimetype,
        };
      }
      if (documents.companyDocs.gstCert) {
        fileMetadata['claimant.gstCert'] = {
          name: documents.companyDocs.gstCert.originalName || documents.companyDocs.gstCert.filename,
          path: documents.companyDocs.gstCert.path,
          size: documents.companyDocs.gstCert.size,
          type: documents.companyDocs.gstCert.mimetype,
        };
      }
    }

    // Extract all files from allFiles if available
    if (documents.allFiles) {
      Object.keys(documents.allFiles).forEach(key => {
        const file = documents.allFiles[key];
        if (file && typeof file === 'object') {
          fileMetadata[key] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    // Extract supporting documents
    if (documents.supportingDocuments && Array.isArray(documents.supportingDocuments)) {
      documents.supportingDocuments.forEach((file, index) => {
        if (file && typeof file === 'object') {
          fileMetadata[`supportingDocuments_${index}`] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    // Extract evidence files
    if (documents.evidenceFiles && Array.isArray(documents.evidenceFiles)) {
      documents.evidenceFiles.forEach((file, index) => {
        if (file && typeof file === 'object') {
          fileMetadata[`evidenceFiles_${index}`] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    // Extract documents evidence files (legacy)
    if (documents.documentsEvidenceFiles) {
      Object.keys(documents.documentsEvidenceFiles).forEach(key => {
        const file = documents.documentsEvidenceFiles[key];
        if (file && typeof file === 'object') {
          fileMetadata[key] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    // Extract NEW DocumentsTabs files
    if (documents.scannedDocuments) {
      Object.keys(documents.scannedDocuments).forEach(key => {
        const file = documents.scannedDocuments[key];
        if (file && typeof file === 'object') {
          fileMetadata[key] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    if (documents.affidavits) {
      Object.keys(documents.affidavits).forEach(key => {
        const file = documents.affidavits[key];
        if (file && typeof file === 'object') {
          fileMetadata[key] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    if (documents.electronicEvidence) {
      Object.keys(documents.electronicEvidence).forEach(key => {
        const file = documents.electronicEvidence[key];
        if (file && typeof file === 'object') {
          fileMetadata[key] = {
            name: file.originalName || file.filename,
            path: file.path,
            size: file.size,
            type: file.mimetype,
          };
        }
      });
    }

    return fileMetadata;
  }

  // Helper method to format documents for frontend
  private formatDocumentsForFrontend(documents: any): any {
    if (!documents || typeof documents !== 'object') {
      return {};
    }

    return {
      ...documents,
      // Ensure arrays are properly formatted
      supportingDocuments: Array.isArray(documents.supportingDocuments) ? documents.supportingDocuments : [],
      evidenceFiles: Array.isArray(documents.evidenceFiles) ? documents.evidenceFiles : [],
    };
  }

  async findOne(id: string) {
    const arbitration = await this.prisma.arbitration.findUnique({
      where: { id },
    });

    if (!arbitration) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }

    // CRITICAL FIX: Add fileMetadata extraction for submitted cases 
    // This ensures that uploaded documents are visible in petition edit mode
    const transformedCase = {
      ...arbitration,
      // Convert file metadata to a format the frontend can use
      fileMetadata: this.extractFileMetadata(arbitration.documents),
      // Ensure documents structure is properly formatted
      documents: this.formatDocumentsForFrontend(arbitration.documents),
    };

    return transformedCase;
  }

  async findByCaseNumber(caseNumber: string) {
    const arbitration = await this.prisma.arbitration.findUnique({
      where: { caseNumber },
    });

    if (!arbitration) {
      throw new NotFoundException(`Arbitration case with case number ${caseNumber} not found`);
    }

    return arbitration;
  }

  async update(id: string, data: any, userId: string) {
    try {
      // Check if the case exists and belongs to the user
      const existingCase = await this.prisma.arbitration.findUnique({
        where: { id },
      });
      
      if (!existingCase) {
        throw new NotFoundException(`Arbitration case with ID ${id} not found`);
      }
      
      if (existingCase.userId !== userId) {
        throw new Error('You do not have permission to update this case');
      }
      
      // Only allow updates to drafts or cases in specific statuses
      if (!existingCase.isDraft && !['pending', 'revise_required'].includes(existingCase.status)) {
        throw new Error('This case cannot be edited in its current status');
      }
      
      return await this.prisma.arbitration.update({
        where: { id },
        data: {
          ...data,
          lastEditedAt: new Date(),
          version: existingCase.version + 1,
        },
      });
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      return await this.prisma.arbitration.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }
  }

  async submitDraft(id: string, userId: string) {
    try {
      // Check if the draft exists and belongs to the user
      const existingDraft = await this.prisma.arbitration.findUnique({
        where: { id },
      });
      
      if (!existingDraft) {
        throw new NotFoundException(`Draft with ID ${id} not found`);
      }
      
      if (existingDraft.userId !== userId) {
        throw new Error('You do not have permission to submit this draft');
      }
      
      if (!existingDraft.isDraft) {
        throw new Error('This case has already been submitted');
      }
      
      // Only generate a new case number if one doesn't already exist
      let caseNumber = existingDraft.caseNumber;
      if (!caseNumber) {
        caseNumber = await generateCaseId();
      }
      
      return await this.prisma.arbitration.update({
        where: { id },
        data: {
          isDraft: false,
          status: 'pending',
          caseNumber,
          lastEditedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error submitting draft:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.arbitration.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }
  }
} 