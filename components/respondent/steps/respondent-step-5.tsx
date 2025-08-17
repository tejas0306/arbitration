"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Check, X, Scale, Calendar, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep5Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep5({ formData, updateFormData, caseData, isEditable }: RespondentStep5Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  // Initialize nature of dispute data from caseData or formData
  const natureOfDisputeData = formData.natureOfDispute || caseData?.natureOfDispute || [{}]

  const handleEdit = (disputeIndex: number, field: string) => {
    const key = `${disputeIndex}-${field}`
    setEditState({ ...editState, [key]: true })
    setTempData({ 
      ...tempData, 
      [key]: natureOfDisputeData[disputeIndex]?.[field] || '' 
    })
  }

  const handleSave = (disputeIndex: number, field: string) => {
    const key = `${disputeIndex}-${field}`
    const updatedDisputes = [...natureOfDisputeData]
    updatedDisputes[disputeIndex] = {
      ...updatedDisputes[disputeIndex],
      [field]: tempData[key]
    }
    
    updateFormData({
      natureOfDispute: updatedDisputes
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
      category: '',
      subCategory: '',
      natureOfDispute: '',
      dateWhenRightToClaimArose: '',
      standardisedPrayerClauses: ''
    }
    updateFormData({
      natureOfDispute: [...natureOfDisputeData, newDispute]
    })
  }

  const removeDispute = (index: number) => {
    const updatedDisputes = natureOfDisputeData.filter((_: any, i: number) => i !== index)
    updateFormData({
      natureOfDispute: updatedDisputes
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
    placeholder?: string
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
              ) : (
                <Input
                  type={type}
                  value={displayValue}
                  onChange={(e) => setTempData({...tempData, [key]: e.target.value})}
                  className="flex-1"
                  placeholder={placeholder}
                  max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
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

  const categoryOptions = [
    { value: 'commercial', label: 'Commercial' },
    { value: 'construction', label: 'Construction' },
    { value: 'employment', label: 'Employment' },
    { value: 'intellectual_property', label: 'Intellectual Property' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'banking', label: 'Banking & Finance' },
    { value: 'other', label: 'Other' }
  ]

  const subCategoryOptions = [
    { value: 'breach', label: 'Breach of Contract' },
    { value: 'payment', label: 'Payment Dispute' },
    { value: 'quality', label: 'Quality/Performance Issue' },
    { value: 'delivery', label: 'Delivery Delay' },
    { value: 'warranty', label: 'Warranty Claim' },
    { value: 'termination', label: 'Contract Termination' },
    { value: 'other', label: 'Other' }
  ]

  const natureOptions = [
    { value: 'civil', label: 'Civil' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'constitutional', label: 'Constitutional' },
    { value: 'family', label: 'Family' },
    { value: 'property', label: 'Property' },
    { value: 'other', label: 'Other' }
  ]

  const prayerOptions = [
    { value: 'monetary_relief', label: 'Monetary Relief' },
    { value: 'specific_performance', label: 'Specific Performance' },
    { value: 'declaratory_relief', label: 'Declaratory Relief' },
    { value: 'injunctive_relief', label: 'Injunctive Relief' },
    { value: 'damages', label: 'Damages' },
    { value: 'costs', label: 'Costs and Expenses' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <Scale className="h-4 w-4" />
        <AlertDescription>
          <strong>Step 5: Nature of Dispute</strong><br/>
          These are the exact same fields (5.1-5.5) as in the claimant's arbitration form. You can add multiple dispute entries. Each entry represents a separate dispute category.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {natureOfDisputeData.map((dispute: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Nature of Dispute {index + 1}</CardTitle>
                  <CardDescription>
                    Category and background details (Same fields as claimant form)
                  </CardDescription>
                </div>
                {natureOfDisputeData.length > 1 && (
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
              {/* 5.1 Category */}
              {renderEditableField(
                index,
                'category',
                '5.1 Category*',
                dispute.category,
                'select',
                categoryOptions,
                <Scale className="h-4 w-4" />,
                'Select dispute category'
              )}

              {/* 5.2 Sub Category */}
              {renderEditableField(
                index,
                'subCategory',
                '5.2 Sub Category*',
                dispute.subCategory,
                'select',
                subCategoryOptions,
                <Scale className="h-4 w-4" />,
                'Select dispute sub-category'
              )}

              {/* 5.3 Nature of Dispute */}
              {renderEditableField(
                index,
                'natureOfDispute',
                '5.3 Nature of Dispute*',
                dispute.natureOfDispute,
                'select',
                natureOptions,
                <Scale className="h-4 w-4" />,
                'Select nature of dispute'
              )}

              {/* 5.4 Date when right to claim arose */}
              {renderEditableField(
                index,
                'dateWhenRightToClaimArose',
                '5.4 Date when right to claim arose*',
                dispute.dateWhenRightToClaimArose,
                'date',
                undefined,
                <Calendar className="h-4 w-4" />,
                'Select date'
              )}

              {/* 5.5 Standardised prayer clauses */}
              {renderEditableField(
                index,
                'standardisedPrayerClauses',
                '5.5 Standardised prayer clauses*',
                dispute.standardisedPrayerClauses,
                'select',
                prayerOptions,
                <Scale className="h-4 w-4" />,
                'Select prayer type'
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Add Nature of Dispute Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={addDispute}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Nature of Dispute
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These are the exact same fields (5.1 to 5.5) as in the claimant's arbitration form. 
          You can modify any information using the "Change" buttons and add multiple dispute entries. All fields marked with * are required.
        </AlertDescription>
      </Alert>
    </div>
  )
}