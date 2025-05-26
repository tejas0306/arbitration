import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import axios from 'axios'

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Restrict to ARBITRATOR role only
  if (session.user?.role !== 'ARBITRATOR') {
    return res.status(403).json({ error: 'Access denied. Only arbitrators can submit disclosures.' })
  }

  const { id: caseId } = req.query

  if (req.method === 'POST') {
    try {
      console.log(`🔄 API Proxy - Arbitrator disclosure submission for case: ${caseId}`)
      
      // Set the target URL in the backend
      const targetUrl = `${API_URL}/arbitrator/cases/${caseId}/disclosure`
      console.log('🔄 Proxying request to:', targetUrl)
      
      // Pass along authorization headers
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      }

      // For regular JSON data, forward the request
      const response = await axios.post(targetUrl, req.body, { headers })
      
      console.log('🔄 Backend response status:', response.status)
      return res.status(response.status).json(response.data)

    } catch (error) {
      console.error('🔄 Error proxying POST request to backend:', error)
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500
        const data = error.response?.data || { error: 'Backend service unavailable' }
        return res.status(status).json(data)
      }
      
      return res.status(500).json({ error: 'Failed to proxy request to backend' })
    }
  } else if (req.method === 'GET') {
    // Get disclosure for a case (proxy to backend)
    try {
      console.log(`🔄 API Proxy - Get disclosure for case: ${caseId}`)
      
      const targetUrl = `${API_URL}/arbitrator/cases/${caseId}/disclosure`
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      }

      const response = await axios.get(targetUrl, { headers })
      return res.status(response.status).json(response.data)
      
    } catch (error) {
      console.error('🔄 Error proxying GET request to backend:', error)
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500
        const data = error.response?.data || { error: 'Backend service unavailable' }
        return res.status(status).json(data)
      }
      
      return res.status(500).json({ error: 'Failed to proxy request to backend' })
    }
  } else if (req.method === 'PUT') {
    // Update disclosure (proxy to backend)
    try {
      console.log(`🔄 API Proxy - Update disclosure for case: ${caseId}`)
      
      const targetUrl = `${API_URL}/arbitrator/cases/${caseId}/disclosure`
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      }

      const response = await axios.put(targetUrl, req.body, { headers })
      return res.status(response.status).json(response.data)
      
    } catch (error) {
      console.error('🔄 Error proxying PUT request to backend:', error)
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500
        const data = error.response?.data || { error: 'Backend service unavailable' }
        return res.status(status).json(data)
      }
      
      return res.status(500).json({ error: 'Failed to proxy request to backend' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
} 