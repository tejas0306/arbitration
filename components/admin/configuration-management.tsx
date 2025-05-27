"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  List,
  Mail,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  RefreshCw,
  Settings
} from 'lucide-react'

interface LOV {
  id: string
  type: string
  key: string
  label: string
  description?: string
  sortOrder: number
  active: boolean
}

interface Template {
  id: string
  name: string
  channel: 'EMAIL' | 'SMS'
  subject?: string
  body: string
  variables: string[]
  active: boolean
}

interface Fee {
  id: string
  name: string
  serviceType: string
  amount: number
  currency: string
  effectiveDate: string
  active: boolean
}

interface BusinessRule {
  id: string
  name: string
  triggerEvent: string
  condition: string
  action: string
  escalationLevel: string
  active: boolean
}

export default function ConfigurationManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('lovs')
  
  // LOVs State
  const [lovs, setLovs] = useState<LOV[]>([])
  const [editingLov, setEditingLov] = useState<LOV | null>(null)
  const [showLovDialog, setShowLovDialog] = useState(false)
  
  // Templates State
  const [templates, setTemplates] = useState<Template[]>([])
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  
  // Fees State
  const [fees, setFees] = useState<Fee[]>([])
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [showFeeDialog, setShowFeeDialog] = useState(false)
  
  // Business Rules State
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([])
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  // Backend API base URL
  const API_BASE = getApiUrl('')

  useEffect(() => {
    fetchConfiguration()
  }, [])

  const fetchConfiguration = async () => {
    try {
      setLoading(true)
      
      // Fetch all configuration data from backend APIs
      const [categoriesRes, documentTypesRes, emailTemplatesRes, smsTemplatesRes, feeSchedulesRes, workflowRulesRes, escalationRulesRes] = await Promise.all([
        fetch(`${API_BASE}api/admin/case-categories`),
        fetch(`${API_BASE}api/admin/document-types`),
        fetch(`${API_BASE}api/admin/email-templates`),
        fetch(`${API_BASE}api/admin/sms-templates`),
        fetch(`${API_BASE}api/admin/fee-schedules`),
        fetch(`${API_BASE}api/admin/workflow-rules`),
        fetch(`${API_BASE}api/admin/escalation-rules`)
      ])

      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
      if (!documentTypesRes.ok) throw new Error('Failed to fetch document types')
      if (!emailTemplatesRes.ok) throw new Error('Failed to fetch email templates')
      if (!smsTemplatesRes.ok) throw new Error('Failed to fetch SMS templates')
      if (!feeSchedulesRes.ok) throw new Error('Failed to fetch fee schedules')
      if (!workflowRulesRes.ok) throw new Error('Failed to fetch workflow rules')
      if (!escalationRulesRes.ok) throw new Error('Failed to fetch escalation rules')

      const [categories, documentTypes, emailTemplates, smsTemplates, feeSchedules, workflowRules, escalationRules] = await Promise.all([
        categoriesRes.json(),
        documentTypesRes.json(),
        emailTemplatesRes.json(),
        smsTemplatesRes.json(),
        feeSchedulesRes.json(),
        workflowRulesRes.json(),
        escalationRulesRes.json()
      ])

      // Transform backend data to match our interface
      const transformedLovs: LOV[] = [
        ...categories.map((cat: any) => ({
          id: cat.id,
          type: 'Category',
          key: cat.name.toLowerCase().replace(/\s+/g, '_'),
          label: cat.name,
          description: cat.description,
          sortOrder: 1,
          active: cat.isActive
        })),
        ...documentTypes.map((doc: any) => ({
          id: doc.id,
          type: 'Document Type',
          key: doc.name.toLowerCase().replace(/\s+/g, '_'),
          label: doc.name,
          description: doc.description,
          sortOrder: 1,
          active: true
        }))
      ]

      const transformedTemplates: Template[] = [
        ...emailTemplates.map((template: any) => ({
          id: template.id,
          name: template.name,
          channel: 'EMAIL' as const,
          subject: template.subject || '',
          body: template.content || template.body || '',
          variables: template.variables || [],
          active: template.isActive
        })),
        ...smsTemplates.map((template: any) => ({
          id: template.id,
          name: template.name,
          channel: 'SMS' as const,
          body: template.content || template.body || '',
          variables: template.variables || [],
          active: template.isActive
        }))
      ]

      const transformedFees: Fee[] = feeSchedules.map((fee: any) => ({
        id: fee.id,
        name: fee.name,
        serviceType: fee.category,
        amount: fee.amount,
        currency: fee.currency,
        effectiveDate: new Date().toISOString().split('T')[0],
        active: fee.isActive
      }))

      const transformedBusinessRules: BusinessRule[] = [
        ...workflowRules.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          triggerEvent: rule.trigger || 'Custom Trigger',
          condition: rule.condition || 'Custom Condition',
          action: rule.action || 'Custom Action',
          escalationLevel: 'Level 1',
          active: rule.isActive
        })),
        ...escalationRules.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          triggerEvent: rule.trigger || 'Custom Trigger',
          condition: 'Custom Condition',
          action: rule.actions?.join(', ') || 'Custom Action',
          escalationLevel: 'Level 2',
          active: true
        }))
      ]

      setLovs(transformedLovs)
      setTemplates(transformedTemplates)
      setFees(transformedFees)
      setBusinessRules(transformedBusinessRules)
      
    } catch (error) {
      console.error('Error fetching configuration:', error)
      toast.error('Failed to fetch configuration data')
    } finally {
      setLoading(false)
    }
  }

  // LOV CRUD Functions
  const handleLovSave = async (lov: LOV) => {
    try {
      setSaving(true)
      const endpoint = lov.type === 'Category' ? 'case-categories' : 'document-types'
      
      if (lov.id) {
        // Update existing LOV
        const response = await fetch(`${API_BASE}api/admin/${endpoint}/${lov.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lov.label,
            description: lov.description,
            isActive: lov.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to update LOV')
        
        setLovs(prev => prev.map(l => l.id === lov.id ? lov : l))
        toast.success('LOV updated successfully')
      } else {
        // Create new LOV
        const response = await fetch(`${API_BASE}api/admin/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lov.label,
            description: lov.description,
            isActive: lov.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to create LOV')
        
        const newLov = await response.json()
        const transformedLov = {
          ...lov,
          id: newLov.id
        }
        setLovs(prev => [...prev, transformedLov])
        toast.success('LOV created successfully')
      }
      
      setShowLovDialog(false)
      setEditingLov(null)
    } catch (error) {
      console.error('Error saving LOV:', error)
      toast.error('Failed to save LOV')
    } finally {
      setSaving(false)
    }
  }

  const handleLovDelete = async (id: string) => {
    try {
      const lov = lovs.find(l => l.id === id)
      if (!lov) return
      
      const endpoint = lov.type === 'Category' ? 'case-categories' : 'document-types'
      const response = await fetch(`${API_BASE}api/admin/${endpoint}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete LOV')
      
      setLovs(prev => prev.filter(l => l.id !== id))
      toast.success('LOV deleted successfully')
    } catch (error) {
      console.error('Error deleting LOV:', error)
      toast.error('Failed to delete LOV')
    }
  }

  // Template CRUD Functions
  const handleTemplateSave = async (template: Template) => {
    try {
      setSaving(true)
      const endpoint = template.channel === 'EMAIL' ? 'email-templates' : 'sms-templates'
      
      if (template.id) {
        // Update existing template
        const response = await fetch(`${API_BASE}api/admin/${endpoint}/${template.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: template.name,
            subject: template.subject,
            content: template.body,
            variables: template.variables,
            isActive: template.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to update template')
        
        setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
        toast.success('Template updated successfully')
      } else {
        // Create new template
        const response = await fetch(`${API_BASE}api/admin/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: template.name,
            subject: template.subject,
            content: template.body,
            variables: template.variables,
            isActive: template.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to create template')
        
        const newTemplate = await response.json()
        const transformedTemplate = {
          ...template,
          id: newTemplate.id
        }
        setTemplates(prev => [...prev, transformedTemplate])
        toast.success('Template created successfully')
      }
      
      setShowTemplateDialog(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateDelete = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id)
      if (!template) return
      
      const endpoint = template.channel === 'EMAIL' ? 'email-templates' : 'sms-templates'
      const response = await fetch(`${API_BASE}api/admin/${endpoint}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete template')
      
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  // Fee CRUD Functions
  const handleFeeSave = async (fee: Fee) => {
    try {
      setSaving(true)
      
      if (fee.id) {
        // Update existing fee
        const response = await fetch(`${API_BASE}api/admin/fee-schedules/${fee.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fee.name,
            category: fee.serviceType,
            amount: fee.amount,
            currency: fee.currency,
            isActive: fee.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to update fee')
        
        setFees(prev => prev.map(f => f.id === fee.id ? fee : f))
        toast.success('Fee updated successfully')
      } else {
        // Create new fee
        const response = await fetch(`${API_BASE}api/admin/fee-schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fee.name,
            category: fee.serviceType,
            amount: fee.amount,
            currency: fee.currency,
            isActive: fee.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to create fee')
        
        const newFee = await response.json()
        const transformedFee = {
          ...fee,
          id: newFee.id
        }
        setFees(prev => [...prev, transformedFee])
        toast.success('Fee created successfully')
      }
      
      setShowFeeDialog(false)
      setEditingFee(null)
    } catch (error) {
      console.error('Error saving fee:', error)
      toast.error('Failed to save fee')
    } finally {
      setSaving(false)
    }
  }

  const handleFeeDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}api/admin/fee-schedules/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete fee')
      
      setFees(prev => prev.filter(f => f.id !== id))
      toast.success('Fee deleted successfully')
    } catch (error) {
      console.error('Error deleting fee:', error)
      toast.error('Failed to delete fee')
    }
  }

  // Business Rule CRUD Functions
  const handleRuleSave = async (rule: BusinessRule) => {
    try {
      setSaving(true)
      const endpoint = rule.escalationLevel === 'Level 1' ? 'workflow-rules' : 'escalation-rules'
      
      if (rule.id) {
        // Update existing rule
        const response = await fetch(`${API_BASE}api/admin/${endpoint}/${rule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: rule.name,
            trigger: rule.triggerEvent,
            condition: rule.condition,
            action: rule.action,
            isActive: rule.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to update business rule')
        
        setBusinessRules(prev => prev.map(r => r.id === rule.id ? rule : r))
        toast.success('Business rule updated successfully')
      } else {
        // Create new rule
        const response = await fetch(`${API_BASE}api/admin/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: rule.name,
            trigger: rule.triggerEvent,
            condition: rule.condition,
            action: rule.action,
            isActive: rule.active
          })
        })
        
        if (!response.ok) throw new Error('Failed to create business rule')
        
        const newRule = await response.json()
        const transformedRule = {
          ...rule,
          id: newRule.id
        }
        setBusinessRules(prev => [...prev, transformedRule])
        toast.success('Business rule created successfully')
      }
      
      setShowRuleDialog(false)
      setEditingRule(null)
    } catch (error) {
      console.error('Error saving business rule:', error)
      toast.error('Failed to save business rule')
    } finally {
      setSaving(false)
    }
  }

  const handleRuleDelete = async (id: string) => {
    try {
      const rule = businessRules.find(r => r.id === id)
      if (!rule) return
      
      const endpoint = rule.escalationLevel === 'Level 1' ? 'workflow-rules' : 'escalation-rules'
      const response = await fetch(`${API_BASE}api/admin/${endpoint}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete business rule')
      
      setBusinessRules(prev => prev.filter(r => r.id !== id))
      toast.success('Business rule deleted successfully')
    } catch (error) {
      console.error('Error deleting business rule:', error)
      toast.error('Failed to delete business rule')
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
    <div className="flex h-full">
      {/* Left Pane - Tabs */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('lovs')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'lovs' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-gray-200'
            }`}
          >
            <List className="h-4 w-4" />
            LOVs
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'templates' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-gray-200'
            }`}
          >
            <Mail className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'fees' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-gray-200'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Fees & Billing
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'rules' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Business Rules
          </button>
        </nav>
      </div>

      {/* Right Pane - Content */}
      <div className="flex-1 p-6">
        {activeTab === 'lovs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">List of Values (LOVs)</h3>
                <p className="text-muted-foreground">Manage categories, document types, and other lookup values</p>
              </div>
              <Dialog open={showLovDialog} onOpenChange={setShowLovDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingLov(null); setShowLovDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add LOV
                  </Button>
                </DialogTrigger>
                <LovDialog 
                  lov={editingLov} 
                  onSave={handleLovSave} 
                  onClose={() => setShowLovDialog(false)} 
                />
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lovs.map((lov) => (
                      <TableRow key={lov.id}>
                        <TableCell>{lov.type}</TableCell>
                        <TableCell className="font-mono">{lov.key}</TableCell>
                        <TableCell>{lov.label}</TableCell>
                        <TableCell>{lov.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={lov.active ? 'default' : 'secondary'}>
                            {lov.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingLov(lov); setShowLovDialog(true) }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLovDelete(lov.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Email & SMS Templates</h3>
                <p className="text-muted-foreground">Manage communication templates with dynamic variables</p>
              </div>
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingTemplate(null); setShowTemplateDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <TemplateDialog 
                  template={editingTemplate} 
                  onSave={handleTemplateSave} 
                  onClose={() => setShowTemplateDialog(false)} 
                />
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant={template.channel === 'EMAIL' ? 'default' : 'secondary'}>
                            {template.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.active ? 'default' : 'secondary'}>
                            {template.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingTemplate(template); setShowTemplateDialog(true) }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTemplateDelete(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Fees & Billing</h3>
                <p className="text-muted-foreground">Configure service fees and billing rates</p>
              </div>
              <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingFee(null); setShowFeeDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee
                  </Button>
                </DialogTrigger>
                <FeeDialog 
                  fee={editingFee} 
                  onSave={handleFeeSave} 
                  onClose={() => setShowFeeDialog(false)} 
                />
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>{fee.serviceType}</TableCell>
                        <TableCell className="font-mono">{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>{fee.currency}</TableCell>
                        <TableCell>{fee.effectiveDate}</TableCell>
                        <TableCell>
                          <Badge variant={fee.active ? 'default' : 'secondary'}>
                            {fee.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingFee(fee); setShowFeeDialog(true) }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeeDelete(fee.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Business Rules & Escalations</h3>
                <p className="text-muted-foreground">Configure automated workflow rules and escalation policies</p>
              </div>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingRule(null); setShowRuleDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <BusinessRuleDialog 
                  rule={editingRule} 
                  onSave={handleRuleSave} 
                  onClose={() => setShowRuleDialog(false)} 
                />
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Escalation Level</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businessRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.triggerEvent}</TableCell>
                        <TableCell>{rule.condition}</TableCell>
                        <TableCell>{rule.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.escalationLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.active ? 'default' : 'secondary'}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingRule(rule); setShowRuleDialog(true) }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRuleDelete(rule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Dialog Components
function LovDialog({ lov, onSave, onClose }: { lov: LOV | null, onSave: (lov: LOV) => Promise<void>, onClose: () => void }) {
  const [formData, setFormData] = useState<LOV>(
    lov || { 
      id: '', 
      type: '', 
      key: '', 
      label: '', 
      description: '', 
      sortOrder: 1, 
      active: true 
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{lov ? 'Edit LOV' : 'Add New LOV'}</DialogTitle>
        <DialogDescription>
          Configure a list of values entry for dropdowns and selections.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">LOV Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Category">Category</SelectItem>
              <SelectItem value="Sub-category">Sub-category</SelectItem>
              <SelectItem value="Dispute Nature">Dispute Nature</SelectItem>
              <SelectItem value="Document Type">Document Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="key">Key/Code</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
            placeholder="e.g., commercial"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="label">Display Label</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="e.g., Commercial Dispute"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
              min="1"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Active</Label>
            <div className="flex items-center mt-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

function TemplateDialog({ template, onSave, onClose }: { template: Template | null, onSave: (template: Template) => Promise<void>, onClose: () => void }) {
  const [formData, setFormData] = useState<Template>(
    template || { 
      id: '', 
      name: '', 
      channel: 'EMAIL', 
      subject: '', 
      body: '', 
      variables: [], 
      active: true 
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{template ? 'Edit Template' : 'Add New Template'}</DialogTitle>
        <DialogDescription>
          Create email or SMS templates with dynamic variables.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Case Registration Confirmation"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="channel">Channel</Label>
            <Select 
              value={formData.channel} 
              onValueChange={(value: 'EMAIL' | 'SMS') => setFormData(prev => ({ ...prev, channel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {formData.channel === 'EMAIL' && (
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject line"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Template content with {{variables}}"
            rows={6}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="variables">Available Variables</Label>
          <Input
            id="variables"
            value={formData.variables.join(', ')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
            }))}
            placeholder="e.g., claimant_name, case_number, due_date"
          />
          <p className="text-xs text-muted-foreground">Comma-separated list of variable names</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label>Active</Label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

function FeeDialog({ fee, onSave, onClose }: { fee: Fee | null, onSave: (fee: Fee) => Promise<void>, onClose: () => void }) {
  const [formData, setFormData] = useState<Fee>(
    fee || { 
      id: '', 
      name: '', 
      serviceType: '', 
      amount: 0, 
      currency: 'USD', 
      effectiveDate: new Date().toISOString().split('T')[0], 
      active: true 
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{fee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
        <DialogDescription>
          Configure service fees and billing rates.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Fee Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Registration Fee"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serviceType">Service Type</Label>
          <Select 
            value={formData.serviceType} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Registration">Registration</SelectItem>
              <SelectItem value="Advisory">Advisory</SelectItem>
              <SelectItem value="Hearing">Hearing</SelectItem>
              <SelectItem value="Document Review">Document Review</SelectItem>
              <SelectItem value="Mediation">Mediation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
              min="0"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="effectiveDate">Effective Date</Label>
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label>Active</Label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

function BusinessRuleDialog({ rule, onSave, onClose }: { rule: BusinessRule | null, onSave: (rule: BusinessRule) => Promise<void>, onClose: () => void }) {
  const [formData, setFormData] = useState<BusinessRule>(
    rule || { 
      id: '', 
      name: '', 
      triggerEvent: '', 
      condition: '', 
      action: '', 
      escalationLevel: 'Level 1', 
      active: true 
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{rule ? 'Edit Business Rule' : 'Add New Business Rule'}</DialogTitle>
        <DialogDescription>
          Configure automated workflow rules and escalation policies.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Evidence Due Reminder"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="triggerEvent">Trigger Event</Label>
          <Select 
            value={formData.triggerEvent} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, triggerEvent: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trigger event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Evidence Due">Evidence Due</SelectItem>
              <SelectItem value="Payment Due">Payment Due</SelectItem>
              <SelectItem value="Hearing Scheduled">Hearing Scheduled</SelectItem>
              <SelectItem value="Case Filed">Case Filed</SelectItem>
              <SelectItem value="Response Due">Response Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Input
            id="condition"
            value={formData.condition}
            onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
            placeholder="e.g., 3 days before, 7 days overdue"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select 
            value={formData.action} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, action: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Send Reminder Email">Send Reminder Email</SelectItem>
              <SelectItem value="Send SMS Notification">Send SMS Notification</SelectItem>
              <SelectItem value="Notify Claimant">Notify Claimant</SelectItem>
              <SelectItem value="Notify Respondent">Notify Respondent</SelectItem>
              <SelectItem value="Escalate to Case Manager">Escalate to Case Manager</SelectItem>
              <SelectItem value="Escalate to Admin">Escalate to Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="escalationLevel">Escalation Level</Label>
          <Select 
            value={formData.escalationLevel} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, escalationLevel: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Level 1">Level 1</SelectItem>
              <SelectItem value="Level 2">Level 2</SelectItem>
              <SelectItem value="Level 3">Level 3</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label>Active</Label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </form>
    </DialogContent>
  )
} 