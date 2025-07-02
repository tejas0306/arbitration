"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  Search,
  Eye,
  Bell,
  Calendar,
  CheckCircle,
  FileText,
  Briefcase,
  MessageSquare,
  Filter,
  Check,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  AlertCircle
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  status: 'READ' | 'UNREAD'
  createdAt: string
  readAt: string | null
  actionUrl?: string
  caseId?: string
  sender?: {
    name: string
  }
  case?: {
    caseNumber: string
  }
}

export default function NotificationsManagement() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchNotifications()
  }, [statusFilter, typeFilter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Construct query parameters
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      
      const response = await fetch(getApiUrl(`api/notifications?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data)
    } catch (error: any) {
      setError(error.message || 'Failed to load notifications')
      toast.error(error.message || 'Failed to load notifications')
      setNotifications([]) // Set empty array instead of mock data
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(getApiUrl(`api/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to mark notification as read')
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } 
            : n
        )
      )
      
      toast.success('Notification marked as read')
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(getApiUrl('api/notifications/read-all'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to mark all notifications as read')
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() }))
      )
      
      toast.success('All notifications marked as read')
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all as read')
    }
  }

  const handleViewNotificationDetails = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === 'UNREAD') {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to appropriate page based on notification type
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.caseId) {
      router.push(`/admin/cases/${notification.caseId}`)
    }
  }

  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a new field, set it and default to descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'case':
        return <Briefcase className="h-4 w-4 text-blue-600" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'meeting':
      case 'hearing':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'system':
        return <CheckCircle className="h-4 w-4 text-orange-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    return status === 'READ' 
      ? 'bg-gray-100 text-gray-800' 
      : 'bg-blue-100 text-blue-800'
  }

  const getTypeBadgeClass = (type: string) => {
    switch(type.toLowerCase()) {
      case 'case':
        return 'bg-blue-100 text-blue-800'
      case 'document':
        return 'bg-green-100 text-green-800'
      case 'meeting':
      case 'hearing':
        return 'bg-purple-100 text-purple-800'
      case 'system':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format relative time
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
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

  // Format date for detailed view
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Sort and filter notifications
  const filteredAndSortedNotifications = notifications
    .filter(notification => {
      // Apply search filter
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.case?.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      
      // Apply status filter
      const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
      
      // Apply type filter
      const matchesType = typeFilter === 'all' || notification.type.toLowerCase() === typeFilter.toLowerCase()
      
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      // Handle sorting
      if (sortField === 'createdAt') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      
      if (sortField === 'status') {
        if (sortDirection === 'asc') {
          return a.status === 'READ' ? -1 : 1
        } else {
          return a.status === 'UNREAD' ? -1 : 1
        }
      }
      
      if (sortField === 'type') {
        return sortDirection === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type)
      }
      
      return 0
    })

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` 
              : 'No unread notifications'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            View and manage your notification history
          </CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
                <SelectItem value="UNREAD">Unread</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-500">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => fetchNotifications()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {filteredAndSortedNotifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No notifications found matching your filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          Status 
                          {sortField === 'status' && (
                            sortDirection === 'asc' 
                              ? <ArrowUpNarrowWide className="h-4 w-4 ml-1" /> 
                              : <ArrowDownNarrowWide className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort('type')}
                        >
                          Type
                          {sortField === 'type' && (
                            sortDirection === 'asc' 
                              ? <ArrowUpNarrowWide className="h-4 w-4 ml-1" /> 
                              : <ArrowDownNarrowWide className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Related Case</TableHead>
                      <TableHead>
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleSort('createdAt')}
                        >
                          Time
                          {sortField === 'createdAt' && (
                            sortDirection === 'asc' 
                              ? <ArrowUpNarrowWide className="h-4 w-4 ml-1" /> 
                              : <ArrowDownNarrowWide className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedNotifications.map((notification) => (
                      <TableRow 
                        key={notification.id}
                        className={notification.status === 'UNREAD' ? 'bg-blue-50' : ''}
                      >
                        <TableCell>
                          <div className="flex justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(notification.status)}>
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeBadgeClass(notification.type)}>
                            {notification.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {notification.title}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {notification.message}
                        </TableCell>
                        <TableCell>
                          {notification.case?.caseNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {formatTimeAgo(notification.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewNotificationDetails(notification)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {notification.status === 'UNREAD' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 