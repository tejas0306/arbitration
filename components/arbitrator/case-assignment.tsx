"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { FileUpload } from '@/components/file-upload'
import {
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Calendar,
  User,
  Users,
  DollarSign,
  AlertCircle,
  Upload
} from 'lucide-react'

interface CaseAssignmentProps {
  onComplete?: () => void
}

export default function CaseAssignment({ onComplete }: CaseAssignmentProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState<any>(null)
  const [responseNotes, setResponseNotes] = useState('')
  const [disclosureFiles, setDisclosureFiles] = useState<File[]>([])
  
  useEffect(() => {
    fetchAssignments()
  }, [])
  
  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl('api/arbitration/arbitrator/assignments'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to load case assignments')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenAssignment = (assignment: any) => {
    setActiveAssignment(assignment)
    setResponseNotes('')
    setDisclosureFiles([])
  }
  
  const handleFileChange = (files: File[]) => {
    setDisclosureFiles(files)
  }
  
  const handleRespondToAssignment = async (accepted: boolean) => {
    if (!activeAssignment) return
    
    if (accepted && disclosureFiles.length === 0) {
      toast.error('Please upload disclosure documents before accepting')
      return
    }
    
    try {
      setResponding(true)
      
      // Prepare disclosure documents data
      const disclosureData = disclosureFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // In a real implementation, you would upload these files to a server
        // and include the URLs here
        url: URL.createObjectURL(file)
      }))
      
      const response = await fetch(
        getApiUrl(`api/arbitration/arbitrator-proposals/${activeAssignment.id}/arbitrator-response`), 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            accepted,
            notes: responseNotes,
            disclosureDocuments: disclosureFiles.length > 0 ? disclosureData : undefined
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${accepted ? 'accept' : 'reject'} assignment`)
      }
      
      toast.success(`Assignment ${accepted ? 'accepted' : 'rejected'} successfully`)
      
      // Refresh assignments
      fetchAssignments()
      
      // Close the assignment details
      setActiveAssignment(null)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      console.error('Error responding to assignment:', error)
      toast.error(error.message || `Failed to ${accepted ? 'accept' : 'reject'} assignment`)
    } finally {
      setResponding(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  
  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Pending Assignments</h3>
          <p className="text-muted-foreground">
            You have no pending case assignments that require your attention.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // If viewing a specific assignment
  if (activeAssignment) {
    const { case: caseData, arbitrator, proposedBy } = activeAssignment
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Case Assignment Review</CardTitle>
            <Button variant="ghost" onClick={() => setActiveAssignment(null)}>
              Back to List
            </Button>
          </div>
          <CardDescription>
            Review and respond to this case assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Case Number:</span> {caseData.caseNumber}
              </div>
              <div>
                <span className="font-medium">Case Type:</span> {caseData.type}
              </div>
              <div>
                <span className="font-medium">Filed On:</span> {formatDate(caseData.createdAt)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {caseData.status}
              </div>
            </div>
            
            <div className="mt-4">
              <span className="font-medium">Dispute Details:</span>
              <p className="mt-1 text-sm">
                {caseData.disputeDetails?.disputeDescription || 'No description provided'}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Proposal Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have been proposed as an arbitrator for this case by {proposedBy.name}.
              Please review the case details and respond to this assignment.
            </p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Response Notes (Optional)
                </label>
                <Textarea
                  placeholder="Add any notes regarding your acceptance or rejection..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Disclosure Documents (Required for Acceptance)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  If accepting this assignment, please upload any required disclosure documents as per the Arbitration Act.
                </p>
                <FileUpload
                  onFilesSelected={handleFileChange}
                  maxFiles={5}
                  maxSize={5}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => handleRespondToAssignment(false)}
            disabled={responding}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline Assignment
          </Button>
          <Button 
            onClick={() => handleRespondToAssignment(true)}
            disabled={responding}
          >
            {responding ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Assignment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }
  
  // List of assignments
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pending Case Assignments</h2>
      <p className="text-muted-foreground">
        Review and respond to cases where you have been proposed as an arbitrator
      </p>
      
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row border-b">
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      Case #{assignment.case.caseNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Filed on {formatDate(assignment.case.createdAt)}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">
                    Pending Response
                  </Badge>
                </div>
                
                <div className="mt-4 flex items-center text-sm">
                  <User className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-medium mr-1">Proposed by:</span>
                  {assignment.proposedBy.name} ({assignment.proposedBy.role})
                </div>
                
                <div className="mt-2 text-sm line-clamp-2">
                  <span className="font-medium">Dispute:</span> {' '}
                  {assignment.case.disputeDetails?.disputeDescription || 'No description provided'}
                </div>
              </div>
              
              <div className="bg-muted/20 p-6 flex flex-row md:flex-col justify-around items-center md:w-48 border-t md:border-t-0 md:border-l">
                <Button 
                  variant="outline" 
                  className="w-full mb-2"
                  onClick={() => handleOpenAssignment(assignment)}
                >
                  Review Details
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mx-auto mb-1" />
                  Response Required
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 