"use client"

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { contractExtractionService } from '@/lib/services/contract-extraction.service';

interface AIContractUploadProps {
  onDataExtracted: (data: any) => void;
  onError?: (error: string) => void;
}

export default function AIContractUpload({ onDataExtracted, onError }: AIContractUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'completed' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/json'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please upload a PDF, JPEG, PNG, or JSON file');
        return;
      }

      // Validate file size (max 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('File size must be less than 100MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setStatus('idle');
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatus('uploading');
    setError(null);

    try {
      // Simulate progress for upload
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let result;

      // Handle JSON files differently - read and parse directly
      if (file.type === 'application/json') {
        const text = await file.text();
        try {
          const jsonData = JSON.parse(text);
          result = {
            success: true,
            extractedData: jsonData
          };
          toast.success('📄 JSON file loaded successfully! Data extracted and form pre-filled.');
        } catch (parseError) {
          throw new Error('Invalid JSON file format');
        }
      } else {
        // Extract contract data using AI for other file types
        result = await contractExtractionService.extractFromContract(file);
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.extractedData) {
        setStatus('completed');
        setExtractedData(result.extractedData);
        onDataExtracted(result.extractedData);
        
        if (file.type === 'application/json') {
          toast.success('📄 JSON data loaded successfully! Form has been pre-filled with extracted information.');
        } else {
          toast.success('🎉 Contract analyzed successfully! AI has extracted key information and pre-filled your form.');
        }
      } else {
        throw new Error(result.error || 'Failed to extract contract data');
      }

    } catch (err: any) {
      console.error('Contract extraction error:', err);
      const errorMessage = err.message || 'Failed to analyze contract';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setLoading(false);
    setProgress(0);
    setStatus('idle');
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500" />;
      case 'analyzing':
        return <Brain className="h-5 w-5 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return file?.type === 'application/json' ? 'Processing JSON file...' : 'Uploading contract to AI...';
      case 'analyzing':
        return file?.type === 'application/json' ? 'Loading JSON data...' : 'AI is analyzing your contract...';
      case 'completed':
        return file?.type === 'application/json' ? 'JSON data loaded successfully!' : 'Analysis completed successfully!';
      case 'error':
        return 'Processing failed';
      default:
        return file?.type === 'application/json' ? 'Ready to load JSON' : 'Ready to analyze';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          AI-Powered Contract Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload your contract document (PDF, images) for AI analysis, or upload a JSON file with pre-extracted contract data to automatically pre-fill your arbitration form.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="contract-file" className="text-sm font-medium">
                Contract Document
              </Label>
              <Input
                ref={fileInputRef}
                id="contract-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.json"
                onChange={handleFileSelect}
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, JPEG, PNG, JSON (max 100MB)
              </p>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetUpload}
                disabled={loading}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {file?.type === 'application/json' ? 'Load JSON Data' : 'Analyze with AI'}
              </>
            )}
          </Button>
        </div>

        {/* Progress and Status */}
        {loading && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {status === 'completed' && extractedData && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{file?.type === 'application/json' ? 'JSON Data Loaded!' : 'Analysis Complete!'}</strong> 
              {file?.type === 'application/json' 
                ? 'JSON file has been successfully loaded and parsed. Contract information has been extracted and will be used to pre-fill your form below.'
                : 'AI has successfully extracted contract information. Key details like parties, arbitration clauses, and obligations have been identified and will be used to pre-fill your form below.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* AI Analysis Summary */}
        {extractedData && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                {file?.type === 'application/json' ? 'JSON Data Summary' : 'AI Extraction Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Contract Date:</strong>
                  <p className="text-muted-foreground">
                    {extractedData.contractDate || 'Not found'}
                  </p>
                </div>
                <div>
                  <strong>Primary Party:</strong>
                  <p className="text-muted-foreground">
                    {extractedData.parties?.party1?.name || 'Not found'}
                  </p>
                </div>
                <div>
                  <strong>Secondary Party:</strong>
                  <p className="text-muted-foreground">
                    {extractedData.parties?.party2?.name || 'Not found'}
                  </p>
                </div>
                <div>
                  <strong>Arbitration Clause:</strong>
                  <p className="text-muted-foreground">
                    {extractedData.legal?.arbitrationClause ? 'Found' : 'Not found'}
                  </p>
                </div>
              </div>
              
              {extractedData.obligations && (
                <div>
                  <strong>Key Obligations Identified:</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    {extractedData.obligations.party1Obligations?.length || 0} obligations for Party 1, {' '}
                    {extractedData.obligations.party2Obligations?.length || 0} obligations for Party 2
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
