import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import { teamMemberApi } from '@/lib/api';

interface TeamMemberStats {
  totalManagedCases: number;
  pendingWorkflow: number;
  inProgress: number;
  overdueDeadlines: number;
  unreadNotifications: number;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  caseNumber?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  activeCases: number;
  availability: 'available' | 'busy' | 'overloaded';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'UNREAD' | 'READ';
  createdAt: string;
  caseId?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  type: 'hearing' | 'reminder' | 'deadline';
  caseId?: string;
}

interface DashboardData {
  stats: TeamMemberStats;
  teamPerformance: any;
  todaySchedule: UpcomingEvent[];
  slaCompliance: any;
  quickActions: Array<{ name: string; url: string }>;
}

export default function TeamMemberDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'deadlines' | 'notifications'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data
      const [dashboard, notificationsData, teamData, deadlinesData] = await Promise.all([
        teamMemberApi.getDashboard(),
        teamMemberApi.getNotifications({ limit: 10 }),
        teamMemberApi.getTeamAvailability(),
        teamMemberApi.getUpcomingDeadlines({ limit: 5 }),
      ]);

      setDashboardData(dashboard);
      setNotifications(notificationsData || []);
      setTeamMembers(teamData || []);
      setUpcomingDeadlines(deadlinesData || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notificationId: string, action: 'read' | 'view') => {
    try {
      if (action === 'read') {
        await teamMemberApi.markNotificationRead(notificationId);
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'READ' as const }
              : notif
          )
        );
      } else if (action === 'view') {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification?.caseId) {
          router.push(`/arbitration/cases/${notification.caseId}`);
        }
      }
    } catch (err) {
      console.error('Notification action error:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await teamMemberApi.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'READ' as const }))
      );
    } catch (err) {
      console.error('Mark all notifications read error:', err);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alert': return 'text-red-600 bg-red-100';
      case 'reminder': return 'text-yellow-600 bg-yellow-100';
      case 'message': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!session?.user || session.user.role !== 'TEAM_MEMBER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You need Team Member access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Member Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user.name}! Here's your team overview and assigned responsibilities.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Managed Cases</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.totalManagedCases}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Workflow</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.pendingWorkflow}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.inProgress}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Overdue Deadlines</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.overdueDeadlines}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Unread Notifications</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.unreadNotifications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardData.quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(action.url)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
                  >
                    <div className="text-sm font-medium text-gray-900">{action.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'team', name: 'Team Status', icon: '👥' },
                  { id: 'deadlines', name: 'Deadlines', icon: '⏰' },
                  { id: 'notifications', name: 'Notifications', icon: '🔔' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Team Overview</h2>
                  <button
                    onClick={() => router.push('/team-member/share-update')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Share Update
                  </button>
                </div>

                <div className="grid gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(member.availability)}`}>
                              {member.availability}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">Active Cases: {member.activeCases}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Team Status</h2>
                  <button
                    onClick={() => router.push('/team-member/share-update')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Share Update
                  </button>
                </div>

                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <span className="text-sm text-gray-500">{member.role}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(member.availability)}`}>
                              {member.availability}
                            </span>
                          </div>
                          <p className="text-gray-700">Active Cases: {member.activeCases}</p>
                          <p className="text-gray-500 text-sm">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No team members found in your team.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'deadlines' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
                
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{deadline.title}</h3>
                          <p className="text-gray-600 mt-1">{deadline.description || 'No description available'}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
                            <span>Due: {new Date(deadline.dueDate || deadline.scheduledDate).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${deadline.isOverdue ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'}`}>
                              {deadline.isOverdue ? 'Overdue' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                        {deadline.caseId && (
                          <button
                            onClick={() => router.push(`/arbitration/cases/${deadline.caseId}`)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View Case
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {upcomingDeadlines.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming deadlines</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You have no upcoming deadlines at this time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                  <button
                    onClick={markAllNotificationsRead}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Mark All as Read
                  </button>
                </div>
                
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`bg-white shadow rounded-lg p-6 border-l-4 ${notification.status === 'UNREAD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNotificationTypeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                            {notification.status === 'UNREAD' && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{new Date(notification.createdAt).toLocaleString()}</span>
                            {notification.caseId && <span>Case Related</span>}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {notification.status === 'UNREAD' && (
                            <button
                              onClick={() => handleNotificationAction(notification.id, 'read')}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Mark Read
                            </button>
                          )}
                          {notification.caseId && (
                            <button
                              onClick={() => handleNotificationAction(notification.id, 'view')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              View Case
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You have no notifications at this time.
                      </p>
                    </div>
                  )}
                </div>

                {/* SLA Compliance Overview */}
                {dashboardData.slaCompliance && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Compliance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {dashboardData.slaCompliance.overall || 95}%
                        </div>
                        <div className="text-sm text-gray-500">Overall Compliance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardData.slaCompliance.responseTimes || 98}%
                        </div>
                        <div className="text-sm text-gray-500">Response Time SLA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {dashboardData.slaCompliance.resolutionTimes || 92}%
                        </div>
                        <div className="text-sm text-gray-500">Resolution Time SLA</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
} 