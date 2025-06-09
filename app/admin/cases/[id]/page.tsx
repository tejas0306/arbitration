import DashboardLayout from '@/components/admin/dashboard-layout'
import CaseForm from '@/components/admin/case-form'

export const metadata = {
  title: 'Case Details - Admin Portal',
  description: 'View and manage case details'
}

export default function CaseDetailPage() {
  return (
    <DashboardLayout>
      <CaseForm />
    </DashboardLayout>
  )
} 