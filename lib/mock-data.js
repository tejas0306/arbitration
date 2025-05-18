// Mock data for development use
// This file provides shared data storage across API route handlers

// Mock drafts array
export const mockDrafts = [];

// Mock cases array
export const mockCases = [];

// Add some initial data
if (typeof window !== 'undefined') {
  // Only run on client side
  if (mockDrafts.length === 0) {
    mockDrafts.push({
      id: 'mock-draft-123',
      title: 'Commercial Dispute Draft',
      type: 'Commercial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: true,
      data: {
        type: 'Commercial',
        name: 'ACME Corporation',
        pincode: '400001',
        address1: '123 Business Park',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        email: 'contact@acme.com',
        phoneCountryCode: '+91',
        phone: '9876543210',
        disputeDetails: {
          disputeType: 'Contract Breach',
          disputeAmount: '1000000',
          disputeDescription: 'Non-fulfillment of contractual obligations',
          disputeDate: '2023-10-15'
        },
        respondents: [
          {
            type: 'Company',
            name: 'XYZ Ltd',
            email: 'legal@xyz.com',
            phoneCountryCode: '+91',
            phone: '8765432109'
          }
        ]
      }
    });
    
    mockDrafts.push({
      id: 'mock-draft-456',
      title: 'Property Dispute Draft',
      type: 'Property',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isDraft: true,
      data: {
        type: 'Individual',
        name: 'Raj Kumar',
        pincode: '110001',
        address1: '45 Park Avenue',
        city: 'New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        email: 'raj.kumar@example.com',
        phoneCountryCode: '+91',
        phone: '7654321098',
        disputeDetails: {
          disputeType: 'Property Ownership',
          disputeAmount: '5000000',
          disputeDescription: 'Dispute regarding property ownership and boundaries',
          disputeDate: '2023-11-20'
        }
      }
    });
  }
  
  if (mockCases.length === 0) {
    mockCases.push({
      id: 'case-789',
      caseNumber: 'ARB-2023-001',
      type: 'Commercial',
      status: 'pending',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      claimant: {
        name: 'Global Trading Ltd',
        email: 'legal@globaltrading.com'
      },
      respondent: {
        name: 'Local Distributors Inc',
        email: 'info@localdist.com'
      },
      disputeAmount: '2500000',
      disputeType: 'Contract Breach'
    });
    
    mockCases.push({
      id: 'case-012',
      caseNumber: 'ARB-2023-002',
      type: 'Individual',
      status: 'approved',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      claimant: {
        name: 'Ananya Sharma',
        email: 'ananya.s@example.com'
      },
      respondent: {
        name: 'City Properties Ltd',
        email: 'support@cityproperties.com'
      },
      disputeAmount: '800000',
      disputeType: 'Rental Agreement'
    });
  }
} 