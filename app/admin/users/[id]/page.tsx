import DashboardLayout from '@/components/admin/dashboard-layout'
import UserForm from '@/components/admin/user-form'

export const metadata = {
  title: 'User Details - Admin Portal',
  description: 'View and manage user details'
}

export default function UserDetailPage() {
  return (
    <DashboardLayout>
      <UserForm />
    </DashboardLayout>
  )
} 