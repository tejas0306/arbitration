import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import ArbitratorForm from '@/components/admin/arbitrator-form'

export const metadata: Metadata = {
  title: 'Add New Arbitrator',
  description: 'Register a new arbitrator in the system'
}

export default function NewArbitratorPage() {
  return (
    <DashboardLayout>
      <ArbitratorForm />
    </DashboardLayout>
  )
} 