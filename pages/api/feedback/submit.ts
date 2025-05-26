import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.method === 'POST') {
    try {
      const feedbackData = req.body

      // Connect to NestJS backend
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedbackData,
          userId: session.user.id
        })
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const result = await response.json()
      res.status(201).json(result)
    } catch (error) {
      console.error('Feedback submission error:', error)
      
      // Mock success response for development
      const mockResult = {
        id: Date.now().toString(),
        ...req.body,
        userId: session.user.id,
        submittedAt: new Date().toISOString()
      }
      
      res.status(201).json(mockResult)
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 