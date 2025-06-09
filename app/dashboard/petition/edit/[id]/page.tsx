"use client"

import { useParams } from 'next/navigation'
import EditPetitionClient from '@/components/edit-petition-client'
import DashboardLayoutClient from '@/components/dashboard-layout-client'

export default function EditPetitionPage() {
  const params = useParams()
  const petitionId = params?.id as string

  return (
    <DashboardLayoutClient showHeader={false} showFooter={false}>
      <div className="container mx-auto max-w-screen-xl py-4">
        <EditPetitionClient petitionId={petitionId} />
      </div>
    </DashboardLayoutClient>
  )
} 