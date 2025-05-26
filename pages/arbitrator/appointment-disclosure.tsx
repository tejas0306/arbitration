import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

// Appointment Disclosure form validation schema
const disclosureSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  
  // Personal disclosures
  hasConflictOfInterest: z.boolean(),
  conflictDetails: z.string().optional(),
  
  // Relationship disclosures
  relationshipWithParties: z.boolean(),
  relationshipDetails: z.string().optional(),
  
  // Financial disclosures
  financialInterests: z.boolean(),
  financialDetails: z.string().optional(),
  
  // Professional disclosures
  priorDealings: z.boolean(),
  priorDealingsDetails: z.string().optional(),
  
  // Independence confirmation
  independenceConfirmation: z.boolean().refine(val => val === true, {
    message: 'You must confirm your independence and impartiality'
  }),
  
  // Availability
  availabilityConfirmation: z.boolean().refine(val => val === true, {
    message: 'You must confirm your availability for this case'
  }),
  
  estimatedTimeCommitment: z.string().min(1, 'Please provide estimated time commitment'),
  proposedHearingSchedule: z.string().min(1, 'Please provide your proposed hearing schedule'),
  
  // Additional disclosures
  otherDisclosures: z.string().optional(),
  
  // Terms acceptance
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
})

type DisclosureFormData = z.infer<typeof disclosureSchema>

interface CaseDetails {
  id: string
  caseNumber: string
  claimantName: string
  respondentName: string
  disputeAmount: string
  caseType: string
  assignedDate: string
}

