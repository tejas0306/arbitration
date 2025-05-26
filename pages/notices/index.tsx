import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { toast } from 'sonner'

interface Notice {
  id: string
  caseId: string
  caseNumber: string
  title: string
  type: 'case_notice' | 'payment_reminder' | 'hearing_notice' | 'document_request' | 'deadline_reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  content: string
  issuedAt: string
  dueDate?: string
  status: 'unread' | 'read' | 'responded' | 'expired'
  requiresResponse: boolean
  attachments?: string[]
  issuedBy: string
}

export default function NoticesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notices')
      if (response.ok) {
        const data = await response.json()
        setNotices(data)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
      toast.error('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notices</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notices found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">{notice.title}</h3>
                  <p className="text-gray-600 mt-2">{notice.content}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Case {notice.caseNumber} • {new Date(notice.issuedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 