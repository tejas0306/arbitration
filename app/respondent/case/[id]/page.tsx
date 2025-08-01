'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, FileText, User, Building, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';

interface CaseData {
  id: string;
  case: {
    id: string;
    caseNumber?: string;
    name: string;
    type: string;
    status: string;
    disputeDetails: any;
    arbitrationAgreement: any;
    documents: any;
    claimant: {
      id: string;
      name: string;
      email: string;
      organization?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  responseStatus: string;
  currentPhase: string;
  responseDeadline?: string;
  noticeServedAt: string;
  respondedAt?: string;
  existingResponse: any;
}

export default function RespondentCaseDetail() {
  const { data: session, status } = useSession();
  const params = useParams();
  const caseId = params?.id as string;
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && caseId) {
      fetchCaseData();
    }
  }, [status, caseId]);

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/respondent/cases/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case data');
      }
      const data = await response.json();
      setCaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isResponseOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading case details...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access case details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Case not found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{caseData.case.name}</h1>
            <p className="text-gray-600 mt-2">Case #{caseData.case.caseNumber}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(caseData.responseStatus)}>
              {caseData.responseStatus.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {caseData.currentPhase.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Response Status Alert */}
        {caseData.responseStatus === 'PENDING' && caseData.responseDeadline && (
          <Alert className={isResponseOverdue(caseData.responseDeadline) ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isResponseOverdue(caseData.responseDeadline) ? (
                <span className="text-red-700 font-semibold">
                  Response deadline has passed: {formatDate(caseData.responseDeadline)}
                </span>
              ) : (
                <span className="text-yellow-700">
                  Response due by: {formatDate(caseData.responseDeadline)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          {caseData.responseStatus === 'PENDING' && (
            <Link href={`/respondent/case/${caseId}/respond`}>
              <Button>Submit Response</Button>
            </Link>
          )}
          {caseData.existingResponse && (
            <Link href={`/respondent/case/${caseId}/response`}>
              <Button variant="outline">View Your Response</Button>
            </Link>
          )}
          <Link href="/respondent/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dispute">Dispute Details</TabsTrigger>
          <TabsTrigger value="agreement">Agreement</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Case Type</label>
                  <p className="text-sm">{caseData.case.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-sm">{caseData.case.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Filed On</label>
                  <p className="text-sm">{formatDate(caseData.case.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Notice Served</label>
                  <p className="text-sm">{formatDate(caseData.noticeServedAt)}</p>
                </div>
                {caseData.responseDeadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Response Deadline</label>
                    <p className={`text-sm ${isResponseOverdue(caseData.responseDeadline) ? 'text-red-600 font-semibold' : ''}`}>
                      {formatDate(caseData.responseDeadline)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claimant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Claimant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{caseData.case.claimant.name}</p>
                    <p className="text-sm text-gray-600">{caseData.case.claimant.email}</p>
                  </div>
                </div>
                {caseData.case.claimant.organization && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Organization</p>
                      <p className="font-medium">{caseData.case.claimant.organization}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Case Filed</p>
                    <p className="text-sm text-gray-600">{formatDateTime(caseData.case.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Notice Served</p>
                    <p className="text-sm text-gray-600">{formatDateTime(caseData.noticeServedAt)}</p>
                  </div>
                </div>
                {caseData.respondedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Response Submitted</p>
                      <p className="text-sm text-gray-600">{formatDateTime(caseData.respondedAt)}</p>
                    </div>
                  </div>
                )}
                {caseData.responseStatus === 'PENDING' && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Awaiting Response</p>
                      <p className="text-sm text-gray-600">Response pending from you</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.case.disputeDetails && typeof caseData.case.disputeDetails === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(caseData.case.disputeDetails).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <p className="text-sm mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No dispute details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agreement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arbitration Agreement</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.case.arbitrationAgreement && typeof caseData.case.arbitrationAgreement === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(caseData.case.arbitrationAgreement).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <p className="text-sm mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No arbitration agreement details available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Documents</CardTitle>
              <CardDescription>Documents submitted by the claimant</CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.case.documents && Array.isArray(caseData.case.documents) && caseData.case.documents.length > 0 ? (
                <div className="space-y-4">
                  {caseData.case.documents.map((doc: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.name || `Document ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">{doc.type || 'Unknown type'}</p>
                          </div>
                        </div>
                        {doc.url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No documents available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 