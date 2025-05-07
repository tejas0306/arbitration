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
        // Skip auth check in development if needed
        if (process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true') {
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
        
        // Verify token by getting current user
        const userData = await auth.getCurrentUser()
        setUser(userData)
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
      const response = await auth.login(email, password)
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      throw error
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