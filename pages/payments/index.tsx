import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { toast } from 'sonner'

interface Payment {
  id: string
  caseId: string
  caseNumber: string
  paymentType: 'filing_fee' | 'arbitrator_fee' | 'administrative_fee' | 'emergency_fee' | 'other'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  transactionId: string
  paidAt: string
  description: string
  invoiceUrl?: string
  receiptUrl?: string
}

interface PaymentStats {
  totalPaid: number
  pendingPayments: number
  completedPayments: number
  refundedAmount: number
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all')

  useEffect(() => {
    fetchPayments()
    fetchPaymentStats()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch('/api/payments/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'filing_fee': return 'Filing Fee'
      case 'arbitrator_fee': return 'Arbitrator Fee'
      case 'administrative_fee': return 'Administrative Fee'
      case 'emergency_fee': return 'Emergency Fee'
      case 'other': return 'Other'
      default: return type
    }
  }

  const filteredPayments = payments.filter(payment => 
    filter === 'all' || payment.status === filter
  )

  const downloadInvoice = (payment: Payment) => {
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank')
    } else {
      toast.error('Invoice not available')
    }
  }

  const downloadReceipt = (payment: Payment) => {
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, '_blank')
    } else {
      toast.error('Receipt not available')
    }
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-2">
            View and manage your arbitration-related payments, invoices, and receipts.
          </p>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">₹</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">↩</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Refunded</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.refundedAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Payment Transactions</h2>
              
              {/* Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payments found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Case {payment.caseNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getPaymentTypeLabel(payment.paymentType)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {payment.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {payment.invoiceUrl && (
                            <button
                              onClick={() => downloadInvoice(payment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Invoice
                            </button>
                          )}
                          {payment.receiptUrl && (
                            <button
                              onClick={() => downloadReceipt(payment)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Need Help with Payments?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-blue-600 text-2xl mb-2">📞</div>
              <h4 className="font-medium text-blue-900">Contact Support</h4>
              <p className="text-sm text-blue-700">Call us for payment-related queries</p>
            </div>
            <div className="text-center">
              <div className="text-blue-600 text-2xl mb-2">💳</div>
              <h4 className="font-medium text-blue-900">Payment Methods</h4>
              <p className="text-sm text-blue-700">View accepted payment options</p>
            </div>
            <div className="text-center">
              <div className="text-blue-600 text-2xl mb-2">🔄</div>
              <h4 className="font-medium text-blue-900">Refund Policy</h4>
              <p className="text-sm text-blue-700">Learn about our refund process</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 