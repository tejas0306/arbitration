import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { toast } from 'sonner'

interface FeedbackCase {
  id: string
  caseNumber: string
  arbitratorName: string
  arbitratorId: string
  status: 'completed' | 'ongoing'
  completedAt?: string
  canProvideFeedback: boolean
  feedbackSubmitted: boolean
}

interface Feedback {
  id: string
  caseId: string
  arbitratorRating: number
  serviceRating: number
  timelinessRating: number
  communicationRating: number
  overallRating: number
  comments: string
  improvements: string
  wouldRecommend: boolean
  submittedAt: string
}

export default function FeedbackPage() {
  const { data: session } = useSession()
  const [availableCases, setAvailableCases] = useState<FeedbackCase[]>([])
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit')
  const [selectedCase, setSelectedCase] = useState<FeedbackCase | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    arbitratorRating: 0,
    serviceRating: 0,
    timelinessRating: 0,
    communicationRating: 0,
    comments: '',
    improvements: '',
    wouldRecommend: false
  })

  useEffect(() => {
    fetchAvailableCases()
    fetchSubmittedFeedbacks()
  }, [])

  const fetchAvailableCases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback/cases')
      if (response.ok) {
        const data = await response.json()
        setAvailableCases(data)
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast.error('Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmittedFeedbacks = async () => {
    try {
      const response = await fetch('/api/feedback/submitted')
      if (response.ok) {
        const data = await response.json()
        setSubmittedFeedbacks(data)
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    }
  }

  const submitFeedback = async () => {
    if (!selectedCase) return

    const { arbitratorRating, serviceRating, timelinessRating, communicationRating } = feedbackForm
    
    if (!arbitratorRating || !serviceRating || !timelinessRating || !communicationRating) {
      toast.error('Please provide all ratings')
      return
    }

    const overallRating = (arbitratorRating + serviceRating + timelinessRating + communicationRating) / 4

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          arbitratorId: selectedCase.arbitratorId,
          arbitratorRating,
          serviceRating,
          timelinessRating,
          communicationRating,
          overallRating,
          comments: feedbackForm.comments,
          improvements: feedbackForm.improvements,
          wouldRecommend: feedbackForm.wouldRecommend
        })
      })

      if (response.ok) {
        toast.success('Feedback submitted successfully')
        setFeedbackForm({
          arbitratorRating: 0,
          serviceRating: 0,
          timelinessRating: 0,
          communicationRating: 0,
          comments: '',
          improvements: '',
          wouldRecommend: false
        })
        setSelectedCase(null)
        fetchAvailableCases() // Refresh cases
        fetchSubmittedFeedbacks() // Refresh submitted feedbacks
        setActiveTab('history') // Switch to history tab
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRating, label }: { rating: number, onRating: (rating: number) => void, label: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRating(star)}
            className={`text-2xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ⭐
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {rating === 0 ? 'Click to rate' : `${rating} star${rating !== 1 ? 's' : ''}`}
      </p>
    </div>
  )

  const DisplayRating = ({ rating }: { rating: number }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ⭐
        </span>
      ))}
      <span className="text-sm text-gray-600 ml-2">{rating.toFixed(1)}</span>
    </div>
  )

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Ratings</h1>
          <p className="text-gray-600 mt-2">
            Share your experience and help improve our arbitration services.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('submit')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'submit'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Submit Feedback ({availableCases.filter(c => c.canProvideFeedback && !c.feedbackSubmitted).length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback History ({submittedFeedbacks.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'submit' && (
              <div>
                {!selectedCase ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Select a Case to Provide Feedback</h3>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : availableCases.filter(c => c.canProvideFeedback && !c.feedbackSubmitted).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No cases available for feedback at this time.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Feedback can be provided after case completion.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableCases
                          .filter(c => c.canProvideFeedback && !c.feedbackSubmitted)
                          .map((caseItem) => (
                          <div key={caseItem.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  Case {caseItem.caseNumber}
                                </h4>
                                <p className="text-gray-600">Arbitrator: {caseItem.arbitratorName}</p>
                                <p className="text-sm text-gray-500">
                                  Status: {caseItem.status}
                                  {caseItem.completedAt && ` • Completed: ${new Date(caseItem.completedAt).toLocaleDateString()}`}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedCase(caseItem)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                              >
                                Provide Feedback
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <button
                        onClick={() => setSelectedCase(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ← Back to Cases
                      </button>
                      <h3 className="text-lg font-medium text-gray-900 mt-2">
                        Feedback for Case {selectedCase.caseNumber}
                      </h3>
                      <p className="text-gray-600">Arbitrator: {selectedCase.arbitratorName}</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); submitFeedback(); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StarRating
                          rating={feedbackForm.arbitratorRating}
                          onRating={(rating) => setFeedbackForm({...feedbackForm, arbitratorRating: rating})}
                          label="Arbitrator Performance"
                        />
                        
                        <StarRating
                          rating={feedbackForm.serviceRating}
                          onRating={(rating) => setFeedbackForm({...feedbackForm, serviceRating: rating})}
                          label="Overall Service Quality"
                        />
                        
                        <StarRating
                          rating={feedbackForm.timelinessRating}
                          onRating={(rating) => setFeedbackForm({...feedbackForm, timelinessRating: rating})}
                          label="Timeliness & Efficiency"
                        />
                        
                        <StarRating
                          rating={feedbackForm.communicationRating}
                          onRating={(rating) => setFeedbackForm({...feedbackForm, communicationRating: rating})}
                          label="Communication"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Comments
                        </label>
                        <textarea
                          value={feedbackForm.comments}
                          onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Share your experience and what went well..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Suggestions for Improvement
                        </label>
                        <textarea
                          value={feedbackForm.improvements}
                          onChange={(e) => setFeedbackForm({...feedbackForm, improvements: e.target.value})}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="What could be improved in future cases?"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={feedbackForm.wouldRecommend}
                          onChange={(e) => setFeedbackForm({...feedbackForm, wouldRecommend: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          I would recommend this arbitrator to others
                        </label>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(null)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Your Submitted Feedback</h3>
                
                {submittedFeedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No feedback submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submittedFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">Case {feedback.caseId}</h4>
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">Overall Rating</p>
                            <DisplayRating rating={feedback.overallRating} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Arbitrator</p>
                            <DisplayRating rating={feedback.arbitratorRating} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Service</p>
                            <DisplayRating rating={feedback.serviceRating} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Timeliness</p>
                            <DisplayRating rating={feedback.timelinessRating} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Communication</p>
                            <DisplayRating rating={feedback.communicationRating} />
                          </div>
                        </div>

                        {feedback.comments && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Comments:</p>
                            <p className="text-sm text-gray-600">{feedback.comments}</p>
                          </div>
                        )}

                        {feedback.improvements && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                            <p className="text-sm text-gray-600">{feedback.improvements}</p>
                          </div>
                        )}

                        <div className="flex items-center text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            feedback.wouldRecommend 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.wouldRecommend ? '✓ Would Recommend' : 'Would Not Recommend'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 