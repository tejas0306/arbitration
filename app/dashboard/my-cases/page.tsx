import { Suspense } from 'react'
import MyCasesClient from '@/components/my-cases-client'

export const metadata = {
  title: 'My Cases - Arbitration Portal',
  description: 'View and manage your arbitration cases',
}

export default function MyCasesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <MyCasesClient />
    </Suspense>
  )
} 