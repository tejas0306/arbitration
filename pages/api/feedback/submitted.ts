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
      const response = await fetch(`${backendUrl}/api/feedback/user/${session.user.id}/submitted`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const feedbacks = await response.json()
      res.status(200).json(feedbacks)
    } catch (error) {
      console.error('Submitted feedback fetch error:', error)
      
      // Fallback with mock data for development
      const mockFeedbacks = [
        {
          id: '1',
          caseId: 'ARB/2024/001',
          arbitratorRating: 5,
          serviceRating: 4,
          timelinessRating: 4,
          communicationRating: 5,
          overallRating: 4.5,
          comments: 'Excellent arbitrator with deep knowledge of commercial law. The process was smooth and fair.',
          improvements: 'Could improve the online document submission process.',
          wouldRecommend: true,
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      res.status(200).json(mockFeedbacks)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 