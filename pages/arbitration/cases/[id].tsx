// pages/arbitration/cases/[id].js
import ProtectedRoute from '@/components/protected-route';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function CaseDetailPage({ caseData }) {
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
          
          {/* Other fields in a two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Claimant */}
            <div>
              <p className="text-sm font-medium text-gray-500">Claimant</p>
              <p className="text-base">{caseData.claimant}</p>
            </div>

            {/* Respondent */}
            <div>
              <p className="text-sm font-medium text-gray-500">Respondent</p>
              <p className="text-base">{caseData.respondent}</p>
            </div>

            {/* Category / Sub-Category */}
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="text-base">{caseData.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sub-Category</p>
              <p className="text-base">{caseData.subCategory}</p>
            </div>

            {/* Nature of Dispute */}
            <div>
              <p className="text-sm font-medium text-gray-500">Nature of Dispute</p>
              <p className="text-base">{caseData.natureOfDispute}</p>
            </div>
            
            {/* Arbitrator */}
            <div>
              <p className="text-sm font-medium text-gray-500">Arbitrator</p>
              <p className="text-base">{caseData.arbitratorName}</p>
            </div>

            {/* Hearing Mode */}
            <div>
              <p className="text-sm font-medium text-gray-500">Hearing Mode</p>
              <p className="text-base">{caseData.hearingMode}</p>
            </div>

            {/* Next Hearing Date */}
            <div>
              <p className="text-sm font-medium text-gray-500">Next Hearing</p>
              <p className="text-base">
                {caseData.nextHearingDate
                  ? new Date(caseData.nextHearingDate).toLocaleDateString()
                  : 'Not scheduled'}
              </p>
            </div>

            {/* Last Updated */}
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-base">
                {new Date(caseData.lastUpdatedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
