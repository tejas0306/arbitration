'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RespondentForm from '@/components/respondent/respondent-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function RespondentCasePage() {
  const params = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Handle dynamic route - decode case ID that may contain encoded slashes
  const caseId = decodeURIComponent(params.caseId as string);

  useEffect(() => {
    // Check if user is logged in first using the auth token (same as dashboard)
    const checkAuth = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        console.log('🔧 Auth token exists:', !!authToken);
        
        if (authToken) {
          setIsLoggedIn(true);
          fetchCaseData();
        } else {
          console.log('🔧 No auth token, redirecting to login');
          // Redirect to login with return URL
          window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      }
    };

    const fetchCaseData = async () => {
      try {
        setLoading(true);
        console.log('🔧 Fetching case data for:', caseId);
        
        // Get all respondent cases and filter for this specific case
        const response = await fetch(`/api/respondent/cases`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch case data: ${response.status}`);
        }
        
        const allCases = await response.json();
        console.log('🔧 All respondent cases received:', allCases);
        
        // Find the specific case
        const specificCase = allCases.find((c: any) => c.id === caseId);
        
        if (!specificCase) {
          throw new Error('Case not found');
        }
        
        console.log('🔧 Specific case data:', specificCase);
        setCaseData(specificCase);
      } catch (err: any) {
        console.error('Error fetching case data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      checkAuth();
    }
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading case data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading case:</strong> {error}
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Case ID: {caseId}
              </span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RespondentForm 
        caseId={caseId}
        caseData={caseData}
        round={1}
      />
    </div>
  );
}