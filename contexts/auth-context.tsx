"use client"

import React, { createContext, useState, useContext, useEffect, useRef } from 'react'
import { auth } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

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

// Helper function to set user data in both localStorage and cookie
const setUserData = (user: User) => {
  // Store in localStorage for the app
  localStorage.setItem('user', JSON.stringify(user))
  
  // Store in cookie for middleware access (limit to essential fields for security)
  const cookieData = {
    id: user.id,
    email: user.email,
    role: user.role
  }
  Cookies.set('user_data', JSON.stringify(cookieData), { expires: 1, path: '/' }) // 1 day expiry
  
  console.log('User data stored in cookie and localStorage', {
    id: user.id,
    role: user.role
  })
}

// Helper function to clear user data from both storage locations
const clearUserData = () => {
  localStorage.removeItem('user')
  Cookies.remove('user_data', { path: '/' })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const refreshedRef = useRef(false)
  const router = useRouter()
  
  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Function to refresh user state from localStorage
  const refreshUserState = () => {
    if (!mounted) return
    
    // Skip if we've already refreshed in this component lifecycle
    if (refreshedRef.current) return
    
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        
        // Debug the user role before setting state
        console.log('Auth Context - Refreshing user state:', {
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role,
          isAdmin: parsedUser.role === 'ADMIN'
        })
        
        setUser(parsedUser)
        
        // Update the cookie with the latest user data
        setUserData(parsedUser)
        
        refreshedRef.current = true
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }
  }
  
  // Reset the refreshed flag when component unmounts
  useEffect(() => {
    return () => {
      refreshedRef.current = false
    }
  }, [])
  
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
          clearUserData()
          setIsLoading(false)
          return
        }
        
        // Try to use stored user first
        refreshUserState()
        
        // Verify token by getting current user from API
        try {
          const userData = await auth.getCurrentUser()
          if (userData) {
            console.log('Auth Context - User data from API:', {
              name: userData.name,
              email: userData.email,
              role: userData.role,
              isAdmin: userData.role === 'ADMIN'
            })
            
            setUser(userData)
            
            // Update both localStorage and cookie with latest user data
            setUserData(userData)
          }
        } catch (error) {
          console.error('User verification failed:', error)
          // If API call fails but we have stored user, keep using that
          // Only clear if we couldn't parse stored user earlier
          if (!user) {
            setUser(null)
            localStorage.removeItem('auth_token')
            clearUserData()
          }
        }
      } catch (error) {
        console.error('Authentication error:', error)
        setUser(null)
        localStorage.removeItem('auth_token')
        clearUserData()
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [mounted, user])
  
  // Login function
  const login = async (email: string, password: string) => {
    if (!mounted) return // Don't run until mounted on client
    
    setIsLoading(true)
    try {
      const response = await auth.login({email, password})
      
      // Debug the response
      console.log('Auth Context - Login response:', {
        user: {
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          isAdmin: response.user.role === 'ADMIN'
        },
        hasToken: !!response.token
      })
      
      // Store token
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('token_expiry', JSON.stringify(Date.now() + (24 * 60 * 60 * 1000)))
      
      // Store user data in both localStorage and cookie
      setUserData(response.user)
      
      // Set user state directly - no need for a second refresh
      setUser(response.user)
      refreshedRef.current = true
      
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
    clearUserData()
    router.push('/auth/login')
  }
  
  // Register function
  const register = async (userData: any) => {
    if (!mounted) return // Don't run until mounted on client
    
    setIsLoading(true)
    try {
      const response = await auth.register(userData)
      
      // Debug the response
      console.log('Auth Context - Register response:', {
        user: {
          name: response.user.name,
          email: response.user.email,
          role: response.user.role
        },
        hasToken: !!response.token
      })
      
      // Store token
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('token_expiry', JSON.stringify(Date.now() + (24 * 60 * 60 * 1000)))
      
      // Store user data in both localStorage and cookie
      setUserData(response.user)
      
      // Set user state directly - no need for a second refresh
      setUser(response.user)
      refreshedRef.current = true
      
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