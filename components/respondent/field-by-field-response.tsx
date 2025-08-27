"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Save, Send, AlertCircle, CheckCircle, XCircle, MessageSquare, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormField {
  id: string;
  stepNumber: number;
  stepTitle: string;
  fieldName: string;
  fieldLabel: string;
  originalValue: any;
  fieldType: 'text' | 'email' | 'phone' | 'address' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'json';
  required?: boolean;
}

interface RespondentResponse {
  fieldId: string;
  action: 'accept' | 'reject' | 'modify';
  respondentValue?: any;
  comment?: string;
  attachments?: File[];
}

interface NewIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  attachments: File[];
  legalBasis?: string;
  requestedRelief?: string;
}

interface FieldByFieldResponseProps {
  caseId: string;
  petitionData: any;
  onSubmit: (responses: RespondentResponse[], newIssues: NewIssue[]) => Promise<void>;
  mode?: 'respond' | 'review';
}

const FIELD_MAPPINGS = {
  // Step 1: Claimant Details
  1: [
    { field: 'claimant.type', label: 'Claimant Type', type: 'select' },
    { field: 'claimant.name', label: 'Name/Company Name', type: 'text' },
    { field: 'claimant.email', label: 'Email Address', type: 'email' },
    { field: 'claimant.phone', label: 'Phone Number', type: 'phone' },
    { field: 'claimant.address', label: 'Address', type: 'address' },
    { field: 'claimant.pincode', label: 'PIN Code', type: 'text' },
    { field: 'claimant.panNumber', label: 'PAN Number', type: 'text' },
    { field: 'claimant.aadharNumber', label: 'Aadhar Number', type: 'text' },
  ],
  // Step 2: Additional Claimants
  2: [
    { field: 'additionalClaimants', label: 'Additional Claimants', type: 'json' },
    { field: 'managerDetails', label: 'Manager Details', type: 'json' },
  ],
  // Step 3: Respondent Details  
  3: [
    { field: 'respondents', label: 'Respondent Information', type: 'json' },
  ],
  // Step 4: Arbitration Agreement
  4: [
    { field: 'arbitrationAgreement.agreementType', label: 'Agreement Type', type: 'select' },
    { field: 'arbitrationAgreement.documentFile', label: 'Agreement Document', type: 'file' },
    { field: 'arbitrationAgreement.clauseText', label: 'Arbitration Clause', type: 'textarea' },
    { field: 'arbitrationAgreement.arbitratorSelection', label: 'Arbitrator Selection', type: 'select' },
  ],
  // Step 5: Nature of Dispute
  5: [
    { field: 'natureOfDispute.category', label: 'Dispute Category', type: 'select' },
    { field: 'natureOfDispute.subCategory', label: 'Sub-Category', type: 'select' },
    { field: 'natureOfDispute.background', label: 'Background', type: 'textarea' },
  ],
  // Step 6: Dispute Description
  6: [
    { field: 'disputeDescriptions', label: 'Dispute Points', type: 'json' },
  ],
  // Step 7: Prayers & Reliefs
  7: [
    { field: 'prayers', label: 'Prayers and Reliefs', type: 'json' },
  ],
  // Step 8: Documents
  8: [
    { field: 'documentsEvidence', label: 'Documents and Evidence', type: 'json' },
  ],
  // Step 9: Payment
  9: [
    { field: 'payment.totalClaimAmount', label: 'Total Claim Amount', type: 'number' },
    { field: 'payment.arbitrationFee', label: 'Arbitration Fee', type: 'number' },
    { field: 'payment.breakdown', label: 'Fee Breakdown', type: 'json' },
  ],
  // Step 10: Arguments
  10: [
    { field: 'arguments', label: 'Legal Arguments', type: 'json' },
  ]
};

