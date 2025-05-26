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

// Award Draft form validation schema
const awardSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  
  // Award details
  awardType: z.enum(['final', 'interim', 'partial'], {
    required_error: 'Please select the award type'
  }),
  
  awardDate: z.string().min(1, 'Award date is required'),
  
  // Case summary
  caseSummary: z.string().min(100, 'Please provide a comprehensive case summary (minimum 100 characters)'),
  
  // Parties involved
  claimantRepresentation: z.string().min(10, 'Please specify claimant representation'),
  respondentRepresentation: z.string().min(10, 'Please specify respondent representation'),
  
  // Issues and findings
  issuesForDetermination: z.string().min(50, 'Please outline the key issues for determination'),
  factsAndEvidence: z.string().min(100, 'Please summarize the facts and evidence considered'),
  legalAnalysis: z.string().min(100, 'Please provide your legal analysis'),
  
  // Award details
  findings: z.string().min(100, 'Please provide detailed findings'),
  decision: z.string().min(50, 'Please state your decision clearly'),
  
  // Financial awards
  hasMonetaryAward: z.boolean().default(false),
  monetaryAward: z.string().optional(),
  interestRate: z.string().optional(),
  interestFromDate: z.string().optional(),
  
  // Costs
  arbitrationCosts: z.string().min(1, 'Please specify arbitration costs'),
  costsAllocation: z.string().min(20, 'Please specify how costs are allocated'),
  
  // Implementation
  implementationDeadline: z.string().min(1, 'Please specify implementation deadline'),
  complianceRequirements: z.string().optional(),
  
  // Final confirmations
  awardIsFinal: z.boolean().refine(val => val === true, {
    message: 'You must confirm this award is final and binding'
  }),
  
  // Signature confirmation
  digitalSignatureConfirmed: z.boolean().refine(val => val === true, {
    message: 'You must confirm your digital signature'
  })
})

type AwardFormData = z.infer<typeof awardSchema>

interface CaseDetails {
  id: string
  caseNumber: string
  claimantName: string
  respondentName: string
  disputeAmount: string
  caseType: string
  hearingDates: string[]
  status: string
}

