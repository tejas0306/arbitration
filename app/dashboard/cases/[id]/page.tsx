import { redirect } from 'next/navigation';

export default function DashboardCaseDetailRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/admin/cases/${id}`);
  return null;
} 