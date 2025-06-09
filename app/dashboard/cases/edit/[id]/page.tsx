import { redirect } from 'next/navigation';

export default function DashboardCaseEditRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/admin/cases/edit/${id}`);
  return null;
} 