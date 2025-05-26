import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

// Response form validation schema (FRS Section 4.2 compliant)
const responseSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  
  // 2. Response Narrative
  arbitrationAgreementComments: z.string().min(10, 'Please provide comments on the arbitration agreement'),
  generalStatementOfFacts: z.string().min(100, 'Please provide a comprehensive statement of facts (minimum 100 characters)'),
  
  // 3. Admissions/Denials - Dynamic array for each claim
  claimResponses: z.array(z.object({
    claimNumber: z.number(),
    claimText: z.string(),
    response: z.enum(['admit_full', 'admit_part', 'deny'], {
      required_error: 'Please respond to this claim'
    }),
    denialWitnessName: z.string().optional(),
    denialAffidavitFile: z.string().optional(), // File path after upload
    partialAdmissionDetails: z.string().optional()
  })),
  
  // 4. Counter-Reliefs (Prayers)
  hasCounterReliefs: z.boolean().default(false),
  counterReliefs: z.string().optional(),
  counterClaimAmount: z.string().optional(),
  
  // 5. Supporting Evidence Upload (structured categories)
  evidence: z.object({
    scannedDocuments: z.array(z.string()).optional(),
    officerAffidavit: z.string().optional(),
    witnessAffidavits: z.array(z.string()).optional(),
    electronicEvidenceCertificates: z.array(z.string()).optional(),
    lawsCaseCitations: z.string().optional()
  }),
  
  // 6. Arbitrator Selection & Mode
  arbitratorResponse: z.enum(['accept', 'reject', 'propose_new'], {
    required_error: 'Please respond to the arbitrator selection'
  }),
  proposedArbitratorId: z.string().optional(),
  hearingMode: z.enum(['in_person', 'virtual'], {
    required_error: 'Please select hearing mode'
  }),
  preferredLocation: z.string().optional(),
  
  // 7. Fee Payment
  registrationFeeAmount: z.string().min(1, 'Registration fee amount is required'),
  paymentMethod: z.enum(['credit_card', 'upi', 'bank_transfer'], {
    required_error: 'Please select payment method'
  }),
  paymentConfirmed: z.boolean().refine(val => val === true, {
    message: 'Payment confirmation is required'
  })
})

type ResponseFormData = z.infer<typeof responseSchema>

interface CaseDetails {
  id: string
  caseNumber: string
  claimantName: string
  respondentName: string
  disputeAmount: string
  disputeDescription: string
  arbitrationAgreement: string
  claimantFacts: string
  claimantPrayers: string[]
  claimantDocuments: string[]
  claims: Array<{
    number: number
    text: string
    type: string
  }>
  proposedArbitrator: {
    id: string
    name: string
    designation: string
  }
  filedDate: string
  status: string
  registrationFee: string
}

interface ArbitratorOption {
  id: string
  name: string
  designation: string
  experience: string
}

