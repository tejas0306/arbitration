"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { ArrowLeft, Save, UserPlus, X } from 'lucide-react'

interface ArbitratorFormData {
  id?: string
  name: string
  email: string
  phone: string
  expertise: string
  qualifications: string
  experience: number
  bio: string
  languages: string[]
  location: string
  hourlyRate?: number
  availabilityInfo: string
  password?: string
  status: 'active' | 'inactive' | 'pending'
}

export default function ArbitratorForm() {
  const router = useRouter()
  const params = useParams()
  const arbitratorId = params?.id as string
  const isEditMode = !!arbitratorId
  
  const [formData, setFormData] = useState<ArbitratorFormData>({
    name: '',
    email: '',
    phone: '',
    expertise: '',
    qualifications: '',
    experience: 0,
    bio: '',
    languages: [],
    location: '',
    hourlyRate: undefined,
    availabilityInfo: '',
    password: '',
    status: 'pending'
  })
  
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ArbitratorFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [languageInput, setLanguageInput] = useState('')
  
  // Common language options
  const commonLanguages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 
    'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Malayalam'
  ]
  
  // Area of expertise options
  const expertiseOptions = [
    'Commercial Disputes',
    'Construction',
    'Real Estate',
    'Intellectual Property',
    'Employment Law',
    'Corporate Law',
    'Banking & Finance',
    'Insurance',
    'Maritime',
    'Energy',
    'Information Technology',
    'International Trade',
    'Family Law',
    'Consumer Disputes'
  ]
  
  useEffect(() => {
    if (isEditMode) {
      fetchArbitratorData()
    }
  }, [arbitratorId])
  
  const fetchArbitratorData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/arbitrators/${arbitratorId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrator data')
      }
      
      const data = await response.json()
      // Format the languages array correctly
      const languages = Array.isArray(data.languages) 
        ? data.languages 
        : data.languages?.split(',').map((lang: string) => lang.trim()) || []
        
      setFormData({
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        expertise: data.expertise || '',
        qualifications: data.qualifications || '',
        experience: data.experience || 0,
        bio: data.bio || '',
        languages,
        location: data.location || '',
        hourlyRate: data.hourlyRate || undefined,
        availabilityInfo: data.availabilityInfo || '',
        status: data.status || 'pending'
      })
    } catch (error) {
      toast.error('Failed to load arbitrator data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (formErrors[name as keyof ArbitratorFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value
    const numberValue = value === '' ? undefined : Number(value)
    setFormData(prev => ({ ...prev, [fieldName]: numberValue }))
  }
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'pending' }))
  }
  
  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()]
      }))
      setLanguageInput('')
    }
  }
  
  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== language)
    }))
  }
  
  const handleAddCommonLanguage = (language: string) => {
    if (!formData.languages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }))
    }
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ArbitratorFormData, string>> = {}
    
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format'
    
    if (!isEditMode && !formData.password) errors.password = 'Password is required for new arbitrators'
    if (!isEditMode && formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number should be 10 digits'
    }
    
    if (!formData.expertise) errors.expertise = 'Area of expertise is required'
    
    if (formData.hourlyRate !== undefined && formData.hourlyRate < 0) {
      errors.hourlyRate = 'Hourly rate cannot be negative'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Prepare the request data
      const arbitratorData = {
        ...formData,
        role: 'ARBITRATOR',
        languages: formData.languages.join(',')
      }
      
      // Remove password if empty in edit mode
      if (isEditMode && !arbitratorData.password) {
        delete arbitratorData.password
      }
      
      const url = isEditMode 
        ? getApiUrl(`api/admin/arbitrators/${arbitratorId}`) 
        : getApiUrl('api/admin/arbitrators')
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(arbitratorData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save arbitrator')
      }
      
      toast.success(isEditMode 
        ? 'Arbitrator updated successfully' 
        : 'New arbitrator created successfully'
      )
      
      // Navigate back to arbitrators list
      router.push('/dashboard/arbitrators')
    } catch (error: any) {
      toast.error(`Failed to save arbitrator: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/dashboard/arbitrators')
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Arbitrators
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Arbitrator' : 'Add New Arbitrator'}</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
              </div>
              
              {!isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className={formErrors.password ? 'border-red-500' : ''}
                  />
                  {formErrors.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit phone number"
                  className={formErrors.phone ? 'border-red-500' : ''}
                />
                {formErrors.phone && <p className="text-red-500 text-xs">{formErrors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, State or Country"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Professional Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Qualifications and expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expertise">Area of Expertise <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.expertise}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, expertise: value }))}
                >
                  <SelectTrigger className={formErrors.expertise ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select area of expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    {expertiseOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.expertise && <p className="text-red-500 text-xs">{formErrors.expertise}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  placeholder="Degrees, certifications, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience || ''}
                  onChange={(e) => handleNumberChange(e, 'experience')}
                  placeholder="Enter years of experience"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => handleNumberChange(e, 'hourlyRate')}
                  placeholder="Enter hourly rate"
                  className={formErrors.hourlyRate ? 'border-red-500' : ''}
                />
                {formErrors.hourlyRate && <p className="text-red-500 text-xs">{formErrors.hourlyRate}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Brief professional biography"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Languages Card */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Languages spoken by the arbitrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Add a language"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                />
                <Button type="button" onClick={addLanguage} variant="outline">Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.languages.map(language => (
                  <div 
                    key={language} 
                    className="bg-gray-100 rounded-full px-3 py-1 flex items-center text-sm"
                  >
                    {language}
                    <button 
                      type="button" 
                      onClick={() => removeLanguage(language)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Label>Common Languages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonLanguages.map(language => (
                    <Button
                      key={language}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCommonLanguage(language)}
                      className={`text-xs ${formData.languages.includes(language) ? 'bg-blue-50' : ''}`}
                    >
                      {language}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Availability Card */}
          <Card>
            <CardHeader>
              <CardTitle>Availability & Status</CardTitle>
              <CardDescription>Arbitrator's availability and current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availabilityInfo">Availability Information</Label>
                <Textarea
                  id="availabilityInfo"
                  name="availabilityInfo"
                  rows={4}
                  value={formData.availabilityInfo}
                  onChange={handleInputChange}
                  placeholder="Preferred days, hours, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.status === 'active' 
                    ? 'Arbitrator is currently active and can be assigned to cases' 
                    : formData.status === 'pending' 
                    ? 'Arbitrator is awaiting approval' 
                    : 'Arbitrator is not currently active'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Arbitrator' : 'Create Arbitrator'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 