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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Calendar,
  Users,
  DollarSign,
  MoreHorizontal,
  Plus,
  Download
} from 'lucide-react'

interface Case {
  id: string
  caseNumber: string
  title: string
  claimant: string
  respondent: string
  arbitrator?: string
  status: 'draft' | 'active' | 'pending' | 'resolved' | 'cancelled'
  amount: number
  filedDate: string
  lastActivity: string
  priority: 'low' | 'medium' | 'high'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export default function CasesManagement() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Extract search term from URL on initial load
  useEffect(() => {
    const url = new URL(window.location.href)
    const searchParam = url.searchParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
    }
  }, [])

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(getApiUrl('api/admin/cases'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map the cases to ensure proper amount from disputeDetails
        const mappedCases = (data.cases || []).map((caseItem: any) => {
          // Extract respondent name from the first respondent if it exists
          const respondent = caseItem.respondents && caseItem.respondents.length > 0
            ? caseItem.respondents[0].name || 'Unknown'
            : caseItem.respondent || 'Unknown';
          
          // Get claimant name either from user.name or name field
          const claimant = caseItem.user?.name || caseItem.name || caseItem.claimant || 'Unknown';
          
          // Determine title based on available data
          const title = caseItem.title || 
                       (caseItem.disputeDetails?.disputeType ? 
                        `${caseItem.disputeDetails.disputeType} Dispute` : 
                        'Arbitration Case');
          
          return {
            id: caseItem.id,
            caseNumber: caseItem.caseNumber || `ADDS/ARB/${new Date().getFullYear()}/000000`,
            title: title,
            claimant: claimant,
            respondent: respondent,
            arbitrator: caseItem.arbitrator || 'Not assigned',
            status: caseItem.status || 'pending',
            amount: caseItem.disputeDetails?.disputeAmount ? 
                    parseFloat(caseItem.disputeDetails.disputeAmount) : 
                    (caseItem.amount || 0),
            filedDate: caseItem.createdAt ? 
                      new Date(caseItem.createdAt).toISOString().split('T')[0] : 
                      (caseItem.filedDate || new Date().toISOString().split('T')[0]),
            lastActivity: caseItem.updatedAt ? 
                          new Date(caseItem.updatedAt).toISOString().split('T')[0] : 
                          (caseItem.lastActivity || new Date().toISOString().split('T')[0]),
            priority: caseItem.priority || 'medium'
          };
        });
        setCases(mappedCases)
      } else {
        // Mock data for development
        setCases([
          {
            id: '1',
            caseNumber: 'ARB-2024-001',
            title: 'Contract Dispute - Supply Agreement',
            claimant: 'ABC Corp',
            respondent: 'XYZ Industries',
            arbitrator: 'John Smith',
            status: 'active',
            amount: 150000,
            filedDate: '2024-03-15',
            lastActivity: '2024-05-25',
            priority: 'high'
          },
          {
            id: '2',
            caseNumber: 'ARB-2024-002',
            title: 'Employment Dispute',
            claimant: 'Sarah Wilson',
            respondent: 'Tech Solutions Inc',
            status: 'pending',
            amount: 75000,
            filedDate: '2024-04-02',
            lastActivity: '2024-05-20',
            priority: 'medium'
          },
          {
            id: '3',
            caseNumber: 'ARB-2024-003',
            title: 'Partnership Dissolution',
            claimant: 'Mike Johnson',
            respondent: 'Business Partners LLC',
            arbitrator: 'Emily Davis',
            status: 'resolved',
            amount: 250000,
            filedDate: '2024-02-10',
            lastActivity: '2024-05-18',
            priority: 'high'
          },
          {
            id: '4',
            caseNumber: 'ARB-2024-004',
            title: 'Intellectual Property Dispute',
            claimant: 'Creative Studios',
            respondent: 'Digital Corp',
            status: 'draft',
            amount: 100000,
            filedDate: '2024-05-01',
            lastActivity: '2024-05-15',
            priority: 'low'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast.error('Failed to fetch cases')
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(case_ => {
    // Convert search term to lowercase for case-insensitive comparison
    const search = searchTerm.toLowerCase().trim();
    
    // Skip filtering if search term is empty
    if (!search) return true;
    
    // Handle possible undefined/null values
    const caseNumber = case_.caseNumber?.toLowerCase() || '';
    const title = case_.title?.toLowerCase() || '';
    const claimant = case_.claimant?.toLowerCase() || '';
    const respondent = case_.respondent?.toLowerCase() || '';
    
    const matchesSearch = 
      caseNumber.includes(search) ||
      title.includes(search) ||
      claimant.includes(search) ||
      respondent.includes(search);
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStats = () => {
    const stats = cases.reduce((acc, case_) => {
      acc.total += 1
      acc.byStatus[case_.status] = (acc.byStatus[case_.status] || 0) + 1
      acc.totalValue += case_.amount
      return acc
    }, { 
      total: 0, 
      byStatus: {} as Record<string, number>,
      totalValue: 0
    })
    
    return stats
  }

  const stats = getStats()

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All cases in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {stats.byStatus.active || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Combined case value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.byStatus.resolved || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.resolved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully closed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cases Management</CardTitle>
              <CardDescription>
                Manage all arbitration cases in the system
              </CardDescription>
            </div>
            
            <Button onClick={() => router.push('/admin/cases/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Case
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases by number, title, or parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Arbitrator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Filed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow key={case_.id}>
                  <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate">{case_.title}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{case_.claimant}</div>
                      <div className="text-xs text-gray-500">vs {case_.respondent}</div>
                    </div>
                  </TableCell>
                  <TableCell>{case_.arbitrator || 'Not assigned'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[case_.status]}>
                      {case_.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[case_.priority]}>
                      {case_.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(case_.amount)}</TableCell>
                  <TableCell>{case_.filedDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/cases/${case_.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => router.push(`/admin/cases/edit/${case_.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cases found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 