import { Suspense } from 'react'
import LoginClient from '@/components/login-client'

export const metadata = {
  title: 'Login - Arbitration Portal',
  description: 'Sign in to your Arbitration Portal account'
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <LoginClient />
    </Suspense>
  )
}