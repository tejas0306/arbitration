'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, FileText, Bell, AlertCircle, User, HelpCircle, Eye, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';

interface RespondentDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    organization?: string;
  };
  cases: Array<{
    id: string;
    caseNumber?: string;
    name: string;
    status: string;
    responseStatus: string;
    currentPhase: string;
    responseDeadline?: string;
    noticeServedAt?: string;
    respondedAt?: string;
    claimant: string;
    claimAmount: number;
    description: string;
  }>;
  responses: Array<{
    id: string;
    caseId: string;
    submittedAt: string;
    status: string;
    documents: Array<{
      name: string;
      type: string;
      uploadedAt: string;
    }>;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    read: boolean;
  }>;
  stats: {
    totalCases: number;
    pendingResponses: number;
    submittedResponses: number;
    unreadNotifications: number;
  };
}

export default function RespondentDashboard() {
  const [data, setData] = useState<RespondentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from API
    fetch('/api/respondent/dashboard')
      .then(res => res.json())
      .then(apiData => {
        setData(apiData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-indigo-600">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto py-8 px-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {data?.user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your case responses and track your arbitration activities
          </p>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/respondent/cases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 hover:border-blue-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Cases</h3>
                  <p className="text-sm text-gray-600">View all cases</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/respondent/notifications">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 hover:border-green-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-green-100 p-3 rounded-full">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">{data?.stats?.unreadNotifications || 0} unread</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 hover:border-purple-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-purple-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Update your info</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 hover:border-orange-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-orange-100 p-3 rounded-full">
                  <HelpCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Support</h3>
                  <p className="text-sm text-gray-600">Get help & support</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900">{data?.stats?.totalCases || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Responses</p>
                  <p className="text-3xl font-bold text-orange-600">{data?.stats?.pendingResponses || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted Responses</p>
                  <p className="text-3xl font-bold text-green-600">{data?.stats?.submittedResponses || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notifications</p>
                  <p className="text-3xl font-bold text-purple-600">{data?.stats?.unreadNotifications || 0}</p>
                </div>
                <Bell className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Your latest arbitration cases and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.cases && data.cases.length > 0 ? (
              <div className="space-y-4">
                {data.cases.map((case_item) => (
                  <div key={case_item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{case_item.name}</h3>
                        <p className="text-sm text-gray-600">Case #{case_item.caseNumber}</p>
                      </div>
                      <Badge 
                        variant={case_item.responseStatus === 'PENDING' ? 'destructive' : 'default'}
                      >
                        {case_item.responseStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Claimant:</span> {case_item.claimant}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹{case_item.claimAmount?.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span> {case_item.responseDeadline ? new Date(case_item.responseDeadline).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{case_item.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {case_item.responseStatus === 'PENDING' && (
                        <Button size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Submit Response
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases yet</h3>
                <p className="text-gray-600">You haven't been assigned any cases yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Stay updated with the latest case developments</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.notifications && data.notifications.length > 0 ? (
              <div className="space-y-4">
                {data.notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className={`border-l-4 pl-4 py-2 ${
                    notification.read ? 'border-gray-300' : 'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
} 