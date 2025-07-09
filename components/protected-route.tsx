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

// Helper function to get the appropriate dashboard URL based on user role
function getDashboardUrl(userRole: string): string {
  switch (userRole?.toUpperCase()) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'CASE_MANAGER':
      return '/case-manager/dashboard';
    case 'ARBITRATOR':
      return '/arbitrator/dashboard';
    case 'TEAM_MEMBER':
      return '/team-member/dashboard';
    case 'RESPONDENT':
      return '/respondent/dashboard';
    case 'CLAIMANT':
    default:
      return '/dashboard'; // Claimant uses the main dashboard
  }
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
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
        
        // Enable bypassing auth check in development/preview
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          setHasAccess(true)
          setIsLoading(false)
          return
        }
        
        // Check if user is authenticated - use either custom auth or NextAuth
        const isUserAuthenticated = isAuthenticated || sessionStatus === 'authenticated'
        const currentUser = user || session?.user
        
        if (!isUserAuthenticated || !currentUser) {
          toast.error('Please log in to access this feature')
          router.push('/auth/login')
          return
        }
        
        // Check role-based access if required
        if (requiredRole) {
          const userRole = (currentUser.role as string)?.toLowerCase()
          const required = requiredRole.toLowerCase()
          
          if (userRole !== required && userRole !== 'admin') {
            toast.error(`Access denied. This section requires ${requiredRole} privileges.`)
            // Redirect to user's appropriate dashboard
            const dashboardUrl = getDashboardUrl(currentUser.role as string)
            router.push(dashboardUrl)
            return
          }
        }
        
        setHasAccess(true)
      } catch (error: any) {
        toast.error('Access verification failed')
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, requiredRole, authLoading, isAuthenticated, user, session, sessionStatus])

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