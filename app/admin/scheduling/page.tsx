import DashboardLayout from '@/components/admin/dashboard-layout'
import SchedulingManagement from '@/components/admin/scheduling-management'

export const metadata = {
  title: 'Scheduling - Admin Portal',
  description: 'Manage hearings and scheduling in the arbitration system'
}

export default function SchedulingPage() {
  return (
    <DashboardLayout>
      <SchedulingManagement />
    </DashboardLayout>
  )
} 