export default function ArbitratorAppointmentDisclosure() {
  const { data: session } = useSession()
  const router = useRouter()
  const { caseId } = router.query
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [disclosureDocuments, setDisclosureDocuments] = useState<File[]>([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<DisclosureFormData>({
    resolver: zodResolver(disclosureSchema),
    defaultValues: {
      hasConflictOfInterest: false,
      relationshipWithParties: false,
      financialInterests: false,
      priorDealings: false,
      independenceConfirmation: false,
      availabilityConfirmation: false,
      termsAccepted: false
    }
  })

  const hasConflictOfInterest = watch('hasConflictOfInterest')
  const relationshipWithParties = watch('relationshipWithParties')
  const financialInterests = watch('financialInterests')
  const priorDealings = watch('priorDealings')

  // Restrict access to ARBITRATOR role only
  if (session && session.user?.role !== 'ARBITRATOR') {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              The Appointment Disclosure Form is only available to Arbitrators.
            </p>
            <p className="text-sm text-red-600">
              Your role: <span className="font-medium">{session.user?.role}</span>
            </p>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    )
  }

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails()
    }
  }, [caseId])

  const fetchCaseDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/arbitrator/cases/${caseId}`)
      if (response.ok) {
        const data = await response.json()
        setCaseDetails(data)
        setValue('caseId', data.id)
      } else {
        toast.error('Failed to load case details')
        router.push('/arbitrator/dashboard')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDisclosureDocuments(Array.from(e.target.files))
    }
  }

  const onSubmit = async (data: DisclosureFormData) => {
    try {
      setSubmitting(true)
      
      const formData = new FormData()
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add disclosure documents
      disclosureDocuments.forEach((file, index) => {
        formData.append(`disclosureDocument_${index}`, file)
      })

      const response = await fetch(`/api/arbitrator/cases/${caseId}/disclosure`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Appointment disclosure submitted successfully')
        router.push('/arbitrator/dashboard')
      } else {
        throw new Error('Failed to submit disclosure')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit disclosure')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Appointment Disclosure Form</h1>
            <p className="text-gray-600 mt-2">
              As the appointed arbitrator, please complete this disclosure form to ensure transparency and maintain the integrity of the arbitration process.
            </p>
          </div>

          {/* Case Summary */}
          {caseDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-900 mb-4">Case Assignment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">Case Number</p>
                  <p className="text-blue-900">{caseDetails.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Case Type</p>
                  <p className="text-blue-900">{caseDetails.caseType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Claimant</p>
                  <p className="text-blue-900">{caseDetails.claimantName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Respondent</p>
                  <p className="text-blue-900">{caseDetails.respondentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Dispute Amount</p>
                  <p className="text-blue-900">₹{caseDetails.disputeAmount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Assigned Date</p>
                  <p className="text-blue-900">{new Date(caseDetails.assignedDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclosure Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Conflict of Interest */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conflict of Interest Disclosure</h3>
                
                <Controller
                  name="hasConflictOfInterest"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I have a potential conflict of interest in this case</span>
                    </label>
                  )}
                />

                {hasConflictOfInterest && (
                  <Controller
                    name="conflictDetails"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please provide details of the conflict of interest
                        </label>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe the nature and extent of the conflict of interest..."
                        />
                      </div>
                    )}
                  />
                )}
              </div>

              {/* Relationship with Parties */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relationship with Parties</h3>
                
                <Controller
                  name="relationshipWithParties"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I have or have had a relationship with any party or their representatives</span>
                    </label>
                  )}
                />

                {relationshipWithParties && (
                  <Controller
                    name="relationshipDetails"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please describe the relationship
                        </label>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe your relationship with the parties or their representatives..."
                        />
                      </div>
                    )}
                  />
                )}
              </div>

              {/* Financial Interests */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Interests</h3>
                
                <Controller
                  name="financialInterests"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I have financial interests that might be affected by the outcome of this case</span>
                    </label>
                  )}
                />

                {financialInterests && (
                  <Controller
                    name="financialDetails"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please describe the financial interests
                        </label>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe any financial interests that might be affected..."
                        />
                      </div>
                    )}
                  />
                )}
              </div>

              {/* Prior Dealings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prior Professional Dealings</h3>
                
                <Controller
                  name="priorDealings"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I have had prior professional dealings related to the subject matter of this dispute</span>
                    </label>
                  )}
                />

                {priorDealings && (
                  <Controller
                    name="priorDealingsDetails"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Please describe the prior dealings
                        </label>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe any prior professional dealings..."
                        />
                      </div>
                    )}
                  />
                )}
              </div>

              {/* Independence Confirmation */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Independence and Impartiality</h3>
                
                <Controller
                  name="independenceConfirmation"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I confirm my independence and impartiality in this matter *</span>
                    </label>
                  )}
                />
                {errors.independenceConfirmation && (
                  <p className="mt-1 text-sm text-red-600">{errors.independenceConfirmation.message}</p>
                )}
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Availability and Time Commitment</h3>
                
                <Controller
                  name="availabilityConfirmation"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I confirm my availability to serve as arbitrator for this case *</span>
                    </label>
                  )}
                />
                {errors.availabilityConfirmation && (
                  <p className="mt-1 text-sm text-red-600">{errors.availabilityConfirmation.message}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="estimatedTimeCommitment"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Time Commitment *
                        </label>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select time commitment</option>
                          <option value="1-3 months">1-3 months</option>
                          <option value="3-6 months">3-6 months</option>
                          <option value="6-12 months">6-12 months</option>
                          <option value="12+ months">12+ months</option>
                        </select>
                        {errors.estimatedTimeCommitment && (
                          <p className="mt-1 text-sm text-red-600">{errors.estimatedTimeCommitment.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="proposedHearingSchedule"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Proposed Hearing Schedule *
                        </label>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select hearing schedule</option>
                          <option value="Weekdays only">Weekdays only</option>
                          <option value="Weekends available">Weekends available</option>
                          <option value="Flexible schedule">Flexible schedule</option>
                          <option value="Limited availability">Limited availability</option>
                        </select>
                        {errors.proposedHearingSchedule && (
                          <p className="mt-1 text-sm text-red-600">{errors.proposedHearingSchedule.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Additional Disclosures */}
              <div>
                <Controller
                  name="otherDisclosures"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Disclosures (Optional)
                      </label>
                      <textarea
                        {...field}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any other matters that should be disclosed to ensure transparency..."
                      />
                    </div>
                  )}
                />
              </div>

              {/* Supporting Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disclosure Documents (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload any supporting disclosure documents (CV, certificates, etc.)
                </p>
              </div>

              {/* Terms Acceptance */}
              <div>
                <Controller
                  name="termsAccepted"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I accept the terms and conditions of this arbitration appointment *</span>
                    </label>
                  )}
                />
                {errors.termsAccepted && (
                  <p className="mt-1 text-sm text-red-600">{errors.termsAccepted.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/arbitrator/dashboard')}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Disclosure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 