import DashboardLayout from '@/components/admin/dashboard-layout'
import CaseView from '@/components/admin/case-view'

export const metadata = {
  title: 'Case Details - Admin Portal',
  description: 'View and manage case details'
}

export default function CaseDetailPage() {
  return (
    <DashboardLayout>
      <CaseView />
    </DashboardLayout>
  )
} 