"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Clock,
  DollarSign,
  Star,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Award,
  Edit,
  Trash,
  AlertTriangle
} from 'lucide-react'

interface ArbitratorData {
  id: string
  name: string
  email: string
  phone?: string
  expertise?: string
  qualifications?: string
  experience?: number
  bio?: string
  languages?: string[]
  location?: string
  hourlyRate?: number
  availabilityInfo?: string
  status: 'active' | 'inactive' | 'pending'
  assignedCases: number
  completedCases: number
  createdAt: string
  updatedAt: string
  arbitrations: Array<{
    id: string
    caseNumber: string
    status: string
    updatedAt: string
  }>
}

export default function ArbitratorDetail() {
  const router = useRouter()
  const params = useParams()
  const arbitratorId = params?.id as string
  
  const [arbitrator, setArbitrator] = useState<ArbitratorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  
  useEffect(() => {
    fetchArbitratorData()
  }, [arbitratorId])
  
  const fetchArbitratorData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(getApiUrl(`api/admin/arbitrators/${arbitratorId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrator data')
      }
      
      const data = await response.json()
      setArbitrator(data)
    } catch (error: any) {
      console.error('Error fetching arbitrator:', error)
      setError(error.message || 'Failed to load arbitrator')
      toast.error('Error loading arbitrator details')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChangeStatus = async (newStatus: string) => {
    try {
      const response = await fetch(getApiUrl(`api/admin/arbitrators/${arbitratorId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update arbitrator status')
      }
      
      toast.success(`Arbitrator status updated to ${newStatus}`)
      
      // Update local state
      if (arbitrator) {
        setArbitrator({
          ...arbitrator,
          status: newStatus as any
        })
      }
    } catch (error) {
      console.error('Error updating arbitrator status:', error)
      toast.error('Failed to update arbitrator status')
    }
  }
  
  const handleDeleteArbitrator = async () => {
    try {
      const response = await fetch(getApiUrl(`api/admin/arbitrators/${arbitratorId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete arbitrator')
      }
      
      toast.success('Arbitrator deleted successfully')
      router.push('/dashboard/arbitrators')
    } catch (error: any) {
      console.error('Error deleting arbitrator:', error)
      toast.error(`Failed to delete arbitrator: ${error.message}`)
    } finally {
      setIsConfirmingDelete(false)
    }
  }
  
  const handleEdit = () => {
    router.push(`/dashboard/arbitrators/edit/${arbitratorId}`)
  }
  
  const handleBack = () => {
    router.push('/dashboard/arbitrators')
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  
  if (error || !arbitrator) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Arbitrator</h2>
        <p className="text-red-700 mb-4">{error || 'Arbitrator not found'}</p>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Arbitrator Details</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          {arbitrator.status === 'pending' && (
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleChangeStatus('active')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          
          {arbitrator.status === 'active' && (
            <Button 
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => handleChangeStatus('inactive')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}
          
          {arbitrator.status === 'inactive' && (
            <Button 
              variant="outline" 
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => handleChangeStatus('active')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          
          {!isConfirmingDelete ? (
            <Button 
              variant="destructive" 
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="destructive" 
                onClick={handleDeleteArbitrator}
              >
                Confirm Delete
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Arbitrator Profile</span>
              {getStatusBadge(arbitrator.status)}
            </CardTitle>
            <CardDescription>
              Registration Date: {formatDate(arbitrator.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <User className="h-10 w-10 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{arbitrator.name}</h2>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {arbitrator.email}
                  </div>
                  {arbitrator.phone && (
                    <div className="flex items-center text-gray-500 mt-1">
                      <Phone className="h-4 w-4 mr-2" />
                      {arbitrator.phone}
                    </div>
                  )}
                  {arbitrator.location && (
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      {arbitrator.location}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Qualifications
                  </h3>
                  <p className="text-gray-700">
                    {arbitrator.qualifications || "No qualifications specified"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Experience
                  </h3>
                  <p className="text-gray-700">
                    {arbitrator.experience ? `${arbitrator.experience} years` : "Not specified"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <Globe className="h-4 w-4 mr-2" />
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {arbitrator.languages && arbitrator.languages.length > 0 ? (
                      arbitrator.languages.map((language, index) => (
                        <Badge key={index} variant="outline">{language}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No languages specified</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Hourly Rate
                  </h3>
                  <p className="text-gray-700">
                    {arbitrator.hourlyRate ? `₹${arbitrator.hourlyRate}/hour` : "Not specified"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Professional Bio
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {arbitrator.bio || "No bio available"}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <Star className="h-4 w-4 mr-2" />
                  Area of Expertise
                </h3>
                <p className="text-gray-700">
                  {arbitrator.expertise || "No expertise specified"}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  Availability Information
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {arbitrator.availabilityInfo || "No availability information provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-xs text-blue-600 mb-1">Assigned Cases</div>
                <div className="text-2xl font-bold">{arbitrator.assignedCases}</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-xs text-green-600 mb-1">Completed</div>
                <div className="text-2xl font-bold">{arbitrator.completedCases}</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-xs text-yellow-600 mb-1">Avg. Resolution</div>
                <div className="text-2xl font-bold">N/A</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-xs text-purple-600 mb-1">Rating</div>
                <div className="text-2xl font-bold flex items-center">
                  N/A <Star className="h-4 w-4 ml-1 text-yellow-500" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Case Resolution Stats</h3>
              <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">No data available</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Expertise Distribution</h3>
              <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">No data available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Assigned Cases</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="disclosures">Disclosures</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Ratings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Cases</CardTitle>
              <CardDescription>
                Cases assigned to this arbitrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {arbitrator.arbitrations && arbitrator.arbitrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arbitrator.arbitrations.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{caseItem.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(caseItem.updatedAt)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/case/${caseItem.id}`)}
                          >
                            View Case
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-center">No cases have been assigned to this arbitrator yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
              <CardDescription>
                Arbitrator's availability and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium mb-2">Availability Management Coming Soon</p>
              <p className="text-center max-w-lg">
                This feature will allow arbitrators to manage their calendar, block out dates, 
                and set preferences for in-person vs. virtual hearings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="disclosures" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Disclosures</CardTitle>
              <CardDescription>
                Arbitrator's legal disclosures and conflict of interest declarations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium mb-2">Disclosure Management Coming Soon</p>
              <p className="text-center max-w-lg">
                This feature will track all disclosures submitted by the arbitrator for each case, 
                including conflict of interest declarations, relationships with parties, and 
                impartiality statements per Section 12 of the Arbitration Act.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback & Ratings</CardTitle>
              <CardDescription>
                Feedback received from parties and system-calculated scores
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Star className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium mb-2">Feedback System Coming Soon</p>
              <p className="text-center max-w-lg">
                This feature will display ratings and feedback from claimants and respondents, 
                as well as system-calculated scores based on case outcomes, timeliness, and 
                other performance metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 