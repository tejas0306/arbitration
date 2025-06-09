import { useState, useEffect, useCallback } from 'react'

// Global loading state to track API requests across the application
let activeRequests = 0
const listeners: Array<(isLoading: boolean) => void> = []

// Function to update all listeners
const updateListeners = (isLoading: boolean) => {
  listeners.forEach(listener => listener(isLoading))
}

// Function to increment active requests
export const startApiRequest = () => {
  activeRequests++
  updateListeners(activeRequests > 0)
}

// Function to decrement active requests
export const finishApiRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1)
  updateListeners(activeRequests > 0)
}

// Hook for components to use
export function useApiLoader() {
  const [isLoading, setIsLoading] = useState(activeRequests > 0)

  // Subscribe to loading state changes
  useEffect(() => {
    const handleLoadingChange = (loading: boolean) => {
      setIsLoading(loading)
    }

    // Add this component as a listener
    listeners.push(handleLoadingChange)

    // Set initial state
    setIsLoading(activeRequests > 0)

    // Cleanup
    return () => {
      const index = listeners.indexOf(handleLoadingChange)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  // Function to wrap API calls with loading state
  const withLoading = useCallback(async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      startApiRequest()
      return await apiCall()
    } finally {
      finishApiRequest()
    }
  }, [])

  return { isLoading, withLoading, startApiRequest, finishApiRequest }
} 