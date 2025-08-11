'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, MessageCircle, Plus } from 'lucide-react';

interface RespondentCaseReviewProps {
  caseData: any;
  onSubmit: (responseData: any) => void;
  user: any;
}

export default function RespondentCaseReview({ caseData, onSubmit, user }: RespondentCaseReviewProps) {
  const [activeTab, setActiveTab] = useState('claimant');
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>({
    claimant: {},
    additionalClaimants: [],
    managerDetails: [],
    respondents: [],
    arbitrationAgreement: {},
    natureOfDispute: {},
    disputeDescriptions: [],
    prayers: {},
    arguments: {},
    newDisputes: [],
    comments: {}
  });

  const handleFieldResponse = (section: string, field: string, action: 'accept' | 'reject', value?: string, comment?: string) => {
    setResponseData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          action,
          originalValue: caseData[section]?.[field],
          correctedValue: value,
          comment
        }
      }
    }));
  };

  const handleArrayFieldResponse = (section: string, index: number, field: string, action: 'accept' | 'reject', value?: string, comment?: string) => {
    setResponseData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [index]: {
          ...prev[section]?.[index],
          [field]: {
            action,
            originalValue: caseData[section]?.[index]?.[field],
            correctedValue: value,
            comment
          }
        }
      }
    }));
  };

  const handleAddNewDispute = () => {
    setResponseData(prev => ({
      ...prev,
      newDisputes: [
        ...prev.newDisputes,
        {
          id: Date.now(),
          title: '',
          description: '',
          evidence: '',
          category: '',
          dateWhenRightArose: ''
        }
      ]
    }));
  };

  const handleNewDisputeChange = (index: number, field: string, value: string) => {
    setResponseData(prev => ({
      ...prev,
      newDisputes: prev.newDisputes.map((dispute: any, i: number) =>
        i === index ? { ...dispute, [field]: value } : dispute
      )
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        ...responseData,
        submittedAt: new Date().toISOString(),
        submittedBy: user.id
      });
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldReview = (section: string, field: string, label: string, value: any, isEditable: boolean = true) => {
    const fieldResponse = responseData[section]?.[field];
    const isAccepted = fieldResponse?.action === 'accept';
    const isRejected = fieldResponse?.action === 'reject';

    return (
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="font-medium">{label}</Label>
          <div className="flex items-center space-x-2">
            {isAccepted && <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Accepted
            </Badge>}
            {isRejected && <Badge variant="secondary" className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Claimant's Entry:</p>
          <p className="text-sm bg-gray-50 p-2 rounded">{value || 'Not provided'}</p>
        </div>

        {isEditable && (
          <div className="space-y-3">
            <RadioGroup
              value={fieldResponse?.action || ''}
              onValueChange={(value) => handleFieldResponse(section, field, value as 'accept' | 'reject')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accept" id={`${field}-accept`} />
                <Label htmlFor={`${field}-accept`}>Accept</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id={`${field}-reject`} />
                <Label htmlFor={`${field}-reject`}>Reject and provide correction</Label>
              </div>
            </RadioGroup>

            {isRejected && (
              <div className="space-y-2">
                <Label htmlFor={`${field}-correction`}>Corrected Value:</Label>
                <Textarea
                  id={`${field}-correction`}
                  value={fieldResponse?.correctedValue || ''}
                  onChange={(e) => handleFieldResponse(section, field, 'reject', e.target.value, fieldResponse?.comment)}
                  placeholder="Provide the correct value"
                />
              </div>
            )}

            <div>
              <Label htmlFor={`${field}-comment`}>Comment (Optional):</Label>
              <Textarea
                id={`${field}-comment`}
                value={fieldResponse?.comment || ''}
                onChange={(e) => handleFieldResponse(section, field, fieldResponse?.action || 'accept', fieldResponse?.correctedValue, e.target.value)}
                placeholder="Add any comments about this field"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderArrayFieldReview = (section: string, items: any[], title: string) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {items?.map((item: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{title} #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(item).map(([field, value]) => (
                <div key={field}>
                  {renderFieldReview(section, `${index}.${field}`, field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Case Review & Response</CardTitle>
          <CardDescription>
            Review the claimant's information and provide your response. You can accept, reject, or correct each field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="claimant">Claimant</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
              <TabsTrigger value="agreement">Agreement</TabsTrigger>
              <TabsTrigger value="prayers">Prayers</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="new-disputes">New Disputes</TabsTrigger>
            </TabsList>

            <TabsContent value="claimant" className="space-y-4">
              <h3 className="text-lg font-semibold">Claimant Information</h3>
              {caseData.claimant && Object.entries(caseData.claimant).map(([field, value]) => (
                <div key={field}>
                  {renderFieldReview('claimant', field, field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value)}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="disputes" className="space-y-4">
              <h3 className="text-lg font-semibold">Nature of Dispute</h3>
              {caseData.natureOfDispute && Object.entries(caseData.natureOfDispute).map(([field, value]) => (
                <div key={field}>
                  {renderFieldReview('natureOfDispute', field, field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value)}
                </div>
              ))}

              {caseData.disputeDescriptions && caseData.disputeDescriptions.length > 0 && (
                renderArrayFieldReview('disputeDescriptions', caseData.disputeDescriptions, 'Dispute Descriptions')
              )}
            </TabsContent>

            <TabsContent value="agreement" className="space-y-4">
              <h3 className="text-lg font-semibold">Arbitration Agreement</h3>
              {caseData.arbitrationAgreement && Object.entries(caseData.arbitrationAgreement).map(([field, value]) => (
                <div key={field}>
                  {renderFieldReview('arbitrationAgreement', field, field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value)}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="prayers" className="space-y-4">
              <h3 className="text-lg font-semibold">Prayers & Reliefs</h3>
              {caseData.prayers?.prayers && caseData.prayers.prayers.length > 0 && (
                renderArrayFieldReview('prayers.prayers', caseData.prayers.prayers, 'Prayers')
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Alert>
                <AlertDescription>
                  Documents submitted by the claimant are available for review. You can comment on their relevance or accuracy.
                </AlertDescription>
              </Alert>
              
              {caseData.documents && (
                <div className="space-y-4">
                  {Object.entries(caseData.documents).map(([docType, docs]) => (
                    <div key={docType}>
                      <h4 className="font-medium mb-2">{docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                      {Array.isArray(docs) && docs.map((doc: any, index: number) => (
                        <div key={index} className="border rounded p-3 mb-2">
                          <p className="text-sm font-medium">{doc.name || `Document ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">{doc.description || 'No description'}</p>
                          <div className="mt-2">
                            <Label htmlFor={`doc-comment-${index}`}>Comment:</Label>
                            <Textarea
                              id={`doc-comment-${index}`}
                              value={responseData.comments?.[`${docType}-${index}`] || ''}
                              onChange={(e) => setResponseData(prev => ({
                                ...prev,
                                comments: {
                                  ...prev.comments,
                                  [`${docType}-${index}`]: e.target.value
                                }
                              }))}
                              placeholder="Add your comment about this document"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new-disputes" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Disputes</h3>
                <Button onClick={handleAddNewDispute} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dispute
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  You can add new disputes or counter-claims that were not mentioned by the claimant.
                </AlertDescription>
              </Alert>

              {responseData.newDisputes.map((dispute: any, index: number) => (
                <Card key={dispute.id}>
                  <CardHeader>
                    <CardTitle className="text-base">New Dispute #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`dispute-title-${index}`}>Dispute Title</Label>
                      <input
                        id={`dispute-title-${index}`}
                        type="text"
                        value={dispute.title}
                        onChange={(e) => handleNewDisputeChange(index, 'title', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter dispute title"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`dispute-description-${index}`}>Description</Label>
                      <Textarea
                        id={`dispute-description-${index}`}
                        value={dispute.description}
                        onChange={(e) => handleNewDisputeChange(index, 'description', e.target.value)}
                        placeholder="Describe the dispute in detail"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`dispute-evidence-${index}`}>Evidence</Label>
                      <Textarea
                        id={`dispute-evidence-${index}`}
                        value={dispute.evidence}
                        onChange={(e) => handleNewDisputeChange(index, 'evidence', e.target.value)}
                        placeholder="Describe any evidence supporting this dispute"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`dispute-category-${index}`}>Category</Label>
                        <input
                          id={`dispute-category-${index}`}
                          type="text"
                          value={dispute.category}
                          onChange={(e) => handleNewDisputeChange(index, 'category', e.target.value)}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., Breach of Contract"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`dispute-date-${index}`}>Date When Right Arose</Label>
                        <input
                          id={`dispute-date-${index}`}
                          type="date"
                          value={dispute.dateWhenRightArose}
                          onChange={(e) => handleNewDisputeChange(index, 'dateWhenRightArose', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={() => setResponseData({})}>
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 