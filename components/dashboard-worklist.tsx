"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CasesDataTable, ArbitrationCase } from '@/components/cases-data-table'

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
          console.log('Claimant cases:', claimantCases.length)
          allCases = [...allCases, ...claimantCases.map((c: any) => ({ ...c, userRole: 'claimant' }))];
        } catch (err) {
          console.log('No claimant cases:', err);
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
            console.log('Respondent cases:', respondentCases.length)
            allCases = [...allCases, ...respondentCases.map((c: any) => ({ ...c, userRole: 'respondent' }))];
          }
        } catch (err) {
          console.log('No respondent cases:', err);
        }
      }
      
      console.log('Total cases:', allCases.length)
      
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
        
        // Console log for debugging
        console.log('Case transformation:', {
          id: caseData.id,
          caseNumber: caseData.caseNumber,
          claimant: claimantName,
          respondent: respondentName
        });
        
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
          userRole: caseData.userRole || 'claimant' // Add userRole field
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
    <div className="w-full">
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