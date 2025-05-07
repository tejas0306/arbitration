import { Suspense } from 'react'
import PetitionClient from '@/components/petition-client'

export const metadata = {
  title: 'File Arbitration Petition - Arbitration Portal',
  description: 'Submit a new arbitration petition with all required details'
}

export default function PetitionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <PetitionClient />
    </Suspense>
  )
} 