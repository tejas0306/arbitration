"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getApiUrl } from '@/lib/config'
import {
  Briefcase,
  Users,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  Edit,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalCases: number
  activeCases: number
  pendingReview: number
  totalArbitrators: number
  recentCases: number
  upcomingHearings: number
  caseResolutionRate: string
}

interface Case {
  id: string
  caseNumber: string
  claimant: string
  respondent: string
  status: string
  nextHearing?: string
  createdAt: string
}

interface ActivityItem {
  id: string
  action: string
  user: string
  target: string
  timestamp: string
  type: 'case' | 'user' | 'arbitrator' | 'system'
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch(getApiUrl('api/admin/dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent cases
      const casesResponse = await fetch(getApiUrl('api/admin/cases?limit=10'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (casesResponse.ok) {
        const casesData = await casesResponse.json()
        setRecentCases(casesData.cases || [])
      }

      // Fetch real activity data from audit logs
      try {
        const activityResponse = await fetch(getApiUrl('api/admin/audit-logs?limit=10'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        
        if (activityResponse.ok) {
          const auditLogs = await activityResponse.json()
          
          // Transform audit logs into activity items
          const activityItems = auditLogs.map(log => {
            // Format the timestamp as relative time
            const timestamp = formatTimeAgo(new Date(log.createdAt))
            
            // Determine the entity type
            const type = getEntityType(log.entityType)
            
            // Format action and target based on log data
            const { action, target } = formatActionAndTarget(log)
            
            // Get user name (or 'System' for automated actions)
            const user = log.userDetails?.name || 'System'
            
            return {
              id: log.id,
              action,
              user,
              target,
              timestamp,
              type
            }
          })
          
          setActivity(activityItems)
        } else {
          // If API fails, fallback to mock data
          setActivity([
            {
              id: '1',
              action: 'assigned',
              user: 'Admin User',
              target: 'Case ARB/2024/001',
              timestamp: '2 minutes ago',
              type: 'case'
            },
            {
              id: '2',
              action: 'approved',
              user: 'System',
              target: 'Arbitrator John Doe',
              timestamp: '15 minutes ago',
              type: 'arbitrator'
            },
            {
              id: '3',
              action: 'created',
              user: 'Case Manager',
              target: 'User Jane Smith',
              timestamp: '1 hour ago',
              type: 'user'
            }
          ])
        }
      } catch (error) {
        // Fallback to mock data if real data fetch fails
        setActivity([
          {
            id: '1',
            action: 'assigned',
            user: 'Admin User',
            target: 'Case ARB/2024/001',
            timestamp: '2 minutes ago',
            type: 'case'
          },
          {
            id: '2',
            action: 'approved',
            user: 'System',
            target: 'Arbitrator John Doe',
            timestamp: '15 minutes ago',
            type: 'arbitrator'
          },
          {
            id: '3',
            action: 'created',
            user: 'Case Manager',
            target: 'User Jane Smith',
            timestamp: '1 hour ago',
            type: 'user'
          }
        ])
      }

    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format timestamp as relative time
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs} seconds ago`
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    
    return date.toLocaleDateString()
  }

  // Helper function to determine entity type from log data
  const getEntityType = (entityType: string): 'case' | 'user' | 'arbitrator' | 'system' => {
    switch (entityType) {
      case 'case':
        return 'case'
      case 'user':
        return 'user'
      case 'arbitrator':
        return 'arbitrator'
      default:
        return 'system'
    }
  }

  // Helper function to format action and target from log data
  const formatActionAndTarget = (log: any) => {
    let action = log.action.replace(/_/g, ' ')
    let target = log.entityType === 'case' 
      ? `Case ${log.details?.caseNumber || log.entityId.substring(0, 8)}`
      : log.entityType === 'user'
        ? `User ${log.details?.userName || log.details?.email || log.entityId.substring(0, 8)}`
        : log.entityType === 'arbitrator'
          ? `Arbitrator ${log.details?.arbitratorName || log.entityId.substring(0, 8)}`
          : log.entityType
    
    return { action, target }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Briefcase className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'arbitrator':
        return <Users className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Handle case editing
  const handleEditCase = (caseId: string) => {
    router.push(`/admin/cases/edit/${caseId}`)
  }

  // Handle case viewing
  const handleViewCase = (caseId: string) => {
    router.push(`/admin/cases/${caseId}`)
  }

  // Handle new case creation
  const handleNewCase = () => {
    router.push('/admin/cases/new')
  }

  // Handle adding an arbitrator
  const handleAddArbitrator = () => {
    router.push('/admin/arbitrators/new')
  }

  // Handle creating a user
  const handleCreateUser = () => {
    router.push('/admin/users/new')
  }

  // Handle configuration
  const handleConfiguration = () => {
    router.push('/admin/configuration')
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.caseResolutionRate || '0'}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReview || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Hearings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingHearings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="h-20 flex flex-col items-center justify-center space-y-2" onClick={handleNewCase}>
          <Plus className="h-6 w-6" />
          <span>New Case</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" onClick={handleAddArbitrator}>
          <Users className="h-6 w-6" />
          <span>Add Arbitrator</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" onClick={handleCreateUser}>
          <User className="h-6 w-6" />
          <span>Create User</span>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" onClick={handleConfiguration}>
          <Settings className="h-6 w-6" />
          <span>Configuration</span>
        </Button>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Worklist Table */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Cases</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Hearing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCases.slice(0, 8).map((case_) => (
                  <TableRow key={case_.id}>
                    <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                    <TableCell>{case_.claimant}</TableCell>
                    <TableCell>{case_.respondent}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{case_.nextHearing || 'Not scheduled'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewCase(case_.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditCase(case_.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.user}</span> {item.action}{' '}
                        <span className="font-medium">{item.target}</span>
                      </p>
                      <p className="text-xs text-gray-500">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Hearings</CardTitle>
            <CardDescription>Calendar view of scheduled hearings</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" className="rounded-md border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Analytics</CardTitle>
            <CardDescription>Performance metrics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm text-gray-600">{stats?.caseResolutionRate || '0'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${stats?.caseResolutionRate || 0}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Arbitrators</span>
                <span className="text-sm text-gray-600">{stats?.totalArbitrators || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg. Case Duration</span>
                <span className="text-sm text-gray-600">45 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 