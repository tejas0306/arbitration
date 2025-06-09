import { Suspense } from 'react'
import ArbitratorForm from '@/components/admin/arbitrator-form'

export const metadata = {
  title: 'Add New Arbitrator - Arbitration Portal',
  description: 'Add a new arbitrator to the system'
}

export default function NewArbitratorPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitratorForm />
    </Suspense>
  )
} 