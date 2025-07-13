"use client"

import React, { useMemo, useState } from 'react';
import { Control, useFieldArray, Controller } from 'react-hook-form';
import { FormData } from '@/lib/validation/form-schema';
import { Button } from "@/components/ui/button";
import { FileField } from '../arbitration-form';
import { FormField, TextAreaField } from '../arbitration-form';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createWorker } from 'tesseract.js';
import mammoth from 'mammoth';

interface DocumentsTabsProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
  watch: any;
  setValue: any; // Add setValue to props
  files?: Record<string, any>; // Add files prop for existing file display
}

// Document type options for dropdown
const documentTypeOptions = [
  { value: "contract", label: "Contract Document" },
  { value: "invoice", label: "Invoice/Bill" },
  { value: "receipt", label: "Receipt/Payment Proof" },
  { value: "correspondence", label: "Email/Letter Correspondence" },
  { value: "legal_notice", label: "Legal Notice" },
  { value: "agreement", label: "Agreement/MOU" },
  { value: "certificate", label: "Certificate/License" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "delivery_proof", label: "Delivery/Shipment Proof" },
  { value: "technical_document", label: "Technical/Specification Document" },
  { value: "photographic_evidence", label: "Photographic Evidence" },
  { value: "expert_report", label: "Expert Report/Analysis" },
  { value: "other", label: "Other Document" }
];

