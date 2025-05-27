// API Configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${config.apiUrl}/${cleanEndpoint}`
} 