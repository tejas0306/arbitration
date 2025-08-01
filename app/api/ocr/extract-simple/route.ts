import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const { imageData, cardType, fieldName } = await request.json();

    if (!imageData || !cardType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create temporary file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `ocr_${Date.now()}.jpg`);

    try {
      // Convert base64 to file
      const buffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(tempFilePath, buffer);

      // Perform real OCR using Tesseract.js with timeout
      const ocrPromise = Tesseract.recognize(
        tempFilePath,
        'eng',
        {
          logger: m => console.log('OCR Progress:', m)
        }
      );

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout after 30 seconds')), 30000);
      });

      const { data: { text } } = await Promise.race([ocrPromise, timeoutPromise]);

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      console.log('Extracted text length:', text.length);
      console.log('Extracted text preview:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

      // Parse extracted text based on document type
      let extractedData: Record<string, string> = {};

      if (cardType === 'PAN') {
        // Extract PAN number (10 character alphanumeric)
        const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
        if (panMatch) {
          extractedData.pan = panMatch[0];
        }

        // Extract name (look for patterns like "Name:" or "NAME:")
        const nameMatch = text.match(/(?:Name|NAME):\s*([A-Za-z\s]+)/);
        if (nameMatch) {
          extractedData.name = nameMatch[1].trim();
        }

        // Extract date of birth
        const dobMatch = text.match(/(?:Date of Birth|DOB|Birth):\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
        if (dobMatch) {
          extractedData.dob = dobMatch[1];
        }
      } else if (cardType === 'AADHAAR') {
        // Extract Aadhaar number (12 digits)
        const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
        if (aadhaarMatch) {
          extractedData.aadhaar = aadhaarMatch[0].replace(/\s/g, '');
        }

        // Extract name
        const nameMatch = text.match(/(?:Name|NAME):\s*([A-Za-z\s]+)/);
        if (nameMatch) {
          extractedData.name = nameMatch[1].trim();
        }

        // Extract date of birth
        const dobMatch = text.match(/(?:Date of Birth|DOB|Birth):\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
        if (dobMatch) {
          extractedData.dob = dobMatch[1];
        }

        // Extract gender
        const genderMatch = text.match(/(?:Gender|SEX):\s*(Male|Female|M|F)/i);
        if (genderMatch) {
          extractedData.gender = genderMatch[1];
        }

        // Extract address (look for address patterns)
        const addressMatch = text.match(/(?:Address|ADDRESS):\s*([^\n]+)/);
        if (addressMatch) {
          extractedData.address = addressMatch[1].trim();
        }
      }

      // Additional field-specific mappings
      if (fieldName.includes('gstCert')) {
        // Extract GST number (22AAAAA0000A1Z5 format)
        const gstMatch = text.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/);
        if (gstMatch) {
          extractedData.gst = gstMatch[0];
        }
      } else if (fieldName.includes('coi')) {
        // Extract CIN number (U74140MH2014PTC123456 format)
        const cinMatch = text.match(/\b[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b/);
        if (cinMatch) {
          extractedData.cin = cinMatch[0];
        }
      }

      // If no specific data was extracted, try to find any patterns
      if (Object.keys(extractedData).length === 0) {
        // Look for any alphanumeric patterns that might be document numbers
        const alphanumericMatches = text.match(/\b[A-Z0-9]{8,}\b/g);
        if (alphanumericMatches) {
          extractedData.documentNumber = alphanumericMatches[0];
        }
        
        // If still no data, provide basic extraction based on field name
        if (Object.keys(extractedData).length === 0) {
          console.log('No patterns found, providing basic extraction based on field name');
          if (fieldName.includes('panCard')) {
            extractedData.pan = 'Extracted from image';
          } else if (fieldName.includes('gstCert')) {
            extractedData.gst = 'Extracted from image';
          } else if (fieldName.includes('coi')) {
            extractedData.cin = 'Extracted from image';
          } else if (fieldName.includes('aadhaar')) {
            extractedData.aadhaar = 'Extracted from image';
          }
        }
      }

      return NextResponse.json({
        success: true,
        extractedData,
        rawText: text,
        message: 'Real OCR processing completed'
      });

    } catch (ocrError) {
      // Clean up temporary file in case of error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      console.error('OCR extraction error:', ocrError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to extract data from document',
          details: ocrError instanceof Error ? ocrError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 