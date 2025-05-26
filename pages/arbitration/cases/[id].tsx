// pages/arbitration/cases/[id].js
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { GetServerSidePropsContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface CaseData {
  id?: string
  caseNumber?: string
  claimant?: string
  respondent?: string
  claimantName?: string
  respondentName?: string
  arbitrationAgreement?: string
  claimantFacts?: string
  claimantPrayers?: string[]
  claims?: Array<{
    number: number
    text: string
    type: string
  }>
  // Add other properties as needed
}

export default function CaseDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCaseData(id as string)
    }
  }, [id])

  const fetchCaseData = async (caseId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth_token')
      const headers: any = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/cases/${caseId}`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setCaseData(data)
      } else {
        throw new Error(`Failed to fetch case data: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error fetching case data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch case data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading case details...</div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    )
  }

  if (error || !caseData) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Case</h3>
            <p className="text-red-600">{error || 'Case not found'}</p>
            <Link href="/dashboard" className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Back to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8">
        {/* Case Details Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
          
          {/* FRS Case Number */}
          {caseData.caseNumber && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Case Number</p>
              <p className="text-base font-semibold">{caseData.caseNumber}</p>
            </div>
          )}
          
          {/* Rest of your grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Claimant</p>
              <p className="text-base">{caseData.claimant || caseData.claimantName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Respondent</p>
              <p className="text-base">{caseData.respondent || caseData.respondentName}</p>
            </div>
            
            {/* Arbitration Agreement */}
            {caseData.arbitrationAgreement && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Arbitration Agreement</p>
                <p className="text-base">{caseData.arbitrationAgreement}</p>
              </div>
            )}
            
            {/* Claimant Facts */}
            {caseData.claimantFacts && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Statement of Facts</p>
                <p className="text-base">{caseData.claimantFacts}</p>
              </div>
            )}
            
            {/* Claimant Prayers */}
            {caseData.claimantPrayers && caseData.claimantPrayers.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Prayers/Relief Sought</p>
                <ul className="text-base list-disc list-inside">
                  {caseData.claimantPrayers.map((prayer, index) => (
                    <li key={index}>{prayer}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Claims for Response */}
            {caseData.claims && caseData.claims.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Claims</p>
                <div className="space-y-2">
                  {caseData.claims.map((claim) => (
                    <div key={claim.number} className="border rounded p-3">
                      <p className="font-medium">Claim #{claim.number} ({claim.type})</p>
                      <p className="text-gray-700">{claim.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Case Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Link href={`/arbitration/cases/${id}/evidence`} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                Manage Evidence
              </Link>
              <Link href={`/arbitration/cases/${id}/arbitrators`} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                Arbitrator Selection
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
}
