"use client"

import React, { createContext, useState, useContext, useEffect } from 'react'
import { auth } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Skip auth check in development if needed
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          console.log('Skipping auth verification in development')
          // Even when skipping verification, try to load user from localStorage
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser))
            } catch (e) {
              console.error('Error parsing stored user:', e)
            }
          }
          setIsLoading(false)
          return
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('user')
        
        if (!token) {
          setUser(null)
          setIsLoading(false)
          return
        }
        
        // Try to use stored user first
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            console.error('Error parsing stored user:', e)
          }
        }
        
        // Verify token by getting current user from API
        try {
          const userData = await auth.getCurrentUser()
          if (userData) {
            setUser(userData)
            // Update localStorage with latest user data
            localStorage.setItem('user', JSON.stringify(userData))
          }
        } catch (error) {
          console.error('User verification failed:', error)
          // If API call fails but we have stored user, keep using that
          // Only clear if we couldn't parse stored user earlier
          if (!storedUser) {
            setUser(null)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Authentication error:', error)
        setUser(null)
        // Clear invalid token
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('Attempting login with email:', email)
      const response = await auth.login({email, password})
      
      if (!response || !response.token) {
        throw new Error('Login failed: No valid token received')
      }
      
      // Log successful login
      console.log('Login successful, token received')
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token)
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
      } else {
        // If no user object in response, try to get user info
        try {
          const userData = await auth.getCurrentUser()
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData))
            setUser(userData)
          }
        } catch (userError) {
          console.error('Error fetching user data after login:', userError)
          // Continue anyway, we can try to get user data on next page load
        }
      }
      
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Extract meaningful error message
      const errorMessage = error?.message || 'An unknown error occurred during login'
      
      // Re-throw with clear message for UI
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Logout function
  const logout = () => {
    auth.logout()
    setUser(null)
    router.push('/auth/login')
  }
  
  // Register function
  const register = async (userData: any) => {
    setIsLoading(true)
    try {
      const response = await auth.register(userData)
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}