import { redirect } from 'next/navigation';

export default function DashboardUsersNewRedirect() {
  redirect('/admin/users/new');
  return null;
} 