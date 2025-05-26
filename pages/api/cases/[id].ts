import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import axios from 'axios'

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      console.log(`🔄 API Proxy - Get case details: ${id}`)
      
      // Set the target URL in the backend
      const targetUrl = `${API_URL}/arbitration/cases/${id}`
      console.log('🔄 Proxying request to:', targetUrl)
      
      // Pass along authorization headers
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      }

      const response = await axios.get(targetUrl, { headers })
      
      console.log('🔄 Backend response status:', response.status)
      return res.status(response.status).json(response.data)
      
    } catch (error) {
      console.error('🔄 Error proxying request to backend:', error)
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500
        const data = error.response?.data || { error: 'Backend service unavailable' }
        return res.status(status).json(data)
      }
      
      return res.status(500).json({ error: 'Failed to proxy request to backend' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
} 