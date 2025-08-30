"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Users, Gavel, Scale, FileText, DollarSign, MessageSquare, Eye, Edit, Check, X, Plus, Trash2 } from 'lucide-react'
import { FormStepSidebar } from "@/components/ui/form-step-sidebar"
import { Alert, AlertDescription } from '@/components/ui/alert'

// Validation constants
const addressRegex = /^[^$%!~`*^+]*$/
const MAX_NAME_LENGTH = 100
const MAX_ADDRESS_LENGTH = 200
const MAX_EMAIL_LENGTH = 100
const MAX_CITY_LENGTH = 50
const MAX_DISTRICT_LENGTH = 50
const MAX_STATE_LENGTH = 50
const MAX_COUNTRY_LENGTH = 50
const MAX_PINCODE_LENGTH = 6
const MAX_PHONE_LENGTH = 10
const MAX_GST_LENGTH = 15
const MIN_GST_LENGTH = 15
const MAX_PAN_LENGTH = 10
const MIN_PAN_LENGTH = 10
const MAX_CIN_LENGTH = 21
const MIN_CIN_LENGTH = 21
const MAX_ARBITRATION_FIELD_LENGTH = 200

// EXACT SAME STRUCTURE AS ARBITRATION FORM
const steps = [
  "Claimant Details",
  "Additional Claimants & Manager", 
  "Respondent Details",
  "Arbitration Agreement",
  "Nature of Dispute",
  "Dispute Description", 
  "Prayers & Reliefs",
  "Documents",
  "Payment",
  "Arguments",
  "Review & Submit",
]

const sidebarSteps = [
  {
    id: 0,
    title: "Step 1: Claimant Details",
    description: "Personal and business information (Read-only)",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 1,
    title: "Step 2: Additional Claimants",
    description: "Co-claimants and authorized managers (Read-only)",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Step 3: Respondent Details",
    description: "Opposing party information (EDITABLE)",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Step 4: Arbitration Agreement",
    description: "Agreement terms and arbitrator selection (EDITABLE)",
    icon: <Gavel className="w-5 h-5" />
  },
  {
    id: 4,
    title: "Step 5: Nature of Dispute",
    description: "Category and background details (EDITABLE)",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 5,
    title: "Step 6: Dispute Description",
    description: "Detailed claims and supporting facts (EDITABLE)",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 6,
    title: "Step 7: Prayers & Reliefs",
    description: "Specific remedies sought (EDITABLE)",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 7,
    title: "Step 8: Documents",
    description: "Evidence and supporting files (EDITABLE)",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 8,
    title: "Step 9: Payment",
    description: "Fee structure and payment details (Read-only)",
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 9,
    title: "Step 10: Arguments",
    description: "Legal arguments for each prayer (EDITABLE)",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 10,
    title: "Step 11: Review & Submit",
    description: "Final review before submission",
    icon: <Eye className="w-5 h-5" />
  },
]

interface RespondentFormProps {
  caseId: string
  caseData?: any
  round?: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentFormComplete({ caseId, caseData, round = 1 }: RespondentFormProps) {
  // Helper function to safely render object values
  const safeRender = (value: any, defaultValue: string = 'Not specified') => {
    if (!value) return defaultValue
    if (typeof value === 'object' && Object.keys(value).length === 0) return defaultValue
    if (typeof value === 'string' && value.trim() === '') return defaultValue
    return value
  }
  const [currentStep, setCurrentStep] = useState(0)
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const router = useRouter()
  
  // Verification states for respondent
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  
  // Email verification function
  const handleEmailVerification = async (email: string) => {
    try {
      setLoading(true)
      // Mock verification for now - in production this would send OTP
      toast.success('Email verification sent!')
      setEmailVerified(true)
    } catch (error) {
      toast.error('Failed to send email verification')
    } finally {
      setLoading(false)
    }
  }
  
  // Phone verification function
  const handlePhoneVerification = async (phone: string) => {
    try {
      setLoading(true)
      // Mock verification for now - in production this would send OTP
      toast.success('Phone verification sent!')
      setPhoneVerified(true)
    } catch (error) {
      toast.error('Failed to send phone verification')
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill form with case data
  useEffect(() => {
    console.log('🔧 [RespondentForm] useEffect triggered with caseData:', caseData);
    if (caseData) {
      console.log('🔧 [RespondentForm] FULL caseData received:');
      console.log('🔧 caseData keys:', Object.keys(caseData));
      console.log('🔧 caseData.managerDetails:', caseData.managerDetails);
      console.log('🔧 caseData.disputeDescriptions:', caseData.disputeDescriptions);
      console.log('🔧 caseData.natureOfDispute:', caseData.natureOfDispute);
      console.log('🔧 caseData.prayers:', caseData.prayers);
      console.log('🔧 caseData.evidence:', caseData.evidence);
      console.log('🔧 caseData.arguments:', caseData.arguments);
      console.log('🔧 caseData._rawFormData:', caseData._rawFormData);
      console.log('🔧 caseData._rawFlattenedFields:', caseData._rawFlattenedFields);
      console.log('🔧 caseData._rawDisputeDetails:', caseData._rawDisputeDetails);
      console.log('🔧 caseData._rawManagerDetails:', caseData._rawManagerDetails);
      console.log('🔧 [RespondentForm] Setting form data with:', {
        claimant: caseData.claimant,
        additionalClaimants: caseData.additionalClaimants,
        managerDetails: caseData.managerDetails,
        natureOfDispute: caseData.natureOfDispute,
        arguments: caseData.arguments
      });
      

      setFormData({
        // Step 1: Claimant Details (Read-only) - FIXED: Include ALL claimant fields
        claimant: {
          type: caseData.claimant?.type || '',
          name: caseData.claimant?.name || '',
          email: caseData.claimant?.email || '',
          phone: caseData.claimant?.phone || '',
          phoneCountryCode: caseData.claimant?.phoneCountryCode || '',
          address1: caseData.claimant?.address1 || '',
          address2: caseData.claimant?.address2 || '',
          city: caseData.claimant?.city || '',
          district: caseData.claimant?.district || '',
          state: caseData.claimant?.state || '',
          country: caseData.claimant?.country || '',
          pincode: caseData.claimant?.pincode || '',
          gst: caseData.claimant?.gst || '',
          pan: caseData.claimant?.pan || '',
          cin: caseData.claimant?.cin || '',
          coi: caseData.claimant?.coi || null,
          panCard: caseData.claimant?.panCard || null,
          gstCert: caseData.claimant?.gstCert || null
        },
        
        // Step 2: Additional Claimants (Read-only)
        additionalClaimants: caseData.additionalClaimants || [],
        managerDetails: Array.isArray(caseData.managerDetails) && caseData.managerDetails.length > 0 
          ? caseData.managerDetails[0] 
          : (caseData.managerDetails || {}),
        
        // Step 3: Respondent Details (EDITABLE)
        respondents: caseData.respondents || [],
        
        // Step 4: Arbitration Agreement (EDITABLE)
        arbitrationAgreement: {
          agreementDate: caseData.arbitrationAgreement?.agreementDate || '2024-01-15',
          placeOfSigning: caseData.arbitrationAgreement?.placeOfSigning || caseData.arbitrationAgreement?.seat || 'Mumbai, Maharashtra',
          arbitrationText: caseData.arbitrationAgreement?.arbitrationText || caseData.arbitrationAgreement?.details || '',
          stampDutyPercentage: caseData.arbitrationAgreement?.stampDutyPercentage || '0.1%',
          numberOfArbitrators: caseData.arbitrationAgreement?.numberOfArbitrators || '1'
        },
        
        // Step 5: Nature of Dispute (EDITABLE) - Should be an array
        natureOfDispute: caseData.natureOfDispute || [],
        
        // Step 6: Dispute Description (EDITABLE)
        disputeDescriptions: caseData.disputeDescriptions || [],
        
        // Step 7: Prayers & Reliefs (EDITABLE)
        prayers: caseData.prayers || [],
        
        // Step 8: Documents (EDITABLE)
        evidence: caseData.evidence || {
          scannedDocuments: [],
          supportingDocuments: [],
          evidenceFiles: [],
          companyDocs: [],
          respondentsFiles: [],
          managerDetailsFiles: [],
          additionalClaimantsFiles: []
        },
        
        // Step 9: Payment (EDITABLE)
        payment: caseData.payment || {
          paymentHead: '',
          paymentAmount: '',
          paymentDetails: ''
        },
        
        // Step 10: Arguments (EDITABLE)
        arguments: caseData.arguments || {
          argumentsPerIssue: [],
          argumentsPerPrayer: []
        },
        
        // Respondent workflow fields
        respondentStatus: 'reviewing', // reviewing, responded, submitted
        respondentResponses: {}, // Field-specific responses
        respondentComments: {}, // General comments per section
      })
      

      
              // Mark steps as completed based on available data
        const completed = []
        if (caseData.claimant) completed.push(0) // Step 1
        if (caseData.additionalClaimants || (Array.isArray(caseData.managerDetails) && caseData.managerDetails.length > 0) || caseData.managerDetails) completed.push(1) // Step 2
      if (caseData.respondents) completed.push(2) // Step 3
      if (caseData.arbitrationAgreement) completed.push(3) // Step 4
      if (caseData.natureOfDispute) completed.push(4) // Step 5
      if (caseData.disputeDescriptions) completed.push(5) // Step 6
      if (caseData.prayers) completed.push(6) // Step 7
      if (caseData.evidence) completed.push(7) // Step 8
      if (caseData.payment) completed.push(8) // Step 9
      if (caseData.arguments) completed.push(9) // Step 10
      completed.push(10) // Step 11 (Review) is always available
      setCompletedSteps(completed)
    }
  }, [caseData])



  // Don't render until formData is properly initialized
  if (!formData || Object.keys(formData).length === 0 || !formData.claimant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  // Edit field functions for editable steps
  const handleEdit = (step: number, index: number | null, field: string) => {
    const key = index !== null ? `${step}-${index}-${field}` : `${step}-${field}`
    setEditState({ ...editState, [key]: true })
    
    let value = ''
    if (step === 2 && index !== null) { // Respondents
      value = formData.respondents?.[index]?.[field] || ''
    } else if (step === 3) { // Arbitration Agreement
      value = formData.arbitrationAgreement?.[field] || ''
    } else if (step === 4 && index !== null) { // Nature of Dispute
      value = formData.natureOfDispute?.[index]?.[field] || ''
    } else if (step === 5 && index !== null) { // Dispute Descriptions
      value = formData.disputeDescriptions?.[index]?.[field] || ''
    } else if (step === 6 && index !== null) { // Prayers
      value = formData.prayers?.[index]?.[field] || ''
    } else if (step === 7) { // Evidence
      value = formData.evidence?.[field] || ''
    } else if (step === 9) { // Arguments
      value = formData.arguments?.[field] || ''
    }
    
    setTempData({ ...tempData, [key]: value })
  }

  const handleSave = (step: number, index: number | null, field: string) => {
    const key = index !== null ? `${step}-${index}-${field}` : `${step}-${field}`
    const newValue = tempData[key]
    
    const updatedFormData = { ...formData }
    
    if (step === 2 && index !== null) { // Respondents
      if (!updatedFormData.respondents) updatedFormData.respondents = []
      if (!updatedFormData.respondents[index]) updatedFormData.respondents[index] = {}
      updatedFormData.respondents[index][field] = newValue
    } else if (step === 3) { // Arbitration Agreement
      if (!updatedFormData.arbitrationAgreement) updatedFormData.arbitrationAgreement = {}
      updatedFormData.arbitrationAgreement[field] = newValue
    } else if (step === 4 && index !== null) { // Nature of Dispute
      if (!updatedFormData.natureOfDispute) updatedFormData.natureOfDispute = []
      if (!updatedFormData.natureOfDispute[index]) updatedFormData.natureOfDispute[index] = {}
      updatedFormData.natureOfDispute[index][field] = newValue
    } else if (step === 5 && index !== null) { // Dispute Descriptions
      if (!updatedFormData.disputeDescriptions) updatedFormData.disputeDescriptions = []
      if (!updatedFormData.disputeDescriptions[index]) updatedFormData.disputeDescriptions[index] = {}
      updatedFormData.disputeDescriptions[index][field] = newValue
    } else if (step === 6 && index !== null) { // Prayers
      if (!updatedFormData.prayers) updatedFormData.prayers = []
      if (!updatedFormData.prayers[index]) updatedFormData.prayers[index] = {}
      updatedFormData.prayers[index][field] = newValue
    } else if (step === 7) { // Evidence
      if (!updatedFormData.evidence) updatedFormData.evidence = {}
      updatedFormData.evidence[field] = newValue
    } else if (step === 9) { // Arguments
      if (!updatedFormData.arguments) updatedFormData.arguments = {}
      updatedFormData.arguments[field] = newValue
    }
    
    setFormData(updatedFormData)
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  const handleCancel = (step: number, index: number | null, field: string) => {
    const key = index !== null ? `${step}-${index}-${field}` : `${step}-${field}`
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  // Render editable field component
  const renderEditableField = (
    step: number,
    index: number | null,
    field: string,
    label: string,
    value: string,
    type: string = 'text',
    options?: Array<{value: string, label: string}>,
    placeholder?: string,
    rows?: number,
    phoneCountryCodeField?: string,
    phoneCountryCodeValue?: string,
    phoneCountryCodes?: Array<{value: string, label: string}>
  ) => {
    const key = index !== null ? `${step}-${index}-${field}` : `${step}-${field}`
    const isEditing = editState[key]
    const displayValue = isEditing ? tempData[key] : value
    const isEditableStep = [2, 3, 4, 5, 6, 7, 9].includes(step)

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {isEditableStep && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(step, index, field)}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              Change
            </Button>
          )}
        </div>

          <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {type === 'select' ? (
                <Select value={displayValue} onValueChange={(val) => setTempData({...tempData, [key]: val})}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === 'textarea' ? (
                <Textarea
                  value={displayValue}
                  onChange={(e) => setTempData({...tempData, [key]: e.target.value})}
                  className="flex-1"
                  rows={rows || 3}
                  placeholder={placeholder}
                />
              ) : (
                <Input
                  type={type}
                  value={displayValue}
                  onChange={(e) => setTempData({...tempData, [key]: e.target.value})}
                  className="flex-1"
                  placeholder={placeholder}
                />
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(step, index, field)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(step, index, field)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
                {value || <span className="text-gray-400">Not provided</span>}
              </div>
              
              {/* Add verify buttons for email and phone fields */}
              {field === 'email' && isEditableStep && value && (
                <Button
                  variant={emailVerified ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEmailVerification(value)}
                  disabled={emailVerified}
                  className="whitespace-nowrap"
                >
                  {emailVerified ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              )}
              
              {field === 'phone' && isEditableStep && value && (
                <Button
                  variant={phoneVerified ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePhoneVerification(value)}
                  disabled={phoneVerified}
                  className="whitespace-nowrap"
                >
                  {phoneVerified ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    'Verify Phone'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render read-only field
  const renderReadOnlyField = (label: string, value: string) => {
    // Better handling of empty values
    let displayValue = value;
    if (value === '' || value === null || value === undefined) {
      displayValue = 'Not filled by claimant';
    } else if (Array.isArray(value) && value.length === 0) {
      displayValue = 'No items added by claimant';
    } else if (Array.isArray(value) && value.length === 1 && value[0] === '') {
      displayValue = 'Claimant started but did not complete this field';
    }
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="p-2 bg-gray-100 rounded border min-h-[40px] flex items-center text-gray-700">
          {displayValue || <span className="text-gray-400">Not provided</span>}
        </div>
      </div>
    )
  }

  // Entity type options
  const entityTypes = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Company', label: 'Company' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'LLP', label: 'LLP' },
    { value: 'HUF', label: 'HUF' },
    { value: 'Trust', label: 'Trust' },
    { value: 'Society', label: 'Society' },
    { value: 'Other', label: 'Other' }
  ]

  // Render form content based on current step
  const renderFormContent = () => {
    switch (currentStep) {
      case 0: // Step 1: Claimant Details (READ-ONLY)
        return (
          <div className="space-y-6">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 1: Claimant Details (Read-Only)</strong><br/>
                This information was filled by the claimant and cannot be modified.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Claimant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderReadOnlyField('Type', formData.claimant?.type)}
                  {renderReadOnlyField('Name', formData.claimant?.name)}
                  {renderReadOnlyField('Email', formData.claimant?.email)}
                  {renderReadOnlyField('Phone', formData.claimant?.phone)}
                  {renderReadOnlyField('Address Line 1', formData.claimant?.address1)}
                  {renderReadOnlyField('Address Line 2', formData.claimant?.address2)}
                  {renderReadOnlyField('City', formData.claimant?.city)}
                  {renderReadOnlyField('District', formData.claimant?.district)}
                  {renderReadOnlyField('State', formData.claimant?.state)}
                  {renderReadOnlyField('Country', formData.claimant?.country)}
                  {renderReadOnlyField('Pincode', formData.claimant?.pincode)}
                  {renderReadOnlyField('GST Number', formData.claimant?.gst)}
                  {renderReadOnlyField('PAN Number', formData.claimant?.pan)}
                  {renderReadOnlyField('CIN Number', formData.claimant?.cin)}
                </div>
                
                {/* Document Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-md">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderReadOnlyField('Certificate of Incorporation', formData.claimant?.coi && formData.claimant.coi !== null ? `${formData.claimant.coi.originalName}` : 'Not uploaded')}
                    {renderReadOnlyField('PAN Card', formData.claimant?.panCard && formData.claimant.panCard !== null ? `${formData.claimant.panCard.originalName}` : 'Not uploaded')}
                    {renderReadOnlyField('GST Certificate', formData.claimant?.gstCert && formData.claimant.gstCert !== null ? `${formData.claimant.gstCert.originalName}` : 'Not uploaded')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 1: // Step 2: Additional Claimants (READ-ONLY)
        return (
          <div className="space-y-6">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 2: Additional Claimants & Manager (Read-Only)</strong><br/>
                This information was filled by the claimant and cannot be modified.
              </AlertDescription>
            </Alert>
            
            {/* Additional Claimants */}
            {formData.additionalClaimants?.map((claimant: any, index: number) => (
              <Card key={index}>
                <CardContent className="space-y-4 pt-6">
                  <h3 className="font-medium text-lg mb-4">Additional Claimant {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderReadOnlyField('Type', claimant.type)}
                    {renderReadOnlyField('Name', claimant.name)}
                    {renderReadOnlyField('Email', claimant.email)}
                    {renderReadOnlyField('Phone', claimant.phone)}
                    {renderReadOnlyField('Country Code', claimant.phoneCountryCode)}
                    {renderReadOnlyField('Address Line 1', claimant.address1)}
                    {renderReadOnlyField('Address Line 2', claimant.address2)}
                    {renderReadOnlyField('City', claimant.city)}
                    {renderReadOnlyField('District', claimant.district)}
                    {renderReadOnlyField('State', claimant.state)}
                    {renderReadOnlyField('Country', claimant.country)}
                    {renderReadOnlyField('Pincode', claimant.pincode)}
                    {renderReadOnlyField('GST Number', claimant.gst)}
                    {renderReadOnlyField('PAN Number', claimant.pan)}
                    {renderReadOnlyField('CIN Number', claimant.cin)}
                  </div>
                  
                  {/* Document Fields */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Uploaded Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderReadOnlyField('Certificate of Incorporation', claimant.coi && claimant.coi !== null ? `${claimant.coi.originalName}` : 'Not uploaded')}
                      {renderReadOnlyField('PAN Card', claimant.panCard && claimant.panCard !== null ? `${claimant.panCard.originalName}` : 'Not uploaded')}
                      {renderReadOnlyField('GST Certificate', claimant.gstCert && claimant.gstCert !== null ? `${claimant.gstCert.originalName}` : 'Not uploaded')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Manager Details */}
            {formData.managerDetails && Object.keys(formData.managerDetails).length > 0 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h3 className="font-medium text-lg mb-4">Manager Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderReadOnlyField('Name', formData.managerDetails.name)}
                    {renderReadOnlyField('Email', formData.managerDetails.email)}
                    {renderReadOnlyField('Phone', formData.managerDetails.phone)}
                    {renderReadOnlyField('Country Code', formData.managerDetails.phoneCountryCode)}
                    {renderReadOnlyField('Address', formData.managerDetails.address)}
                    {renderReadOnlyField('Designation', formData.managerDetails.designation)}
                    {renderReadOnlyField('Authority', formData.managerDetails.authority)}
                    {renderReadOnlyField('Manager ID', formData.managerDetails.managerId)}
                    {renderReadOnlyField('GST Number', formData.managerDetails.gst)}
                    {renderReadOnlyField('PAN Number', formData.managerDetails.pan)}
                    {renderReadOnlyField('CIN Number', formData.managerDetails.cin)}
                  </div>
                  
                  {/* Document Fields */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Uploaded Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderReadOnlyField('Certificate of Incorporation', formData.managerDetails.coi ? `${formData.managerDetails.coi.originalName}` : 'Not uploaded')}
                      {renderReadOnlyField('PAN Card', formData.managerDetails.panCard ? `${formData.managerDetails.panCard.originalName}` : 'Not uploaded')}
                      {renderReadOnlyField('GST Certificate', formData.managerDetails.gstCert ? `${formData.managerDetails.gstCert.originalName}` : 'Not uploaded')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 2: // Step 3: Respondent Details (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 3: Respondent Details (EDITABLE)</strong><br/>
                These are the exact same fields as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            {formData.respondents?.map((respondent: any, index: number) => (
              <Card key={index}>
                <CardContent className="space-y-4 pt-6">
                  <h3 className="font-medium text-lg mb-4">Respondent {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderEditableField(2, index, 'type', '3.1 Type*', respondent.type, 'select', entityTypes, 'Select type')}
                    {renderEditableField(2, index, 'name', '3.2 Name*', respondent.name, 'text', undefined, 'Enter name')}
                    {renderEditableField(2, index, 'email', '3.3 Email*', respondent.email, 'email', undefined, 'Enter email')}
                    {renderEditableField(2, index, 'phone', '3.4 Phone*', respondent.phone, 'tel', undefined, 'Enter phone')}
                    {renderEditableField(2, index, 'address1', '3.5a Address Line 1*', respondent.address1, 'text', undefined, 'Enter address')}
                    {renderEditableField(2, index, 'address2', '3.5b Address Line 2', respondent.address2, 'text', undefined, 'Enter address (optional)')}
                    {renderEditableField(2, index, 'city', '3.6 City*', respondent.city, 'text', undefined, 'Enter city')}
                    {renderEditableField(2, index, 'district', '3.7 District*', respondent.district, 'text', undefined, 'Enter district')}
                    {renderEditableField(2, index, 'state', '3.8 State*', respondent.state, 'text', undefined, 'Enter state')}
                    {renderEditableField(2, index, 'country', '3.9 Country*', respondent.country, 'text', undefined, 'Enter country')}
                    {renderEditableField(2, index, 'pincode', '3.10 Pincode*', respondent.pincode, 'text', undefined, 'Enter pincode')}
                    {renderEditableField(2, index, 'gst', '3.11 GST Number', respondent.gst, 'text', undefined, 'Enter GST number')}
                    {renderEditableField(2, index, 'pan', '3.12 PAN Number', respondent.pan, 'text', undefined, 'Enter PAN number')}
                    {renderEditableField(2, index, 'cin', '3.13 CIN Number', respondent.cin, 'text', undefined, 'Enter CIN number')}
                  </div>
                  
                  {/* Document Upload Fields */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Document Upload</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Certificate of Incorporation</Label>
                        <div className="p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
                          {respondent.coi ? 'File uploaded' : 'No file uploaded'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>PAN Card</Label>
                        <div className="p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
                          {respondent.panCard ? 'File uploaded' : 'No file uploaded'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>GST Certificate</Label>
                        <div className="p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
                          {respondent.gstCert ? 'File uploaded' : 'No file uploaded'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 3: // Step 4: Arbitration Agreement (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <Gavel className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 4: Arbitration Agreement (EDITABLE)</strong><br/>
                These are the exact same fields (4.1-4.5) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Arbitration Agreement Details</h3>
                {renderEditableField(3, null, 'agreementDate', '4.1 Date of Arbitration Agreement*', formData.arbitrationAgreement?.agreementDate, 'date')}
                {renderEditableField(3, null, 'placeOfSigning', '4.2 Place of Signing*', formData.arbitrationAgreement?.placeOfSigning, 'text', undefined, 'Enter place')}
                {renderEditableField(3, null, 'arbitrationText', '4.3 Text of Arbitration Agreement*', formData.arbitrationAgreement?.arbitrationText, 'textarea', undefined, 'Enter agreement text', 5)}
                {renderEditableField(3, null, 'stampDutyPercentage', '4.4 Stamp Duty Percentage*', formData.arbitrationAgreement?.stampDutyPercentage, 'text', undefined, 'Enter percentage')}
                {renderEditableField(3, null, 'numberOfArbitrators', '4.5 Number of Arbitrators*', formData.arbitrationAgreement?.numberOfArbitrators, 'select', [
                  { value: '1', label: '1 (Sole Arbitrator)' },
                  { value: '3', label: '3 (Tribunal)' },
                  { value: '5', label: '5' },
                  { value: 'other', label: 'Other' }
                ], 'Select number')}
              </CardContent>
            </Card>
          </div>
        )

      case 4: // Step 5: Nature of Dispute (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 5: Nature of Dispute (EDITABLE)</strong><br/>
                These are the exact same fields (5.1-5.5) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Nature of Dispute</h3>
                

                
                {formData.natureOfDispute && formData.natureOfDispute.length > 0 ? (
                  formData.natureOfDispute.map((dispute, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardContent className="space-y-4 pt-6">
                        <h4 className="font-medium text-md">Dispute {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderEditableField(4, index, 'category', '5.1 Category*', dispute.category, 'select', [
                            { value: 'commercial', label: 'Commercial' },
                            { value: 'construction', label: 'Construction' },
                            { value: 'employment', label: 'Employment' },
                            { value: 'intellectual_property', label: 'Intellectual Property' },
                            { value: 'corporate', label: 'Corporate' },
                            { value: 'real_estate', label: 'Real Estate' },
                            { value: 'banking', label: 'Banking & Finance' },
                            { value: 'other', label: 'Other' }
                          ], 'Select category')}
                          {renderEditableField(4, index, 'subCategory', '5.2 Sub Category*', dispute.subCategory, 'select', [
                            { value: 'breach', label: 'Breach of Contract' },
                            { value: 'payment', label: 'Payment Dispute' },
                            { value: 'quality', label: 'Quality/Performance Issue' },
                            { value: 'delivery', label: 'Delivery Delay' },
                            { value: 'warranty', label: 'Warranty Claim' },
                            { value: 'termination', label: 'Contract Termination' },
                            { value: 'other', label: 'Other' }
                          ], 'Select sub-category')}
                          {renderEditableField(4, index, 'description', '5.3 Nature of Dispute*', dispute.description, 'textarea', undefined, 'Describe the dispute', 4)}
                          {renderEditableField(4, index, 'dateWhenRightToClaimArose', '5.4 Date when right to claim arose*', dispute.dateWhenRightToClaimArose, 'date')}
                          {renderEditableField(4, index, 'standardisedPrayerClauses', '5.5 Standardised prayer clauses*', dispute.standardisedPrayerClauses, 'select', [
                            { value: 'monetary_relief', label: 'Monetary Relief' },
                            { value: 'specific_performance', label: 'Specific Performance' },
                            { value: 'declaratory_relief', label: 'Declaratory Relief' },
                            { value: 'injunctive_relief', label: 'Injunctive Relief' },
                            { value: 'damages', label: 'Damages' },
                            { value: 'costs', label: 'Costs and Expenses' },
                            { value: 'other', label: 'Other' }
                          ], 'Select prayer type')}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No nature of dispute found. Claimant has not specified any dispute details yet.
                  </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )

      case 5: // Step 6: Dispute Description (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 6: Dispute Description (EDITABLE)</strong><br/>
                These are the exact same fields (6.1-6.8) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Dispute Description</h3>
                {formData.disputeDescriptions && formData.disputeDescriptions.length > 0 ? (
                  formData.disputeDescriptions.map((dispute, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="space-y-4 pt-6">
                        <h4 className="font-medium text-md">Dispute {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderEditableField(5, index, 'clause', '6.1 Clause*', dispute.clause, 'text')}
                          {renderEditableField(5, index, 'claimType', '6.2 Claim Type*', dispute.claimType, 'select', [
                            { value: 'monetary', label: 'Monetary' },
                            { value: 'non_monetary', label: 'Non-Monetary' },
                            { value: 'declaratory', label: 'Declaratory' },
                            { value: 'injunctive', label: 'Injunctive' },
                            { value: 'other', label: 'Other' }
                          ])}
                          {renderEditableField(5, index, 'claimReason', '6.3 Claim Reason*', dispute.claimReason, 'text')}
                          {renderEditableField(5, index, 'reliefSought', '6.4 Relief Sought*', dispute.reliefSought, 'select', [
                            { value: 'damages', label: 'Damages' },
                            { value: 'specific_performance', label: 'Specific Performance' },
                            { value: 'rectification', label: 'Rectification' },
                            { value: 'rescission', label: 'Rescission' },
                            { value: 'injunction', label: 'Injunction' },
                            { value: 'declaration', label: 'Declaration' },
                            { value: 'other', label: 'Other' }
                          ])}
                          {renderEditableField(5, index, 'lawReliedUpon', '6.5 Law Relied Upon*', dispute.lawReliedUpon, 'text')}
                          {renderEditableField(5, index, 'relevantClauseNumber', '6.6 Relevant Clause Number*', dispute.relevantClauseNumber, 'text')}
                          {renderEditableField(5, index, 'clauseSupportingClaim', '6.7 Clause Supporting Claim*', dispute.clauseSupportingClaim, 'text')}
                          {renderEditableField(5, index, 'documentSupportingClaim', '6.8 Document Supporting Claim*', dispute.documentSupportingClaim, 'text')}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No dispute descriptions found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 6: // Step 7: Prayers & Reliefs (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 7: Prayers & Reliefs (EDITABLE)</strong><br/>
                These are the exact same fields (7.1-7.2) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Prayers & Reliefs</h3>
                

                
                <div className="grid grid-cols-1 gap-4">
                  {formData.prayers && formData.prayers.length > 0 ? (
                    formData.prayers.map((prayer, index) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="space-y-4 pt-6">
                          <h4 className="font-medium text-md">Prayer {index + 1}</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {renderEditableField(6, index, 'prayer', '7.1 Prayer Text*', typeof prayer === 'string' ? prayer : prayer.title || prayer.description || '', 'textarea')}
                            {renderEditableField(6, index, 'prayerType', '7.2 Prayer Type*', typeof prayer === 'object' ? prayer.reliefType || prayer.prayerType : '', 'select', [
                              { value: 'damages', label: 'Damages' },
                              { value: 'specific_performance', label: 'Specific Performance' },
                              { value: 'injunction', label: 'Injunction' },
                              { value: 'declaration', label: 'Declaration' },
                              { value: 'costs', label: 'Costs and Expenses' },
                              { value: 'other', label: 'Other' }
                            ], 'Select prayer type')}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No prayers found. Claimant has not specified any prayers yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 7: // Step 8: Documents (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 8: Documents (EDITABLE)</strong><br/>
                These are the exact same fields (8.1-8.5) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Evidence & Documents</h3>
                
                {/* Scanned Documents */}
                {formData.evidence?.scannedDocuments && formData.evidence.scannedDocuments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Scanned Documents</h4>
                    {formData.evidence.scannedDocuments.map((doc, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Document {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderEditableField(7, index, 'description', '8.1 Description*', doc.description, 'text')}
                            {renderEditableField(7, index, 'date', '8.2 Date*', doc.date, 'date')}
                            {renderEditableField(7, index, 'linkedIssue', '8.3 Linked Issue*', doc.linkedIssue, 'text')}
                            {renderEditableField(7, index, 'admissionStatus', '8.4 Admission Status*', doc.admissionStatus, 'select', [
                              { value: 'pending', label: 'Pending' },
                              { value: 'admitted', label: 'Admitted' },
                              { value: 'rejected', label: 'Rejected' }
                            ])}
                            {renderEditableField(7, index, 'crossExaminationRef', '8.5 Cross Examination Reference', doc.crossExaminationRef, 'text')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Supporting Documents */}
                {formData.evidence?.supportingDocuments && formData.evidence.supportingDocuments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Supporting Documents</h4>
                    {formData.evidence.supportingDocuments.map((doc, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Supporting Document {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReadOnlyField('File Name', doc.fileName || 'Not uploaded')}
                            {renderReadOnlyField('Description', doc.description || 'Not provided')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Company Documents */}
                {formData.evidence?.companyDocs && formData.evidence.companyDocs.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Company Documents</h4>
                    {formData.evidence.companyDocs.map((doc, index) => (
                      <Card key={index} className="border-l-4 border-l-yellow-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Company Document {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReadOnlyField('File Name', doc.fileName || 'Not uploaded')}
                            {renderReadOnlyField('Description', doc.description || 'Not provided')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Evidence Files */}
                {formData.evidence?.evidenceFiles && formData.evidence.evidenceFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Evidence Files</h4>
                    {formData.evidence.evidenceFiles.map((doc, index) => (
                      <Card key={index} className="border-l-4 border-l-red-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Evidence File {index + 1}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReadOnlyField('File Name', doc.fileName || 'Not uploaded')}
                            {renderReadOnlyField('Description', doc.description || 'Not provided')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {(!formData.evidence?.scannedDocuments || formData.evidence.scannedDocuments.length === 0) && 
                 (!formData.evidence?.supportingDocuments || formData.evidence.supportingDocuments.length === 0) &&
                 (!formData.evidence?.companyDocs || formData.evidence.companyDocs.length === 0) &&
                 (!formData.evidence?.evidenceFiles || formData.evidence.evidenceFiles.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No documents found. Claimant has not uploaded any documents yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 8: // Step 9: Payment (READ-ONLY)
        return (
          <div className="space-y-6">
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 9: Payment (Read-Only)</strong><br/>
                Payment information filled by the claimant cannot be modified.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderReadOnlyField('Payment Head', formData.payment?.paymentHead || 'Not specified')}
                  {renderReadOnlyField('Payment Amount', formData.payment?.paymentAmount || 'Not specified')}
                  {renderReadOnlyField('Payment Details', formData.payment?.paymentDetails || 'Not specified')}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 9: // Step 10: Arguments (EDITABLE)
        return (
          <div className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Step 10: Arguments (EDITABLE)</strong><br/>
                These are the exact same fields (10.1-10.2) as the claimant form. You can modify any information using the "Change" buttons.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-medium text-lg mb-4">Legal Arguments</h3>
                
                {/* DEBUG: Log arguments data */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>DEBUG Arguments Data:</strong><br/>
                    formData.arguments: {JSON.stringify(formData.arguments, null, 2)}<br/>
                    argumentsPerIssue: {formData.arguments?.argumentsPerIssue ? JSON.stringify(formData.arguments.argumentsPerIssue) : 'undefined'}<br/>
                    argumentsPerPrayer: {formData.arguments?.argumentsPerPrayer ? JSON.stringify(formData.arguments.argumentsPerPrayer) : 'undefined'}<br/>
                    argumentsPerIssue length: {formData.arguments?.argumentsPerIssue?.length || 0}<br/>
                    argumentsPerPrayer length: {formData.arguments?.argumentsPerPrayer?.length || 0}
                  </p>
                </div>
                
                {/* Arguments Per Issue */}
                {formData.arguments?.argumentsPerIssue && formData.arguments.argumentsPerIssue.length > 0 && formData.arguments.argumentsPerIssue.some(arg => arg && arg.trim() !== '') ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Arguments Per Issue</h4>
                    {formData.arguments.argumentsPerIssue.map((argument, index) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Argument {index + 1}</h5>
                          <div className="grid grid-cols-1 gap-4">
                            {renderEditableField(9, index, 'issue', '10.1 Issue*', argument.issue, 'text')}
                            {renderEditableField(9, index, 'argument', '10.2 Legal Argument*', argument.argument, 'textarea')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : formData.arguments?.argumentsPerPrayer && formData.arguments.argumentsPerPrayer.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Arguments Per Prayer</h4>
                    {formData.arguments.argumentsPerPrayer.map((argument, index) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="space-y-4 pt-6">
                          <h5 className="font-medium text-sm">Prayer Argument {index + 1}</h5>
                          <div className="grid grid-cols-1 gap-4">
                            {renderEditableField(9, index, 'prayerTitle', '10.1 Prayer Title*', argument.prayerTitle || '', 'text')}
                            {renderEditableField(9, index, 'argument', '10.2 Legal Argument*', argument.argument || '', 'textarea')}
                            {renderEditableField(9, index, 'legalBasis', '10.3 Legal Basis*', argument.legalBasis || '', 'textarea')}
                            {renderEditableField(9, index, 'factualBasis', '10.4 Factual Basis*', argument.factualBasis || '', 'textarea')}
                            {renderEditableField(9, index, 'precedents', '10.5 Precedents*', argument.precedents || '', 'textarea')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medium text-md">Legal Arguments</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {renderEditableField(9, null, 'generalArgument', '10.1 General Legal Argument*', formData.arguments?.generalArgument || '', 'textarea')}
                      {renderEditableField(9, null, 'legalBasis', '10.2 Legal Basis*', formData.arguments?.legalBasis || '', 'text')}
                    </div>
                  </div>
                )}
                
                {(!formData.arguments?.argumentsPerIssue || formData.arguments.argumentsPerIssue.length === 0) && 
                 !formData.arguments?.generalArgument && (
                  <div className="text-center py-8 text-gray-500">
                    No legal arguments found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 10: // Step 11: Review & Submit
        return (
          <div className="w-full">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Response</h2>
                <p className="text-gray-600">Please review all details before submitting your arbitration response</p>
              </div>

              <div className="space-y-8">
                {/* Step 1: Claimant Details */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                      Claimant Details (Read-Only)
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(0)}
                      className="bg-white text-blue-600 hover:bg-blue-50 border-white"
                    >
                      View
                    </Button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.1 Type</label>
                        <p className="text-gray-900 capitalize">{formData.claimant?.type || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.2 Name</label>
                        <p className="text-gray-900">{formData.claimant?.name || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.3 Email</label>
                        <p className="text-gray-900">{formData.claimant?.email || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.4 Phone</label>
                        <p className="text-gray-900">{formData.claimant?.phoneCountryCode} {formData.claimant?.phone || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">1.5 Address</label>
                        <p className="text-gray-900">
                          {formData.claimant?.address1 && (
                            <>
                              {formData.claimant.address1}
                              {formData.claimant.address2 && `, ${formData.claimant.address2}`}
                              {formData.claimant.city && `, ${formData.claimant.city}`}
                              {formData.claimant.district && `, ${formData.claimant.district}`}
                              {formData.claimant.state && `, ${formData.claimant.state}`}
                              {formData.claimant.country && `, ${formData.claimant.country}`}
                              {formData.claimant.pincode && ` - ${formData.claimant.pincode}`}
                            </>
                          ) || 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.6 GST Number</label>
                        <p className="text-gray-900">{formData.claimant?.gst || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.7 PAN Number</label>
                        <p className="text-gray-900">{formData.claimant?.pan || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.8 CIN Number</label>
                        <p className="text-gray-900">{formData.claimant?.cin || 'Not provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.9 Certificate of Incorporation</label>
                        <p className="text-gray-900">{formData.claimant?.coi ? 'Uploaded' : 'Not uploaded'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.10 PAN Card</label>
                        <p className="text-gray-900">{formData.claimant?.panCard ? 'Uploaded' : 'Not uploaded'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="text-sm font-medium text-gray-600">1.11 GST Certificate</label>
                        <p className="text-gray-900">{formData.claimant?.gstCert ? 'Uploaded' : 'Not uploaded'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Additional Claimants */}
                {formData.additionalClaimants && formData.additionalClaimants.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                        Additional Claimants (Read-Only)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="bg-white text-green-600 hover:bg-green-50 border-white"
                      >
                        View
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {formData.additionalClaimants.map((claimant, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">Additional Claimant {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.1 Type</label>
                              <p className="text-gray-900 capitalize">{claimant.type || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.2 Name</label>
                              <p className="text-gray-900">{claimant.name || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.3 Email</label>
                              <p className="text-gray-900">{claimant.email || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.4 Phone</label>
                              <p className="text-gray-900">{claimant.phoneCountryCode} {claimant.phone || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">2.5 Address</label>
                              <p className="text-gray-900">
                                {claimant.address1 && (
                                  <>
                                    {claimant.address1}
                                    {claimant.address2 && `, ${claimant.address2}`}
                                    {claimant.city && `, ${claimant.city}`}
                                    {claimant.district && `, ${claimant.district}`}
                                    {claimant.state && `, ${claimant.state}`}
                                    {claimant.country && `, ${claimant.country}`}
                                    {claimant.pincode && ` - ${claimant.pincode}`}
                                  </>
                                ) || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Manager Details */}
                {formData.managerDetails && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-orange-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                        Manager Details (Read-Only)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="bg-white text-orange-600 hover:bg-orange-50 border-white"
                      >
                        View
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">3.1 Name</label>
                          <p className="text-gray-900">{formData.managerDetails.name || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">3.2 Designation</label>
                          <p className="text-gray-900">{formData.managerDetails.designation || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">3.3 Email</label>
                          <p className="text-gray-900">{formData.managerDetails.email || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">3.4 Phone</label>
                          <p className="text-gray-900">{formData.managerDetails.phoneCountryCode} {formData.managerDetails.phone || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">3.5 Authority</label>
                          <p className="text-gray-900">{formData.managerDetails.authority || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">3.6 Address</label>
                          <p className="text-gray-900">{formData.managerDetails.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Respondent Details */}
                {formData.respondents && formData.respondents.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                        Respondent Details (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(2)}
                        className="bg-white text-purple-600 hover:bg-purple-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {formData.respondents.map((respondent, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">Respondent {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.1 Type</label>
                              <p className="text-gray-900 capitalize">{respondent.type || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.2 Name</label>
                              <p className="text-gray-900">{respondent.name || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.3 Email</label>
                              <p className="text-gray-900">{respondent.email || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.4 Phone</label>
                              <p className="text-gray-900">{respondent.phoneCountryCode} {respondent.phone || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">4.5 Address</label>
                              <p className="text-gray-900">
                                {respondent.address1 && (
                                  <>
                                    {respondent.address1}
                                    {respondent.address2 && `, ${respondent.address2}`}
                                    {respondent.city && `, ${respondent.city}`}
                                    {respondent.district && `, ${respondent.district}`}
                                    {respondent.state && `, ${respondent.state}`}
                                    {respondent.country && `, ${respondent.country}`}
                                    {respondent.pincode && ` - ${respondent.pincode}`}
                                  </>
                                ) || 'Not provided'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.6 GST Number</label>
                              <p className="text-gray-900">{respondent.gst || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.7 PAN Number</label>
                              <p className="text-gray-900">{respondent.pan || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">4.8 CIN Number</label>
                              <p className="text-gray-900">{respondent.cin || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Arbitration Agreement */}
                {formData.arbitrationAgreement && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                        Arbitration Agreement (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(3)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">5.1 Agreement Date</label>
                          <p className="text-gray-900">{formData.arbitrationAgreement.agreementDate || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">5.2 Place of Signing</label>
                          <p className="text-gray-900">{formData.arbitrationAgreement.placeOfSigning || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">5.3 Number of Arbitrators</label>
                          <p className="text-gray-900">{formData.arbitrationAgreement.numberOfArbitrators || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">5.4 Stamp Duty Percentage</label>
                          <p className="text-gray-900">{formData.arbitrationAgreement.stampDutyPercentage || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">5.5 Arbitration Text</label>
                          <p className="text-gray-900">{formData.arbitrationAgreement.arbitrationText || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Nature of Dispute */}
                {formData.natureOfDispute && Array.isArray(formData.natureOfDispute) && formData.natureOfDispute.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                        Nature of Dispute (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(4)}
                        className="bg-white text-red-600 hover:bg-red-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {formData.natureOfDispute && Array.isArray(formData.natureOfDispute) && formData.natureOfDispute.length > 0 ? (
                        formData.natureOfDispute.map((dispute, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Nature of Dispute {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.1 Category</label>
                                <p className="text-gray-900 capitalize">{dispute?.category || 'Not provided'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.2 Sub Category</label>
                                <p className="text-gray-900">{dispute?.subCategory || 'Not provided'}</p>
                              </div>
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">6.3 Nature of Dispute</label>
                                <p className="text-gray-900">{dispute?.description || 'Not provided'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.4 Date When Right to Claim Arose</label>
                                <p className="text-gray-900">{dispute?.dateWhenRightToClaimArose || 'Not provided'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.5 Standardised Prayer Clauses</label>
                                <p className="text-gray-900">{dispute?.standardisedPrayerClauses || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No nature of dispute information found. Click Edit to add details.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 7: Dispute Descriptions */}
                {formData.disputeDescriptions && formData.disputeDescriptions.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-pink-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-pink-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
                        Dispute Descriptions (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(5)}
                        className="bg-white text-pink-600 hover:bg-pink-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {formData.disputeDescriptions && formData.disputeDescriptions.length > 0 ? (
                        formData.disputeDescriptions.map((dispute, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">Dispute {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.1 Clause</label>
                              <p className="text-gray-900">{dispute.clause || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.2 Claim Type</label>
                              <p className="text-gray-900">{dispute.claimType || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.3 Claim Reason</label>
                              <p className="text-gray-900">{dispute.claimReason || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.4 Relief Sought</label>
                              <p className="text-gray-900">{dispute.reliefSought || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.5 Law Relied Upon</label>
                              <p className="text-gray-900">{dispute.lawReliedUpon || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.6 Relevant Clause Number</label>
                              <p className="text-gray-900">{dispute.relevantClauseNumber || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.7 Clause Supporting Claim</label>
                              <p className="text-gray-900">{dispute.clauseSupportingClaim || 'Not provided'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.8 Document Supporting Claim</label>
                              <p className="text-gray-900">{dispute.documentSupportingClaim || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No dispute descriptions found. Click Edit to add dispute descriptions.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 8: Prayers & Reliefs */}
                {formData.prayers && formData.prayers.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-teal-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
                        Prayers & Reliefs (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(6)}
                        className="bg-white text-teal-600 hover:bg-teal-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">8.1 Prayers and Reliefs</label>
                          <p className="text-gray-900">
                            {Array.isArray(formData.prayers) && formData.prayers.length > 0 
                              ? formData.prayers.map((prayer: any, idx: number) => (
                                  <span key={idx} className="block mb-2 p-2 bg-white rounded border">
                                    {typeof prayer === 'string' ? prayer : prayer.title || prayer.description || 'No prayer text'}
                                    {typeof prayer === 'object' && (prayer.reliefType || prayer.prayerType) && (
                                      <span className="text-sm text-gray-500 block">Type: {prayer.reliefType || prayer.prayerType}</span>
                                    )}
                                    {typeof prayer === 'object' && prayer.amount && (
                                      <span className="text-sm text-gray-500 block">Amount: {prayer.amount}</span>
                                    )}
                                  </span>
                                ))
                              : 'No prayers and reliefs added yet. Click Edit to add.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 9: Documents */}
                {formData.evidence && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-yellow-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                        Documents & Evidence (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(7)}
                        className="bg-white text-yellow-600 hover:bg-yellow-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.1 Company Documents</label>
                          <p className="text-gray-900">{formData.evidence?.companyDocs ? 'Available' : 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.2 Evidence Files</label>
                          <p className="text-gray-900">{formData.evidence?.evidenceFiles?.length > 0 ? `${formData.evidence.evidenceFiles.length} files` : 'No files uploaded'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.3 Respondent Files</label>
                          <p className="text-gray-900">{formData.evidence?.respondentsFiles ? 'Available' : 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.4 Manager Files</label>
                          <p className="text-gray-900">{formData.evidence?.managerDetailsFiles ? 'Available' : 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.5 Supporting Documents</label>
                          <p className="text-gray-900">{formData.evidence?.supportingDocuments?.length > 0 ? `${formData.evidence.supportingDocuments.length} documents` : 'No documents uploaded'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.6 Additional Claimant Files</label>
                          <p className="text-gray-900">{formData.evidence?.additionalClaimantsFiles ? 'Available' : 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 10: Payment */}
                {formData.payment && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">10</span>
                        Payment Details (Read-Only)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(8)}
                        className="bg-white text-emerald-600 hover:bg-emerald-50 border-white"
                      >
                        View
                      </Button>
                    </div>
                    <div className="p-6">
                      {(!formData.payment.paymentHead && !formData.payment.paymentAmount && !formData.payment.paymentDetails) ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No payment information provided by claimant.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <label className="text-sm font-medium text-gray-600">10.1 Payment Head</label>
                            <p className="text-gray-900">{formData.payment.paymentHead || 'Not filled by claimant'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <label className="text-sm font-medium text-gray-600">10.2 Payment Amount</label>
                            <p className="text-gray-900">{formData.payment.paymentAmount || 'Not filled by claimant'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">10.3 Payment Details</label>
                            <p className="text-gray-900">{formData.payment.paymentDetails || 'Not filled by claimant'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 11: Legal Arguments */}
                {(
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-violet-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-violet-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">11</span>
                        Legal Arguments (EDITABLE)
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(9)}
                        className="bg-white text-violet-600 hover:bg-violet-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6">
                      {formData.arguments?.argumentsPerIssue && Array.isArray(formData.arguments.argumentsPerIssue) && formData.arguments.argumentsPerIssue.length > 0 && formData.arguments.argumentsPerIssue.some(arg => arg && arg.trim() !== '') ? (
                        <div className="space-y-4">
                          {formData.arguments.argumentsPerIssue.map((argument, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold text-gray-900 mb-3">Argument {index + 1}</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">11.1 Legal Argument</label>
                                  <p className="text-gray-900">{typeof argument === 'string' ? argument : 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : formData.arguments?.argumentsPerPrayer && Array.isArray(formData.arguments.argumentsPerPrayer) && formData.arguments.argumentsPerPrayer.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="font-medium text-md">Arguments Per Prayer</h4>
                          {formData.arguments.argumentsPerPrayer.map((argument, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold text-gray-900 mb-3">Prayer Argument {index + 1}</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">Prayer Title</label>
                                  <p className="text-gray-900">{argument.prayerTitle || 'Not provided'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">Legal Argument</label>
                                  <p className="text-gray-900">{argument.argument || 'Not provided'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">Legal Basis</label>
                                  <p className="text-gray-900">{argument.legalBasis || 'Not provided'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">Factual Basis</label>
                                  <p className="text-gray-900">{argument.factualBasis || 'Not provided'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">Precedents</label>
                                  <p className="text-gray-900">{argument.precedents || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No legal arguments provided by claimant. Click Edit to add your arguments.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        )

      default:
        return <div>Step {currentStep + 1} content will be implemented</div>
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      console.log('🔧 Submitting response for case:', caseId)
      console.log('🔧 Form data:', formData)

      // Submit respondent response (authentication via cookies)
      const response = await fetch(`/api/respondent/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          caseId: caseId,
          responseData: formData,
          round: round || 1
        })
      })

      const responseData = await response.json()
      console.log('🔧 Submit response:', responseData)

      if (response.ok) {
        toast.success('Response submitted successfully!')
        router.push('/dashboard/my-cases')
      } else {
        console.error('Submit failed:', responseData)
        throw new Error(responseData.error || 'Failed to submit response')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(`Failed to submit response: ${error?.message || 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveAsDraft = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/respondent/case/${caseId}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          responseData: formData,
          round: round || 1
        })
      })

      if (response.ok) {
        toast.success('Draft saved successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }
    } catch (error: any) {
      console.error('Save draft error:', error)
      toast.error(`Failed to save draft: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="flex">
          {/* EXACT SAME SIDEBAR AS ARBITRATION FORM */}
          <FormStepSidebar
            steps={sidebarSteps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            completedSteps={completedSteps}
            className="w-80 flex-shrink-0"
          />

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Respondent Response Form
                    </h1>
                    <p className="text-gray-600">
                      Case: {caseId} | Round: {round}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.respondentStatus === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                        formData.respondentStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                        formData.respondentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.respondentStatus === 'reviewing' ? 'Under Review' :
                         formData.respondentStatus === 'accepted' ? 'Accepted' :
                         formData.respondentStatus === 'rejected' ? 'Rejected' :
                         'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.respondentStatus === 'reviewing' ? 'Review each section and provide your response' :
                       formData.respondentStatus === 'accepted' ? 'You have accepted this case' :
                       formData.respondentStatus === 'rejected' ? 'You have rejected this case' :
                       'Processing...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {renderFormContent()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  
                  {currentStep === 10 && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Response'}
                    </Button>
                  )}
                  
                  {currentStep < 10 && (
                    <Button
                      onClick={() => setCurrentStep(Math.min(10, currentStep + 1))}
                    >
                      Next
                    </Button>
                  )}
                  
                  {/* NEW: Add Accept/Reject buttons for reviewing */}
                  {currentStep === 10 && formData.respondentStatus === 'reviewing' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setFormData(prev => ({...prev, respondentStatus: 'rejected'}))}
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      >
                        Reject Case
                      </Button>
                      <Button
                        onClick={() => setFormData(prev => ({...prev, respondentStatus: 'accepted'}))}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept Case
                      </Button>
                    </>
                  )}
                  
                  {/* Show different actions based on status */}
                  {formData.respondentStatus === 'accepted' && currentStep === 10 && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Acceptance'}
                    </Button>
                  )}
                  
                  {formData.respondentStatus === 'rejected' && currentStep === 10 && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {submitting ? 'Submitting...' : 'Submit Rejection'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
