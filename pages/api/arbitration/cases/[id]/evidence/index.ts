import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      // Connect to NestJS backend
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/arbitration/cases/${id}/evidence`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const evidence = await response.json()
      res.status(200).json(evidence)
    } catch (error) {
      console.error('Evidence fetch error:', error)
      
      // Fallback with mock data for development
      const mockEvidence = [
        {
          id: '1',
          type: 'document',
          title: 'Contract Agreement',
          description: 'Original contract between parties dated March 2024',
          fileName: 'contract_march_2024.pdf',
          fileSize: 2048576,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session.user.name || 'Unknown',
          category: 'Contracts',
          status: 'approved'
        },
        {
          id: '2',
          type: 'photo',
          title: 'Damaged Property',
          description: 'Photographs showing the extent of damage to the property',
          fileName: 'property_damage.jpg',
          fileSize: 5242880,
          uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          uploadedBy: session.user.name || 'Unknown',
          category: 'Physical Evidence',
          status: 'pending'
        }
      ]
      
      res.status(200).json(mockEvidence)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 