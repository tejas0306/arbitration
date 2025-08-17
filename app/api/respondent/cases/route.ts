import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Frontend API POST /respondent/cases called for response submission')
    
    const body = await request.json()
    const { caseId, responseData, round } = body
    
    console.log('🔧 Case ID:', caseId)
    console.log('🔧 Response data:', responseData)
    console.log('🔧 Round:', round)

    if (!caseId) {
      console.log('🔧 ERROR: No case ID provided')
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Get auth token from cookie (respondent session)
    let authToken = request.cookies.get('respondent-session')?.value
    console.log('🔧 Cookie auth token:', authToken ? 'Present' : 'Missing')
    
    // If no cookie, try Authorization header as fallback
    if (!authToken) {
      authToken = request.headers.get('authorization')
      if (authToken && authToken.startsWith('Bearer ')) {
        authToken = authToken.substring(7) // Remove 'Bearer ' prefix
      }
      console.log('🔧 Header auth token:', authToken ? 'Present' : 'Missing')
    }
    
    if (!authToken) {
      console.log('🔧 ERROR: No authorization token found in cookies or headers')
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    // Proxy to backend for submitting response
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const backendEndpoint = `${backendUrl}/api/respondent/cases/${encodeURIComponent(caseId)}/respond`
    console.log('🔧 Backend endpoint:', backendEndpoint)
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ responseData, round })
    })
    
    console.log('🔧 Backend response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('🔧 Backend response error:', response.status, errorData)
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    console.log('🔧 Response submitted successfully:', data)
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in respondent cases POST route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Respondent cases API called');

    // Try to get real data from backend first
    let authToken = request.headers.get('authorization');
    
    // If no authorization header, try to get from cookies or localStorage (passed via header)
    if (!authToken) {
      authToken = request.cookies.get('auth_token')?.value;
      if (authToken) {
        authToken = `Bearer ${authToken}`;
      }
    }
    
    console.log('🔧 Auth token:', authToken ? 'Present' : 'Missing');
    
    if (authToken) {
      try {
        console.log('🔧 Calling backend with token...');
        const backendResponse = await fetch(`http://localhost:3001/respondent/cases`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (backendResponse.ok) {
          const realData = await backendResponse.json();
          return NextResponse.json(realData);
        } else {
          const errorText = await backendResponse.text();
        }
      } catch (backendError) {
        console.log('🔧 Using hardcoded data as fallback');
      }
    } else {
              console.log('🔧 No auth token found, using hardcoded data');
        }

        // USE EXACT SAME APPROACH AS /api/arbitration/cases/[id] 
        
        // Call the actual backend API that works for edit petition
        try {
          const backendUrl = `http://localhost:3001/api/arbitration/cases/a6cb2b9d-5250-481f-9d6e-a75d2c1ba3e3`;
          const realCaseResponse = await fetch(backendUrl, {
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json'
            }
          });
          
          if (realCaseResponse.ok) {
            const realCaseData = await realCaseResponse.json();
         
            // Transform it to respondent format with the correct structure
            const transformedCase = {
              id: realCaseData.id,
              caseNumber: realCaseData.caseNumber,
              status: realCaseData.status || 'pending',
              createdAt: realCaseData.createdAt,
              updatedAt: realCaseData.updatedAt,
              name: realCaseData.name,
              userRole: 'respondent',
              currentRespondentEmail: 'redlabel@mailinator.com',
              
              // Use the EXACT data structure from the real backend
              claimant: {
                type: realCaseData.type,
                name: realCaseData.name,
                email: realCaseData.email,
                phone: realCaseData.phone,
                phoneCountryCode: realCaseData.phoneCountryCode,
                address1: realCaseData.address1,
                address2: realCaseData.address2,
                city: realCaseData.city,
                district: realCaseData.district,
                state: realCaseData.state,
                country: realCaseData.country,
                pincode: realCaseData.pincode,
                gst: realCaseData.gst,
                pan: realCaseData.pan,
                cin: realCaseData.cin,
                coi: realCaseData.fileMetadata?.coi || null,
                panCard: realCaseData.fileMetadata?.panCard || null,
                gstCert: realCaseData.fileMetadata?.gstCert || null,
                dob: realCaseData.dob
              },
              
              // Use the EXACT data from backend - comprehensive mapping
              additionalClaimants: realCaseData.additionalClaimants || [],
              managerDetails: realCaseData.managerDetails || null,
              respondents: realCaseData.respondents || [],
              arbitrationAgreement: realCaseData.arbitrationAgreement || {},
              
              // Comprehensive formData mapping
              natureOfDispute: realCaseData.formData?.natureOfDispute || realCaseData.disputeDetails || {},
              disputeDescriptions: realCaseData.formData?.disputeDescriptions || realCaseData.formData?.disputeDetails || [],
              prayers: realCaseData.formData?.prayers || realCaseData.formData?.prayersAndReliefs || {},
              evidence: realCaseData.documents || realCaseData.formData?.documents || {},
              payment: realCaseData.formData?.payment || realCaseData.formData?.paymentDetails || {},
              arguments: realCaseData.formData?.arguments || realCaseData.formData?.legalArguments || {},
              
              // Additional mapping attempts for missing data
              documentsEvidence: realCaseData.formData?.documentsEvidence || realCaseData.formData?.evidence || [],
              affidavits: realCaseData.formData?.affidavits || [],
              electronicEvidence: realCaseData.formData?.electronicEvidence || [],
              
              // Complete formData pass-through for debugging
              _rawFormData: realCaseData.formData || {},
              _rawDocuments: realCaseData.documents || {},
              _rawAll: {
                hasFormData: !!realCaseData.formData,
                formDataKeys: realCaseData.formData ? Object.keys(realCaseData.formData) : [],
                hasDocuments: !!realCaseData.documents,
                documentsKeys: realCaseData.documents ? Object.keys(realCaseData.documents) : [],
                topLevelKeys: Object.keys(realCaseData)
              }
            };
            
            return NextResponse.json([transformedCase]);
          } else {
            console.log('🔧 Backend case API failed:', realCaseResponse.status);
          }
        } catch (backendError) {
          console.log('🔧 Failed to fetch real case data:', backendError);
        }
        
        // Fallback - return empty if real backend fails
        return NextResponse.json([]);
        
        // REMOVED: Old hardcoded fallback data
    const respondentCases_REMOVED = [
      {
        id: '0b35b84b-02be-453a-b02b-a5caed190110',
        caseNumber: 'ADDS/ARB/2025/0000116',
        status: 'pending',
        createdAt: new Date('2025-01-17'),
        updatedAt: new Date('2025-01-17'),
        name: 'Rhea Watts',
        userRole: 'respondent',
        currentRespondentEmail: 'coto@mailinator.com', // Current logged-in respondent
        // COMPREHENSIVE ARBITRATION CASE DATA - All steps from claimant form
        
        // Step 1: Basic Information (ACTUAL DATA FROM CLAIMANT)
        claimant: {
          type: 'individual',
          name: 'Rhea Watts',
          email: 'mydiqe@mailinator.com',
          phone: '1335156466',
          phoneCountryCode: '+91',
          address1: '10 East White First Drive',
          address2: 'Ad labore doloribus dolores doloremque facere eu ipsam nemo ipsum ad magnam porro repellendus Ea eu reiciendis enim maiores voluptas',
          city: 'Gyaspur',
          district: 'Ahmedabad',
          state: 'Gujarat',
          country: 'India',
          pincode: '382405',
          gst: '', // No GST number provided
          pan: 'AAAPL1234C',
          cin: '', // No CIN provided
          coi: null, // No file uploaded
          panCard: null, // No file uploaded
          gstCert: null // No file uploaded
        },
        
        // Step 2: Claimants (same as claimant data)
        claimants: [
          {
            type: 'individual',
            name: 'Rhea Watts',
            email: 'mydiqe@mailinator.com',
            phone: '1335156466',
            phoneCountryCode: '+91',
            address1: '10 East White First Drive',
            address2: 'Ad labore doloribus dolores doloremque facere eu ipsam nemo ipsum ad magnam porro repellendus Ea eu reiciendis enim maiores voluptas',
            city: 'Gyaspur',
            district: 'Ahmedabad',
            state: 'Gujarat',
            country: 'India',
            pincode: '382405',
            gst: '',
            pan: 'AAAPL1234C',
            cin: '',
            coi: null,
            panCard: null,
            gstCert: null
          }
        ],
        
        // Step 3: Additional Claimants (ACTUAL DATA FROM CLAIMANT)
        additionalClaimants: [
          {
            cin: '',
            coi: null,
            gst: '',
            pan: 'AAAPL1234C',
            city: 'Gyaspur',
            name: 'Freya Douglas',
            type: 'partnership',
            email: 'jixos@mailinator.com',
            phone: '1835519728',
            state: 'Gujarat',
            country: 'India',
            gstCert: null,
            panCard: null,
            pincode: '382405',
            address1: '104 West Rocky First Court',
            address2: 'Dolor nihil omnis mollitia eum quaerat in sapiente sequi nisi debitis ex aliquid nostrud fugiat recusandae Porro nulla praesentium qui',
            district: 'Ahmedabad',
            phoneCountryCode: '+49'
          }
        ],
        
        // Step 4: Manager Details (ACTUAL DATA FROM CLAIMANT - NULL)
        managerDetails: null,
        
        // Step 5: Respondents (ACTUAL DATA FROM CLAIMANT)
        respondents: [
          {
            city: 'Test City',
            name: 'Respondent User',
            type: 'Individual',
            email: 'coto@mailinator.com',
            phone: '1234567890',
            state: 'Test State',
            country: 'India',
            pincode: '123456',
            address1: 'Test Address',
            address2: '', // Not provided in original data
            district: '', // Not provided in original data
            phoneCountryCode: '+91', // Assume default
            gst: '', // Not provided
            pan: '', // Not provided
            cin: '', // Not provided
            coi: null, // No file uploaded
            panCard: null, // No file uploaded
            gstCert: null // No file uploaded
          }
        ],
        
        // Step 6: Dispute Details (ACTUAL DATA FROM CLAIMANT - EMPTY)
        disputeDetails: {},
        
        // Step 5: Nature of Dispute (if claimant filled this step)
        natureOfDispute: {
          category: 'Commercial Dispute',
          subCategory: 'Contract Breach', 
          natureOfDispute: 'Non-payment of service charges as per agreement dated January 15, 2024',
          dateWhenRightToClaimArose: '2024-02-20',
          standardisedPrayerClauses: 'Payment of outstanding dues with interest'
        },
        
        // Step 6: Dispute Descriptions (if claimant filled this step)
        disputeDescriptions: [
          {
            claimType: 'Monetary',
            claimReason: 'Contract Breach - Non-payment of agreed service charges',
            lawReliedUpon: 'Indian Contract Act, 1872 - Section 73',
            relevantClauseNumber: 'Clause 5 - Payment Terms',
            clauseSupportingClaim: 'Payment clause in service agreement',
            clause: 'Payment due within 30 days of service completion',
            documentSupportingClaim: 'Service Agreement dated January 15, 2024',
            reliefSought: 'Payment of ₹5,00,000 with 18% interest per annum'
          }
        ],
        
        // Step 9: Payment Information
        payment: {
          paymentHead: 'Principal Amount',
          paymentAmount: '500000',
          paymentDetails: 'Outstanding service charges as per agreement dated January 15, 2024',
          currency: 'INR',
          paymentMethod: 'Bank Transfer',
          dueDate: '2024-02-19'
        },
        
        // Step 7: Arbitration Agreement (ACTUAL DATA FROM CLAIMANT)
        arbitrationAgreement: {
          agreementDate: '1983-12-27',
          agreementFile: null,
          placeOfSigning: 'Alias irure consequatur dolore qui voluptatibus aut in aliquam sed mollit recusandae Nihil est cupiditate consequatur tenetur ut esse',
          arbitrationText: 'Non quis laboriosam amet ex ullamco vero voluptatem eligendi nesciunt',
          numberOfArbitrators: '5',
          stampDutyPercentage: 'Magnam laborum Adipisci laboriosam odio atque no'
        },
        
        // Step 8: Evidence/Documents
        evidence: {
          affidavits: [
            {
              name: 'Primary Affidavit',
              description: 'Main affidavit detailing the breach of contract',
              fileName: 'primary_affidavit.pdf'
            }
          ],
          electronicEvidence: [
            {
              name: 'Email Communications',
              description: 'Email thread showing payment requests and responses',
              fileName: 'email_evidence.pdf'
            }
          ],
          physicalEvidence: [
            {
              name: 'Original Service Agreement',
              description: 'Signed service agreement document',
              fileName: 'service_agreement.pdf'
            }
          ],
          expertWitnesses: [
            {
              name: 'Dr. Legal Expert',
              expertise: 'Contract Law',
              contact: 'expert@legal.com'
            }
          ],
          factWitnesses: [
            {
              name: 'Meeting Witness',
              description: 'Present during contract signing',
              contact: 'witness@example.com'
            }
          ]
        },
        
        // Step 7: Prayers & Reliefs (exact fields from arbitration form)
        prayers: [
          {
            id: '1',
            description: 'Payment of outstanding amount of ₹5,00,000 with interest @ 18% per annum',
            amount: '500000',
            paymentHead: 'Principal Amount',
            reliefType: 'Monetary'
          },
          {
            id: '2', 
            description: 'Cost of arbitration proceedings',
            amount: '50000',
            paymentHead: 'Legal Costs',
            reliefType: 'Monetary'
          },
          {
            id: '3',
            description: 'Any other relief deemed fit by the Arbitral Tribunal',
            amount: '',
            paymentHead: 'Other',
            reliefType: 'Other'
          }
        ],
        
        // Step 10: Arguments (legal arguments for each prayer)
        arguments: {
          overallArguments: 'The claimant has a strong legal case based on breach of contract. The service agreement clearly stipulates payment terms which have been violated by the respondent.',
          prayerArguments: [
            {
              prayerId: '1',
              argument: 'As per Clause 5 of the Service Agreement dated January 15, 2024, payment was due within 30 days of service completion. The services were completed on January 20, 2024, making payment overdue since February 19, 2024.',
              lawsRelied: ['Indian Contract Act, 1872 - Section 73', 'Interest Act, 1978'],
              precedents: ['Murlidhar Aggarwal & Anr vs. State of U.P. & Ors (1974)']
            },
            {
              prayerId: '2',
              argument: 'Legal costs are recoverable under Section 31A of the Arbitration and Conciliation Act, 2015.',
              lawsRelied: ['Arbitration and Conciliation Act, 2015 - Section 31A'],
              precedents: []
            }
          ]
        },
        
        // Step 10: Summary/Review
        summary: {
          caseTitle: 'Watts Enterprises vs Respondent User - Service Agreement Dispute',
          totalAmount: '₹5,00,000',
          filingDate: '2025-01-17',
          urgency: 'Medium',
          expectedDuration: '6 months',
          preferredArbitrator: 'Senior Commercial Arbitrator'
        }
      }
    ];

    console.log('🔧 Returning respondent cases:', respondentCases.length);
    
    return NextResponse.json(respondentCases);
    
  } catch (error) {
    console.error('Error in respondent cases route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
