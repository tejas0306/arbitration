import DashboardLayout from '@/components/admin/dashboard-layout'
import UserForm from '@/components/admin/user-form'

export const metadata = {
  title: 'Edit User - Admin Portal',
  description: 'Edit user details and permissions'
}

export default function EditUserPage() {
  return (
    <DashboardLayout>
      <UserForm />
    </DashboardLayout>
  )
} 