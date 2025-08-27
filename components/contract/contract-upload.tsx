"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  RefreshCw,
  Lightbulb,
  Scale,
  Users,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContractUploadProps {
  onExtractionComplete: (data: any) => void;
  onSuggestionsGenerated: (suggestions: any) => void;
  disabled?: boolean;
}

interface ExtractionResult {
  success: boolean;
  extractedData: any;
  confidence: number;
  processingTime: number;
  suggestions: any;
  fieldsToReview: string[];
  advice: string[];
  legalIssues: string[];
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
  recommendedActions: string[];
}

export default function ContractUpload({ 
  onExtractionComplete, 
  onSuggestionsGenerated, 
  disabled = false 
}: ContractUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Unsupported File Type",
          description: "Please upload PDF, DOC, DOCX, TXT, or image files only.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setExtractionResult(null);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      // Create a synthetic input event
      const input = document.createElement('input');
      input.type = 'file';
      const fileList = new DataTransfer();
      fileList.items.add(droppedFile);
      input.files = fileList.files;
      
      handleFileSelect({ target: input } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const extractContractData = async () => {
    if (!file) return;

    setUploading(true);
    setActiveTab('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify({
        focusAreas: ['parties', 'financial', 'disputes', 'terms'],
        language: 'en',
        includeConfidence: true,
        generateSummary: true
      }));

      const response = await fetch('/api/contract/extract', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Extraction failed');
      }

      const result = await response.json();
      setExtractionResult(result);
      setActiveTab('results');

      // Notify parent components
      onExtractionComplete(result.extractedData);
      onSuggestionsGenerated(result.suggestions);

      toast({
        title: "Contract Analysis Complete",
        description: `Successfully extracted data with ${result.confidence}% confidence.`
      });

    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract contract data",
        variant: "destructive"
      });
      setActiveTab('upload');
    } finally {
      setUploading(false);
    }
  };

  const applySuggestions = () => {
    if (extractionResult?.suggestions) {
      onSuggestionsGenerated(extractionResult.suggestions);
      toast({
        title: "Suggestions Applied",
        description: "Contract data has been pre-filled in the form. Please review and modify as needed."
      });
    }
  };

  const renderUploadArea = () => (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Upload Contract Document
        </h3>
        <p className="text-gray-600 mb-4">
          Upload your contract or agreement for automatic data extraction
        </p>
        
        <input
          type="file"
          id="contract-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        
        <Button
          onClick={() => document.getElementById('contract-upload')?.click()}
          disabled={disabled}
          className="mb-4"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
        
        <p className="text-xs text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT, Images (Max 10MB)
        </p>
      </div>

      {file && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
                <Button
                  onClick={extractContractData}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Extract Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Contract Analysis:</strong> Our AI will extract party information, 
          financial terms, arbitration clauses, and key contract details to pre-fill your petition.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
      <h3 className="text-xl font-medium mb-2">Analyzing Contract</h3>
      <p className="text-gray-600 mb-4">
        Please wait while we extract and analyze your contract data...
      </p>
      <div className="max-w-md mx-auto space-y-2 text-sm text-gray-500">
        <div>✓ Reading document content</div>
        <div>✓ Identifying parties and terms</div>
        <div>✓ Analyzing dispute resolution clauses</div>
        <div>✓ Generating form suggestions</div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!extractionResult) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extraction Summary</span>
              <Badge className={
                extractionResult.confidence > 80 ? "bg-green-100 text-green-800" :
                extractionResult.confidence > 60 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }>
                {extractionResult.confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <div className="text-sm font-medium">Parties</div>
                <div className="text-xs text-gray-600">
                  {extractionResult.extractedData?.parties ? 'Identified' : 'Not found'}
                </div>
              </div>
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <div className="text-sm font-medium">Financial Terms</div>
                <div className="text-xs text-gray-600">
                  {extractionResult.extractedData?.financial ? 'Found' : 'Not specified'}
                </div>
              </div>
              <div className="text-center">
                <Scale className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <div className="text-sm font-medium">Arbitration Clause</div>
                <div className="text-xs text-gray-600">
                  {extractionResult.extractedData?.disputeResolution?.hasArbitrationClause ? 'Present' : 'Not found'}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={applySuggestions}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Suggestions to Form
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('upload')}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Upload Different File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <Tabs defaultValue="parties" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="dispute">Dispute Resolution</TabsTrigger>
            <TabsTrigger value="advice">Legal Advice</TabsTrigger>
          </TabsList>

          <TabsContent value="parties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Party Information</CardTitle>
              </CardHeader>
              <CardContent>
                {extractionResult.extractedData?.parties ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractionResult.extractedData.parties.party1 && (
                      <div>
                        <h4 className="font-medium mb-2">Party 1</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div><strong>Name:</strong> {extractionResult.extractedData.parties.party1.name}</div>
                          <div><strong>Type:</strong> {extractionResult.extractedData.parties.party1.type}</div>
                          {extractionResult.extractedData.parties.party1.email && (
                            <div><strong>Email:</strong> {extractionResult.extractedData.parties.party1.email}</div>
                          )}
                          {extractionResult.extractedData.parties.party1.address && (
                            <div><strong>Address:</strong> {extractionResult.extractedData.parties.party1.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {extractionResult.extractedData.parties.party2 && (
                      <div>
                        <h4 className="font-medium mb-2">Party 2</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div><strong>Name:</strong> {extractionResult.extractedData.parties.party2.name}</div>
                          <div><strong>Type:</strong> {extractionResult.extractedData.parties.party2.type}</div>
                          {extractionResult.extractedData.parties.party2.email && (
                            <div><strong>Email:</strong> {extractionResult.extractedData.parties.party2.email}</div>
                          )}
                          {extractionResult.extractedData.parties.party2.address && (
                            <div><strong>Address:</strong> {extractionResult.extractedData.parties.party2.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">No party information found in the contract</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Terms</CardTitle>
              </CardHeader>
              <CardContent>
                {extractionResult.extractedData?.financial ? (
                  <div className="space-y-3">
                    {extractionResult.extractedData.financial.totalValue && (
                      <div>
                        <strong>Total Value:</strong> {extractionResult.extractedData.financial.totalValue}
                      </div>
                    )}
                    {extractionResult.extractedData.financial.paymentTerms && (
                      <div>
                        <strong>Payment Terms:</strong> {extractionResult.extractedData.financial.paymentTerms}
                      </div>
                    )}
                    {extractionResult.extractedData.financial.advanceAmount && (
                      <div>
                        <strong>Advance Amount:</strong> {extractionResult.extractedData.financial.advanceAmount}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">No financial terms found in the contract</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispute" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                {extractionResult.extractedData?.disputeResolution ? (
                  <div className="space-y-3">
                    <div>
                      <strong>Has Arbitration Clause:</strong>{' '}
                      <Badge className={
                        extractionResult.extractedData.disputeResolution.hasArbitrationClause 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }>
                        {extractionResult.extractedData.disputeResolution.hasArbitrationClause ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    
                    {extractionResult.extractedData.disputeResolution.arbitrationClause && (
                      <div>
                        <strong>Arbitration Clause:</strong>
                        <div className="bg-gray-50 p-3 rounded mt-1 text-sm">
                          {extractionResult.extractedData.disputeResolution.arbitrationClause}
                        </div>
                      </div>
                    )}
                    
                    {extractionResult.extractedData.disputeResolution.arbitrationSeat && (
                      <div>
                        <strong>Arbitration Seat:</strong> {extractionResult.extractedData.disputeResolution.arbitrationSeat}
                      </div>
                    )}
                    
                    {extractionResult.extractedData.disputeResolution.governingLaw && (
                      <div>
                        <strong>Governing Law:</strong> {extractionResult.extractedData.disputeResolution.governingLaw}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">No dispute resolution clauses found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Legal Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Advice */}
                {extractionResult.advice?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-blue-700">Primary Advice</h4>
                    <ul className="space-y-1">
                      {extractionResult.advice.map((advice, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {advice}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractionResult.strengthsWeaknesses?.strengths?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
                      <ul className="space-y-1">
                        {extractionResult.strengthsWeaknesses.strengths.map((strength, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractionResult.strengthsWeaknesses?.weaknesses?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-700">Areas of Concern</h4>
                      <ul className="space-y-1">
                        {extractionResult.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommended Actions */}
                {extractionResult.recommendedActions?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-purple-700">Recommended Actions</h4>
                    <ul className="space-y-1">
                      {extractionResult.recommendedActions.map((action, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Smart Contract Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="processing" disabled={!uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing
                </>
              ) : (
                'Processing'
              )}
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!extractionResult}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            {renderUploadArea()}
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            {renderProcessing()}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {renderResults()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
