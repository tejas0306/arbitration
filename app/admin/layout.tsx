import { Metadata } from 'next'
import ProtectedRoute from '@/components/protected-route'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin Portal',
    default: 'Admin Portal - Arbitration System'
  },
  description: 'Administrative portal for managing arbitration cases and system configuration'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  )
} 