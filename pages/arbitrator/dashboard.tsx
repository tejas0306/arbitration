import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';

interface ArbitratorStats {
  assignedCases: number;
  pendingAssignments: number;
  scheduledHearings: number;
  completedCases: number;
  avgRating: number;
}

interface CaseAssignment {
  id: string;
  caseNumber: string;
  claimant: string;
  respondent: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  assignedAt: string;
  priority: 'high' | 'medium' | 'low';
  nextDeadline?: string;
}

interface Hearing {
  id: string;
  caseNumber: string;
  scheduledAt: string;
  type: 'virtual' | 'physical';
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  participants: string[];
}

interface DashboardData {
  stats: ArbitratorStats;
  caseAssignments: CaseAssignment[];
  upcomingHearings: Hearing[];
  availability: {
    today: boolean;
    thisWeek: number;
    nextWeek: number;
  };
}

export default function ArbitratorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'hearings' | 'availability' | 'awards'>('assignments');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints from the real backend
      const [statsResponse, casesResponse, hearingsResponse] = await Promise.all([
        fetch('/api/arbitrator/dashboard'),
        fetch('/api/arbitrator/assignments'),
        fetch('/api/arbitrator/hearings'),
      ]);

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await statsResponse.json();
      
      // For now, use the stats data and mock the structure for assignments and hearings
      // until the backend endpoints are fully implemented to match the expected structure
      const dashboardData = {
        stats: statsData.stats || {
          assignedCases: 0,
          pendingAssignments: 0,
          scheduledHearings: 0,
          completedCases: 0,
          avgRating: 0
        },
        caseAssignments: statsData.caseAssignments || [],
        upcomingHearings: statsData.upcomingHearings || [],
        availability: statsData.availability || {
          today: false,
          thisWeek: 0,
          nextWeek: 0
        }
      };

      setDashboardData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentAction = async (assignmentId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/arbitrator/assignments/${assignmentId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (err) {
      console.error('Assignment action error:', err);
    }
  };

  const handleScheduleHearing = (caseId: string) => {
    router.push(`/arbitrator/hearings/schedule?caseId=${caseId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!session?.user || session.user.role !== 'ARBITRATOR') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You need Arbitrator access to view this page.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Arbitrator Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user.name}! Manage your case assignments and hearings.
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assigned Cases</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.assignedCases}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Assignments</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.pendingAssignments}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Scheduled Hearings</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.scheduledHearings}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Cases</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.completedCases}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Rating</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.avgRating}/5.0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[
                  { id: 'assignments', name: 'Case Assignments', icon: '⚖️', count: dashboardData.caseAssignments.length },
                  { id: 'hearings', name: 'Hearings', icon: '🎥', count: dashboardData.upcomingHearings.length },
                  { id: 'availability', name: 'Availability', icon: '📅' },
                  { id: 'awards', name: 'Awards', icon: '🏆' },
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
                    {tab.count && (
                      <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Case Assignments</h2>
                  <button
                    onClick={() => router.push('/arbitrator/availability')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Manage Availability
                  </button>
                </div>

                <div className="grid gap-4">
                  {dashboardData.caseAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Case {assignment.caseNumber}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                              {assignment.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                              {assignment.priority} priority
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Claimant</p>
                              <p className="text-base">{assignment.claimant}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Respondent</p>
                              <p className="text-base">{assignment.respondent}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                            {assignment.nextDeadline && (
                              <span>Next Deadline: {new Date(assignment.nextDeadline).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <div className="flex space-x-2">
                            {assignment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAssignmentAction(assignment.id, 'accept')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleAssignmentAction(assignment.id, 'reject')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {assignment.status === 'accepted' && (
                              <>
                                <button
                                  onClick={() => router.push(`/arbitrator/disclosure-form?caseId=${assignment.id}`)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm font-medium"
                                >
                                  📋 Submit Disclosure
                                </button>
                                <button
                                  onClick={() => handleScheduleHearing(assignment.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Schedule Hearing
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => router.push(`/arbitrator/cases/${assignment.id}`)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                          
                          {/* Disclosure Requirement Notice for Accepted Cases */}
                          {assignment.status === 'accepted' && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                              <p className="text-amber-800 font-medium">⚖️ Section 12 Disclosure Required</p>
                              <p className="text-amber-700">Submit statutory disclosure as per Arbitration Act, 1996</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {dashboardData.caseAssignments.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No case assignments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You don't have any case assignments at the moment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'hearings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Hearings</h2>
                  <button
                    onClick={() => router.push('/arbitrator/hearings/schedule')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Schedule New Hearing
                  </button>
                </div>

                <div className="space-y-4">
                  {dashboardData.upcomingHearings.map((hearing) => (
                    <div key={hearing.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Case {hearing.caseNumber}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(hearing.status)}`}>
                              {hearing.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              hearing.type === 'virtual' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100'
                            }`}>
                              {hearing.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Scheduled At</p>
                              <p className="text-base">{new Date(hearing.scheduledAt).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Duration</p>
                              <p className="text-base">{hearing.duration} hours</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Participants</p>
                              <p className="text-base">{hearing.participants.length} attendees</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {hearing.status === 'scheduled' && (
                            <>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                Join Hearing
                              </button>
                              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                                Reschedule
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {dashboardData.upcomingHearings.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming hearings</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You don't have any hearings scheduled.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Availability Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {dashboardData.availability.today ? 'Available' : 'Busy'}
                      </div>
                      <div className="text-sm text-gray-500">Today</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {dashboardData.availability.thisWeek} days
                      </div>
                      <div className="text-sm text-gray-500">Available This Week</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {dashboardData.availability.nextWeek} days
                      </div>
                      <div className="text-sm text-gray-500">Available Next Week</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Your Availability</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => router.push('/arbitrator/availability/calendar')}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Calendar View</h4>
                          <p className="text-sm text-gray-600">View and manage your daily availability</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => router.push('/arbitrator/availability/settings')}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Availability Settings</h4>
                          <p className="text-sm text-gray-600">Set your working hours and preferences</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'awards' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Awards & Decisions</h2>
                  <button
                    onClick={() => router.push('/arbitrator/awards/create')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Draft New Award
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Awards</h3>
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <h4 className="mt-2 text-sm font-medium text-gray-900">No awards yet</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Awards and decisions you've created will appear here.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
} 