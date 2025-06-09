"use client"

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import EditPetitionClient from '@/components/edit-petition-client'

export default function EditPetitionPage() {
  const params = useParams()
  const petitionId = params?.id as string

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading petition editor...</div>}>
      <EditPetitionClient petitionId={petitionId} />
    </Suspense>
  )
} 