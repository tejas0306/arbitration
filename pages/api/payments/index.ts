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
      const response = await fetch(`${backendUrl}/api/payments/user/${session.user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }

      const payments = await response.json()
      res.status(200).json(payments)
    } catch (error) {
      console.error('Payment fetch error:', error)
      
      // Fallback with mock data for development
      const mockPayments = [
        {
          id: '1',
          caseId: 'case-001',
          caseNumber: 'ARB/2024/001',
          paymentType: 'filing_fee',
          amount: 50000,
          currency: '₹',
          status: 'completed',
          paymentMethod: 'Credit Card',
          transactionId: 'TXN-20241225-001',
          paidAt: new Date().toISOString(),
          description: 'Filing fee for arbitration case ARB/2024/001',
          invoiceUrl: '/api/payments/1/invoice',
          receiptUrl: '/api/payments/1/receipt'
        },
        {
          id: '2',
          caseId: 'case-002',
          caseNumber: 'ARB/2024/002',
          paymentType: 'arbitrator_fee',
          amount: 125000,
          currency: '₹',
          status: 'pending',
          paymentMethod: 'Bank Transfer',
          transactionId: 'TXN-20241224-002',
          paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          description: 'Arbitrator fee for case ARB/2024/002',
          invoiceUrl: '/api/payments/2/invoice',
          receiptUrl: null
        },
        {
          id: '3',
          caseId: 'case-003',
          caseNumber: 'ARB/2024/003',
          paymentType: 'administrative_fee',
          amount: 25000,
          currency: '₹',
          status: 'completed',
          paymentMethod: 'UPI',
          transactionId: 'TXN-20241220-003',
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Administrative fee for case processing',
          invoiceUrl: '/api/payments/3/invoice',
          receiptUrl: '/api/payments/3/receipt'
        }
      ]
      
      res.status(200).json(mockPayments)
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: 'Method not allowed' })
  }
} 