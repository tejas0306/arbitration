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
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { ArrowLeft, Save, UserPlus, X } from 'lucide-react'

interface UserFormData {
  id?: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'ARBITRATOR' | 'CASE_MANAGER' | 'TEAM_MEMBER' | 'CLAIMANT' | 'RESPONDENT'
  organization?: string
  password?: string
  status: 'active' | 'inactive' | 'pending'
}

export default function UserForm() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  const isEditMode = !!userId
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'CLAIMANT',
    organization: '',
    password: '',
    status: 'pending'
  })
  
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Role options
  const roleOptions = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'ARBITRATOR', label: 'Arbitrator' },
    { value: 'CASE_MANAGER', label: 'Case Manager' },
    { value: 'TEAM_MEMBER', label: 'Team Member' },
    { value: 'CLAIMANT', label: 'Claimant' },
    { value: 'RESPONDENT', label: 'Respondent' }
  ]
  
  useEffect(() => {
    if (isEditMode) {
      fetchUserData()
    }
  }, [userId])
  
  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/users/${userId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const data = await response.json()
      
      setFormData({
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'CLAIMANT',
        organization: data.organization || '',
        status: data.isActive ? 'active' : (data.isSuspended ? 'inactive' : 'pending')
      })
    } catch (error) {
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (formErrors[name as keyof UserFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }
  
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as UserFormData['role'] }))
  }
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'pending' }))
  }
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {}
    
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format'
    
    if (!isEditMode && !formData.password) errors.password = 'Password is required for new users'
    if (!isEditMode && formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number should be 10 digits'
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
        ? getApiUrl(`api/admin/users/${userId}`)
        : getApiUrl('api/admin/users')
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      // Create payload (omit id and password for edit mode)
      const payload = { ...formData }
      if (isEditMode) {
        delete payload.id
        if (!payload.password) delete payload.password
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
        throw new Error(data.message || 'Failed to save user')
      }
      
      toast.success(`User ${isEditMode ? 'updated' : 'created'} successfully`)
      router.push('/dashboard/users')
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} user`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/dashboard/users')
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
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit User' : 'Add New User'}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit User Details' : 'New User Details'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update user information' : 'Enter information to create a new user'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
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
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>
                
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={formData.organization || ''}
                    onChange={handleInputChange}
                    placeholder="Enter organization name"
                  />
                </div>
              </div>
              
              {/* Account Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">User Role <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {!isEditMode && (
                  <div>
                    <Label htmlFor="password">Password {!isEditMode && <span className="text-red-500">*</span>}</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={handleInputChange}
                      placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                      className={formErrors.password ? 'border-red-500' : ''}
                    />
                    {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="status">Account Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {isEditMode ? 'Update User' : 'Create User'}
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