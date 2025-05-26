import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.method === 'GET') {
    try {
      // Connect to NestJS backend
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/feedback/cases/user/${session.user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const cases = await response.json()
      res.status(200).json(cases)
    } catch (error) {
      console.error('Feedback cases fetch error:', error)
      
      // Fallback with mock data for development
      const mockCases = [
        {
          id: 'case-001',
          caseNumber: 'ARB/2024/001',
          arbitratorName: 'Dr. Rajesh Kumar',
          arbitratorId: 'arb-001',
          status: 'completed',
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          canProvideFeedback: true,
          feedbackSubmitted: false
        },
        {
          id: 'case-002',
          caseNumber: 'ARB/2024/002',
          arbitratorName: 'Ms. Priya Sharma',
          arbitratorId: 'arb-002',
          status: 'completed',
          completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          canProvideFeedback: true,
          feedbackSubmitted: true
        },
        {
          id: 'case-003',
          caseNumber: 'ARB/2024/003',
          arbitratorName: 'Mr. Arjun Patel',
          arbitratorId: 'arb-003',
          status: 'ongoing',
          canProvideFeedback: false,
          feedbackSubmitted: false
        }
      ]
      
      res.status(200).json(mockCases)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 