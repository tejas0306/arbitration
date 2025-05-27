import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import HelpDeskManagement from '@/components/admin/helpdesk-management'

export const metadata: Metadata = {
  title: 'Help Desk - Admin Portal',
  description: 'Manage help desk tickets and user support requests'
}

export default function HelpDeskPage() {
  return (
    <DashboardLayout>
      <HelpDeskManagement />
    </DashboardLayout>
  )
} 