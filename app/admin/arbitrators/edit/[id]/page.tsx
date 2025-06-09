import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import ArbitratorForm from '@/components/admin/arbitrator-form'

export const metadata: Metadata = {
  title: 'Edit Arbitrator',
  description: 'Update arbitrator information'
}

export default function EditArbitratorPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <ArbitratorForm />
    </DashboardLayout>
  )
} 