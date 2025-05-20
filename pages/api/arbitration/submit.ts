import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// This file handles the /api/arbitration/submit endpoint
// It proxies requests to the real backend with case ID generation

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

// Store sequence in a JSON file to persist between restarts
const SEQUENCE_FILE = path.join(process.cwd(), 'data', 'case-sequence.json');

// Function to generate the next case ID
async function generateCaseId(): Promise<string> {
  try {
    // Make sure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read the current sequence number, or initialize if it doesn't exist
    let sequence = 1;
    if (fs.existsSync(SEQUENCE_FILE)) {
      const data = await fs.promises.readFile(SEQUENCE_FILE, 'utf8');
      const json = JSON.parse(data);
      sequence = json.sequence || 1;
    }
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Format the case ID: ADDS/ARB/{Year}/{Six Digit Running Number}
    const caseId = `ADDS/ARB/${currentYear}/${String(sequence).padStart(7, '0')}`;
    
    // Update the sequence number for the next case
    await fs.promises.writeFile(SEQUENCE_FILE, JSON.stringify({ sequence: sequence + 1 }));
    
    return caseId;
  } catch (error) {
    console.error('Error generating case ID:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 API Proxy - Submit endpoint called:', req.method);
  console.log('🔄 Backend URL:', API_URL);
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Set the target URL in the backend
    const targetUrl = `${API_URL}/arbitration/submit`;
    console.log('🔄 Proxying request to:', targetUrl);
    
    // Generate a case ID for this submission
    const caseId = await generateCaseId();
    console.log('🔄 Generated case ID:', caseId);
    
    // Pass along all headers
    const headers = {
      ...req.headers,
      host: new URL(API_URL).host,
    };
    
    // Remove headers that might cause issues
    delete headers['content-length'];
    
    // If the request is multipart/form-data, add the caseId to the form data
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log('🔄 Found multipart form data - handling specially');
      
      // For multipart/form-data, we'll need to modify the boundary
      // Instead, we'll add the case ID as a header and let the backend extract it
      headers['x-case-id'] = caseId;
      
      // For multipart/form-data, we can't easily proxy it with the standard API routes
      // Instead, return a 307 Temporary Redirect to the actual backend URL
      res.setHeader('Location', targetUrl);
      res.setHeader('X-Case-ID', caseId);
      return res.status(307).end();
    }
    
    // For regular JSON body, add the case ID to the request body
    let requestBody = req.body;
    if (typeof requestBody === 'object') {
      requestBody = { ...requestBody, caseId };
    }
    
    // Forward the request to the backend
    const response = await axios.post(targetUrl, requestBody, { headers });
    
    // Return the response from the backend
    return res.status(response.status).json({
      ...response.data,
      caseId // Ensure the case ID is in the response
    });
  } catch (error) {
    // Handle errors from the backend
    console.error('🔄 Error proxying request to backend:', error);
    
    // Return appropriate error
    if (axios.isAxiosError(error)) {
      // This is an Axios error, we can get more details
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Backend service unavailable' };
      
      console.error('🔄 Backend returned error:', {
        status,
        data,
        message: error.message
      });
      
      return res.status(status).json(data);
    }
    
    // Generic error handling
    return res.status(500).json({ 
      error: 'Failed to proxy request to backend',
      message: error.message
    });
  }
} 