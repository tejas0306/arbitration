"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { auth, setLogoutCallback } from "@/lib/api"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Setup the logout callback
  useEffect(() => {
    setLogoutCallback(() => {
      setUser(null)
      router.push("/auth/login")
    })
  }, [router])

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      setIsLoading(true)
      
      try {
        // First check if we have a valid token
        if (!auth.isAuthenticated()) {
          setIsLoading(false)
          return
        }
        
        // Try to get user data from localStorage first for quick loading
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            // Invalid user data, will fetch from server instead
            console.error("Error parsing stored user:", e)
          }
        }
        
        // Validate the token by fetching current user from server
        const userData = await auth.getCurrentUser()
        
        // Update user data with latest from server
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
      } catch (error) {
        console.error("Auth check error:", error)
        // Clear auth data
        auth.logout()
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = (token: string, userData: User) => {
    // Use the token and user data provided by the login API
    setUser(userData)
    
    // No need to set auth_token here as it will be handled by the auth.login() function
    // This function should be called after auth.login() is successful
  }

  const logout = () => {
    auth.logout()
    setUser(null)
    router.push("/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}