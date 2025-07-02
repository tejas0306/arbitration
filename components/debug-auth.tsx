'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiUrl } from '@/lib/config'

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, check the debug endpoint
      const debugResponse = await fetch(getApiUrl('api/debug/auth'), {
        credentials: 'include' // Include cookies
      })
      
      const debugData = await debugResponse.json()
      
      // Then try the arbitrators endpoint
      const arbitratorsResponse = await fetch(getApiUrl('api/arbitrators'), {
        credentials: 'include' // Include cookies
      })
      
      let arbitratorsData
      try {
        arbitratorsData = await arbitratorsResponse.json()
      } catch (e) {
        arbitratorsData = { error: 'Failed to parse JSON response' }
      }
      
      setDebugInfo({
        debug: debugData,
        arbitrators: {
          status: arbitratorsResponse.status,
          ok: arbitratorsResponse.ok,
          data: arbitratorsData
        }
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testAuth} 
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </Button>
        
        {error && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {debugInfo && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Debug Endpoint</h3>
            <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
              {JSON.stringify(debugInfo.debug, null, 2)}
            </pre>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Arbitrators Endpoint</h3>
            <div className="mb-2">
              <span className="font-medium">Status:</span> {debugInfo.arbitrators.status}
              <span className="ml-2">({debugInfo.arbitrators.ok ? 'OK' : 'Failed'})</span>
            </div>
            <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
              {JSON.stringify(debugInfo.arbitrators.data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 