import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import axios from 'axios'

// Get the API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Restrict to RESPONDENT role only
  if (session.user?.role !== 'RESPONDENT') {
    return res.status(403).json({ error: 'Access denied. Only respondents can submit responses.' })
  }

  const { id: caseId } = req.query

  if (req.method === 'POST') {
    try {
      console.log(`🔄 API Proxy - Response submission for case: ${caseId}`)
      
      // Set the target URL in the backend
      const targetUrl = `${API_URL}/arbitration/cases/${caseId}/response`
      console.log('🔄 Proxying request to:', targetUrl)
      
      // Pass along authorization headers
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || 'application/json',
      }

      // If it's multipart/form-data (file uploads), handle differently
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        console.log('🔄 Found multipart form data - proxying file upload')
        
        // For file uploads, redirect to backend directly
        res.setHeader('Location', targetUrl)
        return res.status(307).end()
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
    // Get response for a case (proxy to backend)
    try {
      console.log(`🔄 API Proxy - Get response for case: ${caseId}`)
      
      const targetUrl = `${API_URL}/arbitration/cases/${caseId}/response`
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
  } else if (req.method === 'DELETE') {
    // Withdraw response (proxy to backend)
    try {
      console.log(`🔄 API Proxy - Withdraw response for case: ${caseId}`)
      
      const targetUrl = `${API_URL}/arbitration/cases/${caseId}/response`
      const headers = {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      }

      const response = await axios.delete(targetUrl, { headers })
      return res.status(response.status).json(response.data)
      
    } catch (error) {
      console.error('🔄 Error proxying DELETE request to backend:', error)
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500
        const data = error.response?.data || { error: 'Backend service unavailable' }
        return res.status(status).json(data)
      }
      
      return res.status(500).json({ error: 'Failed to proxy request to backend' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
} 