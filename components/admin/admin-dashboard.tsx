"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { getApiUrl } from '@/lib/config'
import RecentActivity from '@/components/admin/recent-activity'
import {
  Users,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  UserPlus,
  PlusCircle,
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalCases: number
  activeCases: number
  pendingCases: number
  arbitrators: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    arbitrators: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, you would fetch this data from an API endpoint
      // For now, we'll simulate some data using existing endpoints
      
      // Fetch user count
      const usersResponse = await fetch(getApiUrl('api/admin/users?limit=1'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const usersData = await usersResponse.json()
      
      // Fetch arbitrators
      const arbitratorsResponse = await fetch(getApiUrl('api/admin/arbitrators?limit=1'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const arbitratorsData = await arbitratorsResponse.json()
      
      // Set stats
      setStats({
        totalUsers: usersData.pagination?.total || 0,
        totalCases: 0, // This would come from a cases endpoint
        activeCases: 0,
        pendingCases: 0,
        arbitrators: arbitratorsData.length || 0
      })
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || 'Admin'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              Filed through the platform
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arbitrators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.arbitrators}</div>
            <p className="text-xs text-muted-foreground">
              Registered arbitrators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/arbitrators/new">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Add Arbitrator</p>
                  <p className="text-sm text-gray-500">Register a new arbitrator</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/cases">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Manage Cases</p>
                  <p className="text-sm text-gray-500">View and manage all cases</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/scheduling">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-purple-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Scheduling</p>
                  <p className="text-sm text-gray-500">Manage hearings and deadlines</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/settings">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-orange-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-gray-500">Configure system settings</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="md:col-span-2">
          <RecentActivity />
        </div>
        
        {/* Case Status Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Case Status</CardTitle>
              <CardDescription>Overview of case statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="min-w-[50px] text-right text-sm font-medium ml-2">45%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Completed</span>
                  </div>
                  <span>15</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    <span>In Progress</span>
                  </div>
                  <span>24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span>Stalled</span>
                  </div>
                  <span>6</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-500 mr-2" />
                    <span>Pending</span>
                  </div>
                  <span>12</span>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 