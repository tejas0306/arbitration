import DashboardLayout from '@/components/admin/dashboard-layout'
import AnalyticsDashboard from '@/components/admin/analytics-dashboard'

export const metadata = {
  title: 'Analytics - Admin Portal',
  description: 'Analytics and reporting for the arbitration system'
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  )
} 