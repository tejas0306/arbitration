import { Suspense } from 'react'
import HomePageClient from '@/components/home-page-client'

export const metadata = {
  title: 'Arbitration Portal - Simplified Dispute Resolution',
  description: 'Our online arbitration platform provides a faster, more affordable alternative to traditional litigation with expert arbitrators.',
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <HomePageClient />
    </Suspense>
  )
}
