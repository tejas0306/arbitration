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
      const response = await fetch(`${backendUrl}/api/notices/user/${session.user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const notices = await response.json()
      res.status(200).json(notices)
    } catch (error) {
      console.error('Notices fetch error:', error)
      
      // Fallback with mock data for development
      const mockNotices = [
        {
          id: '1',
          caseId: 'case-001',
          caseNumber: 'ARB/2024/001',
          title: 'Case Filing Notice',
          type: 'case_notice',
          priority: 'high',
          content: 'A new arbitration case has been filed against you. Please review the details and submit your response within 30 days.',
          issuedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'unread',
          requiresResponse: true,
          issuedBy: 'Case Manager'
        },
        {
          id: '2',
          caseId: 'case-002',
          caseNumber: 'ARB/2024/002',
          title: 'Payment Reminder',
          type: 'payment_reminder',
          priority: 'medium',
          content: 'Your arbitrator fee payment is due. Please complete the payment to proceed with the case.',
          issuedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'read',
          requiresResponse: false,
          issuedBy: 'Finance Team'
        },
        {
          id: '3',
          caseId: 'case-003',
          caseNumber: 'ARB/2024/003',
          title: 'Document Submission Request',
          type: 'document_request',
          priority: 'urgent',
          content: 'Please submit the requested supporting documents for your case within 15 days.',
          issuedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'unread',
          requiresResponse: true,
          issuedBy: 'Arbitrator'
        }
      ]
      
      res.status(200).json(mockNotices)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 