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
  refreshUserState: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Function to refresh user state from localStorage
  const refreshUserState = () => {
    if (!mounted) return
    
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log('User state refreshed:', parsedUser)
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }
  }
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    if (!mounted) return // Don't run until mounted on client
    
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Skip auth check in development if needed
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
          console.log('Skipping auth verification in development')
          // Even when skipping verification, try to load user from localStorage
          refreshUserState()
          setIsLoading(false)
          return
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          setUser(null)
          setIsLoading(false)
          return
        }
        
        // Try to use stored user first
        refreshUserState()
        
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
          if (!user) {
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
  }, [mounted])
  
  // Login function
  const login = async (email: string, password: string) => {
    if (!mounted) return // Don't run until mounted on client
    
    setIsLoading(true)
    try {
      const response = await auth.login({email, password})
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Set user state
      setUser(response.user)
      
      // Force a refresh of the user state to ensure role is properly recognized
      setTimeout(() => {
        refreshUserState()
      }, 100)
      
      // Force a full page reload by using window.location instead of router.push
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  // Logout function
  const logout = () => {
    if (!mounted) return // Don't run until mounted on client
    
    auth.logout()
    setUser(null)
    router.push('/auth/login')
  }
  
  // Register function
  const register = async (userData: any) => {
    if (!mounted) return // Don't run until mounted on client
    
    setIsLoading(true)
    try {
      const response = await auth.register(userData)
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Set user state
      setUser(response.user)
      
      // Force a refresh of the user state
      setTimeout(() => {
        refreshUserState()
      }, 100)
      
      // Force a full page reload by using window.location instead of router.push
      window.location.href = '/dashboard'
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
        isLoading: isLoading || !mounted, // Keep loading until mounted and auth check complete
        isAuthenticated: mounted && !!user, // Only consider authenticated if mounted and user exists
        login,
        logout,
        register,
        refreshUserState
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