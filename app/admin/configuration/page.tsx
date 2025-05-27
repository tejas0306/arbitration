import { Metadata } from 'next'
import DashboardLayout from '@/components/admin/dashboard-layout'
import ConfigurationManagement from '@/components/admin/configuration-management'

export const metadata: Metadata = {
  title: 'Configuration | Admin Portal',
  description: 'System configuration and settings management',
}

export default function ConfigurationPage() {
  return (
    <DashboardLayout>
      <ConfigurationManagement />
    </DashboardLayout>
  )
} 