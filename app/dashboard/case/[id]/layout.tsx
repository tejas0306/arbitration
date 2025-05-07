import { Suspense } from 'react'
import DashboardLayoutClient from '@/components/dashboard-layout-client'

export default function CaseDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </Suspense>
  )
} 