import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import ArbitratorsManagement from '@/components/admin/arbitrators-management'

export const metadata: Metadata = {
  title: 'Arbitrator Management',
  description: 'Manage arbitrators in the system'
}

export default function ArbitratorsPage() {
  return (
    <DashboardLayout>
      <ArbitratorsManagement />
    </DashboardLayout>
  )
} 