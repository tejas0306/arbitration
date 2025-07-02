"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  Search,
  Filter,
  Star,
  StarHalf,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  GraduationCap,
  CheckCircle,
  DollarSign
} from 'lucide-react'

interface ArbitratorSelectionProps {
  caseId: string
  onComplete?: () => void
  showTitle?: boolean
  className?: string
}

interface Arbitrator {
  id: string
  name: string
  email: string
  expertise?: string
  qualifications?: string
  experience?: number
  languages?: string[]
  location?: string
  hourlyRate?: number
  availability?: string
  rating?: number
  status: 'active' | 'inactive' | 'pending'
  avatarUrl?: string
}

export default function ArbitratorSelection({ 
  caseId, 
  onComplete, 
  showTitle = true,
  className = ''
}: ArbitratorSelectionProps) {
  const router = useRouter()
  const [arbitrators, setArbitrators] = useState<Arbitrator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all')
  const [selectedArbitrator, setSelectedArbitrator] = useState<string | null>(null)
  const [proposing, setProposing] = useState(false)
  const [proposals, setProposals] = useState<any[]>([])
  const [loadingProposals, setLoadingProposals] = useState(true)
  const [expertiseOptions, setExpertiseOptions] = useState<string[]>([])
  
  useEffect(() => {
    fetchArbitrators()
    fetchProposals()
  }, [caseId])
  
  const fetchArbitrators = async () => {
    try {
      setLoading(true)
      
      // Build query params based on filters
      const params = new URLSearchParams()
      params.append('status', 'active')
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (expertiseFilter !== 'all') {
        params.append('expertise', expertiseFilter)
      }
      
      const apiUrl = getApiUrl(`api/arbitrators?${params}`)
      
      // Make the request without explicitly setting Authorization header
      // NextAuth will handle the session cookie automatically
      const response = await fetch(apiUrl, {
        credentials: 'include', // Include cookies
      })
      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to fetch arbitrators')
      }
      
      const data = await response.json()
      
      // Extract unique expertise values for filters
      const expertiseSet = new Set<string>()
      data.forEach((arb: Arbitrator) => {
        if (arb.expertise) {
          expertiseSet.add(arb.expertise)
        }
      })
      
      setExpertiseOptions(Array.from(expertiseSet))
      setArbitrators(data || [])
    } catch (error) {
      toast.error('Failed to load arbitrators')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchProposals = async () => {
    try {
      setLoadingProposals(true)
      const apiUrl = getApiUrl(`api/arbitration/cases/${caseId}/arbitrator-proposals`)
      
      const response = await fetch(apiUrl, {
        credentials: 'include' // Include cookies
      })
      
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to fetch arbitrator proposals')
      }
      
      const data = await response.json()
      setProposals(data || [])
    } catch (error) {
    } finally {
      setLoadingProposals(false)
    }
  }
  
  const handleSearch = () => {
    fetchArbitrators()
  }
  
  const handleSelectArbitrator = (arbitratorId: string) => {
    setSelectedArbitrator(arbitratorId === selectedArbitrator ? null : arbitratorId)
  }
  
  const handleProposeArbitrator = async () => {
    if (!selectedArbitrator) {
      toast.error('Please select an arbitrator first')
      return
    }
    
    try {
      setProposing(true)
      
      const apiUrl = getApiUrl(`api/arbitration/cases/${caseId}/propose-arbitrator`)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          arbitratorId: selectedArbitrator
        })
      })
      
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to propose arbitrator')
      }
      
      const data = await response.json()
      
      toast.success('Arbitrator proposed successfully')
      fetchProposals()
      setSelectedArbitrator(null)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to propose arbitrator')
    } finally {
      setProposing(false)
    }
  }

  const handleRespondToProposal = async (proposalId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const apiUrl = getApiUrl(`api/arbitration/arbitrator-proposals/${proposalId}/respond`)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          status
        })
      })
      
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || `Failed to ${status.toLowerCase()} proposal`)
      }
      
      const data = await response.json()
      
      toast.success(`Proposal ${status.toLowerCase()} successfully`)
      fetchProposals()
      
      if (status === 'ACCEPTED' && onComplete) {
        onComplete()
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${status.toLowerCase()} proposal`)
    }
  }
  
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }
  
  const pendingProposal = proposals.find(p => p.status === 'PENDING')
  const hasProposalsThatNeedResponse = proposals.some(p => 
    p.status === 'PENDING' && p.proposedBy.id !== localStorage.getItem('user_id')
  )
  const lastProposal = proposals.length > 0 ? proposals[0] : null
  const canProposeNew = !pendingProposal || 
    (pendingProposal && pendingProposal.proposedBy.id !== localStorage.getItem('user_id'))
  
  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Arbitrator Selection</h2>
          <p className="text-muted-foreground">
            Choose an arbitrator for your case from our panel of experts
          </p>
        </div>
      )}
      
      {/* Existing Proposals Section */}
      {proposals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Arbitrator Proposals</CardTitle>
            <CardDescription>
              Review and respond to arbitrator proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProposals ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div 
                    key={proposal.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center mb-2 md:mb-0">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarFallback>{proposal.arbitrator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{proposal.arbitrator.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Proposed by {proposal.proposedBy.name} ({proposal.proposerRole})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {proposal.status === 'PENDING' && proposal.proposedBy.id !== localStorage.getItem('user_id') && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRespondToProposal(proposal.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRespondToProposal(proposal.id, 'ACCEPTED')}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      {proposal.status === 'PENDING' && proposal.proposedBy.id === localStorage.getItem('user_id') && (
                        <Badge>Awaiting Response</Badge>
                      )}
                      {proposal.status === 'ACCEPTED' && (
                        <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                      )}
                      {proposal.status === 'REJECTED' && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Selection Section - Show only if we can propose a new arbitrator */}
      {canProposeNew && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Available Arbitrators</CardTitle>
              <CardDescription>
                Select an arbitrator for your case
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search arbitrators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8"
                  />
                </div>
                <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Expertise</SelectItem>
                    {expertiseOptions.map(expertise => (
                      <SelectItem key={expertise} value={expertise}>{expertise}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSearch}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : arbitrators.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No arbitrators found matching your criteria.</p>
                </div>
              ) : (
                <RadioGroup value={selectedArbitrator || ""} className="space-y-4">
                  {arbitrators.map(arbitrator => (
                    <div
                      key={arbitrator.id}
                      className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedArbitrator === arbitrator.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectArbitrator(arbitrator.id)}
                    >
                      <RadioGroupItem 
                        value={arbitrator.id} 
                        id={`arbitrator-${arbitrator.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={arbitrator.avatarUrl} alt={arbitrator.name} />
                              <AvatarFallback>{arbitrator.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Label htmlFor={`arbitrator-${arbitrator.id}`} className="text-base font-medium cursor-pointer">
                                {arbitrator.name}
                              </Label>
                              {arbitrator.rating && (
                                <div className="mt-1">
                                  {renderRatingStars(arbitrator.rating)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {arbitrator.hourlyRate && (
                              <div className="flex items-center justify-end text-sm font-medium">
                                <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(arbitrator.hourlyRate)}/hr
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                          {arbitrator.expertise && (
                            <div className="flex items-center text-sm">
                              <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Expertise: {arbitrator.expertise}</span>
                            </div>
                          )}
                          {arbitrator.experience && (
                            <div className="flex items-center text-sm">
                              <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Experience: {arbitrator.experience} years</span>
                            </div>
                          )}
                          {arbitrator.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Location: {arbitrator.location}</span>
                            </div>
                          )}
                          {arbitrator.availability && (
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>Availability: {arbitrator.availability}</span>
                            </div>
                          )}
                        </div>
                        
                        {arbitrator.qualifications && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Qualifications:</span> {arbitrator.qualifications}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedArbitrator(null)}>
                Clear Selection
              </Button>
              <Button 
                onClick={handleProposeArbitrator} 
                disabled={!selectedArbitrator || proposing}
              >
                {proposing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Proposing...
                  </>
                ) : (
                  <>Propose Arbitrator</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
} 