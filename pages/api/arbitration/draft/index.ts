import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This file handles the /api/arbitration/draft endpoint
// It proxies requests to the real backend with proper authentication

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 API Proxy - Draft endpoint called:', req.method);
  console.log('🔄 Backend URL:', API_URL);
  
  try {
    // Extract the authorization token from the request headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Set the target URL in the backend
    const targetUrl = `${API_URL}/arbitration/draft`;
    console.log('🔄 Proxying request to:', targetUrl);
    console.log('🔄 Auth header present:', !!authHeader);
    
    // Prepare headers with authentication
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    };
    
    // Handle different methods
    switch (req.method) {
      case 'GET': {
        console.log('🔄 Proxying GET request with user authentication');
        
        // Forward the request to the backend with authentication
        const response = await axios.get(targetUrl, { 
          headers,
          params: req.query
        });
        
        console.log(`🔄 Backend returned ${response.data?.length || 0} drafts for authenticated user`);
        
        // Return the response from the backend
        return res.status(response.status).json(response.data);
      }
      
      case 'POST': {
        console.log('🔄 Proxying POST request');
        
        // If the request is multipart/form-data, we need to handle it specially
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          console.log('🔄 Found multipart form data - creating pass-through response');
          
          // For multipart/form-data, we can't easily proxy it with the standard API routes
          // Instead, return a 307 Temporary Redirect to the actual backend URL
          res.setHeader('Location', targetUrl);
          return res.status(307).end();
        }
        
        // For regular JSON, forward the request
        const response = await axios.post(targetUrl, req.body, { headers });
        return res.status(response.status).json(response.data);
      }
      
      default:
        // For any other method, return method not allowed
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
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