import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (session.user.role !== 'ARBITRATOR') {
      return res.status(403).json({ error: 'Arbitrator access required' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Proxy to the NestJS backend
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
    const token = req.headers.authorization;

    const response = await fetch(`${backendUrl}/api/arbitrators/assignments/my-cases`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Arbitrator assignments API error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments data' });
  }
} 