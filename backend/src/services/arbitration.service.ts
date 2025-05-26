import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
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
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    try {
      console.log('Processing arbitration data:', {
        ...data,
        files: data.files ? 'Files included' : 'No files'
      });
      
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
          .map(key => fileReferences[key])
      };
      
      // Create the arbitration agreement structure
      const arbitrationAgreement = {
        ...data.arbitrationAgreement,
        agreementFile: fileReferences.agreementFile || null
      };
      
      // Create the final processed data structure that matches the Prisma schema
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
        disputeDetails: data.disputeDetails,
        documents: documents,
        caseNumber,
        status: data.status || 'pending',
        isDraft: false, // When created through submit, it's not a draft
        lastEditedAt: new Date(),
        userId: userId, // Link to the user who created it
      };
      
      console.log('Saving arbitration case with data:', {
        ...processedData,
        documents: 'Documents object included',
        status: processedData.status
      });
      
      return this.prisma.arbitration.create({
        data: processedData,
      });
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
        // Create a new draft
        const caseNumber = await generateCaseId();
        
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
            prayers: data.prayers,
            documents: data.documents,
            payment: data.payment,
            arguments: data.arguments,
          },
          caseNumber,
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

    return draft;
  }

  async findOne(id: string) {
    const arbitration = await this.prisma.arbitration.findUnique({
      where: { id },
    });

    if (!arbitration) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }

    return arbitration;
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
      
      // Generate a proper case number
      const caseNumber = await generateCaseId();
      
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