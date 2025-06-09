"use client"

import React, { useEffect, useState } from 'react'
import { useApiLoader } from '@/hooks/use-api-loader'

export function ApiProgressBar() {
  const { isLoading } = useApiLoader()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let progressInterval: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout

    if (isLoading) {
      setVisible(true)
      setProgress(10) // Start with a small progress

      // Simulate progress while loading
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // Slowly increase progress but never reach 100%
          if (prevProgress < 90) {
            return prevProgress + (90 - prevProgress) * 0.1
          }
          return prevProgress
        })
      }, 300)
    } else {
      // When loading finishes, quickly complete the progress
      setProgress(100)
      
      // Hide after animation completes
      timeoutId = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }

    return () => {
      clearInterval(progressInterval)
      clearTimeout(timeoutId)
    }
  }, [isLoading])

  if (!visible && progress === 0) {
    return null
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[9999]"
      style={{ 
        pointerEvents: 'none',
      }}
    >
      <div 
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.7), 0 0 5px rgba(37, 99, 235, 0.5)',
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
} 