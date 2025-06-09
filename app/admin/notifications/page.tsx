import DashboardLayout from '@/components/admin/dashboard-layout'
import NotificationsManagement from '@/components/admin/notifications-management'

export const metadata = {
  title: 'Notifications - Admin Portal',
  description: 'View and manage your notifications'
}

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationsManagement />
    </DashboardLayout>
  )
} 