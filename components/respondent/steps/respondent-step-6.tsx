"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Check, X, FileText, Plus, Trash2, Scale } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep6Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep6({ formData, updateFormData, caseData, isEditable }: RespondentStep6Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  // Initialize dispute descriptions data from caseData or formData
  const disputeDescriptionsData = formData.disputeDescriptions || caseData?.disputeDescriptions || [{}]

  const handleEdit = (disputeIndex: number, field: string) => {
    const key = `${disputeIndex}-${field}`
    setEditState({ ...editState, [key]: true })
    setTempData({ 
      ...tempData, 
      [key]: disputeDescriptionsData[disputeIndex]?.[field] || '' 
    })
  }

  const handleSave = (disputeIndex: number, field: string) => {
    const key = `${disputeIndex}-${field}`
    const updatedDisputes = [...disputeDescriptionsData]
    updatedDisputes[disputeIndex] = {
      ...updatedDisputes[disputeIndex],
      [field]: tempData[key]
    }
    
    updateFormData({
      disputeDescriptions: updatedDisputes
    })
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  const handleCancel = (disputeIndex: number, field: string) => {
    const key = `${disputeIndex}-${field}`
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  const addDispute = () => {
    const newDispute = {
      claimType: '',
      claimReason: '',
      lawReliedUpon: '',
      relevantClauseNumber: '',
      clauseSupportingClaim: '',
      clause: '',
      documentSupportingClaim: '',
      reliefSought: ''
    }
    updateFormData({
      disputeDescriptions: [...disputeDescriptionsData, newDispute]
    })
  }

  const removeDispute = (index: number) => {
    const updatedDisputes = disputeDescriptionsData.filter((_: any, i: number) => i !== index)
    updateFormData({
      disputeDescriptions: updatedDisputes
    })
  }

  const renderEditableField = (
    disputeIndex: number,
    field: string,
    label: string,
    value: string,
    type: string = 'text',
    options?: Array<{value: string, label: string}>,
    icon?: React.ReactNode,
    placeholder?: string,
    rows?: number
  ) => {
    const key = `${disputeIndex}-${field}`
    const isEditing = editState[key]
    const displayValue = isEditing ? tempData[key] : value

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
              onClick={() => handleEdit(disputeIndex, field)}
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
                    <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
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
                  onClick={() => handleSave(disputeIndex, field)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(disputeIndex, field)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {value || <span className="text-gray-400">Not provided</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const claimTypeOptions = [
    { value: 'monetary', label: 'Monetary' },
    { value: 'specific_performance', label: 'Specific Performance' },
    { value: 'declaratory', label: 'Declaratory Relief' },
    { value: 'injunctive', label: 'Injunctive Relief' },
    { value: 'combination', label: 'Combination of Above' },
    { value: 'other', label: 'Other' }
  ]

  const reliefSoughtOptions = [
    { value: 'monetary_compensation', label: 'Monetary Compensation' },
    { value: 'specific_performance', label: 'Specific Performance' },
    { value: 'declaratory_relief', label: 'Declaratory Relief' },
    { value: 'injunctive_relief', label: 'Injunctive Relief' },
    { value: 'restitution', label: 'Restitution' },
    { value: 'rescission', label: 'Rescission of Contract' },
    { value: 'rectification', label: 'Rectification' },
    { value: 'damages_costs', label: 'Damages and Costs' },
    { value: 'interest_penalty', label: 'Interest and Penalty' },
    { value: 'termination', label: 'Contract Termination' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Step 6: Dispute Description</strong><br/>
          These are the exact same fields (6.1-6.7 + Relief Sought) as in the claimant's arbitration form. You can add multiple dispute descriptions. Each entry represents a separate claim or issue.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {disputeDescriptionsData.map((dispute: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Dispute Description {index + 1}</CardTitle>
                  <CardDescription>
                    Detailed claims and supporting facts (Same fields as claimant form)
                  </CardDescription>
                </div>
                {disputeDescriptionsData.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDispute(index)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 6.1 Claim Type */}
              {renderEditableField(
                index,
                'claimType',
                '6.1 Claim Type*',
                dispute.claimType,
                'select',
                claimTypeOptions,
                <Scale className="h-4 w-4" />,
                'Select claim type'
              )}

              {/* 6.2 Claim Reason */}
              {renderEditableField(
                index,
                'claimReason',
                '6.2 Claim Reason*',
                dispute.claimReason,
                'textarea',
                undefined,
                <FileText className="h-4 w-4" />,
                'Provide the primary reason for this claim',
                2
              )}

              {/* 6.3 Law relied upon */}
              {renderEditableField(
                index,
                'lawReliedUpon',
                '6.3 Law relied upon by Claimant to be listed (Acts/Rules/Regulations/Others)*',
                dispute.lawReliedUpon,
                'textarea',
                undefined,
                <FileText className="h-4 w-4" />,
                'List specific Acts, Rules, Regulations, or other legal provisions relied upon',
                3
              )}

              {/* 6.4 Relevant Clause Number */}
              {renderEditableField(
                index,
                'relevantClauseNumber',
                '6.4 Relevant Clause Number/Page Number*',
                dispute.relevantClauseNumber,
                'text',
                undefined,
                <FileText className="h-4 w-4" />,
                'e.g., Clause 5.2 or Page 7'
              )}

              {/* 6.5 Clause Supporting Claim */}
              {renderEditableField(
                index,
                'clauseSupportingClaim',
                '6.5 Clause Supporting Claim*',
                dispute.clauseSupportingClaim,
                'textarea',
                undefined,
                <FileText className="h-4 w-4" />,
                'Describe how this clause supports your claim',
                2
              )}

              {/* 6.6 Clause */}
              {renderEditableField(
                index,
                'clause',
                '6.6 Clause*',
                dispute.clause,
                'textarea',
                undefined,
                <FileText className="h-4 w-4" />,
                'Enter the exact text of the relevant clause',
                3
              )}

              {/* 6.7 Document Supporting Claim */}
              {renderEditableField(
                index,
                'documentSupportingClaim',
                '6.7 Document Supporting Claim*',
                dispute.documentSupportingClaim,
                'text',
                undefined,
                <FileText className="h-4 w-4" />,
                'Name/reference of supporting document'
              )}

              {/* Relief Sought */}
              {renderEditableField(
                index,
                'reliefSought',
                'Relief Sought*',
                dispute.reliefSought,
                'select',
                reliefSoughtOptions,
                <Scale className="h-4 w-4" />,
                'Select relief sought'
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Add Dispute Description Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={addDispute}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Dispute Description
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These are the exact same fields (6.1 to 6.7 + Relief Sought) as in the claimant's arbitration form. 
          You can modify any information using the "Change" buttons and add multiple dispute descriptions. All fields marked with * are required.
        </AlertDescription>
      </Alert>
    </div>
  )
}