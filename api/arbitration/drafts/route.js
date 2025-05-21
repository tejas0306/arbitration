// Mock API route to handle arbitration drafts list request (plural endpoint)
import { NextResponse } from 'next/server';
import { mockDrafts } from '@/lib/mock-data';

export async function GET(req) {
  console.log('🔶 Mock API - Getting all drafts (plural route)');
  console.log(`🔶 Current mock drafts: ${mockDrafts.length}`);
  
  // Ensure we have some mock data even if array is empty
  if (mockDrafts.length === 0) {
    mockDrafts.push({
      id: 'test-draft-' + Date.now(),
      title: 'Test Draft',
      type: 'Commercial',
      name: 'Commercial Dispute',
      isDraft: true,
      version: 1,
      lastEditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data: {
        claimant: {
          type: 'company',
          name: 'ACME Corporation',
          pincode: '400001',
          address1: '123 Business Park',
          address2: '',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          email: 'contact@acme.com',
          phoneCountryCode: '+91',
          phone: '9876543210',
          gst: '',
          pan: '',
          cin: ''
        },
        additionalClaimants: [],
        managerDetails: {
          name: '',
          email: '',
          phoneCountryCode: '+91',
          phone: '',
          address: '',
          designation: '',
          authority: ''
        },
        respondents: [
          {
            type: 'company',
            name: 'XYZ Ltd',
            address: '456 Corporate Tower, Mumbai',
            email: 'legal@xyz.com',
            phoneCountryCode: '+91',
            phone: '8765432109',
            gst: '',
            pan: '',
            cin: ''
          }
        ],
        arbitrationAgreement: {
          agreementDate: '2023-01-01',
          agreementType: 'contract',
          resolutionMode: 'sole',
          seatOfArbitration: 'Mumbai',
          signedOnPlace: 'Mumbai',
          agreementParties: 'ACME Corporation and XYZ Ltd',
          arbitratorSelection: 'parties'
        },
        disputeDetails: {
          disputeType: 'commercial',
          disputeAmount: '1000000',
          disputeDescription: 'Non-fulfillment of contractual obligations',
          disputeDate: '2023-10-15',
          serviceType: 'regular',
          applicableActs: ['Arbitration and Conciliation Act, 1996'],
          disputeCategory: 'contractual',
          disputeSubCategory: 'breach',
          natureOfDispute: 'civil',
          factsOfCase: 'This is a mock dispute for testing purposes',
          clauseReferences: 'Clause 15.3 of the Agreement'
        },
        prayers: {
          prayers: 'The claimant seeks monetary compensation of INR 10,00,000/- (Indian Rupees Ten Lakhs Only) along with interest at the rate of 12% per annum.'
        },
        documents: {
          supportingDocuments: [],
          evidenceFiles: [],
          documentTypes: {}
        },
        payment: {
          paymentHead: 'filing_fee',
          paymentAmount: '50000',
          paymentDetails: 'Payment made via NEFT'
        },
        arguments: {
          argumentsPerIssue: ['The respondent failed to deliver the agreed goods.']
        }
      }
    });
    console.log('🔶 Added test draft for development');
  }
  
  // Return mock data
  return NextResponse.json(mockDrafts);
}

export async function POST(req) {
  console.log('🔶 Mock API - Saving draft (plural route)');
  
  try {
    // Parse the request body
    const formData = await req.formData();
    let id = formData.get('id');
    const jsonData = formData.get('data');
    
    console.log(`🔶 Got form data - ID: ${id}, Data: ${jsonData ? 'present' : 'missing'}`);
    
    // Parse the JSON data
    let parsedData = {};
    if (jsonData) {
      try {
        parsedData = JSON.parse(jsonData);
        console.log('🔶 Successfully parsed form data JSON');
      } catch (parseError) {
        console.error('🔶 Error parsing JSON data:', parseError);
        // Continue with empty object
      }
    }
    
    // Create a draft object with a unique ID if none provided
    const draftId = id || `draft-${Date.now()}`;
    
    // Create draft data structure
    const draftData = { 
      id: draftId,
      title: parsedData.claimant?.name || 'New Draft',
      name: parsedData.claimant?.name || 'New Draft',
      type: parsedData.claimant?.type || 'Commercial',
      isDraft: true,
      version: 1,
      lastEditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data: parsedData
    };
    
    // Try to find existing draft
    const existingIndex = mockDrafts.findIndex(d => d.id === draftId);
    
    if (existingIndex >= 0) {
      // Update existing draft
      mockDrafts[existingIndex] = {
        ...mockDrafts[existingIndex],
        title: draftData.title,
        name: draftData.name,
        type: draftData.type,
        lastEditedAt: new Date().toISOString(),
        data: draftData.data
      };
      console.log('🔶 Mock API - Draft updated:', draftId);
      return NextResponse.json(mockDrafts[existingIndex]);
    } else {
      // Add new draft
      mockDrafts.push(draftData);
      console.log('🔶 Mock API - New draft saved:', draftId);
      return NextResponse.json(draftData);
    }
  } catch (error) {
    console.error('🔶 Mock API - Error saving draft:', error);
    return NextResponse.json(
      { error: 'Error saving draft', message: error.message },
      { status: 500 }
    );
  }
} 