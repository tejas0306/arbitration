"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Check, X, User, Building, Phone, Mail, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep1Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface EditState {
  [key: string]: boolean
}

export default function RespondentStep1({ formData, updateFormData, caseData, isEditable }: RespondentStep1Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [tempData, setTempData] = useState<any>({})

  const handleEdit = (field: string) => {
    setEditState({ ...editState, [field]: true })
    setTempData({ 
      ...tempData, 
      [field]: formData.respondentInfo[field] || '' 
    })
  }

  const handleSave = (field: string) => {
    updateFormData({
      respondentInfo: {
        ...formData.respondentInfo,
        [field]: tempData[field]
      }
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
    value: any, 
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' = 'text',
    options?: string[],
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

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {type === 'textarea' ? (
                <Textarea
                  value={displayValue}
                  onChange={(e) => setTempData({ ...tempData, [field]: e.target.value })}
                  className="flex-1"
                  rows={3}
                />
              ) : type === 'select' ? (
                <Select
                  value={displayValue}
                  onValueChange={(value) => setTempData({ ...tempData, [field]: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={type}
                  value={displayValue}
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
            <div className="flex-1 p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {value || <span className="text-gray-400">Not provided</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAddressField = () => {
    const address = formData.respondentInfo.address || {}
    const isEditing = editState['address']
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address
          </Label>
          {isEditable && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit('address')}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              Change
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 p-4 border rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={tempData.address?.street || ''}
                  onChange={(e) => setTempData({
                    ...tempData,
                    address: { ...tempData.address, street: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={tempData.address?.city || ''}
                  onChange={(e) => setTempData({
                    ...tempData,
                    address: { ...tempData.address, city: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>State/Province</Label>
                <Input
                  value={tempData.address?.state || ''}
                  onChange={(e) => setTempData({
                    ...tempData,
                    address: { ...tempData.address, state: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>ZIP/Postal Code</Label>
                <Input
                  value={tempData.address?.zip || ''}
                  onChange={(e) => setTempData({
                    ...tempData,
                    address: { ...tempData.address, zip: e.target.value }
                  })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Country</Label>
                <Input
                  value={tempData.address?.country || ''}
                  onChange={(e) => setTempData({
                    ...tempData,
                    address: { ...tempData.address, country: e.target.value }
                  })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('address')}
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel('address')}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded border">
            {address.street || address.city ? (
              <div className="space-y-1">
                {address.street && <div>{address.street}</div>}
                <div>
                  {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                </div>
                {address.country && <div>{address.country}</div>}
              </div>
            ) : (
              <span className="text-gray-400">Address not provided</span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          Please verify your information below. You can update any details that are incorrect or missing.
          This information will be used for all correspondence regarding this arbitration case.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your basic contact details for this case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderEditableField(
              'name',
              'Full Name',
              formData.respondentInfo.name,
              'text',
              undefined,
              <User className="h-4 w-4" />
            )}

            {renderEditableField(
              'email',
              'Email Address',
              formData.respondentInfo.email,
              'email',
              undefined,
              <Mail className="h-4 w-4" />
            )}

            {renderEditableField(
              'phone',
              'Phone Number',
              formData.respondentInfo.phone,
              'tel',
              undefined,
              <Phone className="h-4 w-4" />
            )}

            {renderEditableField(
              'organization',
              'Organization/Company',
              formData.respondentInfo.organization,
              'text',
              undefined,
              <Building className="h-4 w-4" />
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
            <CardDescription>
              Your mailing address for official correspondence
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAddressField()}
          </CardContent>
        </Card>
      </div>

      {/* Case Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
          <CardDescription>
            Details about the arbitration case you are responding to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Case Number</Label>
              <div className="p-2 bg-gray-50 rounded border">
                {caseData?.caseNumber || 'Not assigned'}
              </div>
            </div>
            
            <div>
              <Label>Case Status</Label>
              <div className="p-2 bg-gray-50 rounded border">
                {caseData?.status || 'Pending'}
              </div>
            </div>
            
            <div>
              <Label>Filed Date</Label>
              <div className="p-2 bg-gray-50 rounded border">
                {caseData?.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>

          <div>
            <Label>Claimant</Label>
            <div className="p-2 bg-gray-50 rounded border">
              {caseData?.claimant?.name || 'Unknown'} ({caseData?.claimant?.email || 'No email'})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Notice */}
      <Alert>
        <AlertDescription>
          <strong>Important:</strong> Please ensure all information above is accurate. 
          You can make changes at any time before submitting your final response. 
          Any updates will be saved automatically as you proceed through the form.
        </AlertDescription>
      </Alert>
    </div>
  )
}
