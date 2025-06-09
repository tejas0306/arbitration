"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { ArrowLeft, Save, FileText, Clock, DollarSign, Calendar } from 'lucide-react'

interface CaseFormData {
  id?: string
  title: string
  caseNumber?: string
  description: string
  claimant: string
  claimantEmail: string
  respondent: string
  respondentEmail: string
  amount: number
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'draft' | 'active' | 'pending' | 'resolved' | 'cancelled'
  arbitratorId?: string
}

export default function CaseForm() {
  const router = useRouter()
  const params = useParams()
  const caseId = params?.id as string
  const isEditMode = !!caseId
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    description: '',
    claimant: '',
    claimantEmail: '',
    respondent: '',
    respondentEmail: '',
    amount: 0,
    category: 'commercial',
    priority: 'medium',
    status: 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CaseFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [arbitrators, setArbitrators] = useState<{id: string, name: string}[]>([])
  
  // Category options
  const categoryOptions = [
    { value: 'commercial', label: 'Commercial Dispute' },
    { value: 'employment', label: 'Employment Dispute' },
    { value: 'construction', label: 'Construction' },
    { value: 'ip', label: 'Intellectual Property' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' }
  ]
  
  useEffect(() => {
    // Fetch arbitrators for the dropdown
    fetchArbitrators()
    
    if (isEditMode) {
      fetchCaseData()
    }
  }, [caseId])
  
  const fetchArbitrators = async () => {
    try {
      const response = await fetch(getApiUrl('api/admin/arbitrators?limit=100'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrators')
      }
      
      const data = await response.json()
      const arbitratorsList = Array.isArray(data) ? data : (data.arbitrators || [])
      setArbitrators(arbitratorsList.map((a: any) => ({
        id: a.id,
        name: a.name
      })))
    } catch (error) {
      console.error('Error fetching arbitrators:', error)
      // Use mock data if API fails
      setArbitrators([
        { id: 'arb1', name: 'John Smith' },
        { id: 'arb2', name: 'Emily Davis' },
        { id: 'arb3', name: 'Michael Brown' }
      ])
    }
  }
  
  const fetchCaseData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/cases/${caseId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch case data')
      }
      
      const data = await response.json()
      
      setFormData({
        id: data.id,
        title: data.title || '',
        caseNumber: data.caseNumber || '',
        description: data.description || '',
        claimant: data.claimant || '',
        claimantEmail: data.claimantEmail || '',
        respondent: data.respondent || '',
        respondentEmail: data.respondentEmail || '',
        amount: data.amount || 0,
        category: data.category || 'commercial',
        priority: data.priority || 'medium',
        status: data.status || 'draft',
        arbitratorId: data.arbitratorId || 'none'
      })
    } catch (error) {
      console.error('Error fetching case data:', error)
      toast.error('Failed to load case data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (formErrors[name as keyof CaseFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numberValue = value === '' ? 0 : Number(value)
    setFormData(prev => ({ ...prev, amount: numberValue }))
  }
  
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }
  
  const handlePriorityChange = (value: string) => {
    setFormData(prev => ({ ...prev, priority: value as CaseFormData['priority'] }))
  }
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as CaseFormData['status'] }))
  }
  
  const handleArbitratorChange = (value: string) => {
    // Convert "none" back to null/undefined when submitting
    setFormData(prev => ({ 
      ...prev, 
      arbitratorId: value === 'none' ? undefined : value 
    }))
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CaseFormData, string>> = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.claimant.trim()) errors.claimant = 'Claimant name is required'
    if (!formData.respondent.trim()) errors.respondent = 'Respondent name is required'
    
    if (formData.claimantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.claimantEmail)) {
      errors.claimantEmail = 'Invalid email format'
    }
    
    if (formData.respondentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.respondentEmail)) {
      errors.respondentEmail = 'Invalid email format'
    }
    
    if (formData.amount < 0) {
      errors.amount = 'Amount cannot be negative'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please correct the errors before submitting')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const endpoint = isEditMode 
        ? getApiUrl(`api/admin/cases/${caseId}`)
        : getApiUrl('api/admin/cases')
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      // Create payload (omit id for edit mode)
      const payload = { ...formData }
      if (isEditMode) {
        delete payload.id
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save case')
      }
      
      toast.success(`Case ${isEditMode ? 'updated' : 'created'} successfully`)
      router.push('/admin/cases')
    } catch (error: any) {
      console.error('Error saving case:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} case`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/admin/cases')
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center">
        <button 
          onClick={handleCancel}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Case' : 'Add New Case'}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Case Details' : 'New Case Details'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update case information' : 'Enter information to create a new case'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Case Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter case title"
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
                </div>
                
                {isEditMode && (
                  <div>
                    <Label htmlFor="caseNumber">Case Number</Label>
                    <Input
                      id="caseNumber"
                      name="caseNumber"
                      value={formData.caseNumber || ''}
                      onChange={handleInputChange}
                      placeholder="System generated"
                      disabled
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the case details"
                    rows={4}
                    className={formErrors.description ? 'border-red-500' : ''}
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>
                
                <div>
                  <Label htmlFor="amount">Claim Amount <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleNumberChange}
                      placeholder="Enter claim amount"
                      className={`pl-8 ${formErrors.amount ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.amount && <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>}
                </div>
                
                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Parties & Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="claimant">Claimant Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="claimant"
                    name="claimant"
                    value={formData.claimant}
                    onChange={handleInputChange}
                    placeholder="Enter claimant name"
                    className={formErrors.claimant ? 'border-red-500' : ''}
                  />
                  {formErrors.claimant && <p className="text-red-500 text-sm mt-1">{formErrors.claimant}</p>}
                </div>
                
                <div>
                  <Label htmlFor="claimantEmail">Claimant Email</Label>
                  <Input
                    id="claimantEmail"
                    name="claimantEmail"
                    type="email"
                    value={formData.claimantEmail}
                    onChange={handleInputChange}
                    placeholder="Enter claimant email"
                    className={formErrors.claimantEmail ? 'border-red-500' : ''}
                  />
                  {formErrors.claimantEmail && <p className="text-red-500 text-sm mt-1">{formErrors.claimantEmail}</p>}
                </div>
                
                <div>
                  <Label htmlFor="respondent">Respondent Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="respondent"
                    name="respondent"
                    value={formData.respondent}
                    onChange={handleInputChange}
                    placeholder="Enter respondent name"
                    className={formErrors.respondent ? 'border-red-500' : ''}
                  />
                  {formErrors.respondent && <p className="text-red-500 text-sm mt-1">{formErrors.respondent}</p>}
                </div>
                
                <div>
                  <Label htmlFor="respondentEmail">Respondent Email</Label>
                  <Input
                    id="respondentEmail"
                    name="respondentEmail"
                    type="email"
                    value={formData.respondentEmail}
                    onChange={handleInputChange}
                    placeholder="Enter respondent email"
                    className={formErrors.respondentEmail ? 'border-red-500' : ''}
                  />
                  {formErrors.respondentEmail && <p className="text-red-500 text-sm mt-1">{formErrors.respondentEmail}</p>}
                </div>
                
                <div>
                  <Label htmlFor="arbitratorId">Assigned Arbitrator</Label>
                  <Select
                    value={formData.arbitratorId || 'none'}
                    onValueChange={handleArbitratorChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select arbitrator (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {arbitrators.map(arbitrator => (
                        <SelectItem key={arbitrator.id} value={arbitrator.id}>
                          {arbitrator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={handlePriorityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <CardFooter className="px-0 pt-6 border-t flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="ml-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Case' : 'Create Case'}
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 