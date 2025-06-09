import DashboardLayout from '@/components/admin/dashboard-layout'
import CaseForm from '@/components/admin/case-form'

export const metadata = {
  title: 'Add New Case - Admin Portal',
  description: 'Create a new arbitration case in the system'
}

export default function NewCasePage() {
  return (
    <DashboardLayout>
      <CaseForm />
    </DashboardLayout>
  )
} 