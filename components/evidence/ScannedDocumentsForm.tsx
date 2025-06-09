"use client"

import React, { useState } from 'react';
import { Control, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { FileField } from '../arbitration-form';
import { FormField } from '../arbitration-form';
import { TextAreaField } from '../arbitration-form';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormData } from '@/lib/validation/form-schema';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScannedDocumentsFormProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
}

export const ScannedDocumentsForm: React.FC<ScannedDocumentsFormProps> = ({ control, disputeIssues }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents.scannedDocuments",
  });

  // State for OCR preview and processing status
  const [ocrPreview, setOcrPreview] = useState<Record<number, {
    processing: boolean;
    text: string;
    keyMetadata: Array<{key: string, value: string}>;
  }>>({});

  const addScannedDocument = () => {
    append({
      file: null,
      description: "",
      isOCREnabled: true,
      linkedIssue: disputeIssues.length > 0 ? disputeIssues[0].value : "issue_default_1",
      admissionStatus: "pending",
      crossExaminationRef: "",
      date: "",
    });
  };

  // Simulate OCR processing when a file is uploaded
  const handleFileUpload = (file: File | null, index: number) => {
    if (!file) return;
    
    // Set processing state
    setOcrPreview(prev => ({
      ...prev,
      [index]: {
        processing: true,
        text: "",
        keyMetadata: []
      }
    }));
    
    // Simulate OCR processing with a timeout
    setTimeout(() => {
      // Generate sample OCR text based on file name
      const sampleText = `EXTRACTED TEXT FROM ${file.name.toUpperCase()}:\n\nThis document appears to be a ${file.name.includes('contract') ? 'contract' : 'business document'} dated ${new Date().toLocaleDateString()}.\n\nRelevant parties mentioned: Claimant, Respondent\nKey terms identified: payment, delivery, breach, damages`;
      
      // Sample extracted metadata
      const keyMetadata = [
        { key: "Document Date", value: new Date().toLocaleDateString() },
        { key: "Parties", value: "Claimant, Respondent" },
        { key: "Key Terms", value: "payment, delivery, breach" },
        { key: "Referenced Clauses", value: "Section 3.2, 4.1" }
      ];
      
      // Update state with OCR results
      setOcrPreview(prev => ({
        ...prev,
        [index]: {
          processing: false,
          text: sampleText,
          keyMetadata
        }
      }));
    }, 2500);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold mb-2">Scanned Documents</h4>
      <p className="text-sm text-gray-600 mb-4">
        Upload scanned documents that are OCR-readable. These documents will be used for inspection/discovery
        and can be referenced during admission/denial and cross-examination. Each document must be linked to a specific Issue.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Document {index + 1}</h5>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.file`}
                render={({ field: { onChange, value } }) => (
                  <FileField
                    label="Document File"
                    name={`scannedDoc_${index}`}
                    onChange={(file) => {
                      if (!Array.isArray(file)) {
                        onChange(file);
                        handleFileUpload(file, index);
                      }
                    }}
                    required
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    error={!value ? "Document file is required" : ""}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.date`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Document Date"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="date"
                    required
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.linkedIssue`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Linked Issue"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    error={fieldState.error?.message}
                    options={disputeIssues}
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Every document must be linked to a specific issue in your case
              </p>
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.description`}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    label="Description"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    rows={2}
                    placeholder="Provide a brief description of this document"
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.admissionStatus`}
                render={({ field }) => (
                  <FormField
                    label="Admission Status"
                    name={field.name}
                    value={field.value || "pending"}
                    onChange={field.onChange}
                    type="select"
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "admitted", label: "Admitted" },
                      { value: "denied", label: "Denied" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.crossExaminationRef`}
                render={({ field }) => (
                  <FormField
                    label="Cross-examination Reference"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Reference for cross-examination (if any)"
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.isOCREnabled`}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`ocr-${index}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor={`ocr-${index}`}>Enable OCR Processing</Label>
                  </div>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                OCR processing extracts text from your document, making it searchable and allowing for automatic metadata extraction
              </p>
            </div>

            {/* OCR Preview Section - Only shown when a file is uploaded */}
            {field.file && (
              <div className="col-span-2 mt-2">
                <Card className="border border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <h6 className="text-sm font-medium mb-2">OCR Processing</h6>
                    
                    {/* Show OCR processing status */}
                    {ocrPreview[index]?.processing ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-sm text-blue-700">OCR processing in progress...</span>
                        </div>
                        <Skeleton className="h-24 w-full bg-blue-100" />
                      </div>
                    ) : ocrPreview[index]?.text ? (
                      <Tabs defaultValue="text" className="w-full">
                        <TabsList className="bg-blue-100">
                          <TabsTrigger value="text">Extracted Text</TabsTrigger>
                          <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="text" className="pt-2">
                          <div className="text-xs font-mono bg-white p-2 rounded-md h-32 overflow-auto border">
                            {ocrPreview[index].text.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="metadata" className="pt-2">
                          <div className="bg-white p-2 rounded-md border">
                            <div className="text-xs divide-y">
                              {ocrPreview[index].keyMetadata.map((item, i) => (
                                <div key={i} className="py-1 flex">
                                  <span className="font-medium w-1/3">{item.key}:</span>
                                  <span className="w-2/3">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="text-sm text-blue-700 p-2">
                        OCR processing not started. Upload a document and enable OCR to extract text and metadata.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={addScannedDocument} 
          variant="outline"
        >
          Add Scanned Document
        </Button>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mt-4">
        <p className="font-medium">How OCR Processing Works:</p>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>Upload your document and enable OCR processing</li>
          <li>Our system automatically extracts text and key metadata</li>
          <li>Document becomes fully searchable by the tribunal</li>
          <li>Document is linked to your selected Issue for organized presentation</li>
          <li>Key metadata (dates, parties, clauses) is automatically detected</li>
        </ol>
      </div>
    </div>
  );
};

export default ScannedDocumentsForm; 