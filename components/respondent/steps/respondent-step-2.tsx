"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Check, X, FileText, Users, Building, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep2Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep2({ formData, updateFormData, caseData, isEditable }: RespondentStep2Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  const handleEdit = (field: string) => {
    setEditState({ ...editState, [field]: true })
    const currentValue = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], formData.agreementDetails)
      : formData.agreementDetails[field]
    setTempData({ 
      ...tempData, 
      [field]: currentValue || '' 
    })
  }

  const handleSave = (field: string) => {
    const updatedData = { ...formData.agreementDetails }
    
    if (field.includes('.')) {
      const keys = field.split('.')
      let current = updatedData
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = tempData[field]
    } else {
      updatedData[field] = tempData[field]
    }

    updateFormData({ agreementDetails: updatedData })
    setEditState({ ...editState, [field]: false })
    setTempData({ ...tempData, [field]: undefined })
  }

  const handleCancel = (field: string) => {
    setEditState({ ...editState, [field]: false })
    setTempData({ ...tempData, [field]: undefined })
  }

  const renderEditableField = (
    field: string,
    label: string,
    value: any,
    type: 'text' | 'textarea' = 'text',
    icon?: React.ReactNode
  ) => {
    const isEditing = editState[field]
    const displayValue = isEditing ? tempData[field] : value

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {icon}
            {label}
          </Label>
          {isEditable && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(field)}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              Change
            </Button>
          )}
        </div>

        <div className="flex items-start gap-2">
          {isEditing ? (
            <>
              {type === 'textarea' ? (
                <Textarea
                  value={displayValue || ''}
                  onChange={(e) => setTempData({ ...tempData, [field]: e.target.value })}
                  className="flex-1"
                  rows={4}
                />
              ) : (
                <Input
                  value={displayValue || ''}
                  onChange={(e) => setTempData({ ...tempData, [field]: e.target.value })}
                  className="flex-1"
                />
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(field)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(field)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 p-3 bg-gray-50 rounded border min-h-[50px] whitespace-pre-wrap">
              {value || <span className="text-gray-400 italic">No information provided</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPartyDetails = () => {
    const parties = formData.agreementDetails.partyDetails || {}
    const claimant = parties.claimant || caseData?.claimant || {}
    const respondents = parties.respondents || caseData?.respondents || []
    const additionalClaimants = parties.additionalClaimants || caseData?.additionalClaimants || []

    return (
      <div className="space-y-4">
        {/* Claimant Details */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Claimant Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded border">
            <div>
              <Label>Name</Label>
              <div className="p-2 bg-white rounded">{claimant.name || 'Not provided'}</div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="p-2 bg-white rounded">{claimant.email || 'Not provided'}</div>
            </div>
            <div>
              <Label>Organization</Label>
              <div className="p-2 bg-white rounded">{claimant.organization || 'Individual'}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="p-2 bg-white rounded">{claimant.phone || 'Not provided'}</div>
            </div>
          </div>
        </div>

        {/* Additional Claimants */}
        {additionalClaimants.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Additional Claimants</h4>
            <div className="space-y-2">
              {additionalClaimants.map((claimant: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-blue-50 rounded border">
                  <div>
                    <Label>Name</Label>
                    <div className="p-2 bg-white rounded">{claimant.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="p-2 bg-white rounded">{claimant.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <div className="p-2 bg-white rounded">{claimant.organization || 'Individual'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Respondent Details */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Respondent Information
          </h4>
          <div className="space-y-2">
            {respondents.map((respondent: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-orange-50 rounded border">
                <div>
                  <Label>Name</Label>
                  <div className="p-2 bg-white rounded">{respondent.name || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="p-2 bg-white rounded">{respondent.email || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Organization</Label>
                  <div className="p-2 bg-white rounded">{respondent.organization || 'Individual'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Please review the arbitration agreement details and party information below. 
          If you notice any inaccuracies, you can suggest corrections using the "Change" buttons.
        </AlertDescription>
      </Alert>

      {/* Arbitration Agreement Details */}
      <Card>
        <CardHeader>
          <CardTitle>Arbitration Agreement</CardTitle>
          <CardDescription>
            Details of the arbitration clause and agreement basis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderEditableField(
            'arbitrationClause.source',
            'Agreement Source',
            formData.agreementDetails.arbitrationClause?.source || caseData?.arbitrationAgreement?.source,
            'text',
            <FileText className="h-4 w-4" />
          )}

          {renderEditableField(
            'arbitrationClause.clauseText',
            'Arbitration Clause Text',
            formData.agreementDetails.arbitrationClause?.clauseText || caseData?.arbitrationAgreement?.clauseText,
            'textarea',
            <FileText className="h-4 w-4" />
          )}

          {renderEditableField(
            'arbitrationClause.governingLaw',
            'Governing Law',
            formData.agreementDetails.arbitrationClause?.governingLaw || caseData?.arbitrationAgreement?.governingLaw,
            'text',
            <Building className="h-4 w-4" />
          )}

          {renderEditableField(
            'arbitrationClause.seat',
            'Seat of Arbitration',
            formData.agreementDetails.arbitrationClause?.seat || caseData?.arbitrationAgreement?.seat,
            'text',
            <Building className="h-4 w-4" />
          )}
        </CardContent>
      </Card>

      {/* Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>Party Information</CardTitle>
          <CardDescription>
            All parties involved in this arbitration case
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPartyDetails()}
        </CardContent>
      </Card>

      {/* Agreement Corrections */}
      <Card>
        <CardHeader>
          <CardTitle>Corrections & Comments</CardTitle>
          <CardDescription>
            Note any corrections or clarifications regarding the agreement details above
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderEditableField(
            'agreementCorrections',
            'Your Comments/Corrections',
            formData.agreementDetails.agreementCorrections,
            'textarea',
            <Edit className="h-4 w-4" />
          )}
        </CardContent>
      </Card>

      {/* Acknowledgment */}
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="acknowledge-agreement"
                checked={formData.agreementDetails.acknowledged || false}
                onCheckedChange={(checked) => 
                  updateFormData({
                    agreementDetails: {
                      ...formData.agreementDetails,
                      acknowledged: checked
                    }
                  })
                }
              />
              <Label htmlFor="acknowledge-agreement" className="text-sm">
                I acknowledge that I have reviewed the arbitration agreement details above and 
                understand the basis for this arbitration proceeding.
              </Label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="dispute-jurisdiction"
                checked={formData.agreementDetails.disputeJurisdiction || false}
                onCheckedChange={(checked) => 
                  updateFormData({
                    agreementDetails: {
                      ...formData.agreementDetails,
                      disputeJurisdiction: checked
                    }
                  })
                }
              />
              <Label htmlFor="dispute-jurisdiction" className="text-sm">
                I dispute the jurisdiction or validity of this arbitration agreement 
                (if checked, please explain in the corrections section above)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> If you dispute the validity of the arbitration agreement or 
          believe there are fundamental errors in the party information, please clearly state your 
          objections in the corrections section above. These issues should be raised early in the process.
        </AlertDescription>
      </Alert>
    </div>
  )
}
