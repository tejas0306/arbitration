'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label as UILabel } from '@/components/ui/label';

interface AIJudgment {
  id: string;
  issueId: string;
  issueDescription: string;
  claimantPosition: string;
  respondentPosition: string;
  aiAnalysis: string;
  aiRecommendation: string;
  confidence: number;
}

interface FieldResponse {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldValue: string;
  status: 'ACCEPTED' | 'REJECTED' | 'CORRECTED';
  respondentComment?: string;
  correctedValue?: string;
}

interface FinalOrderData {
  caseId: string;
  caseNumber: string;
  fieldResponses: FieldResponse[];
  aiJudgments: AIJudgment[];
  orderContent: string;
  generatedAt: string;
}

interface FinalOrderGeneratorProps {
  caseId: string;
  caseNumber: string;
}

export default function FinalOrderGenerator({ caseId, caseNumber }: FinalOrderGeneratorProps) {
  const [orderData, setOrderData] = useState<FinalOrderData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrderData();
  }, [caseId]);

  const loadOrderData = async () => {
    try {
      const response = await fetch(`/api/admin/cases/${caseId}/final-order`);
      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
      } else {
        toast.error('Failed to load order data');
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      toast.error('An error occurred while loading order data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFinalOrder = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/admin/cases/${caseId}/generate-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
        toast.success('Final order generated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate final order');
      }
    } catch (error) {
      console.error('Error generating final order:', error);
      toast.error('An error occurred while generating the final order');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadOrder = () => {
    if (!orderData?.orderContent) return;

    const blob = new Blob([orderData.orderContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitration-order-${caseNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const publishOrder = async () => {
    try {
      const response = await fetch(`/api/admin/cases/${caseId}/publish-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('Order published successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to publish order');
      }
    } catch (error) {
      console.error('Error publishing order:', error);
      toast.error('An error occurred while publishing the order');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Final Arbitration Order Generator
          </h1>
          <p className="text-xl text-muted-foreground">
            Case: {caseNumber} | Generate AI-Powered Final Order
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex justify-center gap-4">
          {!orderData ? (
            <Button
              onClick={generateFinalOrder}
              disabled={isGenerating}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating...' : 'Generate Final Order'}
            </Button>
          ) : (
            <>
              <Button
                onClick={downloadOrder}
                variant="outline"
                size="lg"
              >
                📥 Download Order
              </Button>
              <Button
                onClick={publishOrder}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                🌐 Publish Order
              </Button>
            </>
          )}
        </div>

        {orderData && (
          <div className="space-y-8">
            {/* Field Responses Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Field Responses Summary
                  <Badge variant="outline">
                    {orderData.fieldResponses.length} Fields
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {orderData.fieldResponses.filter(f => f.status === 'ACCEPTED').length}
                    </div>
                    <div className="text-sm text-green-700">Accepted Fields</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">
                      {orderData.fieldResponses.filter(f => f.status === 'REJECTED').length}
                    </div>
                    <div className="text-sm text-red-700">Rejected Fields</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {orderData.fieldResponses.filter(f => f.status === 'CORRECTED').length}
                    </div>
                    <div className="text-sm text-blue-700">Corrected Fields</div>
                  </div>
                </div>

                {/* Field Details */}
                <div className="mt-6 space-y-3">
                  {orderData.fieldResponses.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {field.fieldId}
                        </Badge>
                        <span className="font-medium">{field.fieldName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Original: {field.fieldValue}
                        </span>
                        <Badge 
                          variant={
                            field.status === 'ACCEPTED' ? 'default' : 
                            field.status === 'REJECTED' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {field.status}
                        </Badge>
                        {field.correctedValue && (
                          <span className="text-sm text-blue-600">
                            → {field.correctedValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Judgments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 AI Analysis & Judgments
                  <Badge variant="outline">
                    {orderData.aiJudgments.length} Issues Analyzed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.aiJudgments.map((judgment) => (
                    <div key={judgment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {judgment.issueId}
                          </Badge>
                          <h4 className="font-semibold">{judgment.issueDescription}</h4>
                        </div>
                        <Badge 
                          variant={
                            judgment.confidence >= 0.7 ? 'default' : 
                            judgment.confidence >= 0.5 ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {(judgment.confidence * 100).toFixed(1)}% Confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Claimant Position:
                          </Label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            {judgment.claimantPosition}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Respondent Position:
                          </Label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            {judgment.respondentPosition}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            AI Analysis:
                          </Label>
                          <div className="mt-1 p-3 bg-blue-50 rounded border border-blue-200">
                            {judgment.aiAnalysis}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            AI Recommendation:
                          </Label>
                          <div className="mt-1 p-3 bg-green-50 rounded border border-green-200">
                            {judgment.aiRecommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Final Order */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📜 Final Arbitration Order
                  <Badge variant="outline">
                    Generated: {new Date(orderData.generatedAt).toLocaleDateString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {orderData.orderContent}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={downloadOrder}
                    variant="outline"
                    size="lg"
                  >
                    📥 Download as Text File
                  </Button>
                  <Button
                    onClick={downloadOrder}
                    variant="outline"
                    size="lg"
                  >
                    📄 Download as PDF
                  </Button>
                  <Button
                    onClick={publishOrder}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    🌐 Publish to Public Portal
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    size="lg"
                  >
                    🖨️ Print Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!orderData && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">
                Ready to Generate Final Order
              </h3>
              <p className="text-muted-foreground mb-6">
                Click the button above to generate an AI-powered final arbitration order based on all field responses and AI analysis.
              </p>
              <Button
                onClick={generateFinalOrder}
                disabled={isGenerating}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? 'Generating...' : 'Generate Final Order'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper component for labels
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <UILabel className={`block text-sm font-medium ${className}`}>{children}</UILabel>;
}
