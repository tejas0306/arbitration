// Mock API route to handle specific draft ID routes with plural path
import { NextResponse } from 'next/server';
import { mockDrafts } from '@/lib/mock-data';

export async function GET(req, { params }) {
  const { id } = params;
  console.log(`🔶 Mock API - Getting draft with ID: ${id} (plural route)`);
  
  // Find the draft with the given ID
  const draft = mockDrafts.find(d => d.id === id);
  
  if (!draft) {
    console.log(`🔶 Mock API - Draft not found with ID: ${id}, creating fallback mock`);
    
    // Create a fallback mock draft if the requested one doesn't exist
    const fallbackDraft = {
      id: id,
      title: 'Fallback Draft',
      type: 'Commercial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: true,
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
          argumentsPerIssue: ['The respondent failed to deliver the agreed goods as per the timeline specified in the contract.']
        }
      }
    };
    
    // Return the fallback draft
    return NextResponse.json(fallbackDraft);
  }
  
  return NextResponse.json(draft);
}

export async function PUT(req, { params }) {
  const { id } = params;
  console.log(`🔶 Mock API - Updating draft with ID: ${id}`);
  
  try {
    // Parse the request body
    const data = await req.formData();
    const jsonData = data.get('data');
    
    // Find the draft index
    const index = mockDrafts.findIndex(d => d.id === id);
    
    if (index === -1) {
      console.log(`🔶 Mock API - Draft not found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Update the draft
    mockDrafts[index] = {
      ...mockDrafts[index],
      data: jsonData ? JSON.parse(jsonData) : mockDrafts[index].data,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(mockDrafts[index]);
  } catch (error) {
    console.error('🔶 Mock API - Error updating draft:', error);
    return NextResponse.json(
      { error: 'Error updating draft', message: error.message },
      { status: 500 }
    );
  }
} 