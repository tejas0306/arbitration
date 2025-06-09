import { Suspense } from 'react'
import DashboardLayoutClient from '@/components/dashboard-layout-client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  )
} 