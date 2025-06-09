"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash,
  Eye,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Star,
  Mail,
  Phone,
  FileText,
  Briefcase,
  Calendar,
  Clock,
  Award,
  MoreHorizontal
} from 'lucide-react'

interface Arbitrator {
  id: string
  name: string
  email: string
  phone?: string
  expertise?: string
  qualifications?: string
  experience?: number
  languages?: string[]
  location?: string
  hourlyRate?: number
  availability?: string
  rating?: number
  status: 'active' | 'inactive' | 'pending'
  assignedCases: number
  completedCases: number
  createdAt: string
}

interface ArbitratorStats {
  total: number
  active: number
  pending: number
  inactive: number
  averageRating: number
  topExpertise: {
    [key: string]: number
  }
}

export default function ArbitratorsManagement() {
  const router = useRouter()
  const [arbitrators, setArbitrators] = useState<Arbitrator[]>([])
  const [stats, setStats] = useState<ArbitratorStats>({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    averageRating: 0,
    topExpertise: {}
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newArbitrator, setNewArbitrator] = useState({
    name: '',
    email: '',
    phone: '',
    expertise: '',
    qualifications: '',
    experience: 0
  })
  
  useEffect(() => {
    fetchArbitrators()
  }, [statusFilter])
  
  const fetchArbitrators = async () => {
    try {
      setLoading(true)
      
      // Build query params based on filters
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(getApiUrl(`api/admin/arbitrators?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrators')
      }
      
      const data = await response.json()
      setArbitrators(data || [])
      
      // Calculate stats
      const calculatedStats = {
        total: data.length,
        active: data.filter((a: any) => a.status === 'active').length,
        pending: data.filter((a: any) => a.status === 'pending').length,
        inactive: data.filter((a: any) => a.status === 'inactive').length,
        averageRating: calculateAverageRating(data),
        topExpertise: calculateTopExpertise(data)
      }
      
      setStats(calculatedStats)
    } catch (error) {
      console.error('Error fetching arbitrators:', error)
      toast.error('Failed to load arbitrators')
    } finally {
      setLoading(false)
    }
  }
  
  const calculateAverageRating = (arbitrators: any[]) => {
    const validRatings = arbitrators.filter(a => a.rating).map(a => a.rating)
    if (validRatings.length === 0) return 0
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0)
    return parseFloat((sum / validRatings.length).toFixed(1))
  }
  
  const calculateTopExpertise = (arbitrators: any[]) => {
    const expertiseCount: {[key: string]: number} = {}
    arbitrators.forEach(a => {
      if (a.expertise) {
        const expertiseList = Array.isArray(a.expertise) 
          ? a.expertise 
          : a.expertise.split(',').map((e: string) => e.trim())
        
        expertiseList.forEach((expertise: string) => {
          expertiseCount[expertise] = (expertiseCount[expertise] || 0) + 1
        })
      }
    })
    return expertiseCount
  }
  
  const handleCreateArbitrator = async () => {
    try {
      if (!newArbitrator.name || !newArbitrator.email) {
        toast.error('Name and email are required')
        return
      }
      
      const response = await fetch(getApiUrl('api/admin/arbitrators'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...newArbitrator,
          role: 'ARBITRATOR'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create arbitrator')
      }
      
      toast.success('Arbitrator created successfully')
      setIsAddDialogOpen(false)
      setNewArbitrator({
        name: '',
        email: '',
        phone: '',
        expertise: '',
        qualifications: '',
        experience: 0
      })
      fetchArbitrators()
    } catch (error: any) {
      console.error('Error creating arbitrator:', error)
      toast.error(`Failed to create arbitrator: ${error.message}`)
    }
  }
  
  const handleStatusChange = async (arbitratorId: string, newStatus: string) => {
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
      setArbitrators(prev => 
        prev.map(a => a.id === arbitratorId ? { ...a, status: newStatus as any } : a)
      )
    } catch (error) {
      console.error('Error updating arbitrator status:', error)
      toast.error('Failed to update arbitrator status')
    }
  }
  
  const handleSearch = () => {
    fetchArbitrators()
  }
  
  const navigateToNewArbitrator = () => {
    router.push('/dashboard/arbitrators/new')
  }
  
  const handleEditArbitrator = (id: string) => {
    router.push(`/dashboard/arbitrators/edit/${id}`)
  }
  
  const handleViewArbitrator = (id: string) => {
    router.push(`/dashboard/arbitrators/${id}`)
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
  
  const filteredArbitrators = arbitrators.filter(arbitrator => {
    return (
      (statusFilter === 'all' || arbitrator.status === statusFilter) &&
      (
        arbitrator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        arbitrator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (arbitrator.expertise && arbitrator.expertise.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
  })
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arbitrators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Arbitrators</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting cases
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Based on feedback
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 max-w-md items-center space-x-2">
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
          <Button variant="outline" onClick={handleSearch}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button onClick={navigateToNewArbitrator}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Arbitrator
          </Button>
        </div>
      </div>
      
      {/* Arbitrators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Arbitrators</CardTitle>
          <CardDescription>
            Manage your arbitrator panel and their assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArbitrators.length > 0 ? (
                    filteredArbitrators.map((arbitrator) => (
                      <TableRow key={arbitrator.id}>
                        <TableCell className="font-medium">
                          {arbitrator.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {arbitrator.email}
                            </span>
                            {arbitrator.phone && (
                              <span className="flex items-center text-sm text-gray-500 mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {arbitrator.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {arbitrator.expertise || "Not specified"}
                        </TableCell>
                        <TableCell>
                          {arbitrator.experience ? `${arbitrator.experience} years` : "Not specified"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(arbitrator.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              Assigned: {arbitrator.assignedCases || 0}
                            </span>
                            <span className="flex items-center text-sm text-gray-500 mt-1">
                              <Award className="h-3 w-3 mr-1" />
                              Completed: {arbitrator.completedCases || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {arbitrator.rating ? arbitrator.rating.toFixed(1) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewArbitrator(arbitrator.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditArbitrator(arbitrator.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {arbitrator.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStatusChange(arbitrator.id, 'active')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {arbitrator.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStatusChange(arbitrator.id, 'inactive')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {arbitrator.status === 'inactive' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStatusChange(arbitrator.id, 'active')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No arbitrators found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 