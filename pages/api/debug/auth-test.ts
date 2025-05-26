import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Auth Debug - Headers received:', {
    authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
    authLength: req.headers.authorization?.length || 0,
    allHeaders: Object.keys(req.headers)
  });

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'No authorization header found',
      headers: Object.keys(req.headers),
      debug: 'Expected Authorization: Bearer <token>'
    });
  }

  // Extract token from Bearer format
  const token = authHeader.replace('Bearer ', '');
  
  return res.status(200).json({
    success: true,
    message: 'Authentication header received successfully',
    tokenLength: token.length,
    tokenStart: token.substring(0, 20) + '...',
    headerPresent: true
  });
} 