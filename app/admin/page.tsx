import { Metadata } from 'next';
import DashboardLayout from '@/components/admin/dashboard-layout'
import DashboardHome from '@/components/admin/dashboard-home'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Arbitration Portal',
  description: 'Administrative dashboard for managing arbitration cases, users, and system configuration'
};

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  )
} 