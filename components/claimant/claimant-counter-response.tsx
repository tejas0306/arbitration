'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FieldResponse {
  fieldId: string;
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  status: 'ACCEPTED' | 'REJECTED' | 'CORRECTED';
  respondentComment?: string;
  correctedValue?: string;
  evidence?: any;
}

interface RespondentResponse {
  id: string;
  respondentName: string;
  respondentEmail: string;
  fieldResponses: FieldResponse[];
  submittedAt: string;
}

interface ClaimantCounterResponseProps {
  caseId: string;
  caseNumber: string;
  respondentResponses: RespondentResponse[];
}

export default function ClaimantCounterResponse({ 
  caseId, 
  caseNumber, 
  respondentResponses 
}: ClaimantCounterResponseProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counterResponses, setCounterResponses] = useState<{[key: string]: any}>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Initialize counter responses
  useEffect(() => {
    const initial: {[key: string]: any} = {};
    respondentResponses.forEach(response => {
      response.fieldResponses.forEach(field => {
        const key = `${response.id}-${field.fieldId}`;
        initial[key] = {
          fieldId: field.fieldId,
          fieldName: field.fieldName,
          originalValue: field.fieldValue,
          respondentStatus: field.status,
          respondentComment: field.respondentComment,
          respondentCorrectedValue: field.correctedValue,
          claimantResponse: '',
          claimantEvidence: '',
          claimantPosition: 'AGREE' // AGREE, DISAGREE, PROVIDE_EVIDENCE
        };
      });
    });
    setCounterResponses(initial);
  }, [respondentResponses]);

  const updateCounterResponse = (key: string, updates: any) => {
    setCounterResponses(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const renderFieldCounterResponse = (response: RespondentResponse, field: FieldResponse) => {
    const key = `${response.id}-${field.fieldId}`;
    const counterResponse = counterResponses[key];

    if (!counterResponse) return null;

    return (
      <Card key={key} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {field.fieldId}
              </Badge>
              <CardTitle className="text-lg">{field.fieldName}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant={
                  field.status === 'ACCEPTED' ? 'default' : 
                  field.status === 'REJECTED' ? 'destructive' : 
                  'secondary'
                }
              >
                Respondent: {field.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Value */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Your Original Value:
            </Label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              {field.fieldValue}
            </div>
          </div>

          {/* Respondent's Response */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Respondent's Response:
            </Label>
            <div className="mt-1 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="mb-2">
                <strong>Status:</strong> {field.status}
              </div>
              {field.respondentComment && (
                <div className="mb-2">
                  <strong>Comment:</strong> {field.respondentComment}
                </div>
              )}
              {field.correctedValue && (
                <div>
                  <strong>Corrected Value:</strong> {field.correctedValue}
                </div>
              )}
            </div>
          </div>

          {/* Claimant's Response */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Your Response:
            </Label>
            <div className="mt-2 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={counterResponse.claimantPosition === 'AGREE' ? 'default' : 'outline'}
                  onClick={() => updateCounterResponse(key, { claimantPosition: 'AGREE' })}
                  size="sm"
                >
                  ✓ Agree
                </Button>
                <Button
                  variant={counterResponse.claimantPosition === 'DISAGREE' ? 'destructive' : 'outline'}
                  onClick={() => updateCounterResponse(key, { claimantPosition: 'DISAGREE' })}
                  size="sm"
                >
                  ✗ Disagree
                </Button>
                <Button
                  variant={counterResponse.claimantPosition === 'PROVIDE_EVIDENCE' ? 'secondary' : 'outline'}
                  onClick={() => updateCounterResponse(key, { claimantPosition: 'PROVIDE_EVIDENCE' })}
                  size="sm"
                >
                  📄 Provide Evidence
                </Button>
              </div>

              {/* Additional Response Text */}
              <Textarea
                placeholder="Add your response, explanation, or additional evidence..."
                value={counterResponse.claimantResponse}
                onChange={(e) => updateCounterResponse(key, { claimantResponse: e.target.value })}
                className="mt-2"
                rows={3}
              />

              {/* Evidence Upload (if needed) */}
              {counterResponse.claimantPosition === 'PROVIDE_EVIDENCE' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Additional Evidence:
                  </Label>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      updateCounterResponse(key, { claimantEvidence: files });
                    }}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/arbitration/counter-response/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          round: 3,
          counterResponses: Object.values(counterResponses),
          summary: 'Claimant counter-response to respondent review'
        }),
      });

      if (response.ok) {
        toast.success('Counter-response submitted successfully!');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit counter-response');
      }
    } catch (error) {
      console.error('Error submitting counter-response:', error);
      toast.error('An error occurred while submitting the counter-response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Review Respondent Responses';
      case 2: return 'Provide Counter-Responses';
      case 3: return 'Submit Final Response';
      default: return 'Complete';
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">
                Respondent Review Summary
              </h3>
              <p className="text-muted-foreground">
                Review how respondents have responded to your case details
              </p>
            </div>
            
            {respondentResponses.map(response => (
              <Card key={response.id} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Respondent: {response.respondentName}</span>
                    <Badge variant="outline">{response.respondentEmail}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(response.submittedAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Accepted:</span>
                      <span className="ml-2 text-green-600">
                        {response.fieldResponses.filter(f => f.status === 'ACCEPTED').length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Rejected:</span>
                      <span className="ml-2 text-red-600">
                        {response.fieldResponses.filter(f => f.status === 'REJECTED').length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Total Fields:</span>
                      <span className="ml-2">
                        {response.fieldResponses.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">
                Provide Your Counter-Responses
              </h3>
              <p className="text-muted-foreground">
                Respond to each field that was rejected or disputed by respondents
              </p>
            </div>
            
            {respondentResponses.map(response => (
              <div key={response.id} className="space-y-4">
                <h4 className="text-lg font-medium border-b pb-2">
                  Respondent: {response.respondentName}
                </h4>
                {response.fieldResponses.map(field => 
                  renderFieldCounterResponse(response, field)
                )}
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">
                Review and Submit
              </h3>
              <p className="text-muted-foreground">
                Review your counter-responses and submit to move to the next round
              </p>
            </div>
            
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Counter-Response Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Agreed Fields:</span>
                    <span className="ml-2 text-green-600">
                      {Object.values(counterResponses).filter((r: any) => r.claimantPosition === 'AGREE').length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Disagreed Fields:</span>
                    <span className="ml-2 text-red-600">
                      {Object.values(counterResponses).filter((r: any) => r.claimantPosition === 'DISAGREE').length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Evidence Provided:</span>
                    <span className="ml-2 text-blue-600">
                      {Object.values(counterResponses).filter((r: any) => r.claimantPosition === 'PROVIDE_EVIDENCE').length}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Total Fields:</span>
                    <span className="ml-2">
                      {Object.keys(counterResponses).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const totalSteps = 3;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Claimant Counter-Response
          </h1>
          <p className="text-center text-muted-foreground">
            Case: {caseNumber} | Round: 3 - Counter-Response
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-center">
            {getStepTitle(currentStep)}
          </h2>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {getStepContent(currentStep)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next →
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Counter-Response'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
