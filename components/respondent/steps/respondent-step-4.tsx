"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Check, X, FileText, Calendar, MapPin, Scale } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep4Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep4({ formData, updateFormData, caseData, isEditable }: RespondentStep4Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  // Initialize arbitration agreement data from caseData or formData
  const arbitrationData = formData.arbitrationAgreement || caseData?.arbitrationAgreement || {}

  const handleEdit = (field: string) => {
    setEditState({ ...editState, [field]: true })
    setTempData({ 
      ...tempData, 
      [field]: arbitrationData[field] || '' 
    })
  }

  const handleSave = (field: string) => {
    const updatedArbitration = {
      ...arbitrationData,
      [field]: tempData[field]
    }
    
    updateFormData({
      arbitrationAgreement: updatedArbitration
    })
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
    value: string,
    type: string = 'text',
    options?: Array<{value: string, label: string}>,
    icon?: React.ReactNode,
    placeholder?: string,
    maxLength?: number,
    rows?: number
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

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {type === 'select' ? (
                <Select value={displayValue} onValueChange={(val) => setTempData({...tempData, [field]: val})}>
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
                  onChange={(e) => setTempData({...tempData, [field]: e.target.value})}
                  className="flex-1"
                  rows={rows || 3}
                  placeholder={placeholder}
                  maxLength={maxLength}
                />
              ) : (
                <Input
                  type={type}
                  value={displayValue}
                  onChange={(e) => setTempData({...tempData, [field]: e.target.value})}
                  className="flex-1"
                  placeholder={placeholder}
                  maxLength={maxLength}
                  max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                />
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(field)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(field)}
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

  const arbitratorOptions = [
    { value: '1', label: '1 (Sole Arbitrator)' },
    { value: '3', label: '3 (Tribunal)' },
    { value: '5', label: '5' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Step 4: Arbitration Agreement Details</strong><br/>
          These are the exact same fields (4.1-4.5) as in the claimant's arbitration form. Review and modify the arbitration agreement details as needed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Arbitration Agreement Details</CardTitle>
          <CardDescription>
            Exact same fields as claimant form - Review arbitration agreement terms and arbitrator selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 4.1 Date of Arbitration Agreement */}
          {renderEditableField(
            'agreementDate',
            '4.1 Date of Arbitration Agreement / Agreement containing the arbitration clause*',
            arbitrationData.agreementDate,
            'date',
            undefined,
            <Calendar className="h-4 w-4" />,
            'Select agreement date'
          )}

          {/* 4.2 Place of Signing */}
          {renderEditableField(
            'placeOfSigning',
            '4.2 Place where the Arbitration Agreement / Agreement containing the arbitration clause was signed*',
            arbitrationData.placeOfSigning,
            'text',
            undefined,
            <MapPin className="h-4 w-4" />,
            'Enter the place where the agreement was signed',
            200
          )}

          {/* 4.3 Text of Arbitration Agreement */}
          {renderEditableField(
            'arbitrationText',
            '4.3 Text of Arbitration Agreement/clause*',
            arbitrationData.arbitrationText,
            'textarea',
            undefined,
            <FileText className="h-4 w-4" />,
            'Enter the exact text of the arbitration agreement or clause',
            2000,
            5
          )}

          {/* 4.4 Stamp Duty Percentage */}
          {renderEditableField(
            'stampDutyPercentage',
            '4.4 Percentage of the Agreement value / Amount of stamp duty paid on the Arbitration Agreement / Agreement containing the arbitration clause*',
            arbitrationData.stampDutyPercentage,
            'text',
            undefined,
            <Scale className="h-4 w-4" />,
            'Enter percentage or amount',
            50
          )}

          {/* 4.5 Number of Arbitrators */}
          {renderEditableField(
            'numberOfArbitrators',
            '4.5 Number of Arbitrators as per Agreement*',
            arbitrationData.numberOfArbitrators,
            'select',
            arbitratorOptions,
            <Scale className="h-4 w-4" />,
            'Select number of arbitrators'
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These are the exact same fields (4.1 to 4.5) as in the claimant's arbitration form. 
          You can modify any information using the "Change" buttons. All fields marked with * are required.
        </AlertDescription>
      </Alert>
    </div>
  )
}