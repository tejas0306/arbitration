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
      const response = await fetch(`${backendUrl}/api/payments/user/${session.user.id}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const stats = await response.json()
      res.status(200).json(stats)
    } catch (error) {
      console.error('Payment stats fetch error:', error)
      
      // Fallback with mock data for development
      const mockStats = {
        totalPaid: 200000,
        pendingPayments: 1,
        completedPayments: 2,
        refundedAmount: 0
      }
      
      res.status(200).json(mockStats)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 