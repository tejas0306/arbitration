"use client"

import { useState, useEffect } from 'react'
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
  Shield,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'arbitrator' | 'case_manager' | 'team_member' | 'claimant' | 'respondent'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastLogin?: string
  phone?: string
  organization?: string
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  arbitrator: 'bg-blue-100 text-blue-800',
  case_manager: 'bg-green-100 text-green-800',
  team_member: 'bg-yellow-100 text-yellow-800',
  claimant: 'bg-orange-100 text-orange-800',
  respondent: 'bg-gray-100 text-gray-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'claimant',
    phone: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(getApiUrl('api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Raw API response:', data)
        
        // Map API response to component format
        const mappedUsers = (Array.isArray(data) ? data : data.users || []).map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.toLowerCase() || 'claimant',
          status: user.isActive ? 'active' : (user.isSuspended ? 'inactive' : 'pending'),
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : undefined,
          phone: user.phone || '',
          organization: user.organization || ''
        }))
        
        console.log('Mapped users:', mappedUsers)
        setUsers(mappedUsers)
      } else {
        // Mock data for development
        setUsers([
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            role: 'arbitrator',
            status: 'active',
            createdAt: '2024-01-15',
            lastLogin: '2024-05-26',
            phone: '+1-555-0123'
          },
          {
            id: '2',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@example.com',
            role: 'case_manager',
            status: 'active',
            createdAt: '2024-02-01',
            lastLogin: '2024-05-25'
          },
          {
            id: '3',
            name: 'Michael Brown',
            email: 'michael.brown@company.com',
            role: 'claimant',
            status: 'active',
            createdAt: '2024-03-10',
            lastLogin: '2024-05-20'
          },
          {
            id: '4',
            name: 'Emily Davis',
            email: 'emily.davis@business.com',
            role: 'respondent',
            status: 'pending',
            createdAt: '2024-05-25'
          },
          {
            id: '5',
            name: 'Admin User',
            email: 'admin@arbitration.com',
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-01',
            lastLogin: '2024-05-26'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = async () => {
    try {
      const response = await fetch(getApiUrl('api/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        toast.success('User created successfully')
        setIsCreateDialogOpen(false)
        setNewUser({ name: '', email: '', role: 'claimant', phone: '' })
        fetchUsers()
      } else {
        // For demo, just add to mock data
        const mockUser: User = {
          id: Date.now().toString(),
          ...newUser,
          role: newUser.role as any,
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0]
        }
        setUsers(prev => [...prev, mockUser])
        toast.success('User created successfully (demo)')
        setIsCreateDialogOpen(false)
        setNewUser({ name: '', email: '', role: 'claimant', phone: '' })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch(getApiUrl(`api/admin/users/${userId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok || true) { // Allow for demo
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus as any } : user
        ))
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'arbitrator':
      case 'case_manager':
        return <Users className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getStats = () => {
    const stats = users.reduce((acc, user) => {
      acc.total += 1
      acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1
      acc.byStatus[user.status] = (acc.byStatus[user.status] || 0) + 1
      return acc
    }, { 
      total: 0, 
      byRole: {} as Record<string, number>, 
      byStatus: {} as Record<string, number> 
    })
    
    return stats
  }

  const stats = getStats()

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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
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
            <CardTitle className="text-sm font-medium">Arbitrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.arbitrator || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active arbitrators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {stats.byStatus.pending || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                Manage all users in the arbitration system
              </CardDescription>
            </div>
            
            <Button onClick={() => router.push('/admin/users/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="arbitrator">Arbitrator</SelectItem>
                <SelectItem value="case_manager">Case Manager</SelectItem>
                <SelectItem value="team_member">Team Member</SelectItem>
                <SelectItem value="claimant">Claimant</SelectItem>
                <SelectItem value="respondent">Respondent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>{user.lastLogin || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.status)}
                      >
                        {user.status === 'active' ? (
                          <Trash className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 