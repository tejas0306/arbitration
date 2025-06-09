import { Suspense } from 'react'
import ArbitratorDetail from '@/components/admin/arbitrator-detail'

export const metadata = {
  title: 'Arbitrator Details - Arbitration Portal',
  description: 'View arbitrator details and performance'
}

export default function ArbitratorDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitratorDetail />
    </Suspense>
  )
} 