"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  User, 
  Scale, 
  Download,
  Print,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  id: string;
  label: string;
  petitionerValue: any;
  respondentResponse?: {
    action: 'accept' | 'reject' | 'modify';
    value?: any;
    comment?: string;
  };
  petitionerCounterResponse?: {
    position: 'accept_respondent' | 'maintain_original' | 'propose_alternative';
    value?: any;
    comment?: string;
  };
}

interface FormStep {
  stepNumber: number;
  stepTitle: string;
  fields: FormField[];
  isExpanded?: boolean;
}

interface TabularSummaryProps {
  caseId: string;
  caseNumber: string;
  petitionerName: string;
  respondentName: string;
  formSteps: FormStep[];
  respondentIssues?: any[];
  caseStatus: string;
}

const STEP_TITLES = {
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

export default function TabularSummary({
  caseId,
  caseNumber,
  petitionerName,
  respondentName,
  formSteps,
  respondentIssues = [],
  caseStatus
}: TabularSummaryProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1, 2]));
  const [activeView, setActiveView] = useState<'table' | 'detailed'>('table');

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAllSteps = () => {
    setExpandedSteps(new Set(formSteps.map(step => step.stepNumber)));
  };

  const collapseAllSteps = () => {
    setExpandedSteps(new Set());
  };

  const getResponseStatusColor = (field: FormField) => {
    if (!field.respondentResponse) return 'bg-gray-100';
    
    switch (field.respondentResponse.action) {
      case 'accept': return 'bg-green-50 border-green-200';
      case 'reject': return 'bg-red-50 border-red-200';
      case 'modify': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-100';
    }
  };

  const getCounterResponseIcon = (field: FormField) => {
    if (!field.petitionerCounterResponse) return null;
    
    switch (field.petitionerCounterResponse.position) {
      case 'accept_respondent': return '✓';
      case 'maintain_original': return '↻';
      case 'propose_alternative': return '⚡';
      default: return null;
    }
  };

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }
    
    if (typeof value === 'object') {
      return (
        <div className="text-xs">
          <details className="cursor-pointer">
            <summary className="text-blue-600 hover:text-blue-800">View Details</summary>
            <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    
    const stringValue = String(value);
    if (stringValue.length > 100) {
      return (
        <div className="text-xs">
          <span>{stringValue.substring(0, 100)}...</span>
          <details className="cursor-pointer inline-block ml-2">
            <summary className="text-blue-600 hover:text-blue-800">Show Full</summary>
            <div className="mt-1 bg-gray-50 p-2 rounded">
              {stringValue}
            </div>
          </details>
        </div>
      );
    }
    
    return <span className="text-sm">{stringValue}</span>;
  };

  const renderTableView = () => (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 font-medium text-sm rounded-t-lg">
        <div className="col-span-3">Field</div>
        <div className="col-span-3 text-center">
          {petitionerName}
          <br />
          <span className="text-xs text-gray-600">(Original)</span>
        </div>
        <div className="col-span-3 text-center">
          {respondentName}
          <br />
          <span className="text-xs text-gray-600">(Response)</span>
        </div>
        <div className="col-span-3 text-center">
          {petitionerName}
          <br />
          <span className="text-xs text-gray-600">(Counter-Response)</span>
        </div>
      </div>

      {/* Steps */}
      {formSteps.map((step) => (
        <div key={step.stepNumber} className="border rounded-lg">
          {/* Step Header */}
          <div 
            className="flex items-center justify-between p-3 bg-blue-50 border-b cursor-pointer hover:bg-blue-100"
            onClick={() => toggleStepExpansion(step.stepNumber)}
          >
            <div className="flex items-center gap-2">
              {expandedSteps.has(step.stepNumber) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-medium">
                {step.stepNumber}. {step.stepTitle}
              </span>
              <Badge variant="outline" className="text-xs">
                {step.fields.length} fields
              </Badge>
            </div>
            
            <div className="flex gap-1">
              {step.fields.some(f => f.respondentResponse?.action === 'accept') && (
                <Badge className="text-xs bg-green-100 text-green-800">Accept</Badge>
              )}
              {step.fields.some(f => f.respondentResponse?.action === 'reject') && (
                <Badge className="text-xs bg-red-100 text-red-800">Reject</Badge>
              )}
              {step.fields.some(f => f.respondentResponse?.action === 'modify') && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800">Modify</Badge>
              )}
            </div>
          </div>

          {/* Step Fields */}
          {expandedSteps.has(step.stepNumber) && (
            <div className="divide-y">
              {step.fields.map((field, fieldIndex) => (
                <div 
                  key={field.id} 
                  className={cn(
                    "grid grid-cols-12 gap-2 p-3 hover:bg-gray-50",
                    getResponseStatusColor(field)
                  )}
                >
                  {/* Field Label */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm">
                      {step.stepNumber}{String.fromCharCode(97 + fieldIndex)}. {field.label}
                    </div>
                  </div>

                  {/* Petitioner Original Value */}
                  <div className="col-span-3 px-2 border-r">
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      {renderFieldValue(field.petitionerValue)}
                    </div>
                  </div>

                  {/* Respondent Response */}
                  <div className="col-span-3 px-2 border-r">
                    {field.respondentResponse ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={cn(
                              "text-xs",
                              field.respondentResponse.action === 'accept' && "bg-green-100 text-green-800",
                              field.respondentResponse.action === 'reject' && "bg-red-100 text-red-800",
                              field.respondentResponse.action === 'modify' && "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {field.respondentResponse.action}
                          </Badge>
                        </div>
                        
                        {field.respondentResponse.action === 'modify' && field.respondentResponse.value && (
                          <div className="bg-yellow-50 p-2 rounded text-xs">
                            <strong>New Value:</strong><br />
                            {renderFieldValue(field.respondentResponse.value)}
                          </div>
                        )}
                        
                        {field.respondentResponse.comment && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <strong>Comment:</strong><br />
                            {field.respondentResponse.comment}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-xs">No response</div>
                    )}
                  </div>

                  {/* Petitioner Counter-Response */}
                  <div className="col-span-3 px-2">
                    {field.petitionerCounterResponse ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCounterResponseIcon(field)}</span>
                          <Badge variant="outline" className="text-xs">
                            {field.petitionerCounterResponse.position.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {field.petitionerCounterResponse.position === 'propose_alternative' && 
                         field.petitionerCounterResponse.value && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <strong>Alternative:</strong><br />
                            {renderFieldValue(field.petitionerCounterResponse.value)}
                          </div>
                        )}
                        
                        {field.petitionerCounterResponse.comment && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <strong>Comment:</strong><br />
                            {field.petitionerCounterResponse.comment}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic text-xs">No counter-response</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderDetailedView = () => (
    <div className="space-y-6">
      {formSteps.map((step) => (
        <Card key={step.stepNumber}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{step.stepNumber}. {step.stepTitle}</span>
              <Badge variant="outline">{step.fields.length} fields</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {step.fields.map((field, fieldIndex) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    {step.stepNumber}{String.fromCharCode(97 + fieldIndex)}. {field.label}
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Original */}
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-2">Original (Petitioner)</div>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        {renderFieldValue(field.petitionerValue)}
                      </div>
                    </div>

                    {/* Respondent Response */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Respondent Response</div>
                      <div className={cn("p-3 rounded border", getResponseStatusColor(field))}>
                        {field.respondentResponse ? (
                          <div className="space-y-2">
                            <Badge className={cn(
                              "text-xs",
                              field.respondentResponse.action === 'accept' && "bg-green-100 text-green-800",
                              field.respondentResponse.action === 'reject' && "bg-red-100 text-red-800",
                              field.respondentResponse.action === 'modify' && "bg-yellow-100 text-yellow-800"
                            )}>
                              {field.respondentResponse.action}
                            </Badge>
                            
                            {field.respondentResponse.action === 'modify' && (
                              <div>
                                <div className="text-xs font-medium">Modified Value:</div>
                                {renderFieldValue(field.respondentResponse.value)}
                              </div>
                            )}
                            
                            {field.respondentResponse.comment && (
                              <div>
                                <div className="text-xs font-medium">Comment:</div>
                                <div className="text-xs text-gray-600">{field.respondentResponse.comment}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-sm">No response provided</div>
                        )}
                      </div>
                    </div>

                    {/* Counter Response */}
                    <div>
                      <div className="text-sm font-medium text-purple-700 mb-2">Petitioner Counter-Response</div>
                      <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        {field.petitionerCounterResponse ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCounterResponseIcon(field)}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.petitionerCounterResponse.position.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {field.petitionerCounterResponse.position === 'propose_alternative' && (
                              <div>
                                <div className="text-xs font-medium">Alternative Value:</div>
                                {renderFieldValue(field.petitionerCounterResponse.value)}
                              </div>
                            )}
                            
                            {field.petitionerCounterResponse.comment && (
                              <div>
                                <div className="text-xs font-medium">Comment:</div>
                                <div className="text-xs text-gray-600">{field.petitionerCounterResponse.comment}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-sm">No counter-response</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRespondentIssues = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Respondent's New Issues/Counter-Claims</h2>
        <Badge variant="outline">{respondentIssues.length} issues</Badge>
      </div>
      
      {respondentIssues.length > 0 ? (
        <div className="space-y-4">
          {respondentIssues.map((issue, index) => (
            <Card key={issue.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Issue {index + 1}: {issue.title}</span>
                  <Badge>{issue.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Respondent's Position</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{issue.description}</p>
                      {issue.legalBasis && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Legal Basis:</div>
                          <div className="text-xs text-gray-600">{issue.legalBasis}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Petitioner's Response</h4>
                    <div className="bg-blue-50 p-3 rounded">
                      {issue.petitionerResponse ? (
                        <div className="space-y-2">
                          <Badge className="text-xs">
                            {issue.petitionerResponse.position}
                          </Badge>
                          <p className="text-sm">{issue.petitionerResponse.response}</p>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-sm">No response provided</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 italic">
              No new issues or counter-claims were raised by the respondent.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Case Summary</h1>
            <p className="text-gray-600">
              Complete tabular view of all submissions and responses for Case #{caseNumber}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Print className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Case Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Case Number</div>
              <div className="font-medium">{caseNumber}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Petitioner</div>
              <div className="font-medium">{petitionerName}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Respondent</div>
              <div className="font-medium">{respondentName}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Status</div>
              <Badge className="font-medium">{caseStatus}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAllSteps}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAllSteps}>
              Collapse All
            </Button>
          </div>
          
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <Tabs value="form-fields" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form-fields">Form Fields Comparison</TabsTrigger>
          <TabsTrigger value="respondent-issues">Respondent Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="form-fields" className="mt-6">
          {activeView === 'table' ? renderTableView() : renderDetailedView()}
        </TabsContent>

        <TabsContent value="respondent-issues" className="mt-6">
          {renderRespondentIssues()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
