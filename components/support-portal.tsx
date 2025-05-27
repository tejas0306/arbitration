"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/contexts/auth-context'
import {
  HelpCircle,
  Plus,
  Upload,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Tag,
  RefreshCw,
  FileText,
  User,
  X
} from 'lucide-react'

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: 'registration' | 'payments' | 'hearings' | 'evidence' | 'technical' | 'other'
  priority: 'low' | 'medium' | 'high'
  status: 'new' | 'in-progress' | 'pending-user' | 'resolved' | 'closed'
  submittedBy: string
  assignedTo?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
  responses?: TicketResponse[]
}

interface TicketResponse {
  id: string
  message: string
  respondedBy: string
  isInternal: boolean
  createdAt: string
  attachments?: string[]
}

interface TicketForm {
  subject: string
  category: string
  description: string
  priority: string
  attachments: File[]
}

export default function SupportPortal() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('my-tickets')
  
  // Form state
  const [form, setForm] = useState<TicketForm>({
    subject: '',
    category: '',
    description: '',
    priority: 'medium',
    attachments: []
  })

  const { user } = useAuth()
  const API_BASE = getApiUrl('')

  useEffect(() => {
    fetchMyTickets()
  }, [])

  const fetchMyTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}api/support/my-tickets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch tickets')
      
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to fetch your support tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = async (ticket: SupportTicket) => {
    try {
      const response = await fetch(`${API_BASE}api/support/tickets/${ticket.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch ticket details')
      
      const detailedTicket = await response.json()
      setSelectedTicket(detailedTicket)
      setShowTicketDialog(true)
    } catch (error) {
      console.error('Error fetching ticket details:', error)
      toast.error('Failed to fetch ticket details')
    }
  }

  const handleSubmitTicket = async () => {
    if (!form.subject.trim() || !form.category || !form.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSending(true)
      
      // Create FormData for file uploads
      const formData = new FormData()
      formData.append('subject', form.subject)
      formData.append('category', form.category)
      formData.append('description', form.description)
      formData.append('priority', form.priority)
      
      // Add attachments
      form.attachments.forEach((file) => {
        formData.append('attachments', file)
      })

      const response = await fetch(`${API_BASE}api/support/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to submit ticket')

      const newTicket = await response.json()
      setTickets(prev => [newTicket, ...prev])
      
      // Reset form
      setForm({
        subject: '',
        category: '',
        description: '',
        priority: 'medium',
        attachments: []
      })
      
      setShowSubmitDialog(false)
      toast.success('Support ticket submitted successfully!')
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast.error('Failed to submit support ticket')
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Validate file type and size (max 10MB)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported format`)
        return false
      }
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB)`)
        return false
      }
      
      return true
    })
    
    setForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))
  }

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'registration': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'payments': return 'bg-green-100 text-green-800 border-green-200'
      case 'hearings': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'evidence': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'technical': return 'bg-red-100 text-red-800 border-red-200'
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending-user': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'pending-user': return <MessageSquare className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <CheckCircle className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Get help with your arbitration portal experience</p>
        </div>
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Submit Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you resolve it as quickly as possible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registration">Registration</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="hearings">Hearings</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={form.priority} onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}>
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
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 mt-1">{form.description.length}/2000 characters</p>
              </div>

              <div>
                <Label htmlFor="attachments">Attachments</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload files</p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB each)</p>
                      </div>
                    </Label>
                  </div>
                  
                  {form.attachments.length > 0 && (
                    <div className="space-y-2">
                      {form.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTicket} disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Support Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tickets" className="space-y-6">
          {/* Ticket Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'new').length}</p>
                    <p className="text-sm text-gray-600">New</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'in-progress').length}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'pending-user').length}</p>
                    <p className="text-sm text-gray-600">Pending Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Support Tickets</CardTitle>
                <CardDescription>Track and manage your support requests</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchMyTickets}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">#{ticket.id.slice(-8)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {ticket.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(ticket.category)}>
                            {ticket.category.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ticket.status)}
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets yet</h3>
                  <p className="text-gray-600 mb-4">Submit your first ticket to get help with any issues.</p>
                  <Button onClick={() => setShowSubmitDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge-base" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">How do I submit a new arbitration case?</h4>
                    <p className="text-sm text-gray-600">Navigate to Dashboard and click "New Petition" to start the arbitration process.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">How can I track my case status?</h4>
                    <p className="text-sm text-gray-600">Go to "My Cases" to view all your cases and their current status.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">What payment methods are accepted?</h4>
                    <p className="text-sm text-gray-600">We accept credit cards, bank transfers, and electronic payments.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Getting Started Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">1. Complete Your Profile</h4>
                    <p className="text-sm text-gray-600">Ensure all your contact information is up to date.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">2. Submit Required Documents</h4>
                    <p className="text-sm text-gray-600">Upload any necessary documentation for your case.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">3. Schedule Hearings</h4>
                    <p className="text-sm text-gray-600">Work with the case manager to schedule hearing dates.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Contact Information</CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-sm text-gray-600">support@arbitration.com</p>
                  <p className="text-xs text-gray-500">Response within 24 hours</p>
                </div>
                <div>
                  <h4 className="font-medium">Phone Support</h4>
                  <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-xs text-gray-500">Mon-Fri 9AM-5PM EST</p>
                </div>
                <div>
                  <h4 className="font-medium">Emergency Support</h4>
                  <p className="text-sm text-gray-600">+1 (555) 999-0000</p>
                  <p className="text-xs text-gray-500">24/7 for urgent issues</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>When you can expect the fastest response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Regular Support</h4>
                  <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p className="text-sm text-gray-600">Saturday: 10:00 AM - 4:00 PM EST</p>
                  <p className="text-sm text-gray-600">Sunday: Closed</p>
                </div>
                <div>
                  <h4 className="font-medium">Holiday Schedule</h4>
                  <p className="text-sm text-gray-600">Reduced hours on federal holidays</p>
                  <p className="text-xs text-gray-500">Emergency support available 24/7</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket #{selectedTicket?.id?.slice(-8)}</span>
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(selectedTicket?.category || '')}>
                  {selectedTicket?.category?.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket?.priority || '')}>
                  {selectedTicket?.priority?.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(selectedTicket?.status || '')}>
                  {selectedTicket?.status?.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Ticket details and conversation history
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                  <p className="text-gray-600 mt-2">{selectedTicket.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Submitted by:</strong> {selectedTicket.submittedBy}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Assigned to:</strong> {selectedTicket.assignedTo || 'Unassigned'}
                  </div>
                  <div>
                    <strong>Last updated:</strong> {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </div>
                </div>

                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attachments:</h4>
                    <div className="space-y-1">
                      {selectedTicket.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversation History */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Conversation</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                    selectedTicket.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-4 rounded-lg ${
                          response.isInternal
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-blue-50 border-l-4 border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <strong>{response.respondedBy}</strong>
                            {response.isInternal && (
                              <Badge variant="outline" className="text-xs">
                                Internal Note
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{response.message}</p>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="mt-2">
                            <div className="space-y-1">
                              {response.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{attachment}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No responses yet. Our support team will respond soon.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 