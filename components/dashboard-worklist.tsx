"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CasesDataTable, ArbitrationCase } from '@/components/cases-data-table'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardWorklistProps {
  userData: any | null;
  drafts: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function DashboardWorklist({
  userData,
  drafts,
  loading: externalLoading,
  error: externalError,
  onRefresh
}: DashboardWorklistProps = {
  userData: null,
  drafts: [],
  loading: false,
  error: null,
  onRefresh: async () => {}
}) {
  const router = useRouter()
  const [cases, setCases] = useState<ArbitrationCase[]>([])
  const [loading, setLoading] = useState(externalLoading)
  const [error, setError] = useState<string | null>(externalError)

  const fetchCases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let allCases: any[] = [];
      
      // Fetch claimant cases (skip for respondents to avoid wrong API calls)
      if (!userData || userData.role !== 'RESPONDENT') {
        try {
          const claimantCases = await api.arbitration.getAll()
  
          allCases = [...allCases, ...claimantCases.map((c: any) => ({ ...c, userRole: 'claimant' }))];
        } catch (err) {
  
        }
      }
      
      // Fetch respondent cases (only if user is respondent or admin)
      if (userData && (userData.role === 'RESPONDENT' || userData.role === 'ADMIN')) {
        try {
          const response = await fetch('/api/respondent/cases', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const respondentCases = await response.json();
    
            allCases = [...allCases, ...respondentCases.map((c: any) => ({ ...c, userRole: 'respondent' }))];
          }
        } catch (err) {
  
        }
      }
      
      
      
      // Transform data to match our required format if needed
      const formattedCases: ArbitrationCase[] = allCases.map((caseData: any) => {
        // Extract claimant name
        const claimantName = caseData.name || 
                           caseData.claimant?.name || 
                           (caseData.claimants && caseData.claimants.length > 0 ? caseData.claimants[0].name : 'Not specified');

        // Extract respondent name from the respondents array (first one if multiple)
        const respondentName = (caseData.respondents && caseData.respondents.length > 0) ? 
                             caseData.respondents[0].name : 
                             caseData.respondent?.name || 
                             'Not specified';
          
        // Extract nature of dispute from disputeDetails
        const natureOfDispute = caseData.disputeDetails?.disputeType || caseData.natureOfDispute || 'Not specified'
        
        // Map category and subcategory from disputeDetails
        const category = caseData.type || caseData.category || 'Not specified'
        const subCategory = caseData.disputeDetails?.subCategory || caseData.subCategory || 'Not specified'
        
        // Determine if arbitrator is assigned
        const arbitratorAssigned = caseData.arbitratorId || caseData.arbitratorName ? "Assigned" : "Not Assigned"
        
        // Get agreement file information
        const agreementFile = 
          // If it's directly in the caseData
          caseData.agreementFile || 
          // If it's in the arbitration agreement object as a string
          (typeof caseData.arbitrationAgreement?.agreementFile === 'string' ? 
            caseData.arbitrationAgreement.agreementFile : 
            // If it's in the arbitration agreement object as an object
            caseData.arbitrationAgreement?.agreementFile?.filename || 
            caseData.arbitrationAgreement?.agreementFile?.path) ||
          // If it's in the documents.arbitrationAgreement object
          (typeof caseData.documents?.arbitrationAgreement?.agreementFile === 'string' ?
            caseData.documents.arbitrationAgreement.agreementFile :
            // If it's in the documents.arbitrationAgreement object as an object
            caseData.documents?.arbitrationAgreement?.agreementFile?.filename || 
            caseData.documents?.arbitrationAgreement?.agreementFile?.path) ||
          null
        

        
        return {
          id: caseData.id,
          caseNumber: caseData.caseNumber || 'Pending',
          claimant: claimantName,
          respondent: respondentName,
          category,
          subCategory,
          natureOfDispute,
          arbitratorName: caseData.arbitratorName || 'Not assigned yet',
          arbitratorAssigned,
          status: caseData.status || 'pending',
          hearingMode: caseData.hearingMode || "Online",
          lastUpdatedDate: caseData.updatedAt || caseData.createdAt,
          nextHearingDate: caseData.nextHearingDate || null,
          agreementFile,
          disputeAmount: caseData.disputeDetails?.disputeAmount || caseData.disputeAmount,
          priority: caseData.priority || 'Medium',
          userRole: caseData.userRole || 'claimant', // Add userRole field
          needsCounterResponse: caseData.needsCounterResponse || false, // Add flag for counter-response
          isFallback: caseData.isFallback || false // Add isFallback field
        }
      })
      
      setCases(formattedCases)
    } catch (err) {
      setError('Failed to load your cases. Please try again later.')
      toast.error('Unable to load your cases')
    } finally {
      setLoading(false)
    }
  }

  // Function to check which cases need counter-responses
  const getCasesNeedingCounterResponse = async () => {
    if (!userData || (userData.role !== 'CLAIMANT' && userData.role !== 'ADMIN')) {
      return [];
    }
    
    const casesNeedingCounterResponse = [];
    
    for (const caseItem of cases) {
      // For admins, check all cases. For claimants, only check their own cases
      if (userData.role === 'ADMIN' || caseItem.userRole === 'claimant') {
        // Check for both "RESPONSE SUBMITTED" and "RESPONSE_SUBMITTED" status
        if (caseItem.status === 'RESPONSE SUBMITTED' || caseItem.status === 'RESPONSE_SUBMITTED') {
          casesNeedingCounterResponse.push({
            ...caseItem,
            needsCounterResponse: true,
            counterResponseDeadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
            isFallback: false
          });
        }
      }
    }
    
    return casesNeedingCounterResponse;
  };

  // State for cases needing counter-response
  const [casesNeedingCounterResponse, setCasesNeedingCounterResponse] = useState<any[]>([]);

  // Effect to check for cases needing counter-response
  useEffect(() => {
    if (cases.length > 0 && (userData?.role === 'CLAIMANT' || userData?.role === 'ADMIN')) {
      getCasesNeedingCounterResponse().then(setCasesNeedingCounterResponse);
    }
  }, [cases, userData]);



  useEffect(() => {
    fetchCases()
  }, [])
  
  useEffect(() => {
    setLoading(externalLoading);
    setError(externalError);
  }, [externalLoading, externalError]);
  
  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => {
            onRefresh();
            fetchCases();
          }}
          className="text-indigo-600 hover:underline mt-2 inline-block"
        >
          Try Again
        </button>
      </div>
    )
  }
  
  if (!loading && cases.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600 mb-4">You don't have any active cases yet.</p>
        <Button onClick={() => router.push('/arbitration/new')}>
          File a New Case
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Counter-Response Quick Access - Only show when there are cases needing counter-response */}
      {(userData?.role === 'CLAIMANT' || userData?.role === 'ADMIN') && casesNeedingCounterResponse.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">
                  Counter-Response Required
                </h3>
                <p className="text-blue-700 text-sm">
                  {casesNeedingCounterResponse.length === 1 
                    ? `Respondent has submitted a response for case #${casesNeedingCounterResponse[0].caseNumber}`
                    : `Respondents have submitted responses for ${casesNeedingCounterResponse.length} cases`
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {casesNeedingCounterResponse.length === 1 ? (
                <Button 
                  onClick={() => {
                    const caseItem = casesNeedingCounterResponse[0];
                    router.push(`/cases/${caseItem.id}/counter-response`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Counter-Response
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    // Navigate to the first case that needs counter-response
                    const firstCase = casesNeedingCounterResponse[0];
                    router.push(`/cases/${firstCase.id}/counter-response`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Counter-Responses
                </Button>
              )}
            </div>
          </div>
          
          {/* List of cases needing counter-response */}
          {casesNeedingCounterResponse.length > 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                Cases requiring counter-response:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {casesNeedingCounterResponse.map((caseItem) => (
                  <div key={caseItem.id} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Case #{caseItem.caseNumber}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          Respondent: {caseItem.respondent || 'N/A'}
                        </p>
                        
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/cases/${caseItem.id}/counter-response`)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                      >
                        Respond
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900">
                {userData?.role === 'ADMIN' ? cases.length : cases.filter(c => c.userRole === 'claimant').length}
              </p>
            </div>
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold text-green-600">
                {userData?.role === 'ADMIN' 
                  ? cases.filter(c => c.status !== 'completed' && c.status !== 'COMPLETED').length
                  : cases.filter(c => c.userRole === 'claimant' && c.status !== 'completed' && c.status !== 'COMPLETED').length
                }
              </p>
            </div>
            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Counter-Response</p>
              <p className="text-2xl font-bold text-orange-600">
                {casesNeedingCounterResponse.length}
              </p>
            </div>
            <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-purple-600">
                {userData?.role === 'ADMIN' 
                  ? cases.filter(c => c.status === 'completed' || c.status === 'COMPLETED').length
                  : cases.filter(c => c.userRole === 'claimant' && (c.status === 'completed' || c.status === 'COMPLETED')).length
                }
              </p>
            </div>
            <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <CasesDataTable 
        data={cases} 
        loading={loading}
        onRefresh={() => {
          onRefresh();
          fetchCases();
        }}
      />
    </div>
  )
}