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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Fetch team members data from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/case-manager/team/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const teamData = await response.json();
    
    res.status(200).json(teamData);
  } catch (error) {
    console.error('Team members API error:', error);
    res.status(500).json({ error: 'Failed to fetch team members data' });
  }
} 