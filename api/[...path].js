// This file serves as a proxy to route API requests to the NestJS backend on Vercel
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextResponse } from 'next/server';

// Initialize the NestJS app if in a Vercel serverless environment
let nestApp;

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
    const path = url.pathname.replace(/^\/api/, '');
    
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
      // Development fallback - forward to your locally running NestJS server
      // This is useful when running local development
      return new Response('API route not available in development mode', { status: 501 });
    }
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 