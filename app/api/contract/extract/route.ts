import { NextRequest, NextResponse } from 'next/server';
import { contractExtractionService } from '@/lib/services/contract-extraction.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsString = formData.get('options') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or image files.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Determine file type
    let fileType: 'pdf' | 'doc' | 'docx' | 'txt' | 'image' = 'pdf';
    if (file.type.includes('pdf')) fileType = 'pdf';
    else if (file.type.includes('msword')) fileType = 'doc';
    else if (file.type.includes('wordprocessingml')) fileType = 'docx';
    else if (file.type.includes('text')) fileType = 'txt';
    else if (file.type.includes('image')) fileType = 'image';

    // Parse extraction options
    let extractionOptions = {};
    if (optionsString) {
      try {
        extractionOptions = JSON.parse(optionsString);
      } catch (e) {
        console.warn('Invalid options JSON, using defaults');
      }
    }

    // Call contract extraction service
    const result = await contractExtractionService.extractContractData({
      fileBuffer,
      fileName: file.name,
      fileType,
      extractionOptions
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Contract extraction failed' },
        { status: 500 }
      );
    }

    // Generate questionnaire suggestions
    const suggestions = await contractExtractionService.generateQuestionnaireSuggestions(
      result.extractedData
    );

    // Generate primary facie advice
    const advice = await contractExtractionService.generatePrimaryFacieAdvice(
      result.extractedData
    );

    return NextResponse.json({
      success: true,
      extractedData: result.extractedData,
      confidence: result.confidence,
      processingTime: result.processingTime,
      suggestions: suggestions.suggestions,
      fieldsToReview: suggestions.fieldsToReview,
      advice: advice.advice,
      legalIssues: advice.legalIssues,
      strengthsWeaknesses: advice.strengthsWeaknesses,
      recommendedActions: advice.recommendedActions
    });

  } catch (error) {
    console.error('Contract extraction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during contract extraction' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Contract Extraction API Ready',
    version: '1.0.0',
    supportedFormats: ['PDF', 'DOC', 'DOCX', 'TXT', 'Images'],
    maxFileSize: '10MB',
    features: [
      'Contract data extraction',
      'Party information extraction',
      'Financial terms analysis',
      'Dispute resolution clause detection',
      'Questionnaire pre-filling',
      'Primary facie legal advice'
    ]
  });
}