export default function RespondentResponseForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const { caseId } = router.query
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [arbitratorOptions, setArbitratorOptions] = useState<ArbitratorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  
  // Evidence file states
  const [scannedDocuments, setScannedDocuments] = useState<File[]>([])
  const [officerAffidavit, setOfficerAffidavit] = useState<File | null>(null)
  const [witnessAffidavits, setWitnessAffidavits] = useState<File[]>([])
  const [electronicCertificates, setElectronicCertificates] = useState<File[]>([])
  const [denialAffidavits, setDenialAffidavits] = useState<{[key: number]: File}>({})

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      hasCounterReliefs: false,
      paymentConfirmed: false,
      claimResponses: []
    }
  })

  const { fields: claimResponseFields, update: updateClaimResponse } = useFieldArray({
    control,
    name: 'claimResponses'
  })

  const hasCounterReliefs = watch('hasCounterReliefs')
  const arbitratorResponse = watch('arbitratorResponse')
  const hearingMode = watch('hearingMode')

  // Restrict access to RESPONDENT role only
  if (session && session.user?.role !== 'RESPONDENT') {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              The Response Form is only available to Respondents.
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
      fetchArbitratorOptions()
    }
  }, [caseId])

  const fetchCaseDetails = async () => {
    try {
      setLoading(true)
      
      // Get auth token for the request
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
        setValue('caseId', data.id)
        setValue('registrationFeeAmount', data.registrationFee)
        
        // Initialize claim responses from case claims
        if (data.claims && data.claims.length > 0) {
          const initialClaimResponses = data.claims.map((claim: any) => ({
            claimNumber: claim.number,
            claimText: claim.text,
            response: undefined,
            denialWitnessName: '',
            denialAffidavitFile: '',
            partialAdmissionDetails: ''
          }))
          setValue('claimResponses', initialClaimResponses)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to load case details')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
    } finally {
      setLoading(false)
    }
  }

  const fetchArbitratorOptions = async () => {
    try {
      // Get auth token for the request
      const token = localStorage.getItem('auth_token')
      const headers: any = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch('/api/arbitrators/available', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setArbitratorOptions(data)
      } else {
        console.error('Failed to fetch arbitrator options:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching arbitrator options:', error)
    }
  }

  // File handling functions
  const handleScannedDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setScannedDocuments(Array.from(e.target.files))
  }

  const handleOfficerAffidavit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setOfficerAffidavit(e.target.files[0])
  }

  const handleWitnessAffidavits = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setWitnessAffidavits(Array.from(e.target.files))
  }

  const handleElectronicCertificates = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setElectronicCertificates(Array.from(e.target.files))
  }

  const handleDenialAffidavit = (claimNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDenialAffidavits(prev => ({
        ...prev,
        [claimNumber]: e.target.files![0]
      }))
    }
  }

  const onSubmit = async (data: ResponseFormData, isDraftSubmission = false) => {
    try {
      setSubmitting(true)
      
      const formData = new FormData()
      
      // Add form data as structured JSON for FRS compliance
      const responsePayload = {
        ...data,
        isDraft: isDraftSubmission,
        caseId: caseId,
        submittedAt: new Date().toISOString()
      }
      
      formData.append('responseData', JSON.stringify(responsePayload))
      formData.append('isDraft', isDraftSubmission.toString())
      
      // Add evidence files with structured categories
      scannedDocuments.forEach((file, index) => {
        formData.append(`evidence.scannedDocuments[${index}]`, file)
      })
      
      if (officerAffidavit) {
        formData.append('evidence.officerAffidavit', officerAffidavit)
      }
      
      witnessAffidavits.forEach((file, index) => {
        formData.append(`evidence.witnessAffidavits[${index}]`, file)
      })
      
      electronicCertificates.forEach((file, index) => {
        formData.append(`evidence.electronicCertificates[${index}]`, file)
      })
      
      // Add denial affidavits linked to specific claims
      Object.entries(denialAffidavits).forEach(([claimNumber, file]) => {
        formData.append(`claimResponses.denialAffidavits.claim_${claimNumber}`, file)
      })

      // Get auth token for the request
      const token = localStorage.getItem('auth_token')
      const headers: any = {}
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/cases/${caseId}/response`, {
        method: 'POST',
        body: formData,
        headers
      })

      if (response.ok) {
        const result = await response.json()
        const message = isDraftSubmission ? 'Response saved as draft' : 'Response submitted successfully'
        toast.success(message)
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit response')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    handleSubmit((data) => onSubmit(data, true))()
  }

  const handleWithdraw = async () => {
    if (confirm('Are you sure you want to withdraw your response? This action cannot be undone.')) {
      try {
        // Get auth token for the request
        const token = localStorage.getItem('auth_token')
        const headers: any = {
          'Content-Type': 'application/json'
        }
        
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        
        const response = await fetch(`/api/cases/${caseId}/response`, {
          method: 'DELETE',
          headers
        })
        
        if (response.ok) {
          toast.success('Response withdrawn successfully')
          router.push('/dashboard')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to withdraw response')
        }
      } catch (error) {
        console.error('Withdrawal error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to withdraw response')
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Case Response Form</h1>
            <p className="text-gray-600 mt-2">
              Respond to the arbitration case filed against you. Review the claimant's details and submit your response.
            </p>
          </div>

          {/* 1. Case Reference (Pre-populated) */}
          {caseDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-blue-900 mb-4">1. Case Reference (Read-Only)</h2>
              
              {/* Basic Case Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div>
                  <p className="text-sm font-medium text-blue-700">Dispute Amount</p>
                  <p className="text-blue-900">₹{caseDetails.disputeAmount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Filed Date</p>
                  <p className="text-blue-900">{new Date(caseDetails.filedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Status</p>
                  <p className="text-blue-900">{caseDetails.status}</p>
                </div>
              </div>

              {/* Claimant's Submitted Details */}
              <div className="border-t border-blue-200 pt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Arbitration Agreement Details</h3>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    {caseDetails.arbitrationAgreement}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Claimant's Statement of Facts</h3>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    {caseDetails.claimantFacts}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Prayers/Reliefs Sought</h3>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    <ul className="list-disc list-inside space-y-1">
                      {caseDetails.claimantPrayers.map((prayer, index) => (
                        <li key={index}>{prayer}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Uploaded Documents</h3>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    {caseDetails.claimantDocuments.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {caseDetails.claimantDocuments.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No documents uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Response Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-8">
              {/* 2. Response Narrative */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">2. Response Narrative</h3>
                
                <Controller
                  name="arbitrationAgreementComments"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments on Arbitration Agreement Details *
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Accept, contest, or propose edits to the arbitration agreement fields entered by the claimant
                      </p>
                      <textarea
                        {...field}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Provide your comments on the arbitration agreement details..."
                      />
                      {errors.arbitrationAgreementComments && (
                        <p className="mt-1 text-sm text-red-600">{errors.arbitrationAgreementComments.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="generalStatementOfFacts"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        General Statement of Facts *
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Provide your version of events and facts relevant to this dispute
                      </p>
                      <textarea
                        {...field}
                        rows={8}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Present your comprehensive statement of facts..."
                      />
                      {errors.generalStatementOfFacts && (
                        <p className="mt-1 text-sm text-red-600">{errors.generalStatementOfFacts.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* 3. Admissions/Denials */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">3. Admissions/Denials</h3>
                <p className="text-sm text-gray-600 mb-4">
                  For each of the claimant's numbered claims or issues, please select your response and provide supporting details if applicable.
                </p>
                
                {caseDetails?.claims && caseDetails.claims.length > 0 ? (
                  <div className="space-y-6">
                    {claimResponseFields.map((claim, index) => (
                      <div key={claim.claimNumber} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Claim #{claim.claimNumber}: {claim.claimText}
                        </h4>
                        
                        <Controller
                          name={`claimResponses.${index}.response`}
                          control={control}
                          render={({ field }) => (
                            <div className="space-y-2 mb-4">
                              {[
                                { value: 'admit_full', label: 'Admit in full' },
                                { value: 'admit_part', label: 'Admit in part' },
                                { value: 'deny', label: 'Deny' }
                              ].map((option) => (
                                <label key={option.value} className="flex items-center">
                                  <input
                                    type="radio"
                                    {...field}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    className="mr-2"
                                  />
                                  <span>{option.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        />

                        {/* Conditional fields based on response */}
                        <Controller
                          name={`claimResponses.${index}.response`}
                          control={control}
                          render={({ field: responseField }) => (
                            <>
                              {responseField.value === 'admit_part' && (
                                <Controller
                                  name={`claimResponses.${index}.partialAdmissionDetails`}
                                  control={control}
                                  render={({ field }) => (
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Details of Partial Admission
                                      </label>
                                      <textarea
                                        {...field}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Specify which parts you admit and which you contest..."
                                      />
                                    </div>
                                  )}
                                />
                              )}

                              {responseField.value === 'deny' && (
                                <>
                                  <Controller
                                    name={`claimResponses.${index}.denialWitnessName`}
                                    control={control}
                                    render={({ field }) => (
                                      <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Witness Name (for denial support)
                                        </label>
                                        <input
                                          type="text"
                                          {...field}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder="Name of witness supporting this denial"
                                        />
                                      </div>
                                    )}
                                  />
                                  
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Affidavit Upload (supporting denial)
                                    </label>
                                    <input
                                      type="file"
                                      onChange={(e) => handleDenialAffidavit(claim.claimNumber, e)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      accept=".pdf,.doc,.docx"
                                    />
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specific claims available for response.</p>
                )}
              </div>

              {/* 4. Counter-Reliefs (Prayers) */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">4. Counter-Reliefs (Prayers)</h3>
                
                <Controller
                  name="hasCounterReliefs"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I wish to file counter-reliefs/counterclaims against the claimant</span>
                    </label>
                  )}
                />

                {hasCounterReliefs && (
                  <div className="space-y-4 ml-6">
                    <Controller
                      name="counterReliefs"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Counter-Reliefs/Counterclaims Details
                          </label>
                          <textarea
                            {...field}
                            rows={6}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Specify any counterclaims or reliefs sought by you as respondent..."
                          />
                        </div>
                      )}
                    />

                    <Controller
                      name="counterClaimAmount"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Counter-Claim Amount (if applicable)
                          </label>
                          <input
                            type="text"
                            {...field}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the monetary amount of your counter-claim"
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* 5. Supporting Evidence Upload (Day 14 requirements) */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">5. Supporting Evidence Upload</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload evidence following Day 14 evidence requirements (OCR-readable preferred)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scanned Documents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scanned Documents (OCR-readable)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleScannedDocuments}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload contracts, correspondence, invoices, etc.
                    </p>
                  </div>

                  {/* Officer's Affidavit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Officer's Affidavit
                    </label>
                    <input
                      type="file"
                      onChange={handleOfficerAffidavit}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sworn affidavit from company officer
                    </p>
                  </div>

                  {/* Witness Affidavits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Witness Affidavits
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleWitnessAffidavits}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Affidavits from witnesses
                    </p>
                  </div>

                  {/* Electronic Evidence Certificates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Electronic Evidence Certificates
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleElectronicCertificates}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Certificates for digital evidence
                    </p>
                  </div>
                </div>

                {/* Laws/Case Citations */}
                <div className="mt-6">
                  <Controller
                    name="evidence.lawsCaseCitations"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          List of Laws/Case Citations Relied Upon
                        </label>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="List relevant laws, regulations, case precedents, and legal authorities you rely upon..."
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 6. Arbitrator Selection & Virtual/Physical Mode */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">6. Arbitrator Selection & Hearing Mode</h3>
                
                {/* Arbitrator Response */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arbitrator Selection Response *
                  </label>
                  {caseDetails?.proposedArbitrator && (
                    <div className="bg-gray-50 p-3 rounded border mb-3">
                      <p className="text-sm"><strong>Proposed Arbitrator:</strong> {caseDetails.proposedArbitrator.name}</p>
                      <p className="text-sm"><strong>Designation:</strong> {caseDetails.proposedArbitrator.designation}</p>
                    </div>
                  )}
                  
                  <Controller
                    name="arbitratorResponse"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {[
                          { value: 'accept', label: 'Accept the proposed arbitrator' },
                          { value: 'reject', label: 'Reject the proposed arbitrator' },
                          { value: 'propose_new', label: 'Propose a new arbitrator' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              {...field}
                              value={option.value}
                              checked={field.value === option.value}
                              className="mr-2"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.arbitratorResponse && (
                    <p className="mt-1 text-sm text-red-600">{errors.arbitratorResponse.message}</p>
                  )}
                </div>

                {/* Propose New Arbitrator */}
                {arbitratorResponse === 'propose_new' && (
                  <div className="mb-6">
                    <Controller
                      name="proposedArbitratorId"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Alternative Arbitrator
                          </label>
                          <select
                            {...field}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select an arbitrator</option>
                            {arbitratorOptions.map((arbitrator) => (
                              <option key={arbitrator.id} value={arbitrator.id}>
                                {arbitrator.name} - {arbitrator.designation} ({arbitrator.experience})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    />
                  </div>
                )}

                {/* Hearing Mode */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Hearing Mode *
                  </label>
                  <Controller
                    name="hearingMode"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            {...field}
                            value="virtual"
                            checked={field.value === 'virtual'}
                            className="mr-2"
                          />
                          <span>Virtual hearings (online)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            {...field}
                            value="in_person"
                            checked={field.value === 'in_person'}
                            className="mr-2"
                          />
                          <span>In-person hearings (physical location)</span>
                        </label>
                      </div>
                    )}
                  />
                  {errors.hearingMode && (
                    <p className="mt-1 text-sm text-red-600">{errors.hearingMode.message}</p>
                  )}
                </div>

                {/* Preferred Location */}
                {hearingMode === 'in_person' && (
                  <Controller
                    name="preferredLocation"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Hearing Location
                        </label>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a location</option>
                          <option value="mumbai">Mumbai</option>
                          <option value="delhi">Delhi</option>
                          <option value="bangalore">Bangalore</option>
                          <option value="chennai">Chennai</option>
                          <option value="kolkata">Kolkata</option>
                          <option value="pune">Pune</option>
                          <option value="hyderabad">Hyderabad</option>
                        </select>
                      </div>
                    )}
                  />
                )}
              </div>

              {/* 7. Fee Payment */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">7. Fee Payment</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 font-medium">Registration Fee Due:</span>
                    <span className="ml-2 text-lg font-bold">₹{caseDetails?.registrationFee || '0'}</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    This is the respondent registration fee required to participate in the arbitration process.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Controller
                    name="registrationFeeAmount"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fee Amount (₹) *
                        </label>
                        <input
                          type="text"
                          {...field}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                        />
                        {errors.registrationFeeAmount && (
                          <p className="mt-1 text-sm text-red-600">{errors.registrationFeeAmount.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method *
                        </label>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select payment method</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="upi">UPI Payment</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                        {errors.paymentMethod && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="paymentConfirmed"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                      <span>I confirm payment of the registration fee and agree to the payment terms *</span>
                    </label>
                  )}
                />
                {errors.paymentConfirmed && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentConfirmed.message}</p>
                )}
              </div>

              {/* 8. Iteration Controls */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">8. Submit Response</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> After submission, the claimant can review your response and either accept it or respond once more. 
                    The FRS allows for two back-and-forth cycles before moving to the next phase.
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={submitting}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleWithdraw}
                      className="px-6 py-2 text-red-600 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                    >
                      Withdraw Response
                    </button>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Submitting...' : 'Submit Final Response'}
                    </button>
                  </div>
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