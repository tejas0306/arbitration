"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Check, X, User, Building, Phone, Mail, MapPin, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep3Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep3({ formData, updateFormData, caseData, isEditable }: RespondentStep3Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  // Initialize respondent data from caseData or formData
  const respondentData = formData.respondents || caseData?.respondents || [{}]

  const handleEdit = (respondentIndex: number, field: string) => {
    const key = `${respondentIndex}-${field}`
    setEditState({ ...editState, [key]: true })
    setTempData({ 
      ...tempData, 
      [key]: respondentData[respondentIndex]?.[field] || '' 
    })
  }

  const handleSave = (respondentIndex: number, field: string) => {
    const key = `${respondentIndex}-${field}`
    const updatedRespondents = [...respondentData]
    updatedRespondents[respondentIndex] = {
      ...updatedRespondents[respondentIndex],
      [field]: tempData[key]
    }
    
    updateFormData({
      respondents: updatedRespondents
    })
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  const handleCancel = (respondentIndex: number, field: string) => {
    const key = `${respondentIndex}-${field}`
    setEditState({ ...editState, [key]: false })
    setTempData({ ...tempData, [key]: undefined })
  }

  const addRespondent = () => {
    const newRespondent = {
      type: '',
      name: '',
      email: '',
      phone: '',
      phoneCountryCode: '+91',
      pincode: '',
      address1: '',
      address2: '',
      city: '',
      district: '',
      state: '',
      country: '',
      gst: '',
      pan: '',
      cin: ''
    }
    updateFormData({
      respondents: [...respondentData, newRespondent]
    })
  }

  const removeRespondent = (index: number) => {
    const updatedRespondents = respondentData.filter((_: any, i: number) => i !== index)
    updateFormData({
      respondents: updatedRespondents
    })
  }

  const renderEditableField = (
    respondentIndex: number,
    field: string,
    label: string,
    value: string,
    type: string = 'text',
    options?: Array<{value: string, label: string}>,
    icon?: React.ReactNode
  ) => {
    const key = `${respondentIndex}-${field}`
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
              onClick={() => handleEdit(respondentIndex, field)}
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
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
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
                  rows={3}
                />
              ) : (
                <Input
                  type={type}
                  value={displayValue}
                  onChange={(e) => setTempData({...tempData, [key]: e.target.value})}
                  className="flex-1"
                />
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(respondentIndex, field)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(respondentIndex, field)}
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

  const countryCodes = [
    { value: '+91', label: '+91 (India)' },
    { value: '+1', label: '+1 (USA/Canada)' },
    { value: '+44', label: '+44 (UK)' },
    { value: '+61', label: '+61 (Australia)' }
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          <strong>Step 3: Respondent Details</strong><br/>
          These are the same fields as in the claimant's arbitration form. Review and modify the respondent details as needed.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {respondentData.map((respondent: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Respondent {index + 1}</CardTitle>
                  <CardDescription>
                    Complete respondent information (Same fields as claimant form)
                  </CardDescription>
                </div>
                {respondentData.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRespondent(index)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Type and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditableField(
                  index,
                  'type',
                  '3.1 Type*',
                  respondent.type,
                  'select',
                  entityTypes,
                  <Building className="h-4 w-4" />
                )}
                
                {renderEditableField(
                  index,
                  'name',
                  '3.2 Name*',
                  respondent.name,
                  'text',
                  undefined,
                  <User className="h-4 w-4" />
                )}
              </div>

              {/* Row 2: Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditableField(
                  index,
                  'email',
                  '3.3 Email*',
                  respondent.email,
                  'email',
                  undefined,
                  <Mail className="h-4 w-4" />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {renderEditableField(
                    index,
                    'phoneCountryCode',
                    '3.4a Country Code',
                    respondent.phoneCountryCode || '+91',
                    'select',
                    countryCodes,
                    <Phone className="h-4 w-4" />
                  )}
                  {renderEditableField(
                    index,
                    'phone',
                    '3.4b Phone*',
                    respondent.phone,
                    'tel',
                    undefined,
                    <Phone className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Row 3: Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditableField(
                  index,
                  'address1',
                  '3.5a Address Line 1*',
                  respondent.address1,
                  'text',
                  undefined,
                  <MapPin className="h-4 w-4" />
                )}
                
                {renderEditableField(
                  index,
                  'address2',
                  '3.5b Address Line 2',
                  respondent.address2,
                  'text',
                  undefined,
                  <MapPin className="h-4 w-4" />
                )}
              </div>

              {/* Row 4: City, District, State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderEditableField(
                  index,
                  'city',
                  '3.6 City*',
                  respondent.city,
                  'text'
                )}
                
                {renderEditableField(
                  index,
                  'district',
                  '3.7 District*',
                  respondent.district,
                  'text'
                )}
                
                {renderEditableField(
                  index,
                  'state',
                  '3.8 State*',
                  respondent.state,
                  'text'
                )}
              </div>

              {/* Row 5: Country and Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditableField(
                  index,
                  'country',
                  '3.9 Country*',
                  respondent.country,
                  'text'
                )}
                
                {renderEditableField(
                  index,
                  'pincode',
                  '3.10 Pincode*',
                  respondent.pincode,
                  'text'
                )}
              </div>

              {/* Row 6: Business Details (if applicable) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderEditableField(
                  index,
                  'gst',
                  '3.11 GST Number',
                  respondent.gst,
                  'text'
                )}
                
                {renderEditableField(
                  index,
                  'pan',
                  '3.12 PAN Number',
                  respondent.pan,
                  'text'
                )}
                
                {renderEditableField(
                  index,
                  'cin',
                  '3.13 CIN Number',
                  respondent.cin,
                  'text'
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add Respondent Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={addRespondent}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Respondent
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These are the exact same fields (3.1 to 3.13) as in the claimant's arbitration form. 
          You can modify any information using the "Change" buttons. All fields marked with * are required.
        </AlertDescription>
      </Alert>
    </div>
  )
}