export default function ArbitratorAwardDraft() {
  const { data: session } = useSession()
  const router = useRouter()
  const { caseId } = router.query
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [awardDocument, setAwardDocument] = useState<File | null>(null)
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AwardFormData>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      hasMonetaryAward: false,
      awardIsFinal: false,
      digitalSignatureConfirmed: false,
      awardDate: new Date().toISOString().split('T')[0] // Today's date
    }
  })

  const hasMonetaryAward = watch('hasMonetaryAward')
  const awardType = watch('awardType')

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
              The Award Draft Form is only available to Arbitrators.
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

  const handleAwardDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAwardDocument(e.target.files[0])
    }
  }

  const handleSupportingDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSupportingDocuments(Array.from(e.target.files))
    }
  }

  const onSubmit = async (data: AwardFormData) => {
    try {
      setSubmitting(true)
      
      const formData = new FormData()
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add award document
      if (awardDocument) {
        formData.append('awardDocument', awardDocument)
      }
      
      // Add supporting documents
      supportingDocuments.forEach((file, index) => {
        formData.append(`supportingDocument_${index}`, file)
      })

      const response = await fetch(`/api/arbitrator/cases/${caseId}/award`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Award draft submitted successfully')
        router.push('/arbitrator/dashboard')
      } else {
        throw new Error('Failed to submit award')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit award')
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Award Draft Form</h1>
            <p className="text-gray-600 mt-2">
              Draft and submit the final arbitration award. This form will generate the formal award document.
            </p>
          </div>

          {/* Case Summary */}
          {caseDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-900 mb-4">Case Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">Case Number</p>
                  <p className="text-blue-900">{caseDetails.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Case Type</p>
                  <p className="text-blue-900">{caseDetails.caseType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Status</p>
                  <p className="text-blue-900">{caseDetails.status}</p>
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
              </div>
            </div>
          )}

          {/* Award Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Award Type and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="awardType"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Award Type *
                      </label>
                      <select
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select award type</option>
                        <option value="final">Final Award</option>
                        <option value="interim">Interim Award</option>
                        <option value="partial">Partial Award</option>
                      </select>
                      {errors.awardType && (
                        <p className="mt-1 text-sm text-red-600">{errors.awardType.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="awardDate"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Award Date *
                      </label>
                      <input
                        type="date"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.awardDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.awardDate.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Case Summary */}
              <Controller
                name="caseSummary"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Case Summary *
                    </label>
                    <textarea
                      {...field}
                      rows={5}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide a comprehensive summary of the case, including background, key events, and procedural history..."
                    />
                    {errors.caseSummary && (
                      <p className="mt-1 text-sm text-red-600">{errors.caseSummary.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Party Representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="claimantRepresentation"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Claimant Representation *
                      </label>
                      <input
                        type="text"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Legal counsel or representative for claimant"
                      />
                      {errors.claimantRepresentation && (
                        <p className="mt-1 text-sm text-red-600">{errors.claimantRepresentation.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="respondentRepresentation"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Respondent Representation *
                      </label>
                      <input
                        type="text"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Legal counsel or representative for respondent"
                      />
                      {errors.respondentRepresentation && (
                        <p className="mt-1 text-sm text-red-600">{errors.respondentRepresentation.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Issues and Analysis */}
              <Controller
                name="issuesForDetermination"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issues for Determination *
                    </label>
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Outline the key legal and factual issues that need to be determined..."
                    />
                    {errors.issuesForDetermination && (
                      <p className="mt-1 text-sm text-red-600">{errors.issuesForDetermination.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="factsAndEvidence"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facts and Evidence Considered *
                    </label>
                    <textarea
                      {...field}
                      rows={6}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Summarize the key facts established and evidence considered in reaching your decision..."
                    />
                    {errors.factsAndEvidence && (
                      <p className="mt-1 text-sm text-red-600">{errors.factsAndEvidence.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="legalAnalysis"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legal Analysis *
                    </label>
                    <textarea
                      {...field}
                      rows={6}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide your legal analysis, including applicable laws, precedents, and reasoning..."
                    />
                    {errors.legalAnalysis && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalAnalysis.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Findings and Decision */}
              <Controller
                name="findings"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Findings *
                    </label>
                    <textarea
                      {...field}
                      rows={5}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State your detailed findings on each issue..."
                    />
                    {errors.findings && (
                      <p className="mt-1 text-sm text-red-600">{errors.findings.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="decision"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision *
                    </label>
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State your final decision clearly and concisely..."
                    />
                    {errors.decision && (
                      <p className="mt-1 text-sm text-red-600">{errors.decision.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Monetary Award Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monetary Award</h3>
                
                <Controller
                  name="hasMonetaryAward"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>This award includes a monetary component</span>
                    </label>
                  )}
                />

                {hasMonetaryAward && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                    <Controller
                      name="monetaryAward"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Award Amount (₹)
                          </label>
                          <input
                            type="text"
                            {...field}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                          />
                        </div>
                      )}
                    />

                    <Controller
                      name="interestRate"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interest Rate (% p.a.)
                          </label>
                          <input
                            type="text"
                            {...field}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 9%"
                          />
                        </div>
                      )}
                    />

                    <Controller
                      name="interestFromDate"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interest From Date
                          </label>
                          <input
                            type="date"
                            {...field}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Costs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="arbitrationCosts"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arbitration Costs (₹) *
                      </label>
                      <input
                        type="text"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Total arbitration costs"
                      />
                      {errors.arbitrationCosts && (
                        <p className="mt-1 text-sm text-red-600">{errors.arbitrationCosts.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="costsAllocation"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costs Allocation *
                      </label>
                      <select
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select allocation</option>
                        <option value="Claimant bears all costs">Claimant bears all costs</option>
                        <option value="Respondent bears all costs">Respondent bears all costs</option>
                        <option value="Equal sharing">Equal sharing (50-50)</option>
                        <option value="Proportional to success">Proportional to success</option>
                        <option value="Custom allocation">Custom allocation</option>
                      </select>
                      {errors.costsAllocation && (
                        <p className="mt-1 text-sm text-red-600">{errors.costsAllocation.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Implementation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="implementationDeadline"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Implementation Deadline *
                      </label>
                      <input
                        type="date"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.implementationDeadline && (
                        <p className="mt-1 text-sm text-red-600">{errors.implementationDeadline.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="complianceRequirements"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compliance Requirements
                      </label>
                      <input
                        type="text"
                        {...field}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any specific compliance requirements"
                      />
                    </div>
                  )}
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Award Document Upload
                  </label>
                  <input
                    type="file"
                    onChange={handleAwardDocumentChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload the formal award document (optional - will be generated from form data)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleSupportingDocumentsChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload any supporting documents or annexures
                  </p>
                </div>
              </div>

              {/* Final Confirmations */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Final Confirmations</h3>
                
                <Controller
                  name="awardIsFinal"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I confirm this award is final and binding on all parties *</span>
                    </label>
                  )}
                />
                {errors.awardIsFinal && (
                  <p className="mt-1 text-sm text-red-600">{errors.awardIsFinal.message}</p>
                )}

                <Controller
                  name="digitalSignatureConfirmed"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I confirm my digital signature on this award *</span>
                    </label>
                  )}
                />
                {errors.digitalSignatureConfirmed && (
                  <p className="mt-1 text-sm text-red-600">{errors.digitalSignatureConfirmed.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/arbitrator/dashboard')}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Final Award'}
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