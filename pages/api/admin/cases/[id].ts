import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user has admin role
    if (session.user?.role !== 'ADMIN' && session.user?.role !== 'CASE_MANAGER') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.query;
    const response = await fetch(`${BACKEND_URL}/admin/cases/${id}`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      return res.status(response.status).json({ 
        message: 'Failed to process request',
        error: errorData 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Admin case details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 