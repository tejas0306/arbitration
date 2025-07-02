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
import {
  HelpCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Send,
  RefreshCw
} from 'lucide-react'

interface HelpDeskTicket {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  submittedBy: string
  assignedTo?: string
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
}

export default function HelpDeskManagement() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<HelpDeskTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<HelpDeskTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const API_BASE = getApiUrl('')

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}api/admin/helpdesk`)
      
      if (!response.ok) throw new Error('Failed to fetch tickets')
      
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      toast.error('Failed to fetch help desk tickets')
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    setFilteredTickets(filtered)
  }

  const handleTicketClick = async (ticket: HelpDeskTicket) => {
    try {
      const response = await fetch(`${API_BASE}api/admin/helpdesk/${ticket.id}`)
      
      if (!response.ok) throw new Error('Failed to fetch ticket details')
      
      const detailedTicket = await response.json()
      setSelectedTicket(detailedTicket)
      setShowTicketDialog(true)
    } catch (error) {
      toast.error('Failed to fetch ticket details')
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}api/admin/helpdesk/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      // Update local state
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus as any } : ticket
      ))

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null)
      }

      toast.success('Ticket status updated successfully')
    } catch (error) {
      toast.error('Failed to update ticket status')
    }
  }

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return

    try {
      setSending(true)
      const response = await fetch(`${API_BASE}api/admin/helpdesk/${selectedTicket.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: responseMessage,
          isInternal
        })
      })

      if (!response.ok) throw new Error('Failed to send response')

      const newResponse = await response.json()
      
      // Update the selected ticket with the new response
      setSelectedTicket(prev => prev ? {
        ...prev,
        responses: [...(prev.responses || []), newResponse]
      } : null)

      setResponseMessage('')
      setIsInternal(false)
      toast.success('Response sent successfully')
    } catch (error) {
      toast.error('Failed to send response')
    } finally {
      setSending(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <CheckCircle className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Desk</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and user requests</p>
        </div>
        <Button onClick={fetchTickets} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
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
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{tickets.filter(t => t.priority === 'urgent').length}</p>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets by subject, description, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Manage and respond to user support requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {ticket.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{ticket.submittedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <Select 
                        value={ticket.status} 
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
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

          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket #{selectedTicket?.id}</span>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(selectedTicket?.priority || '')}>
                  {selectedTicket?.priority?.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(selectedTicket?.status || '')}>
                  {selectedTicket?.status?.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Support ticket details and conversation history
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
              </div>

              {/* Conversation History */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Conversation</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {selectedTicket.responses?.map((response) => (
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Form */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-lg font-semibold">Send Response</h4>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your response here..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="internal"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="internal" className="text-sm">
                        Internal note (not visible to user)
                      </Label>
                    </div>
                    <Button
                      onClick={handleSendResponse}
                      disabled={!responseMessage.trim() || sending}
                    >
                      {sending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 