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

// Appointment Disclosure Form validation schema (Section 12 of Arbitration Act, 1996)
const disclosureSchema = z.object({
  // Case Details
  caseId: z.string().min(1, 'Case ID is required'),
  disclosureDate: z.string().min(1, 'Disclosure date is required'),
  
  // Arbitrator Details
  arbitratorName: z.string().min(1, 'Arbitrator name is required'),
  empanelmentNumber: z.string().min(1, 'Empanelment/Registration number is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  
  // Relationship Disclosures
  personalRelationshipWithClaimant: z.string().min(1, 'This disclosure is required'),
  personalRelationshipWithRespondent: z.string().min(1, 'This disclosure is required'),
  professionalRelationshipWithClaimant: z.string().min(1, 'This disclosure is required'),
  professionalRelationshipWithRespondent: z.string().min(1, 'This disclosure is required'),
  relationshipWithCounsel: z.string().min(1, 'This disclosure is required'),
  relationshipWithWitnesses: z.string().min(1, 'This disclosure is required'),
  
  // Financial & Business Interest Disclosures
  financialInterestInOutcome: z.string().min(1, 'This disclosure is required'),
  businessInterestInOutcome: z.string().min(1, 'This disclosure is required'),
  sharesOrInvestments: z.string().min(1, 'This disclosure is required'),
  
  // Previous Engagements
  previousArbitratorAppointments: z.string().min(1, 'This disclosure is required'),
  previousExpertAppointments: z.string().min(1, 'This disclosure is required'),
  previousCounselAppointments: z.string().min(1, 'This disclosure is required'),
  relatedMatterInvolvement: z.string().min(1, 'This disclosure is required'),
  
  // Impartiality & Independence
  impartialityDeclaration: z.boolean().refine(val => val === true, {
    message: 'You must declare your impartiality and independence'
  }),
  conflictOfInterestExists: z.enum(['yes', 'no'], {
    required_error: 'Please indicate if any conflict of interest exists'
  }),
  conflictDescription: z.string().optional(),
  
  // Availability
  abilityToMeetTimelines: z.boolean().refine(val => val === true, {
    message: 'You must confirm ability to meet statutory timelines'
  }),
  schedulingConstraints: z.string().min(1, 'Please provide scheduling information'),
  estimatedAvailabilityHours: z.string().min(1, 'Please estimate your weekly availability'),
  
  // Verification
  informationAccuracy: z.boolean().refine(val => val === true, {
    message: 'You must confirm the accuracy of information provided'
  }),
  electronicSignature: z.string().min(1, 'Electronic signature is required'),
  verificationDate: z.string().min(1, 'Verification date is required')
})

type DisclosureFormData = z.infer<typeof disclosureSchema>

interface CaseDetails {
  id: string
  caseNumber: string
  claimantName: string
  respondentName: string
  disputeAmount: string
  arbitratorAppointmentDate: string
}

export default function ArbitratorDisclosureForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { caseId } = router.query
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<DisclosureFormData>({
    resolver: zodResolver(disclosureSchema),
    defaultValues: {
      disclosureDate: new Date().toISOString().split('T')[0],
      verificationDate: new Date().toISOString().split('T')[0],
      conflictOfInterestExists: 'no',
      impartialityDeclaration: false,
      abilityToMeetTimelines: false,
      informationAccuracy: false
    }
  })

  const conflictExists = watch('conflictOfInterestExists')

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
              The Arbitrator Disclosure Form is only available to Arbitrators.
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
    if (caseId && session?.user) {
      fetchCaseDetails()
      
      // Pre-fill arbitrator details from session
      setValue('arbitratorName', session.user.name || '')
      setValue('email', session.user.email || '')
      setValue('electronicSignature', session.user.name || '')
    }
  }, [caseId, session])

  const fetchCaseDetails = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('auth_token')
      const headers: any = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/cases/${caseId}`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setCaseDetails(data)
        setValue('caseId', data.caseNumber || data.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to load case details')
        router.push('/arbitrator/dashboard')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
      router.push('/arbitrator/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: DisclosureFormData) => {
    try {
      setSubmitting(true)
      
      const token = localStorage.getItem('auth_token')
      const headers: any = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/arbitrator/cases/${caseId}/disclosure`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Disclosure submitted successfully')
        router.push('/arbitrator/dashboard')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit disclosure')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit disclosure')
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
            <h1 className="text-3xl font-bold text-gray-900">Arbitrator Appointment Disclosure</h1>
            <p className="text-gray-600 mt-2">
              Complete disclosure as required under Section 12 of the Arbitration and Conciliation Act, 1996
            </p>
          </div>

          {/* Legal Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-amber-800 mb-2">📋 Statutory Disclosure Requirement</h2>
            <p className="text-amber-700 text-sm leading-relaxed">
              <strong>Section 12 of the Arbitration and Conciliation Act, 1996</strong> requires arbitrators to disclose 
              any circumstances that may give rise to justifiable doubts as to their independence or impartiality. 
              This disclosure must be made immediately upon accepting the appointment and continuously updated if new circumstances arise.
            </p>
          </div>

          {/* Case Reference */}
          {caseDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-900 mb-4">Case Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">Case Number</p>
                  <p className="text-blue-900 font-mono">{caseDetails.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Claimant</p>
                  <p className="text-blue-900">{caseDetails.claimantName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Respondent</p>
                  <p className="text-blue-900">{caseDetails.respondentName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclosure Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* 1. Case Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">1. Case Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="caseId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Case ID *
                        </label>
                        <input
                          type="text"
                          {...field}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                        />
                        {errors.caseId && (
                          <p className="mt-1 text-sm text-red-600">{errors.caseId.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="disclosureDate"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Disclosure *
                        </label>
                        <input
                          type="date"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.disclosureDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.disclosureDate.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 2. Arbitrator Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">2. Arbitrator Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="arbitratorName"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.arbitratorName && (
                          <p className="mt-1 text-sm text-red-600">{errors.arbitratorName.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="empanelmentNumber"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Empanelment/Registration Number *
                        </label>
                        <input
                          type="text"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Institution empanelment number"
                        />
                        {errors.empanelmentNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.empanelmentNumber.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 3. Relationship Disclosures */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">3. Relationship Disclosures</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please disclose any past or present personal or professional relationships with the parties, their counsel, or witnesses.
                </p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="personalRelationshipWithClaimant"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personal Relationship with Claimant *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any personal relationships..."
                          />
                          {errors.personalRelationshipWithClaimant && (
                            <p className="mt-1 text-sm text-red-600">{errors.personalRelationshipWithClaimant.message}</p>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      name="personalRelationshipWithRespondent"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personal Relationship with Respondent *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any personal relationships..."
                          />
                          {errors.personalRelationshipWithRespondent && (
                            <p className="mt-1 text-sm text-red-600">{errors.personalRelationshipWithRespondent.message}</p>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      name="professionalRelationshipWithClaimant"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Professional Relationship with Claimant *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any professional engagements..."
                          />
                          {errors.professionalRelationshipWithClaimant && (
                            <p className="mt-1 text-sm text-red-600">{errors.professionalRelationshipWithClaimant.message}</p>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      name="professionalRelationshipWithRespondent"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Professional Relationship with Respondent *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any professional engagements..."
                          />
                          {errors.professionalRelationshipWithRespondent && (
                            <p className="mt-1 text-sm text-red-600">{errors.professionalRelationshipWithRespondent.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="relationshipWithCounsel"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship with Counsel of Parties *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any relationships with legal counsel..."
                          />
                          {errors.relationshipWithCounsel && (
                            <p className="mt-1 text-sm text-red-600">{errors.relationshipWithCounsel.message}</p>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      name="relationshipWithWitnesses"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship with Witnesses *
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="None / Describe any relationships with witnesses..."
                          />
                          {errors.relationshipWithWitnesses && (
                            <p className="mt-1 text-sm text-red-600">{errors.relationshipWithWitnesses.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Financial & Business Interest Disclosures */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">4. Financial & Business Interest Disclosures</h3>
                <div className="space-y-4">
                  <Controller
                    name="financialInterestInOutcome"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Financial Interest in Dispute Outcome *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / Describe any direct or indirect financial interest..."
                        />
                        {errors.financialInterestInOutcome && (
                          <p className="mt-1 text-sm text-red-600">{errors.financialInterestInOutcome.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="businessInterestInOutcome"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Interest in Dispute Outcome *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / Describe any business interest in the outcome..."
                        />
                        {errors.businessInterestInOutcome && (
                          <p className="mt-1 text-sm text-red-600">{errors.businessInterestInOutcome.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="sharesOrInvestments"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shares or Investments in Parties *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / Describe any shareholding or investments..."
                        />
                        {errors.sharesOrInvestments && (
                          <p className="mt-1 text-sm text-red-600">{errors.sharesOrInvestments.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 5. Previous Engagements */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">5. Previous Engagements</h3>
                <div className="space-y-4">
                  <Controller
                    name="previousArbitratorAppointments"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Appointments as Arbitrator involving Parties *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / List previous arbitrator appointments..."
                        />
                        {errors.previousArbitratorAppointments && (
                          <p className="mt-1 text-sm text-red-600">{errors.previousArbitratorAppointments.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="previousExpertAppointments"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Appointments as Expert involving Parties *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / List previous expert appointments..."
                        />
                        {errors.previousExpertAppointments && (
                          <p className="mt-1 text-sm text-red-600">{errors.previousExpertAppointments.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="previousCounselAppointments"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Appointments as Counsel involving Parties *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / List previous counsel appointments..."
                        />
                        {errors.previousCounselAppointments && (
                          <p className="mt-1 text-sm text-red-600">{errors.previousCounselAppointments.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="relatedMatterInvolvement"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Involvement in Related Matters *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / Describe involvement in related disputes or matters..."
                        />
                        {errors.relatedMatterInvolvement && (
                          <p className="mt-1 text-sm text-red-600">{errors.relatedMatterInvolvement.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 6. Impartiality & Independence */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">6. Impartiality & Independence Statements</h3>
                <div className="space-y-4">
                  <Controller
                    name="impartialityDeclaration"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mr-3 mt-1"
                        />
                        <span className="text-sm">
                          I hereby declare that no circumstances exist that would give rise to justifiable doubts 
                          as to my impartiality or independence as arbitrator in this matter. *
                        </span>
                      </label>
                    )}
                  />
                  {errors.impartialityDeclaration && (
                    <p className="mt-1 text-sm text-red-600">{errors.impartialityDeclaration.message}</p>
                  )}

                  <Controller
                    name="conflictOfInterestExists"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Do any potential conflicts of interest exist? *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              {...field}
                              value="no"
                              checked={field.value === 'no'}
                              className="mr-2"
                            />
                            <span>No potential conflicts exist</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              {...field}
                              value="yes"
                              checked={field.value === 'yes'}
                              className="mr-2"
                            />
                            <span>Yes, potential conflicts exist (please describe below)</span>
                          </label>
                        </div>
                        {errors.conflictOfInterestExists && (
                          <p className="mt-1 text-sm text-red-600">{errors.conflictOfInterestExists.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {conflictExists === 'yes' && (
                    <Controller
                      name="conflictDescription"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detailed Description of Potential Conflicts
                          </label>
                          <textarea
                            {...field}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Provide detailed description of the potential conflicts..."
                          />
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* 7. Availability */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">7. Availability</h3>
                <div className="space-y-4">
                  <Controller
                    name="abilityToMeetTimelines"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mr-3 mt-1"
                        />
                        <span className="text-sm">
                          I confirm my ability to meet statutory timelines including delivery of the award 
                          within 12 months as required under Section 29A of the Arbitration Act, 1996. *
                        </span>
                      </label>
                    )}
                  />
                  {errors.abilityToMeetTimelines && (
                    <p className="mt-1 text-sm text-red-600">{errors.abilityToMeetTimelines.message}</p>
                  )}

                  <Controller
                    name="schedulingConstraints"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Known Scheduling Constraints *
                        </label>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="None / List any known scheduling constraints or commitments..."
                        />
                        {errors.schedulingConstraints && (
                          <p className="mt-1 text-sm text-red-600">{errors.schedulingConstraints.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="estimatedAvailabilityHours"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Weekly Availability (Hours) *
                        </label>
                        <input
                          type="text"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 20-25 hours per week"
                        />
                        {errors.estimatedAvailabilityHours && (
                          <p className="mt-1 text-sm text-red-600">{errors.estimatedAvailabilityHours.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 8. Signature & Verification */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">8. Signature & Verification</h3>
                <div className="space-y-4">
                  <Controller
                    name="electronicSignature"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Electronic Signature *
                        </label>
                        <input
                          type="text"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type your full name as electronic signature"
                        />
                        {errors.electronicSignature && (
                          <p className="mt-1 text-sm text-red-600">{errors.electronicSignature.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="verificationDate"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Date *
                        </label>
                        <input
                          type="date"
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.verificationDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.verificationDate.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="informationAccuracy"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mr-3 mt-1"
                        />
                        <span className="text-sm">
                          I hereby confirm that the information provided above is true and complete to the best 
                          of my knowledge and belief. I undertake to promptly disclose any changes that may occur 
                          during the arbitration proceedings. *
                        </span>
                      </label>
                    )}
                  />
                  {errors.informationAccuracy && (
                    <p className="mt-1 text-sm text-red-600">{errors.informationAccuracy.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between">
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
                    className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Submitting...' : 'Submit Disclosure'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 