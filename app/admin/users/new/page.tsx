import DashboardLayout from '@/components/admin/dashboard-layout'
import UserForm from '@/components/admin/user-form'

export const metadata = {
  title: 'Add New User - Admin Portal',
  description: 'Add a new user to the arbitration system'
}

export default function NewUserPage() {
  return (
    <DashboardLayout>
      <UserForm />
    </DashboardLayout>
  )
} 