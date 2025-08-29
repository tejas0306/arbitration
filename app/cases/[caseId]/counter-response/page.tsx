"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CounterResponse from '@/components/petitioner/counter-response';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

interface CaseData {
  id: string;
  caseNumber: string;
  status: string;
  originalData: any;
  respondentResponses: any[];
  respondentIssues: any[];
  hasCounterResponse: boolean;
  counterResponseDeadline: string;
}

export default function CounterResponsePage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const caseId = params.caseId as string;
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCaseData();
    }
  }, [caseId, user]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      console.log('🔍 Debug: Token exists:', !!token);
      console.log('🔍 Debug: Case ID:', caseId);

      // Call the backend API directly instead of going through Next.js API routes
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiUrl = `${backendUrl}/api/arbitration/cases/${caseId}`;
      
      console.log('🔍 Debug: Calling backend directly:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 Debug: Response status:', response.status);
      console.log('🔍 Debug: Response ok:', response.ok);

      if (response.status === 401) {
        console.log('🔍 Debug: 401 Unauthorized - redirecting to login');
        router.push('/auth/login');
        return;
      }

      if (response.status === 403) {
        console.log('🔍 Debug: 403 Forbidden');
        setError('You are not authorized to access this case.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Debug: Response not ok, error text:', errorText);
        throw new Error(`Failed to load case data: ${response.status} - ${errorText}`);
      }

      const caseData = await response.json();
      console.log('🔍 Debug: Successfully loaded case data:', caseData);
      
      // Transform the case data into the format expected by the component
      const transformedData = {
        id: caseData.id,
        caseNumber: caseData.caseNumber || caseData.id,
        status: caseData.status,
        originalData: {
          title: caseData.name || 'Untitled Case',
          description: caseData.disputeDetails || {},
          disputeType: (caseData.disputeDetails as any)?.disputeType || 'Not specified',
          disputeAmount: (caseData.disputeDetails as any)?.disputeAmount || 'Not specified',
          claimant: {
            name: caseData.user?.name || 'Unknown',
            email: caseData.user?.email || 'Unknown'
          },
          respondents: caseData.respondents || [],
          documents: caseData.documents || {},
          createdAt: caseData.createdAt
        },
        respondentResponses: [], // Will be populated when responses are implemented
        respondentIssues: [], // Will implement AI judgments later
        hasCounterResponse: false, // Will be determined based on actual responses
        counterResponseDeadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // Default 7 days from now
        currentRound: null // Will implement workflow rounds later
      };
      
      setCaseData(transformedData);

    } catch (err) {
      console.error('🔍 Debug: Error in loadCaseData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterResponseSubmit = async (counterResponses: any[], issueResponses: any[]) => {
    try {
      const response = await fetch(`/api/cases/${caseId}/counter-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          counterResponses,
          issueResponses
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit counter-response');
      }

      const result = await response.json();
      
      toast({
        title: "Counter-Response Submitted Successfully",
        description: "Your counter-response has been submitted. The case is now ready for arbitration.",
      });

      // Redirect to case summary or dashboard
      router.push(`/cases/${caseId}/summary`);

    } catch (error) {
      throw error; // Let the component handle the error display
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Please log in to continue...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading case information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={loadCaseData}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Case not found or access denied.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if counter-response is already submitted
  if (caseData.hasCounterResponse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Counter-Response Already Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You have already submitted your counter-response for this case. 
                  The case is now ready for arbitration.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/cases/${caseId}/summary`)}
                >
                  View Case Summary
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if deadline has passed
  const deadline = new Date(caseData.counterResponseDeadline);
  const now = new Date();
  const isOverdue = now > deadline;

  if (isOverdue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Counter-Response Deadline Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The deadline for submitting your counter-response has passed 
                  ({deadline.toLocaleDateString()} at 11:59 PM). 
                  Please contact the arbitration administrator if you need assistance.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/support')}
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* Page Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="text-2xl font-bold">Counter-Response Required</h1>
                </div>
                <p className="text-gray-600">
                  Case #{caseData.caseNumber} • 
                  Deadline: {deadline.toLocaleDateString()} at 11:59 PM
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Time Remaining</div>
                <div className="text-lg font-medium text-red-600">
                  {Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="max-w-7xl mx-auto p-6">
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> The respondent has submitted their response to your petition. 
              You now have the opportunity to review their responses and provide a counter-response. 
              This is your final opportunity to address their points before the case proceeds to arbitration.
            </AlertDescription>
          </Alert>

          {/* Counter Response Component */}
          <CounterResponse
            caseId={caseData.id}
            originalData={caseData.originalData}
            respondentResponses={caseData.respondentResponses}
            respondentIssues={caseData.respondentIssues}
            onSubmit={handleCounterResponseSubmit}
            mode="respond"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
