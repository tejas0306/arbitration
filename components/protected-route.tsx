"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useSession } from 'next-auth/react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, refreshUserState } = useAuth()
  const { data: session, status: sessionStatus } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true)
        
        // Wait for auth context to finish loading
        if (authLoading || sessionStatus === 'loading') {
          return
        }
        
        // Force refresh user state to ensure we have the latest role info
        refreshUserState()
        
        // Enable bypassing auth check in development/preview
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          console.log('Skipping auth verification in development');
          setHasAccess(true)
          setIsLoading(false)
          return
        }
        
        // Check if user is authenticated - use either custom auth or NextAuth
        const isUserAuthenticated = isAuthenticated || sessionStatus === 'authenticated'
        const currentUser = user || session?.user
        
        if (!isUserAuthenticated || !currentUser) {
          console.log('Not authenticated, redirecting to login');
          toast.error('Please log in to access this feature')
          router.push('/auth/login')
          return
        }
        
        // Check role-based access if required
        if (requiredRole) {
          // Case-sensitive role check
          const userRole = currentUser.role || ''
          
          // For admin routes, strictly check for ADMIN role
          if (requiredRole.toLowerCase() === 'admin' && userRole !== 'ADMIN') {
            console.log(`Access denied. User role: ${userRole}, Required: ADMIN`);
            toast.error('Access denied. This section requires administrator privileges.')
            
            // If the user is authenticated but not an admin, redirect to dashboard
            // instead of login page
            router.push('/dashboard')
            return
          }
          
          // For other role checks
          if (requiredRole.toLowerCase() !== 'admin' && 
              userRole !== requiredRole && 
              userRole !== 'ADMIN') {
            console.log(`Access denied. User role: ${userRole}, Required: ${requiredRole}`);
            toast.error(`Access denied. This section requires ${requiredRole} privileges.`)
            
            // If user is authenticated but doesn't have the required role,
            // redirect to dashboard instead of login
            router.push('/dashboard')
            return
          }
        }
        
        console.log('Access granted to protected route');
        setHasAccess(true)
      } catch (error: any) {
        console.error('Access check error:', error)
        toast.error('Access verification failed')
        
        // Check if user is authenticated but there was an error with role verification
        if (isAuthenticated) {
          router.push('/dashboard')
        } else {
          router.push('/auth/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, requiredRole, authLoading, isAuthenticated, user, session, sessionStatus, refreshUserState])

  if (isLoading || authLoading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Only render children if user has access
  return hasAccess ? <>{children}</> : null
}