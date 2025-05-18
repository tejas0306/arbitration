import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This file handles the /api/arbitration/draft/[id]/submit endpoint
// It proxies requests to the real backend

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`🔄 API Proxy - Draft Submit endpoint called: ${id}, Method: ${req.method}`);
  console.log('🔄 Backend URL:', API_URL);
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Set the target URL in the backend
    const targetUrl = `${API_URL}/arbitration/draft/${id}/submit`;
    console.log('🔄 Proxying request to:', targetUrl);
    
    // Pass along all headers
    const headers = {
      ...req.headers,
      host: new URL(API_URL).host,
    };
    
    // Remove headers that might cause issues
    delete headers['content-length'];
    
    // Send token if present in the incoming request
    if (req.headers.authorization) {
      console.log('🔄 Authorization header present, forwarding it');
    }
    
    // Forward the request to the backend
    const response = await axios.post(targetUrl, req.body, { headers });
    
    // Return the response from the backend
    return res.status(response.status).json(response.data);
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