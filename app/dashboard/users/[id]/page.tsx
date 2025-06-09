import { redirect } from 'next/navigation';

export default function DashboardUserDetailRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/admin/users/${id}`);
  return null;
} 