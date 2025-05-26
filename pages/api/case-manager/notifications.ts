import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    if (req.method === 'GET') {
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.keys(req.query).forEach(key => {
        if (req.query[key]) {
          queryParams.append(key, req.query[key] as string);
        }
      });

      // Fetch notifications data from backend
      const url = `${backendUrl}/case-manager/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const notificationsData = await response.json();
      
      res.status(200).json(notificationsData);
    } else if (req.method === 'POST') {
      // Create notification in backend
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
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    res.status(500).json({ error: 'Failed to process notifications request' });
  }
} 