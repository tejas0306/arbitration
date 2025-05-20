<div className="bg-white shadow rounded-lg p-6 mb-6">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
  
  {/* Add Case ID if available */}
  {caseData.caseId && (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-500">Case ID</p>
      <p className="text-base font-semibold">{caseData.caseId}</p>
    </div>
  )}
  
  {/* Existing case details */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* ... existing details ... */}
  </div>
</div> 