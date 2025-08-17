import { Suspense } from 'react'
import ArbitratorsManagement from '@/components/admin/arbitrators-management'

export const metadata = {
  title: 'Arbitrators Management - Arbitration Portal',
  description: 'View and manage arbitrators'
}

export default function ArbitratorsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitratorsManagement />
    </Suspense>
  )
} 