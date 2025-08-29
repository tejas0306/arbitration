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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CORRECTED';
  respondentComment?: string;
  correctedValue?: string;
  evidence?: any;
}

interface CaseData {
  id: string;
  caseNumber: string;
  status: string;
  claimant: any;
  additionalClaimants: any[];
  managerDetails: any;
  respondents: any[];
  arbitrationAgreement: any;
  natureOfDispute: any;
  disputeDescriptions: any[];
  documents: any;
  prayers: any;
  arguments: any;
  payment: any;
}

interface RespondentFormEnhancedProps {
  caseData: CaseData;
  caseId: string;
}

export default function RespondentFormEnhanced({ caseData, caseId }: RespondentFormEnhancedProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldResponses, setFieldResponses] = useState<FieldResponse[]>([]);
  const [round, setRound] = useState(1);

  // Initialize field responses from case data
  useEffect(() => {
    if (caseData) {
      const initialResponses: FieldResponse[] = [];
      
      // Step 1: Claimant Details
      if (caseData.claimant) {
        initialResponses.push({
          fieldId: '1.1',
          fieldName: 'Type',
          fieldValue: caseData.claimant.type || 'Not provided',
          fieldType: 'select',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.2',
          fieldName: 'Name',
          fieldValue: caseData.claimant.name || 'Not provided',
          fieldType: 'text',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.3',
          fieldName: 'Email',
          fieldValue: caseData.claimant.email || 'Not provided',
          fieldType: 'email',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.4',
          fieldName: 'Phone',
          fieldValue: caseData.claimant.phone || 'Not provided',
          fieldType: 'phone',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.5',
          fieldName: 'Address',
          fieldValue: `${caseData.claimant.address1 || ''} ${caseData.claimant.address2 || ''} ${caseData.claimant.city || ''} ${caseData.claimant.state || ''} ${caseData.claimant.pincode || ''}`.trim() || 'Not provided',
          fieldType: 'address',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.6',
          fieldName: 'GST Number',
          fieldValue: caseData.claimant.gst || 'Not provided',
          fieldType: 'text',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.7',
          fieldName: 'PAN Number',
          fieldValue: caseData.claimant.pan || 'Not provided',
          fieldType: 'text',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '1.8',
          fieldName: 'CIN Number',
          fieldValue: caseData.claimant.cin || 'Not provided',
          fieldType: 'text',
          status: 'PENDING'
        });
      }

      // Step 3: Additional Claimants
      if (caseData.additionalClaimants && caseData.additionalClaimants.length > 0) {
        caseData.additionalClaimants.forEach((claimant, index) => {
          initialResponses.push({
            fieldId: `3.${index + 1}`,
            fieldName: `Additional Claimant ${index + 1}`,
            fieldValue: `${claimant.name || 'Not provided'} - ${claimant.email || 'Not provided'}`,
            fieldType: 'claimant',
            status: 'PENDING'
          });
        });
      }

      // Step 4: Manager Details
      if (caseData.managerDetails) {
        initialResponses.push({
          fieldId: '4.1',
          fieldName: 'Manager Name',
          fieldValue: caseData.managerDetails.name || 'Not provided',
          fieldType: 'text',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '4.2',
          fieldName: 'Manager Email',
          fieldValue: caseData.managerDetails.email || 'Not provided',
          fieldType: 'email',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '4.3',
          fieldName: 'Manager Phone',
          fieldValue: caseData.managerDetails.phone || 'Not provided',
          fieldType: 'phone',
          status: 'PENDING'
        });
      }

      // Step 5: Respondents
      if (caseData.respondents && caseData.respondents.length > 0) {
        caseData.respondents.forEach((respondent, index) => {
          initialResponses.push({
            fieldId: `5.${index + 1}`,
            fieldName: `Respondent ${index + 1}`,
            fieldValue: `${respondent.name || 'Not provided'} - ${respondent.email || 'Not provided'}`,
            fieldType: 'respondent',
            status: 'PENDING'
          });
        });
      }

      // Step 6: Nature of Dispute
      if (caseData.natureOfDispute) {
        initialResponses.push({
          fieldId: '6.1',
          fieldName: 'Dispute Category',
          fieldValue: caseData.natureOfDispute.category || 'Not provided',
          fieldType: 'select',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '6.2',
          fieldName: 'Dispute Sub-Category',
          fieldValue: caseData.natureOfDispute.subCategory || 'Not provided',
          fieldType: 'select',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '6.3',
          fieldName: 'Dispute Description',
          fieldValue: caseData.natureOfDispute.description || 'Not provided',
          fieldType: 'textarea',
          status: 'PENDING'
        });
      }

      // Step 7: Dispute Descriptions
      if (caseData.disputeDescriptions && caseData.disputeDescriptions.length > 0) {
        caseData.disputeDescriptions.forEach((dispute, index) => {
          initialResponses.push({
            fieldId: `7.${index + 1}`,
            fieldName: `Dispute Point ${index + 1}`,
            fieldValue: dispute.description || 'Not provided',
            fieldType: 'textarea',
            status: 'PENDING'
          });
        });
      }

      // Step 8: Prayers & Reliefs
      if (caseData.prayers) {
        initialResponses.push({
          fieldId: '8.1',
          fieldName: 'Prayers & Reliefs',
          fieldValue: caseData.prayers.description || 'Not provided',
          fieldType: 'textarea',
          status: 'PENDING'
        });
      }

      // Step 9: Evidence & Documents
      if (caseData.documents) {
        initialResponses.push({
          fieldId: '9.1',
          fieldName: 'Evidence & Documents',
          fieldValue: Array.isArray(caseData.documents) ? caseData.documents.join(', ') : 'Not provided',
          fieldType: 'documents',
          status: 'PENDING'
        });
      }

      // Step 10: Payment Details
      if (caseData.payment) {
        initialResponses.push({
          fieldId: '10.1',
          fieldName: 'Payment Amount',
          fieldValue: caseData.payment.amount || 'Not provided',
          fieldType: 'currency',
          status: 'PENDING'
        });
        initialResponses.push({
          fieldId: '10.2',
          fieldName: 'Payment Currency',
          fieldValue: caseData.payment.currency || 'Not provided',
          fieldType: 'select',
          status: 'PENDING'
        });
      }

      // Step 11: Legal Arguments
      if (caseData.arguments) {
        initialResponses.push({
          fieldId: '11.1',
          fieldName: 'Legal Arguments',
          fieldValue: caseData.arguments.description || 'Not provided',
          fieldType: 'textarea',
          status: 'PENDING'
        });
      }

      setFieldResponses(initialResponses);
    }
  }, [caseData]);

  const updateFieldResponse = (fieldId: string, updates: Partial<FieldResponse>) => {
    setFieldResponses(prev => 
      prev.map(field => 
        field.fieldId === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const handleFieldAction = (fieldId: string, action: 'ACCEPT' | 'REJECT') => {
    updateFieldResponse(fieldId, { 
      status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      correctedValue: action === 'REJECT' ? '' : undefined
    });
  };

  const renderFieldResponse = (field: FieldResponse) => {
    return (
      <Card key={field.fieldId} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {field.fieldId}
              </Badge>
              <CardTitle className="text-lg">{field.fieldName}</CardTitle>
            </div>
            <Badge 
              variant={
                field.status === 'ACCEPTED' ? 'default' : 
                field.status === 'REJECTED' ? 'destructive' : 
                'secondary'
              }
            >
              {field.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Value */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Original Value:
            </Label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              {field.fieldValue}
            </div>
          </div>

          {/* Accept/Reject Buttons */}
          <div className="flex gap-2">
            <Button
              variant={field.status === 'ACCEPTED' ? 'default' : 'outline'}
              onClick={() => handleFieldAction(field.fieldId, 'ACCEPT')}
              disabled={field.status === 'ACCEPTED'}
            >
              ✓ Accept
            </Button>
            <Button
              variant={field.status === 'REJECTED' ? 'destructive' : 'outline'}
              onClick={() => handleFieldAction(field.fieldId, 'REJECT')}
              disabled={field.status === 'REJECTED'}
            >
              ✗ Reject
            </Button>
          </div>

          {/* Respondent Comment */}
          <div>
            <Label htmlFor={`comment-${field.fieldId}`}>
              Your Comment (Optional):
            </Label>
            <Textarea
              id={`comment-${field.fieldId}`}
              placeholder="Add your comment about this field..."
              value={field.respondentComment || ''}
              onChange={(e) => updateFieldResponse(field.fieldId, { respondentComment: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Corrected Value (if rejected) */}
          {field.status === 'REJECTED' && (
            <div>
              <Label htmlFor={`corrected-${field.fieldId}`}>
                Corrected Value:
              </Label>
              <Input
                id={`corrected-${field.fieldId}`}
                placeholder="Provide the correct value..."
                value={field.correctedValue || ''}
                onChange={(e) => updateFieldResponse(field.fieldId, { correctedValue: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/respondent/cases/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          round: round,
          fieldResponses: fieldResponses,
          responseOverview: 'Respondent review completed with field-level responses',
          legalArguments: 'Legal arguments based on field review',
          additionalNotes: 'Additional notes from respondent review'
        }),
      });

      if (response.ok) {
        toast.success('Response submitted successfully!');
        router.push('/respondent/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('An error occurred while submitting the response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Claimant Details Review';
      case 2: return 'Additional Claimants Review';
      case 3: return 'Manager Details Review';
      case 4: return 'Respondents Review';
      case 5: return 'Dispute Details Review';
      case 6: return 'Evidence & Documents Review';
      case 7: return 'Payment & Arguments Review';
      default: return 'Review Complete';
    }
  };

  const getStepFields = (step: number) => {
    switch (step) {
      case 1: return fieldResponses.filter(f => f.fieldId.startsWith('1.'));
      case 2: return fieldResponses.filter(f => f.fieldId.startsWith('3.'));
      case 3: return fieldResponses.filter(f => f.fieldId.startsWith('4.'));
      case 4: return fieldResponses.filter(f => f.fieldId.startsWith('5.'));
      case 5: return fieldResponses.filter(f => f.fieldId.startsWith('6.') || f.fieldId.startsWith('7.'));
      case 6: return fieldResponses.filter(f => f.fieldId.startsWith('9.'));
      case 7: return fieldResponses.filter(f => f.fieldId.startsWith('8.') || f.fieldId.startsWith('10.') || f.fieldId.startsWith('11.'));
      default: return [];
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentFields = getStepFields(currentStep);
  const totalSteps = 7;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Respondent Review Form
          </h1>
          <p className="text-center text-muted-foreground">
            Case: {caseData?.caseNumber || 'N/A'} | Round: {round}
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

        {/* Fields for Current Step */}
        <div className="space-y-6">
          {currentFields.map(renderFieldResponse)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
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
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          )}
        </div>

        {/* Summary */}
        {currentStep === totalSteps && (
          <Card className="mt-8 bg-muted/50">
            <CardHeader>
              <CardTitle>Review Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Accepted Fields:</span>
                  <span className="ml-2 text-green-600">
                    {fieldResponses.filter(f => f.status === 'ACCEPTED').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Rejected Fields:</span>
                  <span className="ml-2 text-red-600">
                    {fieldResponses.filter(f => f.status === 'REJECTED').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Pending Fields:</span>
                  <span className="ml-2 text-yellow-600">
                    {fieldResponses.filter(f => f.status === 'PENDING').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Total Fields:</span>
                  <span className="ml-2">
                    {fieldResponses.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
