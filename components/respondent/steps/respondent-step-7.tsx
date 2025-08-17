"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Check, X, MessageSquare, Clock, ArrowRight, Plus, FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RespondentStep7Props {
  formData: any
  updateFormData: (data: any) => void
  caseData: any
  isEditable: boolean
  round: number
}

interface RoundUpdate {
  id: string
  type: 'response' | 'clarification' | 'new_evidence' | 'modification'
  title: string
  content: string
  targetSection: string
  createdAt: string
}

export default function RespondentStep7({ formData, updateFormData, caseData, isEditable, round }: RespondentStep7Props) {
  const [editingUpdate, setEditingUpdate] = useState<string | null>(null)
  const [tempData, setTempData] = useState<any>({})

  const addRoundUpdate = (type: string) => {
    const currentRoundUpdates = formData.roundUpdates?.[round] || { newComments: '', responses: [], modifications: [] }
    const newUpdate: RoundUpdate = {
      id: `update-${Date.now()}`,
      type,
      title: '',
      content: '',
      targetSection: '',
      createdAt: new Date().toISOString()
    }

    const updatedResponses = [...(currentRoundUpdates.responses || []), newUpdate]

    updateFormData({
      roundUpdates: {
        ...formData.roundUpdates,
        [round]: {
          ...currentRoundUpdates,
          responses: updatedResponses
        }
      }
    })
  }

  const updateRoundResponse = (id: string, updates: Partial<RoundUpdate>) => {
    const currentRoundUpdates = formData.roundUpdates?.[round] || { newComments: '', responses: [], modifications: [] }
    const updatedResponses = (currentRoundUpdates.responses || []).map((response: RoundUpdate) =>
      response.id === id ? { ...response, ...updates } : response
    )

    updateFormData({
      roundUpdates: {
        ...formData.roundUpdates,
        [round]: {
          ...currentRoundUpdates,
          responses: updatedResponses
        }
      }
    })
  }

  const removeRoundUpdate = (id: string) => {
    const currentRoundUpdates = formData.roundUpdates?.[round] || { newComments: '', responses: [], modifications: [] }
    const updatedResponses = (currentRoundUpdates.responses || []).filter((response: RoundUpdate) => response.id !== id)

    updateFormData({
      roundUpdates: {
        ...formData.roundUpdates,
        [round]: {
          ...currentRoundUpdates,
          responses: updatedResponses
        }
      }
    })
  }

  const updateNewComments = (comments: string) => {
    const currentRoundUpdates = formData.roundUpdates?.[round] || { newComments: '', responses: [], modifications: [] }

    updateFormData({
      roundUpdates: {
        ...formData.roundUpdates,
        [round]: {
          ...currentRoundUpdates,
          newComments: comments
        }
      }
    })
  }

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'response': return 'bg-blue-100 text-blue-800'
      case 'clarification': return 'bg-yellow-100 text-yellow-800'
      case 'new_evidence': return 'bg-green-100 text-green-800'
      case 'modification': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case 'response': return 'Response to New Points'
      case 'clarification': return 'Clarification'
      case 'new_evidence': return 'New Evidence'
      case 'modification': return 'Modification'
      default: return 'Update'
    }
  }

  const renderClaimantNewPoints = () => {
    // Mock data for claimant's new points in this round
    // In a real implementation, this would come from the case data
    const claimantNewPoints = caseData?.rounds?.[round]?.claimantUpdates || [
      {
        id: 'new-point-1',
        type: 'Additional Claim',
        title: 'Breach of Confidentiality Clause',
        content: 'The claimant now alleges that the respondent breached the confidentiality clause in Section 5.2 of the agreement...',
        submittedAt: new Date().toISOString()
      },
      {
        id: 'new-point-2',
        type: 'Clarification',
        title: 'Clarification on Damages Calculation',
        content: 'To clarify the damages calculation mentioned in our original claim, we are providing the following additional details...',
        submittedAt: new Date().toISOString()
      }
    ]

    return (
      <div className="space-y-4">
        {claimantNewPoints.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No new points from claimant in this round.
            </CardContent>
          </Card>
        ) : (
          claimantNewPoints.map((point: any, index: number) => (
            <Card key={point.id} className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Claimant's New Point #{index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{point.type}</Badge>
                    <Badge variant="outline" className="text-xs">
                      Round {round}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{point.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded border">
                    {point.content}
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted: {new Date(point.submittedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  const renderRoundUpdateCard = (update: RoundUpdate, index: number) => (
    <Card key={update.id} className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Update #{index + 1}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getUpdateTypeColor(update.type)}>
              {getUpdateTypeLabel(update.type)}
            </Badge>
            {isEditable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeRoundUpdate(update.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Update Title</Label>
          <Input
            value={update.title}
            onChange={(e) => updateRoundResponse(update.id, { title: e.target.value })}
            placeholder="Brief title for this update..."
            disabled={!isEditable}
          />
        </div>

        <div>
          <Label>Target Section/Reference</Label>
          <Input
            value={update.targetSection}
            onChange={(e) => updateRoundResponse(update.id, { targetSection: e.target.value })}
            placeholder="Which section does this update relate to? (e.g., 'Step 3, Claim #2')"
            disabled={!isEditable}
          />
        </div>

        <div>
          <Label>Update Content</Label>
          <Textarea
            value={update.content}
            onChange={(e) => updateRoundResponse(update.id, { content: e.target.value })}
            placeholder="Provide your detailed response or update..."
            className="min-h-[120px]"
            disabled={!isEditable}
          />
        </div>

        <div className="text-xs text-gray-500">
          Created: {new Date(update.createdAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )

  const currentRoundData = formData.roundUpdates?.[round] || { newComments: '', responses: [], modifications: [] }

  if (round === 1) {
    return (
      <div className="space-y-6">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This section is for multi-round editing and will become active after the claimant 
            provides their counter-response to your initial submission.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Waiting for Round 2</h3>
            <p>Multi-round editing will be available once the claimant responds to your submission.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Round {round} editing is now active. Review the claimant's new points and provide your responses. 
          You can also make modifications to your previous submissions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="new-points" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-points">Claimant's New Points</TabsTrigger>
          <TabsTrigger value="responses">Your Responses</TabsTrigger>
          <TabsTrigger value="modifications">Modifications</TabsTrigger>
        </TabsList>

        {/* Claimant's New Points */}
        <TabsContent value="new-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claimant's New Points - Round {round}</CardTitle>
              <CardDescription>
                Review the new points, clarifications, or evidence submitted by the claimant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderClaimantNewPoints()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Your Responses */}
        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Responses - Round {round}</CardTitle>
                  <CardDescription>
                    Respond to the claimant's new points and provide additional information
                  </CardDescription>
                </div>
                {isEditable && (
                  <div className="flex gap-2">
                    <Button onClick={() => addRoundUpdate('response')} variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Response
                    </Button>
                    <Button onClick={() => addRoundUpdate('clarification')} variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Clarification
                    </Button>
                    <Button onClick={() => addRoundUpdate('new_evidence')} variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      New Evidence
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentRoundData.responses?.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No responses added yet. Click the buttons above to add your responses.
                    </CardContent>
                  </Card>
                ) : (
                  currentRoundData.responses?.map((response: RoundUpdate, index: number) =>
                    renderRoundUpdateCard(response, index)
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* General Comments for this round */}
          <Card>
            <CardHeader>
              <CardTitle>General Comments for Round {round}</CardTitle>
              <CardDescription>
                Any additional comments or observations for this round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentRoundData.newComments || ''}
                onChange={(e) => updateNewComments(e.target.value)}
                placeholder="Add any general comments for this round..."
                className="min-h-[100px]"
                disabled={!isEditable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modifications */}
        <TabsContent value="modifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modifications to Previous Submissions</CardTitle>
                  <CardDescription>
                    Modify or clarify points from your previous submissions
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button onClick={() => addRoundUpdate('modification')} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Modification
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(currentRoundData.modifications || []).length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No modifications added yet.
                  </div>
                ) : (
                  currentRoundData.modifications?.map((mod: any, index: number) => (
                    renderRoundUpdateCard(mod, index)
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links to Previous Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access to Previous Sections</CardTitle>
              <CardDescription>
                Jump back to previous steps to make edits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { step: 1, title: 'Information', icon: <Edit className="h-4 w-4" /> },
                  { step: 2, title: 'Agreement', icon: <FileText className="h-4 w-4" /> },
                  { step: 3, title: 'Responses', icon: <MessageSquare className="h-4 w-4" /> },
                  { step: 4, title: 'Documents', icon: <FileText className="h-4 w-4" /> },
                  { step: 5, title: 'Additional Issues', icon: <Plus className="h-4 w-4" /> },
                  { step: 6, title: 'Final Review', icon: <Check className="h-4 w-4" /> }
                ].map((section) => (
                  <Button
                    key={section.step}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => {
                      // This would trigger navigation to the specific step
                      // Implementation depends on parent component
                    }}
                  >
                    {section.icon}
                    <span className="text-xs">Step {section.step}</span>
                    <span className="text-xs font-normal">{section.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Round Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Round {round} Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {currentRoundData.responses?.length || 0}
              </div>
              <div className="text-xs text-blue-700">Your Responses</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">
                {currentRoundData.modifications?.length || 0}
              </div>
              <div className="text-xs text-purple-700">Modifications</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {currentRoundData.newComments ? 1 : 0}
              </div>
              <div className="text-xs text-green-700">General Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Round {round} Guidelines:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Address each new point raised by the claimant</li>
            <li>Be specific about which previous submissions you're modifying</li>
            <li>Provide clear reasons for any changes to your position</li>
            <li>Submit all round {round} updates together when complete</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