export const DocumentsTabs: React.FC<DocumentsTabsProps> = ({ control, disputeIssues, watch, setValue, files = {} }) => {
  
  // DEBUG: Log files prop when component renders
  React.useEffect(() => {
    console.log('🔧 DocumentsTabs received files prop:', {
      filesReceived: files,
      fileKeys: Object.keys(files),
      hasScannedDocs: Object.keys(files).filter(key => key.startsWith('scannedDoc_')),
      hasAffidavits: Object.keys(files).filter(key => key.startsWith('affidavit_')),
      hasCertificates: Object.keys(files).filter(key => key.startsWith('certificate_'))
    });
  }, [files]);
  
  // Generate dispute issues from the arguments if none provided
  const issues = useMemo(() => {
    if (disputeIssues && disputeIssues.length > 0) {
      return disputeIssues;
    }
    
    const argumentsPerIssue = watch('arguments.argumentsPerIssue') || [];
    
    if (argumentsPerIssue.length > 0) {
      return argumentsPerIssue.map((_, index) => ({
        value: `issue_${index + 1}`,
        label: `Issue ${index + 1}`
      }));
    }
    
    return [
      { value: "issue_default_1", label: "Issue 1 - Breach of Contract" },
      { value: "issue_default_2", label: "Issue 2 - Non-payment of Invoice" },
      { value: "issue_default_3", label: "Issue 3 - Delay in Delivery" }
    ];
  }, [disputeIssues, watch]);

  // Field array for documents
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents.scannedDocuments",
  });

  // Add document function
  const addDocument = () => {
    append({
      documentType: "",
      date: "",
      file: null,
      linkedIssue: "",
      admissionStatus: "pending",
      description: "",
      isOCREnabled: false,
      extractedText: "",
      keyMetadata: []
    });
  };

  // State for OCR preview and processing status
  const [ocrPreview, setOcrPreview] = useState<Record<number, {
    processing: boolean;
    text: string;
    keyMetadata: Array<{key: string, value: string}>;
    progress: number;
    error?: string;
  }>>({});

  // Watch for changes in scanned documents to restore OCR preview from saved data
  const scannedDocuments = watch('documents.scannedDocuments') || [];
  
  // Effect to restore OCR preview when form data changes (e.g., when loading a draft)
  React.useEffect(() => {
    scannedDocuments.forEach((doc: any, index: number) => {
      if (doc.extractedText && doc.keyMetadata && !ocrPreview[index]) {
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            processing: false,
            text: doc.extractedText,
            keyMetadata: doc.keyMetadata,
            progress: 100
          }
        }));
      }
    });
  }, [scannedDocuments, ocrPreview]);
  
  // Utility function to validate image files
  const validateImageFile = (file: File): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> => {
    return new Promise((resolve) => {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
        
        // Check minimum dimensions
        if (img.width < 50 || img.height < 50) {
          resolve({
            valid: false,
            error: "Image dimensions too small (minimum 50x50 pixels)",
            dimensions: { width: img.width, height: img.height }
          });
          return;
        }
        
        // Check maximum dimensions to prevent memory issues
        if (img.width > 4000 || img.height > 4000) {
          resolve({
            valid: false,
            error: "Image dimensions too large (maximum 4000x4000 pixels)",
            dimensions: { width: img.width, height: img.height }
          });
          return;
        }
        
        resolve({
          valid: true,
          dimensions: { width: img.width, height: img.height }
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({
          valid: false,
          error: "Invalid or corrupted image file"
        });
      };
      
      // Set a timeout to prevent hanging
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
        resolve({
          valid: false,
          error: "Image validation timeout"
        });
      }, 5000);
      
      img.src = imageUrl;
    });
  };

  // Utility function to resize large images
  const resizeImage = (file: File, maxWidth: number = 2000, maxHeight: number = 2000, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Utility function to extract text from DOC/DOCX files
  const extractTextFromDocument = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX file
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (file.type === 'application/msword') {
      // DOC file - mammoth can handle this too
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      throw new Error('Unsupported document format');
    }
  };

  // Utility function to extract metadata from text content
  const extractMetadata = (text: string, fileName: string): Array<{key: string, value: string}> => {
    const metadata: Array<{key: string, value: string}> = [];
    
    // Add file information
    metadata.push({ key: "File Name", value: fileName });
    metadata.push({ key: "Text Length", value: `${text.length} characters` });
    metadata.push({ key: "Word Count", value: `${text.split(/\s+/).filter(word => word.length > 0).length} words` });
    
    // Extract dates (various formats)
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY or DD/MM/YYYY
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,   // MM-DD-YYYY or DD-MM-YYYY
      /\b\d{4}-\d{1,2}-\d{1,2}\b/g,   // YYYY-MM-DD
      /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, // DD Month YYYY
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi // Month DD, YYYY
    ];
    
    const dates = new Set<string>();
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => dates.add(match.trim()));
      }
    });
    
    if (dates.size > 0) {
      metadata.push({ key: "Dates Found", value: Array.from(dates).slice(0, 5).join(', ') + (dates.size > 5 ? '...' : '') });
    }
    
    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      const uniqueEmails = [...new Set(emails)];
      metadata.push({ key: "Email Addresses", value: uniqueEmails.slice(0, 3).join(', ') + (uniqueEmails.length > 3 ? '...' : '') });
    }
    
    // Extract phone numbers (various formats)
    const phonePatterns = [
      /\b\d{3}-\d{3}-\d{4}\b/g,           // 123-456-7890
      /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,    // (123) 456-7890
      /\b\d{3}\.\d{3}\.\d{4}\b/g,        // 123.456.7890
      /\b\d{10}\b/g,                      // 1234567890
      /\b\+\d{1,3}\s*\d{3,4}\s*\d{3,4}\s*\d{4}\b/g // +1 123 456 7890
    ];
    
    const phones = new Set<string>();
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => phones.add(match.trim()));
      }
    });
    
    if (phones.size > 0) {
      metadata.push({ key: "Phone Numbers", value: Array.from(phones).slice(0, 3).join(', ') + (phones.size > 3 ? '...' : '') });
    }
    
    // Extract monetary amounts
    const moneyPatterns = [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,  // $1,234.56
      /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|usd|dollars?)\b/gi, // 1,234.56 USD
      /\b(?:USD|usd|\$)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi // USD 1,234.56
    ];
    
    const amounts = new Set<string>();
    moneyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => amounts.add(match.trim()));
      }
    });
    
    if (amounts.size > 0) {
      metadata.push({ key: "Monetary Amounts", value: Array.from(amounts).slice(0, 3).join(', ') + (amounts.size > 3 ? '...' : '') });
    }
    
    // Extract contract/case numbers
    const contractPatterns = [
      /\b(?:contract|agreement|case|ref|reference)[\s#:]*([A-Z0-9-]+)\b/gi,
      /\b[A-Z]{2,}\d{4,}\b/g, // ABC1234
      /\b\d{4,}-[A-Z0-9]+\b/g // 2024-ABC123
    ];
    
    const contractNumbers = new Set<string>();
    contractPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => contractNumbers.add(match.trim()));
      }
    });
    
    if (contractNumbers.size > 0) {
      metadata.push({ key: "Reference Numbers", value: Array.from(contractNumbers).slice(0, 3).join(', ') + (contractNumbers.size > 3 ? '...' : '') });
    }
    
    // Extract names (simple pattern for common name formats)
    const namePatterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // First Last
      /\b[A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+\b/g // First M. Last
    ];
    
    const names = new Set<string>();
    namePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Filter out common false positives
          if (!match.match(/\b(United States|New York|Los Angeles|San Francisco|Washington DC)\b/i)) {
            names.add(match.trim());
          }
        });
      }
    });
    
    if (names.size > 0) {
      metadata.push({ key: "Potential Names", value: Array.from(names).slice(0, 3).join(', ') + (names.size > 3 ? '...' : '') });
    }
    
    // Extract addresses (simple pattern)
    const addressPattern = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi;
    const addresses = text.match(addressPattern);
    if (addresses && addresses.length > 0) {
      const uniqueAddresses = [...new Set(addresses)];
      metadata.push({ key: "Addresses", value: uniqueAddresses.slice(0, 2).join(', ') + (uniqueAddresses.length > 2 ? '...' : '') });
    }
    
    // Add processing timestamp
    metadata.push({ key: "Processed", value: new Date().toLocaleString() });
    
    return metadata;
  };

  // Real OCR processing using Tesseract.js
  const handleFileUpload = async (file: File | null, index: number) => {
    if (!file) return;
    
    // Check if OCR is enabled for this document
    const isOCREnabled = watch(`documents.scannedDocuments.${index}.isOCREnabled`);
    if (!isOCREnabled) return;
    
    // Support both image and PDF files
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    const pdfTypes = ['application/pdf'];
    const docTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const isImageFile = imageTypes.includes(file.type);
    const isPdfFile = pdfTypes.includes(file.type);
    const isDocFile = docTypes.includes(file.type);
    
    if (!isImageFile && !isPdfFile && !isDocFile) {
      setOcrPreview(prev => ({
        ...prev,
        [index]: {
          processing: false,
          text: "Text extraction is supported for image files (JPEG, PNG, GIF, BMP, TIFF), PDF files, and DOC/DOCX files. Please upload a supported file format.",
          keyMetadata: [
            { key: "File Type", value: file.type },
            { key: "File Name", value: file.name },
            { key: "File Size", value: `${Math.round(file.size / 1024)} KB` },
            { key: "Supported Formats", value: "Images, PDF, DOC, DOCX" },
            { key: "Processing Status", value: "Unsupported file type" }
          ],
          progress: 0,
          error: "Unsupported file type for text extraction"
        }
      }));
      return;
    }
    
    // Validate file size (max 10MB for processing)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      setOcrPreview(prev => ({
        ...prev,
        [index]: {
          processing: false,
          text: "File is too large for processing. Please use files smaller than 10MB for optimal performance.",
          keyMetadata: [
            { key: "File Name", value: file.name },
            { key: "File Size", value: `${Math.round(file.size / 1024 / 1024)} MB` },
            { key: "Max Size", value: "10 MB" },
            { key: "Processing Status", value: "File too large" }
          ],
          progress: 0,
          error: "File size exceeds limit"
        }
      }));
      return;
    }
    
    // Initialize processing state
    setOcrPreview(prev => ({
      ...prev,
      [index]: {
        processing: true,
        text: "Starting file processing...",
        keyMetadata: [
          { key: "File Name", value: file.name },
          { key: "File Type", value: file.type },
          { key: "File Size", value: `${Math.round(file.size / 1024)} KB` }
        ],
        progress: 5
      }
    }));
    
    try {
      // Handle DOC/DOCX files with direct text extraction
      if (isDocFile) {
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            text: "Processing DOC/DOCX file...",
            keyMetadata: [
              { key: "File Type", value: file.type },
              { key: "File Name", value: file.name },
              { key: "File Size", value: `${Math.round(file.size / 1024)} KB` },
              { key: "Processing Method", value: "Direct text extraction" }
            ],
            progress: 30
          }
        }));
        
        const extractedText = await extractTextFromDocument(file);
        
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            processing: false,
            text: extractedText || "No text could be extracted from this document. The file may be empty or contain only images.",
            keyMetadata: extractMetadata(extractedText, file.name),
            progress: 100
          }
        }));
        
        // Save extracted text to form data
        setValue(`documents.scannedDocuments.${index}.extractedText`, extractedText);
        setValue(`documents.scannedDocuments.${index}.keyMetadata`, extractMetadata(extractedText, file.name));
        
        return;
      }
      
      // Handle PDF files - show message that PDF OCR is not supported yet
      if (isPdfFile) {
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            processing: false,
            text: "PDF text extraction is not yet supported. Please convert your PDF to an image format (JPEG, PNG) or DOC/DOCX format for text extraction.",
            keyMetadata: [
              { key: "File Type", value: file.type },
              { key: "File Name", value: file.name },
              { key: "File Size", value: `${Math.round(file.size / 1024)} KB` },
              { key: "Processing Status", value: "PDF OCR not supported" },
              { key: "Recommendation", value: "Convert to image or DOC/DOCX format" }
            ],
            progress: 0,
            error: "PDF OCR not supported yet"
          }
        }));
        return;
      }
      
      // Handle Image files with OCR processing
      if (isImageFile) {
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            text: "Validating image file...",
            progress: 10
          }
        }));
        
        // Validate image file
        const validation = await validateImageFile(file);
        let processedFile = file;
        
        // If image is too large, resize it
        if (!validation.valid && validation.error?.includes("too large")) {
          setOcrPreview(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              text: "Resizing large image for OCR processing...",
              keyMetadata: [
                { key: "File Name", value: file.name },
                { key: "Original Size", value: validation.dimensions ? `${validation.dimensions.width}x${validation.dimensions.height} pixels` : "Unknown" },
                { key: "Action", value: "Resizing to 2000x2000 max" }
              ],
              progress: 15
            }
          }));
          
          processedFile = await resizeImage(file, 2000, 2000, 0.8);
          
          setOcrPreview(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              text: "Image resized successfully. Starting OCR processing...",
              keyMetadata: [
                { key: "File Name", value: file.name },
                { key: "Original Size", value: validation.dimensions ? `${validation.dimensions.width}x${validation.dimensions.height} pixels` : "Unknown" },
                { key: "Resized Size", value: "≤ 2000x2000 pixels" },
                { key: "Action", value: "Ready for OCR" }
              ],
              progress: 25
            }
          }));
        }
        // If validation failed for other reasons (too small, corrupted, etc.)
        else if (!validation.valid) {
          setOcrPreview(prev => ({
            ...prev,
            [index]: {
              processing: false,
              text: `Image validation failed: ${validation.error}`,
              keyMetadata: [
                { key: "File Name", value: file.name },
                { key: "File Type", value: file.type },
                { key: "File Size", value: `${Math.round(file.size / 1024)} KB` },
                ...(validation.dimensions ? [
                  { key: "Image Size", value: `${validation.dimensions.width}x${validation.dimensions.height} pixels` }
                ] : []),
                { key: "Error", value: validation.error || "Unknown validation error" },
                { key: "Processing Status", value: "Validation failed" }
              ],
              progress: 0,
              error: validation.error || "Image validation failed"
            }
          }));
          return;
        }
        
        // Start OCR processing for valid images
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            text: "Initializing OCR worker...",
            progress: 30
          }
        }));
        
        // Create Tesseract worker
        const worker = await createWorker();
        
        // Set up worker parameters
        await worker.setParameters({
          tessedit_pageseg_mode: '1', // Automatic page segmentation
          tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine
        });
        
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            text: "Processing image with OCR...",
            progress: 40
          }
        }));
        
        // Progress simulation
        const progressInterval = setInterval(() => {
          setOcrPreview(prev => {
            const current = prev[index];
            if (current && current.processing && current.progress < 90) {
              return {
                ...prev,
                [index]: {
                  ...current,
                  progress: Math.min(current.progress + 5, 90)
                }
              };
            }
            return prev;
          });
        }, 1000);
        
        // Process the image with timeout
        const recognitionPromise = worker.recognize(processedFile);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OCR processing timeout (30 seconds)')), 30000);
        });
        
        const { data: { text } } = await Promise.race([recognitionPromise, timeoutPromise]);
        
        // Clear progress interval
        clearInterval(progressInterval);
        
        // Clean up worker
        await worker.terminate();
        
        // Extract metadata from the OCR text
        const keyMetadata = extractMetadata(text, file.name);
        
        // Update state with OCR results
        setOcrPreview(prev => ({
          ...prev,
          [index]: {
            processing: false,
            text: text || "No text could be extracted from this image. Please ensure the image contains readable text.",
            keyMetadata,
            progress: 100
          }
        }));

        // Save extracted text to form data
        setValue(`documents.scannedDocuments.${index}.extractedText`, text);
        setValue(`documents.scannedDocuments.${index}.keyMetadata`, keyMetadata);

      }
      
    } catch (error) {
      console.error('File processing failed:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "File processing failed. Please try with a different file.";
      let recommendation = "Try with a clear image file (JPEG, PNG) or DOC/DOCX file";
      
      if (error instanceof Error) {
        if (error.message.includes("read image") || error.message.includes("Invalid or corrupted")) {
          errorMessage = "The uploaded file appears to be corrupted or in an unsupported format. Please try with a different file.";
          recommendation = "Use a clear JPEG or PNG image file";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Processing failed due to network issues. Please check your connection and try again.";
          recommendation = "Check internet connection and retry";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Processing timed out. The file may be too complex or large.";
          recommendation = "Try with a smaller or simpler file";
        } else if (error.message.includes("Worker") || error.message.includes("WebAssembly")) {
          errorMessage = "Processing failed due to browser compatibility issues.";
          recommendation = "Try using a modern browser like Chrome or Firefox";
        } else if (error.message.includes("Memory") || error.message.includes("out of memory")) {
          errorMessage = "Processing failed due to insufficient memory. The file may be too large.";
          recommendation = "Try with a smaller file or reduce image resolution";
        } else if (error.message.includes("Failed to resize")) {
          errorMessage = "Image resizing failed. Please try with a different image.";
          recommendation = "Try with a smaller image or different format";
        } else if (error.message.includes("Unsupported document format")) {
          errorMessage = "Document format not supported for text extraction.";
          recommendation = "Try with DOC, DOCX, or image formats";
        }
      }
      
      setOcrPreview(prev => ({
        ...prev,
        [index]: {
          processing: false,
          text: errorMessage,
          keyMetadata: [
            { key: "File Name", value: file.name },
            { key: "File Type", value: file.type },
            { key: "File Size", value: `${Math.round(file.size / 1024)} KB` },
            { key: "Error Details", value: error instanceof Error ? error.message : "Unknown error" },
            { key: "Processing Status", value: "Failed" },
            { key: "Recommendation", value: recommendation }
          ],
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg mb-4">Documents & Evidence</h3>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h4 className="font-medium text-blue-800 mb-2">Document Upload Instructions</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Select document type from dropdown for proper categorization</li>
          <li>• <strong>Image files</strong> (JPEG, PNG, GIF, BMP, TIFF): Full OCR support with automatic resizing for large images</li>
          <li>• <strong>DOC/DOCX files</strong>: Direct text extraction supported - no conversion needed</li>
          <li>• <strong>PDF files</strong>: Not yet supported for text extraction - convert to image or DOC/DOCX format</li>
          <li>• Large images (>4000x4000px) are automatically resized to optimize OCR processing</li>
          <li>• Each document must be linked to a specific issue in your case</li>
          <li>• Text extraction processes your documents and extracts key metadata</li>
          <li>• Files remain accessible when navigating between form steps</li>
        </ul>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-lg space-y-4 mb-4 bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <h5 className="font-medium text-gray-800">Document {index + 1}</h5>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type Dropdown */}
            <div>
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.documentType`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Document Type"
                    name={field.name}
                    value={field.value || "contract"}
                    onChange={field.onChange}
                    type="select"
                    required
                    error={fieldState.error?.message}
                    options={documentTypeOptions}
                  />
                )}
              />
            </div>

            {/* Date Field */}
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

            {/* File Upload */}
            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.scannedDocuments.${index}.file`}
                render={({ field: { onChange, value } }) => (
                  <div>
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
                      error={!value ? "Document file is required" : ""}
                      existingFile={files[`scannedDoc_${index}`]}
                    />
                    {value && value.isExisting && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 text-sm">✓ Previously uploaded: {value.name}</span>
                          {value.path && (
                            <button
                              type="button"
                              onClick={() => window.open(`/api/arbitration/files/${value.path.split('/').pop()}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Linked Issue */}
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
                    options={issues}
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Link this document to a specific issue in your case
              </p>
            </div>

            {/* Admission Status */}
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

            {/* Description */}
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
                    placeholder="Provide a brief description of this document and its relevance to your case"
                  />
                )}
              />
            </div>

            {/* OCR Enable Checkbox */}
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
                OCR processing extracts actual text from your document images, making them searchable and extracting key metadata
              </p>
            </div>

            {/* OCR Preview Section */}
            {field.file && (
              <div className="col-span-2 mt-2">
                <Card className="border border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <h6 className="text-sm font-medium mb-2 text-blue-800">OCR Processing Results</h6>
                    
                    {ocrPreview[index]?.processing ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-sm text-blue-700">Processing document with OCR...</span>
                          <span className="text-xs text-blue-600">({ocrPreview[index]?.progress || 0}%)</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${ocrPreview[index]?.progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600">Reading text from your document...</p>
                      </div>
                    ) : ocrPreview[index]?.text ? (
                      <Tabs defaultValue="text" className="w-full">
                        <TabsList className="bg-blue-100">
                          <TabsTrigger value="text">Extracted Text</TabsTrigger>
                          <TabsTrigger value="metadata">Key Metadata</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="text" className="pt-2">
                          <div className="text-xs font-mono bg-white p-3 rounded-md h-32 overflow-auto border border-blue-200">
                            {ocrPreview[index].text.split('\n').map((line, i) => (
                              <div key={i} className="mb-1">{line}</div>
                            ))}
                          </div>
                          {ocrPreview[index].error ? (
                            <p className="text-xs text-red-600 mt-2">⚠ {ocrPreview[index].error}</p>
                          ) : (
                            <p className="text-xs text-blue-600 mt-2">✓ Text extracted successfully from your document</p>
                          )}
        </TabsContent>
        
                        <TabsContent value="metadata" className="pt-2">
                          <div className="bg-white p-3 rounded-md border border-blue-200">
                            <div className="text-xs space-y-2">
                              {ocrPreview[index].keyMetadata.map((item, i) => (
                                <div key={i} className="flex border-b border-gray-100 pb-1">
                                  <span className="font-medium w-1/3 text-gray-700">{item.key}:</span>
                                  <span className="w-2/3 text-gray-600">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">✓ Key information automatically extracted from document</p>
        </TabsContent>
      </Tabs>
                    ) : (
                      <div className="text-sm text-blue-700 p-3 bg-blue-100 rounded-md">
                        <p className="font-medium mb-1">Ready for OCR Processing</p>
                        <p className="text-xs">Upload an image document and enable OCR to automatically extract text and metadata from your actual document.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-center">
        <Button 
          onClick={addDocument} 
          variant="outline"
          className="w-full max-w-xs"
        >
          Add Document
        </Button>
      </div>
      
      <div className="bg-green-50 p-4 rounded-md text-sm text-green-800 mt-6">
        <p className="font-medium mb-2">Enhanced Text Extraction Features:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Actual text extraction from uploaded images using advanced OCR technology</li>
          <li>Direct text extraction from DOC/DOCX files using advanced document processing</li>
          <li>Automatic detection of dates, amounts, emails, and phone numbers</li>
          <li>Real-time progress tracking during processing</li>
          <li>Support for multiple image formats: JPEG, PNG, GIF, BMP, TIFF</li>
          <li>Intelligent metadata extraction from document content</li>
          <li>Enhanced error handling with helpful recommendations</li>
          <li>Automatic image resizing for large files (>4000x4000px) to optimize OCR processing</li>
        </ol>
      </div>
    </div>
  );
};

export default DocumentsTabs; 