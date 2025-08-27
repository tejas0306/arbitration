"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, FileText, Calendar, Scale } from 'lucide-react';
import FieldByFieldResponse from '@/components/respondent/field-by-field-response';
import { useToast } from '@/hooks/use-toast';

interface CaseData {
  id: string;
  caseNumber: string;
  claimantName: string;
  submissionDate: string;
  responseDeadline: string;
  status: string;
  petitionData: any;
  respondentInfo: {
    name: string;
    email: string;
    hasResponded: boolean;
  };
}

export default function CasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const encryptedCaseNumber = params.caseNumber as string;
  const accessCode = searchParams.get('code');
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState(accessCode || '');
  const [needsAccessCode, setNeedsAccessCode] = useState(!accessCode);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'respond' | 'review'>('overview');

  useEffect(() => {
    if (accessCode) {
      loadCaseData();
    }
  }, [encryptedCaseNumber, accessCode]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cases/public/${encryptedCaseNumber}?code=${accessCodeInput || accessCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setNeedsAccessCode(true);
        setIsAuthenticated(false);
        setError('Invalid access code. Please check your email for the correct code.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load case data');
      }

      const data = await response.json();
      setCaseData(data);
      setIsAuthenticated(true);
      setNeedsAccessCode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCodeInput) {
      loadCaseData();
    }
  };

  const handleResponseSubmit = async (responses: any[], newIssues: any[]) => {
    try {
      const response = await fetch(`/api/cases/${caseData?.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          newIssues,
          accessCode: accessCodeInput || accessCode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const result = await response.json();
      
      toast({
        title: "Response Submitted Successfully",
        description: "Your response has been submitted and the claimant will be notified.",
      });

      // Refresh case data to show updated status
      await loadCaseData();
      setCurrentView('review');

    } catch (error) {
      throw error; // Let the component handle the error display
    }
  };

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

  if (needsAccessCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Scale className="w-6 h-6" />
              Access Arbitration Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-600">
                  Check your email for the access code sent to you.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={!accessCodeInput}>
                Access Case
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Case Number</Label>
              <p className="font-medium">{caseData.caseNumber}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Claimant</Label>
              <p className="font-medium">{caseData.claimantName}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Submission Date</Label>
              <p className="font-medium">{new Date(caseData.submissionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Response Deadline</Label>
              <p className="font-medium text-red-600">
                {new Date(caseData.responseDeadline).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Status */}
      <Card>
        <CardHeader>
          <CardTitle>Response Status</CardTitle>
        </CardHeader>
        <CardContent>
          {caseData.respondentInfo.hasResponded ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have already submitted your response to this case. You can review your submission below.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Your response is pending. Please review the petition and submit your response before the deadline.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {!caseData.respondentInfo.hasResponded ? (
              <Button
                onClick={() => setCurrentView('respond')}
                size="lg"
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Respond to Petition
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentView('review')}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Review Your Response
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Response Deadline</p>
                <p className="text-gray-600">
                  You must submit your response before {new Date(caseData.responseDeadline).toLocaleDateString()} 
                  at 11:59 PM. Late responses may not be accepted.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Scale className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium">Legal Representation</p>
                <p className="text-gray-600">
                  You have the right to be represented by a lawyer. Consider seeking legal advice 
                  before submitting your response.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Arbitration Case #{caseData.caseNumber}</h1>
              <p className="text-gray-600 mt-1">
                Case filed by {caseData.claimantName} • 
                Response due: {new Date(caseData.responseDeadline).toLocaleDateString()}
              </p>
            </div>
            
            {currentView !== 'overview' && (
              <Button
                variant="outline"
                onClick={() => setCurrentView('overview')}
              >
                Back to Overview
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {currentView === 'overview' && renderOverview()}
        
        {currentView === 'respond' && (
          <FieldByFieldResponse
            caseId={caseData.id}
            petitionData={caseData.petitionData}
            onSubmit={handleResponseSubmit}
            mode="respond"
          />
        )}
        
        {currentView === 'review' && (
          <FieldByFieldResponse
            caseId={caseData.id}
            petitionData={caseData.petitionData}
            onSubmit={handleResponseSubmit}
            mode="review"
          />
        )}
      </div>
    </div>
  );
}
