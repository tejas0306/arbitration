"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, User, Key, Save } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  organization?: string
  expertise?: string
  qualifications?: string
  experience?: number
  bio?: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    organization: '',
    expertise: '',
    qualifications: '',
    experience: 0,
    bio: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await api.profile.getProfile()
        const userProfile = response.data
        setProfile(userProfile)
        
        // Populate form with current data
        setProfileForm({
          name: userProfile.name || '',
          email: userProfile.email || '',
          organization: userProfile.organization || '',
          expertise: userProfile.expertise || '',
          qualifications: userProfile.qualifications || '',
          experience: userProfile.experience || 0,
          bio: userProfile.bio || ''
        })
      } catch (error: any) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile information')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await api.profile.updateProfile(profileForm)
      setProfile(response.data.user)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    setSaving(true)

    try {
      await api.profile.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      toast.success('Password changed successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    )
  }

  const isArbitrator = profile?.role === 'ARBITRATOR'

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account information and security settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile Information</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Security Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <p className="text-sm text-gray-600">
                    Update your personal information and professional details
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization</Label>
                        <Input
                          id="organization"
                          name="organization"
                          value={profileForm.organization}
                          onChange={handleProfileChange}
                          placeholder="Company, Law Firm, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={profile?.role || ''}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">
                          Contact support to change your role
                        </p>
                      </div>
                    </div>

                    {isArbitrator && (
                      <>
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Arbitrator Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="expertise">Areas of Expertise</Label>
                              <Input
                                id="expertise"
                                name="expertise"
                                value={profileForm.expertise}
                                onChange={handleProfileChange}
                                placeholder="Commercial Law, Corporate Disputes, etc."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="experience">Years of Experience</Label>
                              <Input
                                id="experience"
                                name="experience"
                                type="number"
                                min="0"
                                max="50"
                                value={profileForm.experience}
                                onChange={handleProfileChange}
                              />
                            </div>
                          </div>

                          <div className="space-y-2 mt-6">
                            <Label htmlFor="qualifications">Qualifications</Label>
                            <Textarea
                              id="qualifications"
                              name="qualifications"
                              value={profileForm.qualifications}
                              onChange={handleProfileChange}
                              rows={3}
                              placeholder="Degrees, certifications, professional memberships..."
                            />
                          </div>

                          <div className="space-y-2 mt-6">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea
                              id="bio"
                              name="bio"
                              value={profileForm.bio}
                              onChange={handleProfileChange}
                              rows={4}
                              placeholder="Brief description of your professional background and arbitration experience..."
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end pt-6 border-t">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <p className="text-sm text-gray-600">
                    Update your password to keep your account secure
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password *</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {profile && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-500">
                  <p>Account created: {new Date(profile.createdAt).toLocaleDateString()}</p>
                  <p>Last updated: {new Date(profile.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 