import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user has admin role
    if (session.user?.role !== 'ADMIN' && session.user?.role !== 'CASE_MANAGER') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const response = await fetch(`${BACKEND_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      return res.status(response.status).json({ 
        message: 'Failed to fetch dashboard stats',
        error: errorData 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 