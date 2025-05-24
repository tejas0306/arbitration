"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CasesDataTable, ArbitrationCase } from '@/components/cases-data-table'

export default function DashboardWorklist() {
  const router = useRouter()
  const [cases, setCases] = useState<ArbitrationCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const casesData = await api.arbitration.getAll()
      
      // Transform data to match our required format if needed
      const formattedCases: ArbitrationCase[] = casesData.map((caseData: any) => {
        // Extract respondent name from the respondents array (first one if multiple)
        const respondentName = caseData.respondents && caseData.respondents.length > 0
          ? caseData.respondents[0].name
          : 'Not specified'
          
        // Extract nature of dispute from disputeDetails
        const natureOfDispute = caseData.disputeDetails?.disputeType || 'Not specified'
        
        // Map category and subcategory from disputeDetails
        const category = caseData.type || 'Not specified'
        const subCategory = caseData.disputeDetails?.subCategory || 'Not specified'
        
        // Determine if arbitrator is assigned
        const arbitratorAssigned = caseData.arbitratorId ? "Assigned" : "Not Assigned"
        
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
          claimant: caseData.name || 'Not specified',
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
          disputeAmount: caseData.disputeDetails?.disputeAmount,
          priority: caseData.priority || 'Medium'
        }
      })
      
      setCases(formattedCases)
    } catch (err) {
      console.error('Error fetching cases:', err)
      setError('Failed to load your cases. Please try again later.')
      toast.error('Unable to load your cases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])
  
  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchCases}
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
        onRefresh={fetchCases}
      />
    </div>
  )
} 