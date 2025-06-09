import { redirect } from 'next/navigation';

export default function DashboardCasesNewRedirect() {
  redirect('/admin/cases/new');
  return null;
} 