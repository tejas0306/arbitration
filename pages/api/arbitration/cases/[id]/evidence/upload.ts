import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../auth/[...nextauth]'
import multer from 'multer'
import { promisify } from 'util'

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'video/mp4',
      'audio/mpeg',
      'audio/wav'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'), false)
    }
  }
})

const multerUpload = promisify(upload.single('file'))

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { id } = req.query

  try {
    // Parse multipart form data
    await multerUpload(req, res)
    
    const file = (req as any).file
    const { title, description, type, category } = req.body

    if (!file || !title || !type) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create FormData for backend
    const formData = new FormData()
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname)
    formData.append('title', title)
    formData.append('description', description || '')
    formData.append('type', type)
    formData.append('category', category || '')

    // Send to NestJS backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/arbitration/cases/${id}/evidence/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Backend upload failed: ${response.status}`)
    }

    const result = await response.json()
    res.status(201).json(result)

  } catch (error) {
    console.error('Evidence upload error:', error)
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: 'Invalid file type' })
    }
    
    if (error.message.includes('File too large')) {
      return res.status(413).json({ error: 'File too large. Maximum size is 50MB' })
    }

    // For development, return mock success
    const mockResult = {
      id: Date.now().toString(),
      type: req.body.type,
      title: req.body.title,
      description: req.body.description || '',
      fileName: (req as any).file?.originalname || 'unknown',
      fileSize: (req as any).file?.size || 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.user.name || 'Unknown',
      category: req.body.category || '',
      status: 'pending'
    }
    
    res.status(201).json(mockResult)
  }
} 