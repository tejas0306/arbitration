import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import ArbitratorDetail from '@/components/admin/arbitrator-detail'

export const metadata: Metadata = {
  title: 'Arbitrator Details',
  description: 'View detailed information about an arbitrator'
}

export default function ArbitratorDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <ArbitratorDetail arbitratorId={params.id} />
    </DashboardLayout>
  )
} 