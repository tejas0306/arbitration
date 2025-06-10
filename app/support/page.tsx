import { Metadata } from 'next'
//import Header from '@/components/header'
//import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import SupportPortal from '@/components/support-portal'

export const metadata: Metadata = {
  title: 'Support - Arbitration Portal',
  description: 'Get help and submit support requests for the arbitration portal'
}

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
      
        <main className="flex-grow">
          <SupportPortal />
        </main>
       
      </div>
    </ProtectedRoute>
  )
} 