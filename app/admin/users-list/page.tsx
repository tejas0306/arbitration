import DashboardLayout from '@/components/admin/dashboard-layout'
import UsersManagement from '@/components/admin/users-management'

export const metadata = {
  title: 'Users Management - Admin Portal',
  description: 'Manage users, arbitrators, and administrators in the arbitration system'
}

export default function UsersPage() {
  return (
    <DashboardLayout>
      <UsersManagement />
    </DashboardLayout>
  )
} 