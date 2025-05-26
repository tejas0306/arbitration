import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingReview: number;
  totalArbitrators: number;
  activeArbitrators: number;
  totalUsers: number;
  recentCases: number;
  upcomingHearings: number;
  caseResolutionRate: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has admin access
    if (session && session.user?.role !== 'ADMIN' && session.user?.role !== 'CASE_MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchDashboardStats();
  }, [session, router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage cases, arbitrators, users, and system settings
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Cases</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalCases}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Cases</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeCases}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingReview}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Arbitrators</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeArbitrators}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Case Management</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/admin/cases')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  View All Cases
                </button>
                <button 
                  onClick={() => router.push('/admin/cases?status=pending')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Pending Review Cases
                </button>
                <button 
                  onClick={() => router.push('/admin/cases?archived=true')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Archived Cases
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Arbitrator Management</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/admin/arbitrators')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  View All Arbitrators
                </button>
                <button 
                  onClick={() => router.push('/admin/arbitrators?status=pending')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Pending Approvals
                </button>
                <button 
                  onClick={() => router.push('/admin/arbitrators/performance')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Performance Reports
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Administration</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  👥 User Management
                </button>
                <button 
                  onClick={() => router.push('/admin/announcements')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Announcements
                </button>
                <button 
                  onClick={() => router.push('/admin/audit-logs')}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2">Recent activity will appear here</p>
              <p className="text-sm text-gray-400">Check back later for updates</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
} 