"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RespondentResponse {
  fieldId: string;
  action: 'accept' | 'reject' | 'modify';
  respondentValue?: any;
  comment?: string;
}

interface RespondentIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  legalBasis?: string;
  requestedRelief?: string;
}

interface PetitionerCounterResponse {
  fieldId: string;
  counterComment: string;
  finalPosition: 'accept_respondent' | 'maintain_original' | 'propose_alternative';
  alternativeValue?: any;
  supportingArguments?: string;
}

interface IssueCounterResponse {
  issueId: string;
  response: string;
  position: 'accept' | 'reject' | 'counter';
  counterArguments?: string;
  legalBasis?: string;
}

interface CounterResponseProps {
  caseId: string;
  originalData: any; // Original petition data
  respondentResponses: RespondentResponse[];
  respondentIssues: RespondentIssue[];
  onSubmit: (counterResponses: PetitionerCounterResponse[], issueResponses: IssueCounterResponse[]) => Promise<void>;
  mode?: 'respond' | 'review';
}

export default function CounterResponse({ 
  caseId, 
  originalData, 
  respondentResponses, 
  respondentIssues, 
  onSubmit,
  mode = 'respond' 
}: CounterResponseProps) {
  const { toast } = useToast();
  const [counterResponses, setCounterResponses] = useState<PetitionerCounterResponse[]>([]);
  const [issueResponses, setIssueResponses] = useState<IssueCounterResponse[]>([]);
  const [activeTab, setActiveTab] = useState('field-responses');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group respondent responses by action type
  const responsesByAction = {
    accepted: respondentResponses.filter(r => r.action === 'accept'),
    rejected: respondentResponses.filter(r => r.action === 'reject'),
    modified: respondentResponses.filter(r => r.action === 'modify'),
  };

  const getCounterResponse = (fieldId: string): PetitionerCounterResponse | undefined => {
    return counterResponses.find(cr => cr.fieldId === fieldId);
  };

  const updateCounterResponse = (fieldId: string, updates: Partial<PetitionerCounterResponse>) => {
    setCounterResponses(prev => {
      const existing = prev.find(cr => cr.fieldId === fieldId);
      if (existing) {
        return prev.map(cr => cr.fieldId === fieldId ? { ...cr, ...updates } : cr);
      } else {
        return [...prev, { 
          fieldId, 
          counterComment: '', 
          finalPosition: 'accept_respondent',
          ...updates 
        }];
      }
    });
  };

  const getIssueResponse = (issueId: string): IssueCounterResponse | undefined => {
    return issueResponses.find(ir => ir.issueId === issueId);
  };

  const updateIssueResponse = (issueId: string, updates: Partial<IssueCounterResponse>) => {
    setIssueResponses(prev => {
      const existing = prev.find(ir => ir.issueId === issueId);
      if (existing) {
        return prev.map(ir => ir.issueId === issueId ? { ...ir, ...updates } : ir);
      } else {
        return [...prev, { 
          issueId, 
          response: '', 
          position: 'reject',
          ...updates 
        }];
      }
    });
  };

  const getFieldLabel = (fieldId: string): string => {
    // Map field IDs to readable labels
    const fieldLabels: Record<string, string> = {
      'claimant.name': 'Claimant Name',
      'claimant.email': 'Email Address',
      'claimant.phone': 'Phone Number',
      'claimant.address': 'Address',
      'payment.totalClaimAmount': 'Total Claim Amount',
      // Add more mappings as needed
    };
    
    return fieldLabels[fieldId] || fieldId.split('.').pop() || fieldId;
  };

  const getOriginalValue = (fieldId: string): any => {
    const keys = fieldId.split('.');
    let value = originalData;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return 'N/A';
      }
    }
    
    return value || 'N/A';
  };

  const renderResponseCard = (response: RespondentResponse, actionType: string) => {
    const counterResponse = getCounterResponse(response.fieldId);
    const finalPosition = counterResponse?.finalPosition || 'accept_respondent';

    return (
      <Card key={response.fieldId} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{getFieldLabel(response.fieldId)}</span>
            <div className="flex gap-2">
              <Badge variant={actionType === 'accepted' ? 'default' : 
                             actionType === 'rejected' ? 'destructive' : 'secondary'}>
                {actionType}
              </Badge>
              {finalPosition !== 'accept_respondent' && (
                <Badge variant="outline">Response Required</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Original vs Respondent Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Your Original Value:</Label>
                <div className="bg-blue-50 p-3 rounded-lg mt-1">
                  <span className="text-sm">{String(getOriginalValue(response.fieldId))}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Respondent's {response.action === 'modify' ? 'Modified' : 'Response'}:
                </Label>
                <div className={`p-3 rounded-lg mt-1 ${
                  response.action === 'accept' ? 'bg-green-50' :
                  response.action === 'reject' ? 'bg-red-50' : 'bg-yellow-50'
                }`}>
                  {response.action === 'accept' && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Accepted as provided</span>
                    </div>
                  )}
                  
                  {response.action === 'reject' && (
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Rejected</span>
                    </div>
                  )}
                  
                  {response.action === 'modify' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Modified</span>
                      </div>
                      <div className="text-sm font-medium">New Value: {String(response.respondentValue)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Respondent Comment */}
            {response.comment && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Respondent's Comment:</Label>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <p className="text-sm">{response.comment}</p>
                </div>
              </div>
            )}

            {/* Your Counter-Response */}
            {mode === 'respond' && (response.action === 'reject' || response.action === 'modify') && (
              <div className="border-t pt-4">
                <Label className="text-lg font-medium text-gray-900 mb-3 block">Your Counter-Response:</Label>
                
                {/* Position Selection */}
                <div className="space-y-3 mb-4">
                  <Label className="text-sm font-medium">Your Position:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={finalPosition === 'accept_respondent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCounterResponse(response.fieldId, { finalPosition: 'accept_respondent' })}
                    >
                      Accept Respondent's Position
                    </Button>
                    <Button
                      variant={finalPosition === 'maintain_original' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCounterResponse(response.fieldId, { finalPosition: 'maintain_original' })}
                    >
                      Maintain Original
                    </Button>
                    <Button
                      variant={finalPosition === 'propose_alternative' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCounterResponse(response.fieldId, { finalPosition: 'propose_alternative' })}
                    >
                      Propose Alternative
                    </Button>
                  </div>
                </div>

                {/* Alternative Value Input */}
                {finalPosition === 'propose_alternative' && (
                  <div className="space-y-2 mb-4">
                    <Label>Your Alternative Value:</Label>
                    <Textarea
                      placeholder="Enter your alternative value..."
                      value={counterResponse?.alternativeValue || ''}
                      onChange={(e) => updateCounterResponse(response.fieldId, { alternativeValue: e.target.value })}
                    />
                  </div>
                )}

                {/* Counter Comment */}
                <div className="space-y-2 mb-4">
                  <Label>Your Comment/Arguments:</Label>
                  <Textarea
                    rows={3}
                    placeholder="Explain your position and provide supporting arguments..."
                    value={counterResponse?.counterComment || ''}
                    onChange={(e) => updateCounterResponse(response.fieldId, { counterComment: e.target.value })}
                  />
                </div>

                {/* Supporting Arguments */}
                <div className="space-y-2">
                  <Label>Legal/Factual Support (Optional):</Label>
                  <Textarea
                    rows={2}
                    placeholder="Provide legal basis or factual support for your position..."
                    value={counterResponse?.supportingArguments || ''}
                    onChange={(e) => updateCounterResponse(response.fieldId, { supportingArguments: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Review Mode Display */}
            {mode === 'review' && counterResponse && (
              <div className="border-t pt-4 bg-blue-50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Your Counter-Response:</Label>
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <strong>Position:</strong> {
                      finalPosition === 'accept_respondent' ? 'Accept Respondent\'s Position' :
                      finalPosition === 'maintain_original' ? 'Maintain Original' :
                      'Propose Alternative'
                    }
                  </div>
                  {counterResponse.counterComment && (
                    <div className="text-sm">
                      <strong>Comment:</strong> {counterResponse.counterComment}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIssueResponse = (issue: RespondentIssue) => {
    const issueResponse = getIssueResponse(issue.id);
    const position = issueResponse?.position || 'reject';

    return (
      <Card key={issue.id} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{issue.title}</span>
            <Badge>{issue.category}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Issue Description */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Respondent's Issue:</Label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                <p className="text-sm">{issue.description}</p>
              </div>
            </div>

            {/* Legal Basis & Relief */}
            {(issue.legalBasis || issue.requestedRelief) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issue.legalBasis && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Legal Basis:</Label>
                    <div className="bg-gray-50 p-2 rounded mt-1">
                      <p className="text-sm">{issue.legalBasis}</p>
                    </div>
                  </div>
                )}
                
                {issue.requestedRelief && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Requested Relief:</Label>
                    <div className="bg-gray-50 p-2 rounded mt-1">
                      <p className="text-sm">{issue.requestedRelief}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Your Response */}
            {mode === 'respond' && (
              <div className="border-t pt-4">
                <Label className="text-lg font-medium text-gray-900 mb-3 block">Your Response:</Label>
                
                {/* Position Selection */}
                <div className="space-y-3 mb-4">
                  <Label className="text-sm font-medium">Your Position:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={position === 'accept' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateIssueResponse(issue.id, { position: 'accept' })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant={position === 'reject' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => updateIssueResponse(issue.id, { position: 'reject' })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant={position === 'counter' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateIssueResponse(issue.id, { position: 'counter' })}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Counter-Argue
                    </Button>
                  </div>
                </div>

                {/* Response Text */}
                <div className="space-y-2 mb-4">
                  <Label>Your Detailed Response:</Label>
                  <Textarea
                    rows={4}
                    placeholder="Provide your detailed response to this issue..."
                    value={issueResponse?.response || ''}
                    onChange={(e) => updateIssueResponse(issue.id, { response: e.target.value })}
                  />
                </div>

                {/* Counter Arguments */}
                {position === 'counter' && (
                  <div className="space-y-2 mb-4">
                    <Label>Counter-Arguments:</Label>
                    <Textarea
                      rows={3}
                      placeholder="Provide your counter-arguments..."
                      value={issueResponse?.counterArguments || ''}
                      onChange={(e) => updateIssueResponse(issue.id, { counterArguments: e.target.value })}
                    />
                  </div>
                )}

                {/* Legal Basis */}
                <div className="space-y-2">
                  <Label>Legal Basis (Optional):</Label>
                  <Textarea
                    rows={2}
                    placeholder="Provide legal support for your position..."
                    value={issueResponse?.legalBasis || ''}
                    onChange={(e) => updateIssueResponse(issue.id, { legalBasis: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Review Mode Display */}
            {mode === 'review' && issueResponse && (
              <div className="border-t pt-4 bg-blue-50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Your Response:</Label>
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <strong>Position:</strong> {position}
                  </div>
                  {issueResponse.response && (
                    <div className="text-sm">
                      <strong>Response:</strong> {issueResponse.response}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(counterResponses, issueResponses);
      toast({
        title: "Counter-Response Submitted",
        description: "Your counter-response has been submitted successfully. The case is now ready for arbitration."
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your counter-response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Counter-Response to Respondent</h1>
        <p className="text-gray-600">
          Review the respondent's responses to your petition and provide your counter-response. 
          This is your final opportunity to address their points before arbitration.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{responsesByAction.accepted.length}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{responsesByAction.rejected.length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{responsesByAction.modified.length}</div>
            <div className="text-sm text-gray-600">Modified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{respondentIssues.length}</div>
            <div className="text-sm text-gray-600">New Issues</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="field-responses">Field Responses</TabsTrigger>
          <TabsTrigger value="new-issues">New Issues</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="field-responses" className="space-y-6">
          {/* Rejected Fields */}
          {responsesByAction.rejected.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-red-700">
                Rejected Fields ({responsesByAction.rejected.length})
              </h2>
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  These fields were rejected by the respondent. You must provide a counter-response.
                </AlertDescription>
              </Alert>
              {responsesByAction.rejected.map(response => renderResponseCard(response, 'rejected'))}
            </div>
          )}

          {/* Modified Fields */}
          {responsesByAction.modified.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-yellow-700">
                Modified Fields ({responsesByAction.modified.length})
              </h2>
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  These fields were modified by the respondent. Please review and respond.
                </AlertDescription>
              </Alert>
              {responsesByAction.modified.map(response => renderResponseCard(response, 'modified'))}
            </div>
          )}

          {/* Accepted Fields */}
          {responsesByAction.accepted.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-green-700">
                Accepted Fields ({responsesByAction.accepted.length})
              </h2>
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  These fields were accepted by the respondent. No response required.
                </AlertDescription>
              </Alert>
              {responsesByAction.accepted.map(response => renderResponseCard(response, 'accepted'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new-issues" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Respondent's New Issues/Counter-Claims ({respondentIssues.length})
            </h2>
            {respondentIssues.length > 0 ? (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  The respondent has raised these new issues. Please review and respond to each.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  The respondent has not raised any new issues or counter-claims.
                </AlertDescription>
              </Alert>
            )}
            
            {respondentIssues.map(issue => renderIssueResponse(issue))}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Counter-Response Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Field Responses</h3>
                    <div className="space-y-1 text-sm">
                      <div>Responses provided: {counterResponses.length}</div>
                      <div>Accepting respondent: {counterResponses.filter(cr => cr.finalPosition === 'accept_respondent').length}</div>
                      <div>Maintaining original: {counterResponses.filter(cr => cr.finalPosition === 'maintain_original').length}</div>
                      <div>Proposing alternative: {counterResponses.filter(cr => cr.finalPosition === 'propose_alternative').length}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Issue Responses</h3>
                    <div className="space-y-1 text-sm">
                      <div>Issues responded to: {issueResponses.length}</div>
                      <div>Accepting: {issueResponses.filter(ir => ir.position === 'accept').length}</div>
                      <div>Rejecting: {issueResponses.filter(ir => ir.position === 'reject').length}</div>
                      <div>Counter-arguing: {issueResponses.filter(ir => ir.position === 'counter').length}</div>
                    </div>
                  </div>
                </div>

                {mode === 'respond' && (
                  <div className="flex justify-center gap-4 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Counter-Response Saved",
                          description: "Your counter-response has been saved as draft."
                        });
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      size="lg"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Final Counter-Response'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
