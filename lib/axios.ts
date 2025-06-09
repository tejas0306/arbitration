import axios from 'axios'
import { startApiRequest, finishApiRequest } from '@/hooks/use-api-loader'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Start loading when a request is sent
    startApiRequest()

    // Get token from local storage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    // End loading if there's a request error
    finishApiRequest()
    return Promise.reject(error)
  }
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // End loading when a response is received
    finishApiRequest()
    return response
  },
  (error) => {
    // End loading when an error response is received
    finishApiRequest()
    return Promise.reject(error)
  }
)

export default api 