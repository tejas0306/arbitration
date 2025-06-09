"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  ArrowLeft,
  Edit,
  FileText,
  Clock,
  Calendar,
  User,
  Users,
  DollarSign,
  Briefcase,
  Building,
  Mail,
  Phone,
  Download,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Tag,
  Flag,
  Bookmark,
  Hash,
  UserPlus
} from 'lucide-react'
import ArbitratorSelection from '@/components/arbitrator-selection'

interface CaseViewProps {
  caseId?: string
}

export default function CaseView({ caseId: propsCaseId }: CaseViewProps) {
  const router = useRouter()
  const params = useParams()
  const resolvedCaseId = propsCaseId || (params?.id as string)
  
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [arbitratorName, setArbitratorName] = useState<string>('Not assigned')
  const [arbitratorProposals, setArbitratorProposals] = useState<any[]>([])
  const [loadingProposals, setLoadingProposals] = useState(false)

  // Category options mapping for display
  const categoryLabels: Record<string, string> = {
    'commercial': 'Commercial Dispute',
    'employment': 'Employment Dispute',
    'construction': 'Construction',
    'ip': 'Intellectual Property',
    'insurance': 'Insurance',
    'corporate': 'Corporate',
    'real_estate': 'Real Estate',
    'other': 'Other'
  }

  useEffect(() => {
    if (resolvedCaseId) {
      fetchCaseData(resolvedCaseId)
      fetchArbitratorProposals(resolvedCaseId)
    }
  }, [resolvedCaseId])

  const fetchCaseData = async (id: string) => {
    try {
      setLoading(true)
      console.log(`Fetching case data for ID: ${id}`)
      
      const response = await fetch(getApiUrl(`api/admin/cases/${id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch case data')
      }
      
      const data = await response.json()
      console.log('Fetched case data:', data)
      
      // Fetch arbitrator name if ID exists
      if (data.arbitratorId) {
        try {
          const arbResponse = await fetch(getApiUrl(`api/admin/arbitrators/${data.arbitratorId}`), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
          
          if (arbResponse.ok) {
            const arbData = await arbResponse.json()
            setArbitratorName(arbData.name || 'Unknown')
          }
        } catch (error) {
          console.error('Error fetching arbitrator details:', error)
        }
      }
      
      setCaseData(data)
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
      
      // Use mock data for development
      setCaseData({
        id: id,
        caseNumber: 'ADDS/ARB/2025/0000023',
        title: 'Contract Dispute - Smith vs ABC Corp',
        type: 'Commercial',
        category: 'commercial',
        status: 'pending',
        priority: 'medium',
        createdAt: '2025-05-24T10:00:00Z',
        updatedAt: '2025-05-25T14:30:00Z',
        claimant: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123'
        },
        respondent: {
          name: 'ABC Corporation',
          email: 'legal@abccorp.com',
          phone: '+1-555-0456'
        },
        disputeDetails: {
          disputeType: 'Contract Breach',
          disputeAmount: '150000',
          disputeDescription: 'Failure to deliver services as specified in contract dated Jan 15, 2025.'
        },
        description: 'Dispute regarding breach of contract for software development services.',
        amount: 150000,
        arbitratorId: 'arb123',
        arbitrator: {
          id: 'arb123',
          name: 'Emily Davis',
          email: 'emily.davis@arbitration.com'
        },
        documents: [
          {
            id: 'doc1',
            name: 'Contract Agreement',
            type: 'pdf',
            uploaded: '2025-05-24T10:05:00Z'
          },
          {
            id: 'doc2',
            name: 'Invoice Evidence',
            type: 'pdf',
            uploaded: '2025-05-24T10:10:00Z'
          }
        ],
        timeline: [
          {
            id: 'event1',
            type: 'CASE_CREATED',
            date: '2025-05-24T10:00:00Z',
            description: 'Case was created'
          },
          {
            id: 'event2',
            type: 'DOCUMENT_ADDED',
            date: '2025-05-24T10:05:00Z',
            description: 'Contract Agreement was uploaded'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchArbitratorProposals = async (id: string) => {
    try {
      setLoadingProposals(true)
      const response = await fetch(getApiUrl(`api/arbitration/cases/${id}/arbitrator-proposals`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrator proposals')
      }
      
      const data = await response.json()
      console.log('Fetched arbitrator proposals:', data)
      setArbitratorProposals(data || [])
    } catch (error) {
      console.error('Error fetching arbitrator proposals:', error)
    } finally {
      setLoadingProposals(false)
    }
  }

  const handleEditCase = () => {
    router.push(`/admin/cases/edit/${resolvedCaseId}`)
  }

  const handleBackToList = () => {
    router.push('/admin/cases')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: string | number) => {
    if (!amount) return 'N/A'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, icon: React.ReactNode }> = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Clock className="h-3 w-3 mr-1" /> 
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="h-3 w-3 mr-1" /> 
      },
      active: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: <CheckCircle className="h-3 w-3 mr-1" /> 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: <XCircle className="h-3 w-3 mr-1" /> 
      },
      draft: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: <FileText className="h-3 w-3 mr-1" /> 
      },
      resolved: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="h-3 w-3 mr-1" /> 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        icon: <XCircle className="h-3 w-3 mr-1" /> 
      }
    }
    
    const { color, icon } = statusMap[status?.toLowerCase()] || statusMap.pending
    
    return (
      <span className={`px-3 py-1 rounded-full inline-flex items-center ${color}`}>
        {icon}
        <span className="capitalize">{status?.replace(/_/g, ' ') || 'Pending'}</span>
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: string, icon: React.ReactNode }> = {
      high: { 
        color: 'bg-red-100 text-red-800', 
        icon: <Flag className="h-3 w-3 mr-1" /> 
      },
      medium: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Flag className="h-3 w-3 mr-1" /> 
      },
      low: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: <Flag className="h-3 w-3 mr-1" /> 
      }
    }
    
    const { color, icon } = priorityMap[priority?.toLowerCase()] || priorityMap.medium
    
    return (
      <span className={`px-3 py-1 rounded-full inline-flex items-center ${color}`}>
        {icon}
        <span className="capitalize">{priority?.replace(/_/g, ' ') || 'Medium'}</span>
      </span>
    )
  }

  // Render form steps
  const renderFormContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>
                Basic information about this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                    Case Number
                  </h3>
                  <p>{caseData.caseNumber || 'Not assigned'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    Title
                  </h3>
                  <p>{caseData.title || 'Not assigned'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Bookmark className="h-4 w-4 mr-2 text-muted-foreground" />
                    Category
                  </h3>
                  <p>{categoryLabels[caseData.category] || caseData.category || 'Not assigned'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    Arbitrator
                  </h3>
                  <p>{caseData.arbitrator?.name || arbitratorName || 'Not assigned'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    Created At
                  </h3>
                  <p>{formatDate(caseData.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    Last Updated
                  </h3>
                  <p>{formatDate(caseData.updatedAt || caseData.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    Dispute Amount
                  </h3>
                  <p>{formatCurrency(caseData.amount || caseData.disputeDetails?.disputeAmount || 0)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
                    Priority
                  </h3>
                  <div>
                    <Badge variant={caseData.priority?.toLowerCase() === 'high' ? 'destructive' : (caseData.priority?.toLowerCase() === 'medium' ? 'default' : 'secondary')}>
                      {caseData.priority?.toUpperCase() || 'Medium'}
                    </Badge>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    Description
                  </h3>
                  <p className="whitespace-pre-line">{caseData.description || caseData.disputeDetails?.disputeDescription || 'No description provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'parties':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Claimant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm text-muted-foreground">Name</h3>
                  <p className="font-medium">
                    {caseData.claimant?.name || caseData.name || 
                     (caseData.claimants && caseData.claimants.length > 0 ? 
                      caseData.claimants[0].name : 'Not specified')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm text-muted-foreground">Email</h3>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>
                      {caseData.claimant?.email || caseData.claimantEmail || 
                       (caseData.claimants && caseData.claimants.length > 0 ? 
                        caseData.claimants[0].email : 'Not specified')}
                    </p>
                  </div>
                </div>
                
                {caseData.claimant?.phone && (
                  <div>
                    <h3 className="text-sm text-muted-foreground">Phone</h3>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{caseData.claimant.phone}</p>
                    </div>
                  </div>
                )}
                
                {caseData.claimant?.organization && (
                  <div>
                    <h3 className="text-sm text-muted-foreground">Organization</h3>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{caseData.claimant.organization}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Respondent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm text-muted-foreground">Name</h3>
                  <p className="font-medium">
                    {caseData.respondent?.name || 
                     (caseData.respondents && caseData.respondents.length > 0 ? 
                      caseData.respondents[0].name : 'Not specified')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm text-muted-foreground">Email</h3>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>
                      {caseData.respondent?.email || caseData.respondentEmail || 
                       (caseData.respondents && caseData.respondents.length > 0 ? 
                        caseData.respondents[0].email : 'Not specified')}
                    </p>
                  </div>
                </div>
                
                {caseData.respondent?.phone && (
                  <div>
                    <h3 className="text-sm text-muted-foreground">Phone</h3>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{caseData.respondent.phone}</p>
                    </div>
                  </div>
                )}
                
                {(caseData.respondent?.organization || (caseData.respondents && caseData.respondents[0]?.organization)) && (
                  <div>
                    <h3 className="text-sm text-muted-foreground">Organization</h3>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>{caseData.respondent?.organization || caseData.respondents[0]?.organization}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'documents':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Case Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!caseData.documents || (Array.isArray(caseData.documents) && caseData.documents.length === 0) ? (
                <p className="text-muted-foreground text-center py-6">No documents available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(caseData.documents) ? (
                      caseData.documents.map((document: any) => (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium">{document.name}</TableCell>
                          <TableCell>{document.type?.toUpperCase() || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(document.uploaded || document.createdAt)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {caseData.arbitrationAgreement?.agreementFile && (
                          <TableRow>
                            <TableCell className="font-medium">Arbitration Agreement</TableCell>
                            <TableCell>PDF</TableCell>
                            <TableCell>{formatDate(caseData.createdAt)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )

      case 'timeline':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {!caseData.timeline || caseData.timeline.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No timeline events available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {caseData.timeline.map((event: any) => (
                    <div key={event.id} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="rounded-full h-3 w-3 bg-primary"></div>
                        {/* Line connecting to next event */}
                        <div className="w-px grow bg-border"></div>
                      </div>
                      <div className="pb-6">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(event.date)}
                        </div>
                        <div className="font-medium mt-1">{event.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'arbitrator':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Arbitrator Assignment</CardTitle>
              <CardDescription>
                Manage the arbitrator selection and assignment process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current arbitrator info if already assigned */}
              {caseData.arbitratorId && (
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium">Assigned Arbitrator</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {arbitratorName}
                    </div>
                    {caseData.arbitrator?.email && (
                      <div>
                        <span className="font-medium">Email:</span> {caseData.arbitrator.email}
                      </div>
                    )}
                    {caseData.arbitrator?.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {caseData.arbitrator.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Arbitrator proposal history */}
              {arbitratorProposals.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Proposal History</h3>
                  <div className="space-y-4">
                    {arbitratorProposals.map((proposal) => (
                      <div 
                        key={proposal.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="mb-2 sm:mb-0">
                          <div className="font-medium">{proposal.arbitrator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Proposed by {proposal.proposedBy.name} ({proposal.proposerRole}) on {formatDate(proposal.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {proposal.status === 'PENDING' && (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                          {proposal.status === 'ACCEPTED' && !proposal.arbitratorAccepted && (
                            <Badge className="bg-blue-100 text-blue-800">Awaiting Arbitrator</Badge>
                          )}
                          {proposal.status === 'ACCEPTED' && proposal.arbitratorAccepted === true && (
                            <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                          )}
                          {proposal.status === 'ACCEPTED' && proposal.arbitratorAccepted === false && (
                            <Badge className="bg-orange-100 text-orange-800">Declined by Arbitrator</Badge>
                          )}
                          {proposal.status === 'REJECTED' && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Admin actions for arbitrator assignment */}
              {!caseData.arbitratorId && caseData.status !== 'resolved' && caseData.status !== 'cancelled' && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Arbitrator Selection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the panel below to initiate or manage the arbitrator selection process for this case.
                  </p>
                  
                  {/* Include the arbitrator selection component */}
                  <ArbitratorSelection 
                    caseId={resolvedCaseId}
                    showTitle={false}
                    onComplete={() => {
                      fetchCaseData(resolvedCaseId)
                      fetchArbitratorProposals(resolvedCaseId)
                      toast.success('Arbitrator proposal processed successfully')
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!caseData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Case not found or you don't have permission to view it.</p>
          <Button onClick={handleBackToList}>
            Back to Cases List
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Extract case fields, considering different possible structures
  const title = caseData.title || caseData.name || ''
  const caseNumber = caseData.caseNumber || 'Not assigned'
  const description = caseData.description || caseData.disputeDetails?.disputeDescription || ''
  const amount = caseData.amount || caseData.disputeDetails?.disputeAmount || 0
  const category = caseData.category || caseData.type || 'other'
  const priority = caseData.priority?.toLowerCase() || 'medium'
  const status = caseData.status?.toLowerCase() || 'pending'
  
  // Extract claimant information
  const claimantName = caseData.claimant?.name || caseData.name || 
    (caseData.claimants && caseData.claimants.length > 0 ? caseData.claimants[0].name : 'Not specified')
  const claimantEmail = caseData.claimant?.email || caseData.claimantEmail || 
    (caseData.claimants && caseData.claimants.length > 0 ? caseData.claimants[0].email : '')
  
  // Extract respondent information
  const respondentName = caseData.respondent?.name || 
    (caseData.respondents && caseData.respondents.length > 0 ? caseData.respondents[0].name : 'Not specified')
  const respondentEmail = caseData.respondent?.email || caseData.respondentEmail || 
    (caseData.respondents && caseData.respondents.length > 0 ? caseData.respondents[0].email : '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackToList} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {caseNumber !== 'Not assigned' ? `Case #${caseNumber}` : 'New Case'}
            </h1>
            <p className="text-muted-foreground">
              {title}
            </p>
          </div>
        </div>
        <Button onClick={handleEditCase}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Case
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="font-medium">{getStatusBadge(status)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(caseData.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dispute Amount</p>
                <p className="font-medium">{formatCurrency(amount)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Flag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <div className="font-medium">
                  <Badge variant={priority === 'high' ? 'destructive' : (priority === 'medium' ? 'default' : 'secondary')}>
                    {priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="arbitrator">Arbitrator</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {renderFormContent()}
        </TabsContent>
        
        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-4">
          {renderFormContent()}
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {renderFormContent()}
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {renderFormContent()}
        </TabsContent>
        
        {/* Arbitrator Tab */}
        <TabsContent value="arbitrator" className="space-y-4">
          {renderFormContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
} 