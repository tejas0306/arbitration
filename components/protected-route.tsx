"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true)
        
        // Wait for auth context to finish loading
        if (authLoading) {
          return
        }
        
        // Enable bypassing auth check in development/preview
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          setHasAccess(true)
          setIsLoading(false)
          return
        }
        
        // Check if user is authenticated
        if (!isAuthenticated || !user) {
          toast.error('Please log in to access this feature')
          router.push('/auth/login')
          return
        }
        
        // Check role-based access if required
        if (requiredRole) {
          const userRole = user.role?.toLowerCase()
          const required = requiredRole.toLowerCase()
          
          if (userRole !== required && userRole !== 'admin') {
            toast.error(`Access denied. This section requires ${requiredRole} privileges.`)
            router.push('/dashboard')
            return
          }
        }
        
        setHasAccess(true)
      } catch (error: any) {
        console.error('Access check error:', error)
        toast.error('Access verification failed')
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, requiredRole, authLoading, isAuthenticated, user])

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Only render children if user has access
  return hasAccess ? <>{children}</> : null
}