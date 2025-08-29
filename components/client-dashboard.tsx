"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { auth, api } from '@/lib/api'
import {
  User,
  Settings,
  FileText,
  PlusCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  Filter,
  Download,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('my-cases')
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch drafts
      try {
        const draftsData = await api.arbitration.getDrafts()
        setDrafts(draftsData || [])
      } catch (draftErr) {
        toast.error('Unable to load your saved drafts')
        setDrafts([])
      }
      
      // Fetch cases (both claimant and respondent cases)
      try {
        let allCases: any[] = [];
        
        // Fetch claimant cases (skip for respondents to avoid wrong API calls)
        if (!user || user.role !== 'RESPONDENT') {
          try {
            const claimantResponse = await fetch('/api/arbitration/my-cases', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            
            if (claimantResponse.ok) {
              const claimantData = await claimantResponse.json();
              allCases = [...allCases, ...(claimantData.cases || []).map((c: any) => ({ ...c, userRole: 'claimant' }))];
            }
          } catch (err) {
            console.log('No claimant cases or error fetching:', err);
          }
        }
        
        // Fetch respondent cases (only if user is respondent or admin)
        if (user && (user.role === 'RESPONDENT' || user.role === 'ADMIN')) {
          try {
            console.log('🔧 Fetching respondent cases...');
            const respondentResponse = await fetch('/api/respondent/cases', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            
            console.log('🔧 Respondent response status:', respondentResponse.status);
            
            if (respondentResponse.ok) {
            const respondentData = await respondentResponse.json();
            console.log('🔧 Respondent data:', respondentData);
            allCases = [...allCases, ...(respondentData || []).map((c: any) => ({ ...c, userRole: 'respondent' }))];
          } else {
            const errorData = await respondentResponse.json().catch(() => ({}));
            console.log('🔧 Respondent API error:', errorData);
          }
          } catch (err) {
            console.log('No respondent cases or error fetching:', err);
          }
        }
        
        setCases(allCases);
      } catch (casesErr) {
        toast.error('Unable to load your cases')
        setCases([])
      }
      
    } catch (error) {
      setError('Failed to load dashboard data')
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  const renderCasesContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )
    }
    
    if (cases.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Yet</h3>
          <p className="text-gray-500 mb-4">You haven't filed any arbitration cases yet.</p>
          {user?.role === 'CLAIMANT' && (
            <Link href="/arbitration/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                File New Petition
              </button>
            </Link>
          )}
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button className="border border-gray-300 bg-white px-3 py-1 rounded text-sm flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="border border-gray-300 bg-white px-3 py-1 rounded text-sm flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
          <button 
            className="border border-gray-300 bg-white px-3 py-1 rounded text-sm flex items-center"
            onClick={fetchDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        
        <div className="space-y-4">
          {cases.map((caseItem: any) => (
            <Link href={`/dashboard/case/${caseItem.id}`} key={caseItem.id}>
              <div className="border border-gray-200 rounded p-4 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{caseItem.name || `Case ${caseItem.caseNumber}`}</h3>
                    <p className="text-sm text-gray-500">Case #{caseItem.caseNumber}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        Filed on {new Date(caseItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      caseItem.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      caseItem.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      caseItem.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }
  
  const renderDraftsContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )
    }
    
    if (drafts.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Drafts</h3>
          <p className="text-gray-500 mb-4">You don't have any saved drafts at the moment.</p>
          {user?.role === 'CLAIMANT' && (
            <Link href="/arbitration/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Start New Petition
              </button>
            </Link>
          )}
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {drafts.map((draft: any) => (
          <Link href={`/dashboard/petition/edit/${draft.id}`} key={draft.id}>
            <div className="border border-gray-200 rounded p-4 hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{draft.name || 'Untitled Draft'}</h3>
                  <div className="flex items-center mt-2">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      Last edited on {new Date(draft.lastEditedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="border border-gray-300 bg-white px-3 py-1 rounded text-sm">
                  Continue Editing
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || 'User'}</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'CLAIMANT' && (
          <Link href="/arbitration/new">
            <div className="border-l-4 border-l-blue-500 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <PlusCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New Petition</p>
                    <p className="text-sm text-gray-500">File a new case</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        )}
        
        <Link href="/dashboard/my-cases">
          <div className="border-l-4 border-l-green-500 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">My Cases</p>
                  <p className="text-sm text-gray-500">View all cases</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </Link>
        
        <Link href="/profile">
          <div className="border-l-4 border-l-purple-500 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-gray-500">Update your info</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </Link>
        
        <Link href="/support">
          <div className="border-l-4 border-l-orange-500 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Support</p>
                  <p className="text-sm text-gray-500">Get help & support</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </Link>

        {/* Counter-Response Quick Action for Claimants */}
        {user?.role === 'CLAIMANT' && cases.some(c => c.status === 'RESPONSE SUBMITTED') && (
          <Link href="/dashboard/my-cases">
            <div className="border-l-4 border-l-indigo-500 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Counter-Response</p>
                    <p className="text-sm text-gray-500">Respond to submissions</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        )}
      </div>
      
      {/* Dashboard Content */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('my-cases')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'my-cases'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Cases
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'drafts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Drafts
            </button>
          </div>
        </div>
        <div className="p-4">
          {activeTab === 'my-cases' && renderCasesContent()}
          {activeTab === 'drafts' && renderDraftsContent()}
        </div>
      </div>
    </div>
  )
} 