"use client"

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Define types for the data
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Case {
  id: string;
  caseNumber?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Draft {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  lastEditedAt?: string;
  claimantDetails?: {
    name?: string;
  };
  disputeCategory?: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('cases');

  // Define fetchData at the component level so it can be used by multiple functions
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch user data
      try {
        const user = await api.auth.getCurrentUser();
        console.log('User data fetched successfully');
        setUserData(user);
      } catch (userErr) {
        console.error('Error fetching user data:', userErr);
        // Continue to fetch other data even if user data fails
      }

      // Fetch arbitration cases
      try {
        console.log('Fetching arbitration cases...');
        const casesData = await api.arbitration.getAll();
        console.log('Cases fetched successfully:', casesData.length);
        setCases(casesData);
      } catch (caseErr) {
        console.error('Error fetching cases:', caseErr);
        setCases([]);
      }

      // Fetch drafts
      try {
        console.log('Fetching drafts...');
        const draftsData = await api.arbitration.getDrafts();
        console.log('Drafts fetched successfully:', draftsData);
        if (Array.isArray(draftsData)) {
          console.log(`Received ${draftsData.length} drafts`);
          setDrafts(draftsData);
        } else {
          console.warn('Received non-array draft data:', draftsData);
          setDrafts([]);
        }
      } catch (draftErr) {
        console.error('Error fetching drafts:', draftErr);
        setDrafts([]);
        // Continue execution - we can still show the dashboard without drafts
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-indigo-600">Loading your dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-indigo-600 hover:underline mt-2 inline-block"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <h1 className="text-3xl font-bold text-indigo-800 mb-4 md:mb-0">Dashboard</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => fetchData()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out inline-flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </span>
                  )}
                </button>
                <Link 
                  href="/arbitration/new" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out inline-flex items-center shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Arbitration Request
                </Link>
              </div>
            </div>

            {userData && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-100">
                <h2 className="text-lg font-medium text-indigo-800 mb-2">Welcome, {userData.name}</h2>
                <p className="text-gray-600">
                  {userData.role === 'ADMIN' 
                    ? 'You have administrator access to the arbitration portal.' 
                    : 'Manage your arbitration cases and draft submissions below.'}
                </p>
              </div>
            )}

            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('cases')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'cases'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Active Cases
                  </button>
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'drafts'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Saved Drafts
                  </button>
                </nav>
              </div>
            </div>

            {activeTab === 'cases' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-indigo-700">Your Arbitration Cases</h2>
                {cases.length > 0 ? (
                  <div className="bg-white shadow overflow-hidden rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Filed Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cases.map((case_) => (
                          <tr key={case_.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {case_.caseNumber || 'Pending'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {case_.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  case_.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : case_.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : case_.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {case_.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(case_.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Link 
                                href={`/arbitration/case/${case_.id}`}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                View Details
                              </Link>
                              <Link 
                                href={`/arbitration/new?petitionId=${case_.id}`}
                                className="text-green-600 hover:text-green-800"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden rounded-md p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No arbitration cases</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't submitted any arbitration requests yet.
                    </p>
                    <div className="mt-6">
                      <Link 
                        href="/arbitration/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Request
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'drafts' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-indigo-700">Saved Drafts</h2>
                {drafts.length > 0 ? (
                  <div className="bg-white shadow overflow-hidden rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Draft Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drafts.map((draft) => (
                          <tr key={draft.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {draft.claimantDetails?.name || draft.name || `Draft ${draft.id.substring(0, 8)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {draft.disputeCategory || draft.type || 'Arbitration'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(draft.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(draft.updatedAt || draft.lastEditedAt || draft.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                              <Link 
                                href={`/arbitration/new?draftId=${draft.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                              <button 
                                onClick={async () => {
                                  try {
                                    console.log(`Attempting to submit draft with ID: ${draft.id}`);
                                    await api.arbitration.submitDraft(draft.id);
                                    toast.success('Draft submitted successfully');
                                    // Refresh the data
                                    await fetchData();
                                  } catch (error: any) {
                                    console.error('Error submitting draft:', error);
                                    
                                    // Provide more specific error message
                                    let errorMessage = 'Failed to submit draft';
                                    
                                    if (error.message) {
                                      errorMessage = error.message;
                                    }
                                    
                                    if (error.response) {
                                      console.error('Server error details:', {
                                        status: error.response.status,
                                        data: error.response.data,
                                      });
                                      
                                      if (error.response.status === 404) {
                                        errorMessage = `Draft not found. The draft may have been deleted or the endpoint is incorrect.`;
                                      } else if (error.response.status === 401) {
                                        errorMessage = 'Your session has expired. Please log in again.';
                                      }
                                    }
                                    
                                    toast.error(errorMessage);
                                  }
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Submit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden rounded-md p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't saved any draft arbitration requests yet.
                    </p>
                    <div className="mt-6">
                      <Link 
                        href="/arbitration/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Start New Draft
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
} 