export default function FieldByFieldResponse({ caseId, petitionData, onSubmit, mode = 'respond' }: FieldByFieldResponseProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<RespondentResponse[]>([]);
  const [newIssues, setNewIssues] = useState<NewIssue[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [currentNewIssue, setCurrentNewIssue] = useState<Partial<NewIssue>>({
    title: '',
    description: '',
    category: '',
    attachments: [],
    legalBasis: '',
    requestedRelief: ''
  });

  // Generate form fields from petition data
  const generateFormFields = (): FormField[] => {
    const fields: FormField[] = [];
    
    Object.entries(FIELD_MAPPINGS).forEach(([stepNum, stepFields]) => {
      const stepNumber = parseInt(stepNum);
      const stepTitle = getStepTitle(stepNumber);
      
      stepFields.forEach((fieldMapping, index) => {
        const fieldValue = getFieldValue(petitionData, fieldMapping.field);
        
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          fields.push({
            id: `${stepNumber}-${index}`,
            stepNumber,
            stepTitle,
            fieldName: fieldMapping.field,
            fieldLabel: fieldMapping.label,
            originalValue: fieldValue,
            fieldType: fieldMapping.type as any,
            required: false
          });
        }
      });
    });
    
    return fields;
  };

  const [formFields] = useState<FormField[]>(generateFormFields());

  // Helper functions
  const getStepTitle = (stepNumber: number): string => {
    const titles = {
      1: 'Claimant Details',
      2: 'Additional Claimants & Manager',
      3: 'Respondent Details',
      4: 'Arbitration Agreement',
      5: 'Nature of Dispute',
      6: 'Dispute Description', 
      7: 'Prayers & Reliefs',
      8: 'Documents & Evidence',
      9: 'Payment Details',
      10: 'Legal Arguments'
    };
    return titles[stepNumber] || `Step ${stepNumber}`;
  };

  const getFieldValue = (data: any, fieldPath: string): any => {
    const keys = fieldPath.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  const getResponse = (fieldId: string): RespondentResponse | undefined => {
    return responses.find(r => r.fieldId === fieldId);
  };

  const updateResponse = (fieldId: string, updates: Partial<RespondentResponse>) => {
    setResponses(prev => {
      const existing = prev.find(r => r.fieldId === fieldId);
      if (existing) {
        return prev.map(r => r.fieldId === fieldId ? { ...r, ...updates } : r);
      } else {
        return [...prev, { fieldId, action: 'accept', ...updates }];
      }
    });
  };

  const renderFieldValue = (field: FormField) => {
    if (field.fieldType === 'json' && typeof field.originalValue === 'object') {
      return (
        <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(field.originalValue, null, 2)}
          </pre>
        </div>
      );
    }
    
    if (field.fieldType === 'file') {
      return (
        <div className="text-blue-600">
          <FileText className="inline w-4 h-4 mr-1" />
          File uploaded by claimant
        </div>
      );
    }
    
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <span className="text-sm">{String(field.originalValue)}</span>
      </div>
    );
  };

  const renderResponseSection = (field: FormField) => {
    const response = getResponse(field.id);
    const action = response?.action || 'accept';

    return (
      <div className="space-y-4">
        {/* Action Selection */}
        <div className="flex gap-2">
          <Button
            variant={action === 'accept' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateResponse(field.id, { action: 'accept' })}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            variant={action === 'reject' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => updateResponse(field.id, { action: 'reject' })}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button
            variant={action === 'modify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateResponse(field.id, { action: 'modify' })}
            className="flex-1"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Modify
          </Button>
        </div>

        {/* Modified Value Input (if action is modify) */}
        {action === 'modify' && (
          <div className="space-y-2">
            <Label>Your Corrected Value:</Label>
            {field.fieldType === 'textarea' ? (
              <Textarea
                placeholder="Enter your corrected value..."
                value={response?.respondentValue || ''}
                onChange={(e) => updateResponse(field.id, { respondentValue: e.target.value })}
              />
            ) : (
              <Input
                type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
                placeholder="Enter your corrected value..."
                value={response?.respondentValue || ''}
                onChange={(e) => updateResponse(field.id, { respondentValue: e.target.value })}
              />
            )}
          </div>
        )}

        {/* Comment Section */}
        <div className="space-y-2">
          <Label>Your Comment (Optional):</Label>
          <Textarea
            placeholder="Add your comment or explanation..."
            value={response?.comment || ''}
            onChange={(e) => updateResponse(field.id, { comment: e.target.value })}
          />
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <Label>Supporting Documents (Optional):</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Drop files here or click to upload</p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                updateResponse(field.id, { attachments: files });
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderNewIssueForm = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Issue/Counter-Claim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Issue Title *</Label>
            <Input
              placeholder="Brief title of your issue..."
              value={currentNewIssue.title || ''}
              onChange={(e) => setCurrentNewIssue(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={currentNewIssue.category || ''}
              onChange={(e) => setCurrentNewIssue(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Select category...</option>
              <option value="contractual">Contractual Dispute</option>
              <option value="payment">Payment Related</option>
              <option value="service">Service Quality</option>
              <option value="damages">Damages/Compensation</option>
              <option value="breach">Breach of Agreement</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Detailed Description *</Label>
          <Textarea
            rows={4}
            placeholder="Provide detailed description of your issue..."
            value={currentNewIssue.description || ''}
            onChange={(e) => setCurrentNewIssue(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Legal Basis (Optional)</Label>
          <Textarea
            rows={3}
            placeholder="Legal grounds or basis for this issue..."
            value={currentNewIssue.legalBasis || ''}
            onChange={(e) => setCurrentNewIssue(prev => ({ ...prev, legalBasis: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Requested Relief (Optional)</Label>
          <Textarea
            rows={2}
            placeholder="What resolution do you seek for this issue..."
            value={currentNewIssue.requestedRelief || ''}
            onChange={(e) => setCurrentNewIssue(prev => ({ ...prev, requestedRelief: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Supporting Documents</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Upload supporting documents</p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setCurrentNewIssue(prev => ({ ...prev, attachments: files }));
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (currentNewIssue.title && currentNewIssue.description) {
                const newIssue: NewIssue = {
                  id: `issue-${Date.now()}`,
                  title: currentNewIssue.title,
                  description: currentNewIssue.description,
                  category: currentNewIssue.category || 'other',
                  attachments: currentNewIssue.attachments || [],
                  legalBasis: currentNewIssue.legalBasis,
                  requestedRelief: currentNewIssue.requestedRelief
                };
                
                setNewIssues(prev => [...prev, newIssue]);
                setCurrentNewIssue({
                  title: '',
                  description: '',
                  category: '',
                  attachments: [],
                  legalBasis: '',
                  requestedRelief: ''
                });
                setShowNewIssueForm(false);
                toast({
                  title: "Issue Added",
                  description: "Your new issue has been added successfully."
                });
              } else {
                toast({
                  title: "Missing Information",
                  description: "Please provide title and description for the issue.",
                  variant: "destructive"
                });
              }
            }}
          >
            Add Issue
          </Button>
          <Button variant="outline" onClick={() => setShowNewIssueForm(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(responses, newIssues);
      toast({
        title: "Response Submitted",
        description: "Your response has been submitted successfully."
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group fields by step
  const fieldsByStep = formFields.reduce((acc, field) => {
    if (!acc[field.stepNumber]) acc[field.stepNumber] = [];
    acc[field.stepNumber].push(field);
    return acc;
  }, {} as Record<number, FormField[]>);

  const stepNumbers = Object.keys(fieldsByStep).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Respond to Petition</h1>
        <p className="text-gray-600">
          Review each field filled by the claimant and provide your response. 
          You can Accept, Reject, or Modify each piece of information.
        </p>
      </div>

      <Tabs value={activeStep.toString()} onValueChange={(value) => setActiveStep(parseInt(value))}>
        <TabsList className="grid grid-cols-5 gap-1 mb-6 h-auto p-1">
          {stepNumbers.slice(0, 5).map(stepNum => (
            <TabsTrigger
              key={stepNum}
              value={stepNum.toString()}
              className="p-2 text-xs"
            >
              {getStepTitle(stepNum)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {stepNumbers.length > 5 && (
          <TabsList className="grid grid-cols-5 gap-1 mb-6 h-auto p-1">
            {stepNumbers.slice(5).map(stepNum => (
              <TabsTrigger
                key={stepNum}
                value={stepNum.toString()}
                className="p-2 text-xs"
              >
                {getStepTitle(stepNum)}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {stepNumbers.map(stepNum => (
          <TabsContent key={stepNum} value={stepNum.toString()}>
            <div className="space-y-6">
              {fieldsByStep[stepNum]?.map(field => (
                <Card key={field.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{field.fieldLabel}</span>
                      <Badge variant="outline">
                        {getResponse(field.id)?.action || 'No response'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Original Value */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          Claimant's Information:
                        </Label>
                        {renderFieldValue(field)}
                      </div>
                      
                      {/* Response Section */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          Your Response:
                        </Label>
                        {mode === 'respond' ? renderResponseSection(field) : (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm">Response: {getResponse(field.id)?.action || 'No response'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* New Issues Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Counter-Claims/Issues</h2>
          {mode === 'respond' && (
            <Button onClick={() => setShowNewIssueForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Issue
            </Button>
          )}
        </div>

        {newIssues.length > 0 && (
          <div className="space-y-4 mb-6">
            {newIssues.map(issue => (
              <Card key={issue.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{issue.title}</span>
                    <Badge>{issue.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">{issue.description}</p>
                  {issue.legalBasis && (
                    <div className="mt-2">
                      <Label className="text-sm font-medium">Legal Basis:</Label>
                      <p className="text-sm text-gray-600">{issue.legalBasis}</p>
                    </div>
                  )}
                  {issue.requestedRelief && (
                    <div className="mt-2">
                      <Label className="text-sm font-medium">Requested Relief:</Label>
                      <p className="text-sm text-gray-600">{issue.requestedRelief}</p>
                    </div>
                  )}
                  {issue.attachments.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-sm font-medium">Attachments:</Label>
                      <p className="text-sm text-gray-600">{issue.attachments.length} file(s) attached</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showNewIssueForm && renderNewIssueForm()}
      </div>

      {/* Summary and Submit */}
      {mode === 'respond' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Response Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {responses.filter(r => r.action === 'accept').length}
                </div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {responses.filter(r => r.action === 'reject').length}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {responses.filter(r => r.action === 'modify').length}
                </div>
                <div className="text-sm text-gray-600">Modified</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-medium mb-2">
                New Issues Added: {newIssues.length}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  // Save as draft functionality
                  toast({
                    title: "Response Saved",
                    description: "Your response has been saved as draft."
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
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
