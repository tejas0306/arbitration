"use client"

import ProtectedRoute from '@/components/protected-route'
import SupportPortal from '@/components/support-portal'

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <SupportPortal />
        </main>
      </div>
    </ProtectedRoute>
  )
} 