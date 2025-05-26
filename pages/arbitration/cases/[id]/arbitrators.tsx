import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';

interface Arbitrator {
  id: string;
  name: string;
  email: string;
  expertise: string;
  qualifications: string;
  experience: number;
  bio: string;
  languages: string[];
  location: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  completedCases: number;
}

interface ArbitratorProposal {
  id: string;
  arbitratorId: string;
  arbitrator: Arbitrator;
  proposedBy: string;
  proposedByRole: 'CLAIMANT' | 'RESPONDENT';
  status: 'pending' | 'accepted' | 'rejected';
  proposedAt: string;
  responseAt?: string;
}

interface CaseData {
  id: string;
  caseNumber: string;
  claimant: string;
  respondent: string;
  status: string;
  assignedArbitrator?: Arbitrator;
  arbitratorProposals: ArbitratorProposal[];
}

export default function ArbitratorManagementPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [availableArbitrators, setAvailableArbitrators] = useState<Arbitrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'proposals' | 'available'>('assigned');
  const [proposalDialog, setProposalDialog] = useState<{ open: boolean; arbitrator?: Arbitrator }>({ open: false });

  useEffect(() => {
    if (id) {
      fetchCaseData();
      fetchAvailableArbitrators();
    }
  }, [id]);

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/arbitration/cases/${id}/arbitrators`);
      if (!response.ok) throw new Error('Failed to fetch case data');
      const data = await response.json();
      setCaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchAvailableArbitrators = async () => {
    try {
      const response = await fetch('/api/arbitrators/available');
      if (!response.ok) throw new Error('Failed to fetch arbitrators');
      const data = await response.json();
      setAvailableArbitrators(data);
    } catch (err) {
      console.error('Error fetching arbitrators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeArbitrator = async (arbitratorId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/arbitration/cases/${id}/arbitrators/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arbitratorId, notes }),
      });

      if (response.ok) {
        fetchCaseData();
        setProposalDialog({ open: false });
      }
    } catch (err) {
      console.error('Error proposing arbitrator:', err);
    }
  };

  const handleRespondToProposal = async (proposalId: string, action: 'accept' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/arbitration/cases/${id}/arbitrators/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action, notes }),
      });

      if (response.ok) {
        fetchCaseData();
      }
    } catch (err) {
      console.error('Error responding to proposal:', err);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (error || !caseData) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error || 'Case not found'}</p>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <button onClick={() => router.push(`/arbitration/cases/${id}`)} className="hover:text-blue-600">
              Case {caseData.caseNumber}
            </button>
            <span>›</span>
            <span>Arbitrator Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Arbitrator Selection & Management</h1>
          <p className="text-gray-600 mt-2">
            Manage arbitrator assignments and proposals for this case.
          </p>
        </div>

        {/* Case Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Case Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Case Number</p>
              <p className="text-base">{caseData.caseNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Claimant</p>
              <p className="text-base">{caseData.claimant}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Respondent</p>
              <p className="text-base">{caseData.respondent}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'assigned', name: 'Assigned Arbitrator', icon: '⚖️' },
              { id: 'proposals', name: 'Proposals', icon: '📋', count: caseData.arbitratorProposals.length },
              { id: 'available', name: 'Available Arbitrators', icon: '👥' },
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
        {activeTab === 'assigned' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Currently Assigned Arbitrator</h2>
            
            {caseData.assignedArbitrator ? (
              <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{caseData.assignedArbitrator.name}</h3>
                    <p className="text-gray-600 mb-3">{caseData.assignedArbitrator.expertise}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Experience</p>
                        <p className="text-base">{caseData.assignedArbitrator.experience} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completed Cases</p>
                        <p className="text-base">{caseData.assignedArbitrator.completedCases}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Rating</p>
                        <p className="text-base">★ {caseData.assignedArbitrator.rating}/5.0</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-base">{caseData.assignedArbitrator.location}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Qualifications</p>
                      <p className="text-sm text-gray-700">{caseData.assignedArbitrator.qualifications}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {caseData.assignedArbitrator.languages.map((lang, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getAvailabilityColor(caseData.assignedArbitrator.availability)}`}>
                      {caseData.assignedArbitrator.availability}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Contact Arbitrator
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                    View Full Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white shadow rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Arbitrator Assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No arbitrator has been assigned to this case yet. You can propose an arbitrator or wait for the other party.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('available')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Browse Available Arbitrators
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Arbitrator Proposals</h2>
            
            <div className="space-y-4">
              {caseData.arbitratorProposals.map((proposal) => (
                <div key={proposal.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{proposal.arbitrator.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Proposed by {proposal.proposedByRole} on {new Date(proposal.proposedAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700">{proposal.arbitrator.expertise}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Experience</p>
                      <p className="text-base">{proposal.arbitrator.experience} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Rating</p>
                      <p className="text-base">★ {proposal.arbitrator.rating}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed Cases</p>
                      <p className="text-base">{proposal.arbitrator.completedCases}</p>
                    </div>
                  </div>

                  {proposal.status === 'pending' && session?.user && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleRespondToProposal(proposal.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToProposal(proposal.id, 'reject')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Reject
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                        View Full Profile
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {caseData.arbitratorProposals.length === 0 && (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Proposals Yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No arbitrator proposals have been made for this case.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Available Arbitrators</h2>
              <div className="text-sm text-gray-500">
                {availableArbitrators.length} arbitrators available
              </div>
            </div>
            
            <div className="grid gap-6">
              {availableArbitrators.map((arbitrator) => (
                <div key={arbitrator.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{arbitrator.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(arbitrator.availability)}`}>
                          {arbitrator.availability}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{arbitrator.expertise}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Experience</p>
                          <p className="text-base">{arbitrator.experience} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Rating</p>
                          <p className="text-base">★ {arbitrator.rating}/5.0</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Completed Cases</p>
                          <p className="text-base">{arbitrator.completedCases}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Rate</p>
                          <p className="text-base">${arbitrator.hourlyRate}/hr</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Languages</p>
                        <div className="flex flex-wrap gap-2">
                          {arbitrator.languages.map((lang, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <div className="flex space-x-3">
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        View Full Profile
                      </button>
                    </div>
                    <button
                      onClick={() => setProposalDialog({ open: true, arbitrator })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      disabled={arbitrator.availability === 'unavailable'}
                    >
                      Propose This Arbitrator
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposal Dialog */}
        {proposalDialog.open && proposalDialog.arbitrator && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Propose {proposalDialog.arbitrator.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to propose this arbitrator for your case? The other party will be notified and can accept or reject the proposal.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-gray-900">{proposalDialog.arbitrator.name}</h4>
                  <p className="text-sm text-gray-600">{proposalDialog.arbitrator.expertise}</p>
                  <p className="text-sm text-gray-600">★ {proposalDialog.arbitrator.rating}/5.0 • {proposalDialog.arbitrator.experience} years experience</p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProposeArbitrator(proposalDialog.arbitrator!.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex-1"
                  >
                    Confirm Proposal
                  </button>
                  <button
                    onClick={() => setProposalDialog({ open: false })}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
} 