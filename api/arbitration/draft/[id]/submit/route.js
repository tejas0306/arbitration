// Mock API route to handle draft submission
import { NextResponse } from 'next/server';
import { mockDrafts, mockCases } from '@/lib/mock-data';
import fs from 'fs';
import path from 'path';

// Store sequence in a JSON file to persist between restarts
const SEQUENCE_FILE = path.join(process.cwd(), 'data', 'case-sequence.json');

// Function to generate the next case ID with a sequential number
async function generateCaseId() {
  try {
    console.log('Generating case ID');
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }
    
    // Read the current sequence number, or initialize if it doesn't exist
    let sequence = 1;
    if (fs.existsSync(SEQUENCE_FILE)) {
      const data = fs.readFileSync(SEQUENCE_FILE, 'utf8');
      const json = JSON.parse(data);
      sequence = json.sequence || 1;
      console.log(`Read sequence number: ${sequence}`);
    } else {
      console.log('Sequence file does not exist, initializing with 1');
    }
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Format the case ID: ADDS/ARB/{Year}/{Seven Digit Running Number}
    const caseId = `ADDS/ARB/${currentYear}/${String(sequence).padStart(7, '0')}`;
    console.log(`Generated case ID: ${caseId}`);
    
    // Update the sequence number for the next case
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ sequence: sequence + 1 }));
    console.log(`Updated sequence to: ${sequence + 1}`);
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    // Fallback to a default format in case of error
    const fallbackId = `ADDS/ARB/${new Date().getFullYear()}/${String(1).padStart(7, '0')}`;
    console.log(`Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

export async function POST(req, { params }) {
  console.log('POST request received for draft submission');
  
  try {
    const { id } = params;
    console.log(`🔶 Mock API - Submitting draft with ID: ${id}`);
    
    // Validate input
    if (!id) {
      console.error('Draft ID is missing in parameters');
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }
    
    // Find the draft with the given ID
    const draftIndex = mockDrafts.findIndex(d => d.id === id);
    console.log(`Found draft at index: ${draftIndex}`);
    
    if (draftIndex === -1) {
      console.log(`🔶 Mock API - Draft not found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Get the draft
    const draft = mockDrafts[draftIndex];
    console.log(`Retrieved draft with title: ${draft.title || 'Untitled'}`);
    
    // Get the case ID from the X-Case-ID header or generate one with our sequential function
    const headers = new Headers(req.headers);
    let caseId;
    try {
      caseId = headers.get('x-case-id') || await generateCaseId();
      console.log(`Using case ID: ${caseId}`);
    } catch (idError) {
      console.error('Error generating case ID:', idError);
      caseId = `ADDS/ARB/${new Date().getFullYear()}/${String(mockCases.length + 1).padStart(7, '0')}`;
      console.log(`Fallback to simple case ID: ${caseId}`);
    }
    
    // Create a case from the draft
    const newCase = {
      id: `case-${Date.now()}`,
      caseNumber: caseId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: draft.data?.type || draft.type || 'Default Type',
      isDraft: false,
      data: draft.data,
    };
    console.log(`Created new case with ID: ${newCase.id} and number: ${newCase.caseNumber}`);
    
    // Add the case to the mock cases array
    mockCases.push(newCase);
    console.log(`Added case to mockCases, total count now: ${mockCases.length}`);
    
    // Remove the draft
    mockDrafts.splice(draftIndex, 1);
    console.log(`Removed draft from mockDrafts, count now: ${mockDrafts.length}`);
    
    console.log(`🔶 Mock API - Draft submitted successfully, created case: ${newCase.caseNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Draft submitted successfully',
      caseId: newCase.id,
      caseNumber: newCase.caseNumber
    });
  } catch (error) {
    console.error('Error in draft submission API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit draft', 
        message: error.message || 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
} 