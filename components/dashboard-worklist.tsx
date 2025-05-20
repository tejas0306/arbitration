"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Edit, FileText } from 'lucide-react'

// Type definitions
interface ArbitrationCase {
  id: string
  caseNumber: string // Format: ADDS/ARB/{Year}/{Six Digit Running Number}
  claimant: string
  respondent: string
  category: string
  subCategory: string
  natureOfDispute: string
  arbitratorName: string
  arbitratorAssigned: "Assigned" | "Not Assigned"
  status: string
  hearingMode: "Online" | "Physical"
  lastUpdatedDate: string
  nextHearingDate: string | null
  agreementFile: string | null // Add agreement file property
  [key: string]: any // For any additional properties
}

export default function DashboardWorklist() {
  const router = useRouter()
  const [cases, setCases] = useState<ArbitrationCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
            agreementFile
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
    
    fetchCases()
  }, [])
  
  const handleViewCase = (id: string) => {
    try {
      console.log(`Navigating to case details: /dashboard/case/${id}`)
      router.push(`/dashboard/case/${id}`)
    } catch (error) {
      console.error("Navigation error:", error)
      toast.error("Failed to navigate to case details. Please try again.")
    }
  }
  
  const handleEditCase = (id: string) => {
    router.push(`/dashboard/petition/edit/${id}`)
  }
  
  const handleDownloadDocuments = (id: string) => {
    // Implement document download logic
    toast.info('Document download will be available soon')
  }
  
  const handleViewDocument = (documentUrl: string | null) => {
    if (!documentUrl) {
      toast.error('No document file available')
      return
    }
    
    try {
      // Log the document URL for debugging
      console.log('Original document URL:', documentUrl)
      
      // Extract just the filename from the path if it exists
      const filename = documentUrl.includes('/') 
        ? documentUrl.split('/').pop() 
        : documentUrl
      
      // Check if it's a full URL
      if (documentUrl.startsWith('http')) {
        // It's already a full URL, just open it
        window.open(documentUrl, '_blank')
      } 
      // Use our new direct file access endpoint for all files
      else if (filename) {
        const baseUrl = window.location.origin
        const directUrl = `${baseUrl}/api/direct-file/${filename}`
        console.log(`Opening document directly: ${directUrl}`)
        window.open(directUrl, '_blank')
      }
      // Fallback for any other case
      else {
        const baseUrl = window.location.origin
        const documentPath = `/api/documents/download?filename=${encodeURIComponent(documentUrl)}`
        console.log(`Opening document: ${baseUrl}${documentPath}`)
        window.open(`${baseUrl}${documentPath}`, '_blank')
      }
    } catch (error) {
      console.error('Error opening document:', error)
      toast.error('Could not open the document. Please try again later.')
    }
  }
  
  // Status badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'arbitrator_assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-indigo-600 hover:underline mt-2 inline-block"
        >
          Try Again
        </button>
      </div>
    )
  }
  
  if (cases.length === 0) {
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
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            List of your arbitration cases in the system.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Claimant</TableHead>
              <TableHead>Respondent</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub-Category</TableHead>
              <TableHead>Nature of Dispute</TableHead>
              <TableHead>Arbitrator</TableHead>
              <TableHead>Arb. Status</TableHead>
              <TableHead>Case Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Agreement File</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Next Hearing</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                <TableCell>{case_.claimant}</TableCell>
                <TableCell>{case_.respondent}</TableCell>
                <TableCell>{case_.category}</TableCell>
                <TableCell>{case_.subCategory}</TableCell>
                <TableCell>{case_.natureOfDispute}</TableCell>
                <TableCell>{case_.arbitratorName}</TableCell>
                <TableCell>
                  <Badge variant={case_.arbitratorAssigned === "Assigned" ? "success" : "secondary"}>
                    {case_.arbitratorAssigned}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(case_.status)}`}
                  >
                    {case_.status}
                  </span>
                </TableCell>
                <TableCell>{case_.hearingMode}</TableCell>
                <TableCell>
                  {case_.agreementFile ? (
                    <button 
                      onClick={() => handleViewDocument(case_.agreementFile)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>{new Date(case_.lastUpdatedDate).toLocaleDateString()}</TableCell>
                <TableCell>{case_.nextHearingDate ? new Date(case_.nextHearingDate).toLocaleDateString() : 'Not scheduled'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewCase(case_.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditCase(case_.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Case</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDocuments(case_.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documents</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 