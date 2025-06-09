import { Suspense } from 'react'
import ArbitratorForm from '@/components/admin/arbitrator-form'

export const metadata = {
  title: 'Edit Arbitrator - Arbitration Portal',
  description: 'Edit arbitrator details'
}

export default function EditArbitratorPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitratorForm />
    </Suspense>
  )
} 