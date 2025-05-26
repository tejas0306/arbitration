import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has case manager or team member role
    if (!['CASE_MANAGER', 'TEAM_MEMBER', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Case Manager, Team Member, or Admin access required' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Create notification in backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/case-manager/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create notification API error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
} 