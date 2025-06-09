import DashboardLayout from '@/components/admin/dashboard-layout'
import CaseForm from '@/components/admin/case-form'

export const metadata = {
  title: 'Edit Case - Admin Portal',
  description: 'Edit case details and status'
}

export default function EditCasePage() {
  return (
    <DashboardLayout>
      <CaseForm />
    </DashboardLayout>
  )
} 