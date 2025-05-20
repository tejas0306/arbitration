import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This file handles the /api/arbitration/cases/[id] endpoint
// It proxies requests to the real backend

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  console.log(`🔄 API Proxy - Cases ID endpoint called: ${id}, Method: ${req.method}`);
  console.log('🔄 Backend URL:', API_URL);
  
  try {
    // Set the target URL in the backend
    const targetUrl = `${API_URL}/arbitration/cases/${id}`;
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
    
    // Handle different methods
    switch (req.method) {
      case 'GET': {
        console.log('🔄 Proxying GET request');
        
        // Forward the request to the backend
        const response = await axios.get(targetUrl, { 
          headers,
          params: { ...req.query, id: undefined } // Remove id from query params as it's in the URL
        });
        
        // Return the response from the backend
        return res.status(response.status).json(response.data);
      }
      
      case 'PUT': {
        console.log('🔄 Proxying PUT request');
        
        // If the request is multipart/form-data, we need to handle it specially
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          console.log('🔄 Found multipart form data - creating pass-through response');
          
          // For multipart/form-data, we can't easily proxy it with the standard API routes
          // Instead, return a 307 Temporary Redirect to the actual backend URL
          res.setHeader('Location', targetUrl);
          return res.status(307).end();
        }
        
        // For regular JSON, forward the request
        const response = await axios.put(targetUrl, req.body, { headers });
        return res.status(response.status).json(response.data);
      }
      
      case 'DELETE': {
        console.log('🔄 Proxying DELETE request');
        
        // Forward the delete request
        const response = await axios.delete(targetUrl, { headers });
        return res.status(response.status).json(response.data);
      }
      
      default:
        // For any other method, return method not allowed
        return res.status(405).json({ error: 'Method not allowed' });
    }
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