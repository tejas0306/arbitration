"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabularSummary from '@/components/case-summary/tabular-summary';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface CaseSummaryData {
  id: string;
  caseNumber: string;
  petitionerName: string;
  respondentName: string;
  caseStatus: string;
  formSteps: any[];
  respondentIssues: any[];
  timeline: any[];
}

export default function CaseSummaryPage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const caseId = params.caseId as string;
  
  const [summaryData, setSummaryData] = useState<CaseSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSummaryData();
    }
  }, [caseId, user]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cases/${caseId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.status === 403) {
        setError('You are not authorized to access this case summary.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load case summary');
      }

      const data = await response.json();
      setSummaryData(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case summary');
    } finally {
      setLoading(false);
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
          <p>Loading case summary...</p>
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
              <Button onClick={loadSummaryData}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Case summary not found or access denied.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Complete Case Summary</h1>
              <p className="text-gray-600">
                Comprehensive 3-column view of all submissions and responses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Component */}
      <TabularSummary
        caseId={summaryData.id}
        caseNumber={summaryData.caseNumber}
        petitionerName={summaryData.petitionerName}
        respondentName={summaryData.respondentName}
        formSteps={summaryData.formSteps}
        respondentIssues={summaryData.respondentIssues}
        caseStatus={summaryData.caseStatus}
      />
    </div>
  );
}
