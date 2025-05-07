import { Metadata } from 'next';
import AdminDashboardPage from '@/components/admin-dashboard-page';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Arbitration Portal',
  description: 'Manage users and arbitration cases',
};

export default function AdminPage() {
  return <AdminDashboardPage />;
} 