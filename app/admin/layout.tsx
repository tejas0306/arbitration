import { Metadata } from 'next'
import ProtectedRoute from '@/components/protected-route'
import DashboardLayout from '@/components/admin/dashboard-layout'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin Portal',
    default: 'Admin Portal - Arbitration System'
  },
  description: 'Administrative portal for managing arbitration cases and system configuration'
}

// Client component to handle redirects
"use client"
import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Only run after auth state is loaded
    if (isLoading) return
    
    console.log('AdminLayout - Checking access', {
      isAuthenticated,
      role: user?.role,
      isAdmin: user?.role === 'ADMIN'
    })
    
    // If authenticated but not admin, redirect to dashboard
    if (isAuthenticated && user && user.role !== 'ADMIN') {
      console.log('AdminLayout - Not admin, redirecting to dashboard')
      window.location.href = '/dashboard'
    }
  }, [isAuthenticated, user, isLoading])
  
  // If still loading, return loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  // If not authenticated or is admin, continue with protected route
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
} 