'use client';

import { useParams } from 'next/navigation';

export default function RespondentCasePage() {
  const params = useParams();
  
  // Handle catch-all route for case IDs with slashes
  const caseId = Array.isArray(params.id) ? params.id.join('/') : params.id as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Respondent Case Page</h1>
        <p className="text-gray-600">Case ID: {caseId}</p>
        <p className="text-sm text-gray-500 mt-2">Route is working!</p>
      </div>
    </div>
  );
} 