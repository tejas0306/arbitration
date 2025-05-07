"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { toast } from 'sonner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Check if token exists and is valid
        if (!auth.isAuthenticated()) {
          toast.error('Please log in to access this feature')
          router.push('/auth/login')
          return
        }
        
        // Verify token by getting current user
        const user = await auth.getCurrentUser()
        setIsAuthenticated(true)
      } catch (error: any) {
        console.error('Authentication error:', error)
        
        // Use the error message from the API if available
        const errorMessage = error.message || 'Your session has expired. Please log in again.'
        toast.error(errorMessage)
        
        // No need to manually clear tokens here, auth.getCurrentUser will handle that
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null
}