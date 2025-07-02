"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { auth } from '@/lib/api'
import { toast } from 'sonner'

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function DashboardLayoutClient({
  children,
  showHeader = true,
  showFooter = true,
}: DashboardLayoutClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Enable bypassing auth check in development/preview
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }
        
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
        
        // Use the error message from the API if available
        const errorMessage = error.message || 'Your session has expired. Please log in again.'
        toast.error(errorMessage)
        
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

  // Only render content if authenticated
  return isAuthenticated ? (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  ) : null
} 