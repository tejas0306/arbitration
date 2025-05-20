// pages/arbitration/cases/[id].js
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { api } from '@/lib/api'
import { GetServerSidePropsContext } from 'next'

interface CaseData {
  caseNumber?: string
  claimant: string
  respondent: string
  // Add other properties as needed
}

export async function getServerSideProps({ params, req }: GetServerSidePropsContext) {
  try {
    // Fetch the case by ID; this runs on every request
    const caseData = await api.arbitration.getById(params?.id as string)

    // If no case, show a 404
    if (!caseData) {
      return { notFound: true }
    }

    return {
      props: { caseData },
    }
  } catch (err) {
    console.error('getServerSideProps error:', err)
    return { notFound: true }
  }
}

export default function CaseDetailPage({ caseData }: { caseData: CaseData }) {
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
              <p className="text-base">{caseData.claimant}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Respondent</p>
              <p className="text-base">{caseData.respondent}</p>
            </div>
            {/* …and so on for Category, Sub-Category, Nature of Dispute, etc. */}
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
}
