"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiUrl } from '@/lib/config'
import {
  UserPlus,
  FileText,
  AlertCircle,
  RefreshCw,
  Calendar,
  ClipboardCheck,
  Clock,
  User
} from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  meta: any
}

export default function RecentActivity() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(getApiUrl('api/admin/activity?limit=10'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities')
      }
      
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error: any) {
      console.error('Error fetching activities:', error)
      setError(error.message || 'Failed to load recent activities')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case 'CASE_CREATION':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'CASE_STATUS_CHANGE':
        return <RefreshCw className="h-5 w-5 text-orange-500" />
      case 'PAYMENT':
        return <ClipboardCheck className="h-5 w-5 text-purple-500" />
      case 'ARBITRATOR_ASSIGNMENT':
        return <User className="h-5 w-5 text-indigo-500" />
      case 'HEARING_SCHEDULED':
        return <Calendar className="h-5 w-5 text-teal-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    
    // Calculate time difference in minutes
    const minutesAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
    
    if (minutesAgo < 1) {
      return 'Just now'
    } else if (minutesAgo < 60) {
      return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
    } else if (minutesAgo < 24 * 60) {
      const hoursAgo = Math.floor(minutesAgo / 60)
      return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    } else if (minutesAgo < 7 * 24 * 60) {
      const daysAgo = Math.floor(minutesAgo / (24 * 60))
      return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const handleRefresh = () => {
    fetchRecentActivities()
  }

  const navigateToDetails = (activity: Activity) => {
    if (activity.type === 'USER_REGISTRATION' && activity.meta.userId) {
      router.push(`/dashboard/users/${activity.meta.userId}`)
    } else if (['CASE_CREATION', 'CASE_STATUS_CHANGE'].includes(activity.type) && activity.meta.caseId) {
      router.push(`/dashboard/case/${activity.meta.caseId}`)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <CardDescription>Latest system activities and changes</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-10 w-10 mx-auto mb-2" />
            <p>No recent activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigateToDetails(activity)}
              >
                <div className="bg-gray-100 p-2 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                  {activity.type === 'CASE_STATUS_CHANGE' && (
                    <Badge className="mt-1" variant="outline">
                      Status: {activity.meta.newStatus}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-2 text-center">
              <Button variant="link" size="sm" className="text-sm">
                View All Activity
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 