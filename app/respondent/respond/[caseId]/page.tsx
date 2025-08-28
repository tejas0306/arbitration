"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send } from 'lucide-react'

interface CaseData {
  id: string
  caseNumber: string
  status: string
  name: string
  createdAt: string
  claimant: {
    name: string
    email: string
    phone: string
    address1: string
    city: string
    state: string
  }
  arbitrationAgreement: {
    agreementDate: string
    placeOfSigning: string
    arbitrationText: string
    numberOfArbitrators: string
    stampDutyPercentage: string
  }
  natureOfDispute: any
  disputeDetails: any
  evidence: any
  prayers: any
  arguments: any
}

export default function RespondentFormPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.caseId as string
  
  // Helper function to safely render object values
  const safeRender = (value: any, defaultValue: string = 'Not specified') => {
    if (!value) return defaultValue
    if (typeof value === 'object' && Object.keys(value).length === 0) return defaultValue
    if (typeof value === 'string' && value.trim() === '') return defaultValue
    return value
  }
  
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [responseData, setResponseData] = useState({
    respondentName: '',
    respondentEmail: '',
    respondentPhone: '',
    respondentAddress: '',
    responseToClaim: '',
    counterArguments: '',
    supportingDocuments: '',
    additionalEvidence: '',
    proposedSettlement: ''
  })

  useEffect(() => {
    if (caseId) {
      fetchCaseData()
    }
  }, [caseId])

  const fetchCaseData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/respondent/cases/${caseId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch case data')
      }
      
      const data = await response.json()
      setCaseData(data)
      
      // Pre-fill respondent details if available
      if (data.respondents && data.respondents.length > 0) {
        const respondent = data.respondents[0]
        setResponseData(prev => ({
          ...prev,
          respondentName: respondent.name || '',
          respondentEmail: respondent.email || '',
          respondentPhone: respondent.phone || '',
          respondentAddress: respondent.address || ''
        }))
      }
      
    } catch (error) {
      console.error('Error fetching case data:', error)
      toast.error('Failed to load case details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/respondent/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          responseData,
          round: 1 // First response
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit response')
      }
      
      toast.success('Response submitted successfully!')
      router.push('/dashboard/my-cases')
      
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading case details...</div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">Case not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Respond to Case</h1>
            <p className="text-muted-foreground">
              Case: {caseData.caseNumber} - {caseData.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Details */}
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Case Number</Label>
              <p className="text-sm text-muted-foreground">{caseData.caseNumber}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Claimant</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.claimant?.name)}
              </p>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.claimant?.email)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Agreement Date</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.arbitrationAgreement?.agreementDate)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Place of Signing</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.arbitrationAgreement?.placeOfSigning)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Arbitration Text</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.arbitrationAgreement?.arbitrationText)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Number of Arbitrators</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.arbitrationAgreement?.numberOfArbitrators)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Stamp Duty</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.arbitrationAgreement?.stampDutyPercentage)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Case Status</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.status)}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Created Date</Label>
              <p className="text-sm text-muted-foreground">
                {safeRender(caseData.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="respondentName">Your Name</Label>
                <Input
                  id="respondentName"
                  value={responseData.respondentName}
                  onChange={(e) => setResponseData(prev => ({ ...prev, respondentName: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="respondentEmail">Your Email</Label>
                <Input
                  id="respondentEmail"
                  type="email"
                  value={responseData.respondentEmail}
                  onChange={(e) => setResponseData(prev => ({ ...prev, respondentEmail: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="respondentPhone">Your Phone</Label>
                <Input
                  id="respondentPhone"
                  value={responseData.respondentPhone}
                  onChange={(e) => setResponseData(prev => ({ ...prev, respondentPhone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="respondentAddress">Your Address</Label>
                <Textarea
                  id="respondentAddress"
                  value={responseData.respondentAddress}
                  onChange={(e) => setResponseData(prev => ({ ...prev, respondentAddress: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="responseToClaim">Response to Claim</Label>
                <Textarea
                  id="responseToClaim"
                  value={responseData.responseToClaim}
                  onChange={(e) => setResponseData(prev => ({ ...prev, responseToClaim: e.target.value }))}
                  placeholder="Provide your response to the claimant's allegations..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="counterArguments">Counter Arguments</Label>
                <Textarea
                  id="counterArguments"
                  value={responseData.counterArguments}
                  onChange={(e) => setResponseData(prev => ({ ...prev, counterArguments: e.target.value }))}
                  placeholder="Present your counter arguments..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="supportingDocuments">Supporting Documents</Label>
                <Textarea
                  id="supportingDocuments"
                  value={responseData.supportingDocuments}
                  onChange={(e) => setResponseData(prev => ({ ...prev, supportingDocuments: e.target.value }))}
                  placeholder="List any supporting documents or evidence..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="additionalEvidence">Additional Evidence</Label>
                <Textarea
                  id="additionalEvidence"
                  value={responseData.additionalEvidence}
                  onChange={(e) => setResponseData(prev => ({ ...prev, additionalEvidence: e.target.value }))}
                  placeholder="Describe any additional evidence you want to present..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="proposedSettlement">Proposed Settlement (Optional)</Label>
                <Textarea
                  id="proposedSettlement"
                  value={responseData.proposedSettlement}
                  onChange={(e) => setResponseData(prev => ({ ...prev, proposedSettlement: e.target.value }))}
                  placeholder="If you have a settlement proposal, describe it here..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Response</span>
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
