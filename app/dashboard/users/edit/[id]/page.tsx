import { redirect } from 'next/navigation';

export default function DashboardUserEditRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/admin/users/edit/${id}`);
  return null;
} 