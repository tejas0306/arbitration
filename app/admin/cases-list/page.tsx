import DashboardLayout from '@/components/admin/dashboard-layout'
import CasesManagement from '@/components/admin/cases-management'

export const metadata = {
  title: 'Cases Management - Admin Portal',
  description: 'Manage all arbitration cases in the system'
}

export default function AdminCasesPage() {
  return (
    <DashboardLayout>
      <CasesManagement />
    </DashboardLayout>
  )
} 