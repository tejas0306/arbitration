// This file serves as a proxy to route API requests to the NestJS backend on Vercel
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextResponse } from 'next/server';

// Initialize the NestJS app if in a Vercel serverless environment
let nestApp;

// Map of old paths to new paths for backwards compatibility
const pathMappings = {
  '/api/arbitration/draft': '/arbitration/draft',
  '/api/arbitration/drafts': '/arbitration/draft',
  '/api/arbitration/cases': '/arbitration/cases',
  '/api/arbitration/submit': '/arbitration/submit',
};

// Dynamic path mapping function to handle paths with IDs and other parameters
const getRemappedPath = (originalPath) => {
  // Direct mappings take precedence
  if (pathMappings[originalPath]) {
    return pathMappings[originalPath];
  }
  
  // Handle draft ID routes
  if (originalPath.match(/^\/api\/arbitration\/draft\/[^\/]+$/)) {
    return originalPath.replace('/api/arbitration/draft/', '/arbitration/draft/');
  }
  
  // Handle draft submission routes 
  if (originalPath.match(/^\/api\/arbitration\/draft\/[^\/]+\/submit$/)) {
    return originalPath.replace('/api/arbitration/draft/', '/arbitration/draft/');
  }
  
  // Handle case ID routes
  if (originalPath.match(/^\/api\/arbitration\/cases\/[^\/]+$/)) {
    return originalPath.replace('/api/arbitration/cases/', '/arbitration/cases/');
  }
  
  // Handle case status update routes
  if (originalPath.match(/^\/api\/arbitration\/cases\/[^\/]+\/status$/)) {
    return originalPath.replace('/api/arbitration/cases/', '/arbitration/cases/');
  }
  
  // Handle verification endpoints
  if (originalPath.startsWith('/api/verification/')) {
    return originalPath.replace('/api/verification/', '/verification/');
  }
  
  // Default to just removing the /api prefix
  return originalPath.replace(/^\/api/, '');
};

export default async function handler(req, res) {
  try {
    // If we're in production (Vercel), we load the NestJS app directly
    if (process.env.NODE_ENV === 'production' && !nestApp) {
      // Dynamically import the NestJS app bootstrap
      const { bootstrap } = await import('../backend/dist/main');
      nestApp = await bootstrap();
    }

    // Convert the incoming request to a format NestJS can handle
    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname.replace(/^\/api/, '');
    
    // Check if we need to remap this path
    const originalPath = url.pathname;
    const remappedPath = getRemappedPath(originalPath);
    
    if (originalPath !== remappedPath && remappedPath !== path) {
      console.log(`Remapping path: ${originalPath} -> ${remappedPath}`);
      path = remappedPath;
    }
    
    console.log(`Processing request: ${req.method} ${originalPath} -> ${path}`);
    
    // Call the NestJS app directly
    if (nestApp) {
      // Create an Express-compatible request/response cycle
      const expressReq = {
        ...req,
        url: path,
        path,
        query: Object.fromEntries(url.searchParams),
        headers: req.headers,
        method: req.method,
      };
      
      const expressRes = {
        ...res,
        status: (code) => {
          res.status(code);
          return expressRes;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return expressRes;
        },
        send: (data) => {
          res.end(data);
          return expressRes;
        },
        end: () => {
          res.end();
          return expressRes;
        },
      };
      
      // Process the request through NestJS
      await nestApp.getHttpAdapter().getInstance()(expressReq, expressRes);
    } else {
      // Development fallback - provide info about the paths
      console.log('Development mode - API routes are handled by the backend server');
      console.log(`Original path: ${originalPath}`);
      console.log(`Remapped path: ${remappedPath}`);
      console.log(`You should access the backend directly at: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${remappedPath}`);
      
      return new Response(JSON.stringify({
        error: 'API route not available in development mode',
        message: 'The Next.js API route is not designed to work in development mode. In production, it proxies to the NestJS app.',
        originalPath,
        remappedPath,
        backendUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${remappedPath}`
      }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 