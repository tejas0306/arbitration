import { Suspense } from 'react'
import LoginClient from '@/components/login-client'
import ClientOnly from '@/components/client-only'

export const metadata = {
  title: 'Login - Arbitration Portal',
  description: 'Sign in to your Arbitration Portal account'
}

export default function LoginPage() {
  return (
    <ClientOnly 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="w-full max-w-md">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl text-center font-semibold leading-none tracking-tight">Login</h3>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="block text-sm font-medium">Email</div>
                    <div className="h-10 bg-gray-100 rounded border animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="block text-sm font-medium">Password</div>
                    <div className="h-10 bg-gray-100 rounded border animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don't have an account?{" "}
                  <span className="text-blue-600">Register</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <LoginClient />
      </Suspense>
    </ClientOnly>
  )
}