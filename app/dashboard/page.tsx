import { Metadata } from 'next';
import DashboardPage from '@/components/dashboard-page';

export const metadata: Metadata = {
  title: 'Dashboard | Arbitration Portal',
  description: 'View and manage your arbitration cases and drafts',
};

export default function Dashboard() {
  return <DashboardPage />;
}