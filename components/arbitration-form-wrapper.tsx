"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ArbitrationForm from "@/components/arbitration-form"
import { auth } from "@/lib/api"
import { toast } from "sonner"

export default function ArbitrationFormWrapper() {
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
        
        // Check if token exists
        if (!auth.isAuthenticated()) {
          toast.error('Please log in to access this feature')
          router.push('/auth/login')
          return
        }
        
        // Verify token by getting current user
        const user = await auth.getCurrentUser()
        setIsAuthenticated(true)
      } catch (error: any) {
        toast.error('Session expired. Please log in again.')
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

  // Only render form if authenticated
  return isAuthenticated ? <ArbitrationForm /> : null
} 