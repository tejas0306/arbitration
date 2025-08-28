"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, FileText, Users, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AIContractUpload from './ai-contract-upload';
import { contractExtractionService } from '@/lib/services/contract-extraction.service';

interface AIEnhancedFormProps {
  onSubmit: (formData: any) => void;
  initialData?: any;
}

export default function AIEnhancedForm({ onSubmit, initialData }: AIEnhancedFormProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    type: '',
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    gst: '',
    pan: '',
    cin: '',
    
    // Arbitration Agreement
    arbitrationAgreement: {
      agreementDate: '',
      placeOfSigning: '',
      arbitrationClause: '',
      language: 'English',
      seatAndVenue: '',
    },
    
    // Dispute Details
    disputeDetails: {
      natureOfDispute: '',
      amountInDispute: '',
      disputeDescription: '',
    },
    
    // Respondents
    respondents: [
      {
        type: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        gst: '',
        pan: '',
        cin: '',
      }
    ],
    
    // AI Extracted Data
    aiExtractedData: null as any,
    obligations: [] as any[],
    clauses: [] as any[],
    penaltyClauses: [] as any[],
  });

  const [aiEnabled, setAiEnabled] = useState(true);
  const [prefilledFields, setPrefilledFields] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('ai-upload');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleAIDataExtracted = (extractedData: any) => {
    console.log('🤖 AI Data extracted:', extractedData);
    
    try {
      // Transform AI data to form format
      const aiFormData = contractExtractionService.transformToArbitrationForm(extractedData);
      console.log('🔄 Transformed AI data:', aiFormData);
      
      const updatedFormData = { ...formData };
      const fieldsUpdated: string[] = [];
      
      // Update form fields with AI data
      console.log('🔍 Processing AI form data:', aiFormData);
      Object.entries(aiFormData).forEach(([key, value]) => {
        console.log(`🔍 Processing field ${key}:`, value, 'Type:', typeof value);
        
        if (value && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Handle nested objects
            console.log(`🔍 Processing nested object for ${key}:`, value);
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              console.log(`🔍 Processing nested field ${key}.${nestedKey}:`, nestedValue);
              if (nestedValue && nestedValue !== '') {
                (updatedFormData as any)[key][nestedKey] = nestedValue;
                fieldsUpdated.push(`${key}.${nestedKey}`);
                console.log(`✅ Updated ${key}.${nestedKey} with:`, nestedValue);
              } else {
                console.log(`⚠️ Skipping ${key}.${nestedKey} - empty value:`, nestedValue);
              }
            });
          } else {
            (updatedFormData as any)[key] = value;
            fieldsUpdated.push(key);
            console.log(`✅ Updated ${key} with:`, value);
          }
        } else {
          console.log(`⚠️ Skipping ${key} - empty/falsy value:`, value);
        }
      });
      
      // Store AI extracted data and obligations
      updatedFormData.aiExtractedData = extractedData;
      
      // Extract obligations from the AI data structure
      if (extractedData.parties && Array.isArray(extractedData.parties)) {
        const allObligations: any[] = [];
        extractedData.parties.forEach((party: any, index: number) => {
          if (party.obligations && Array.isArray(party.obligations)) {
            party.obligations.forEach((obligation: any) => {
              allObligations.push({
                ...obligation,
                partyIndex: index,
                partyName: party.name || `Party ${index + 1}`
              });
            });
          }
        });
        updatedFormData.obligations = allObligations;
      } else if (extractedData.obligations) {
        updatedFormData.obligations = [
          ...(extractedData.obligations.party1Obligations || []),
          ...(extractedData.obligations.party2Obligations || [])
        ];
      }
      
      if (extractedData.penalty_clauses && Array.isArray(extractedData.penalty_clauses)) {
        updatedFormData.penaltyClauses = extractedData.penalty_clauses;
      } else if (extractedData.legal?.penaltyClauses) {
        updatedFormData.penaltyClauses = extractedData.legal.penaltyClauses;
      }
      
      console.log('📊 Final updated form data:', updatedFormData);
      console.log('📊 Fields updated:', fieldsUpdated);
      
      setFormData(updatedFormData);
      setPrefilledFields(fieldsUpdated);
      setActiveTab('basic-info');
      
      toast.success(`🎉 Form pre-filled with AI data! ${fieldsUpdated.length} fields updated.`);
    } catch (error) {
      console.error('Error processing AI data:', error);
      toast.error('Failed to process AI extracted data');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const fieldPath = field.split('.');
      
      if (fieldPath.length === 1) {
        (newData as any)[fieldPath[0]] = value;
      } else if (fieldPath.length === 2) {
        (newData as any)[fieldPath[0]][fieldPath[1]] = value;
      }
      
      return newData;
    });
    
    // Remove field from prefilled list when manually edited
    if (prefilledFields.includes(field)) {
      setPrefilledFields(prev => prev.filter(f => f !== field));
    }
  };

  const addRespondent = () => {
    setFormData(prev => ({
      ...prev,
      respondents: [...prev.respondents, {
        type: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        gst: '',
        pan: '',
        cin: '',
      }]
    }));
  };

  const removeRespondent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      respondents: prev.respondents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'address1'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    onSubmit(formData);
  };

  const renderField = (field: string, label: string, component: React.ReactNode) => {
    const isPrefilled = prefilledFields.includes(field);
    
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {label}
          {isPrefilled && (
            <Badge variant="secondary" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI Filled
            </Badge>
          )}
        </Label>
        {component}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI-Enhanced Arbitration Request Form
          </CardTitle>
          <p className="text-muted-foreground">
            Upload your contract to auto-fill the form, or fill it manually.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-upload" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Upload
          </TabsTrigger>
          <TabsTrigger value="basic-info" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="arbitration" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Arbitration
          </TabsTrigger>
          <TabsTrigger value="dispute" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dispute
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-upload" className="space-y-6">
          <AIContractUpload
            onDataExtracted={handleAIDataExtracted}
            onError={(error) => toast.error(error)}
          />
        </TabsContent>

        <TabsContent value="basic-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderField('type', 'Type *', (
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPANY">Company</SelectItem>
                    </SelectContent>
                  </Select>
                ))}
                
                {renderField('name', 'Name *', (
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderField('email', 'Email *', (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                ))}
                
                {renderField('phone', 'Phone *', (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderField('address1', 'Address Line 1 *', (
                  <Input
                    value={formData.address1}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    placeholder="Enter address"
                  />
                ))}
                
                {renderField('address2', 'Address Line 2', (
                  <Input
                    value={formData.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    placeholder="Enter additional address"
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {renderField('city', 'City', (
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                ))}
                
                {renderField('state', 'State', (
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                ))}
                
                {renderField('pincode', 'PIN Code', (
                  <Input
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="Enter PIN code"
                  />
                ))}
              </div>

              {formData.type === 'COMPANY' && (
                <div className="grid grid-cols-3 gap-4">
                  {renderField('gst', 'GST Number', (
                    <Input
                      value={formData.gst}
                      onChange={(e) => handleInputChange('gst', e.target.value)}
                      placeholder="Enter GST number"
                    />
                  ))}
                  
                  {renderField('pan', 'PAN Number', (
                    <Input
                      value={formData.pan}
                      onChange={(e) => handleInputChange('pan', e.target.value)}
                      placeholder="Enter PAN number"
                    />
                  ))}
                  
                  {renderField('cin', 'CIN Number', (
                    <Input
                      value={formData.cin}
                      onChange={(e) => handleInputChange('cin', e.target.value)}
                      placeholder="Enter CIN number"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arbitration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arbitration Agreement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderField('arbitrationAgreement.agreementDate', 'Agreement Date', (
                  <Input
                    type="date"
                    value={formData.arbitrationAgreement.agreementDate}
                    onChange={(e) => handleInputChange('arbitrationAgreement.agreementDate', e.target.value)}
                  />
                ))}
                
                {renderField('arbitrationAgreement.placeOfSigning', 'Place of Signing', (
                  <Input
                    value={formData.arbitrationAgreement.placeOfSigning}
                    onChange={(e) => handleInputChange('arbitrationAgreement.placeOfSigning', e.target.value)}
                    placeholder="Enter place of signing"
                  />
                ))}
              </div>

              {renderField('arbitrationAgreement.arbitrationClause', 'Arbitration Clause', (
                <Textarea
                  value={formData.arbitrationAgreement.arbitrationClause}
                  onChange={(e) => handleInputChange('arbitrationAgreement.arbitrationClause', e.target.value)}
                  placeholder="Enter the arbitration clause from your agreement"
                  rows={4}
                />
              ))}

              <div className="grid grid-cols-2 gap-4">
                {renderField('arbitrationAgreement.language', 'Language', (
                  <Select 
                    value={formData.arbitrationAgreement.language} 
                    onValueChange={(value) => handleInputChange('arbitrationAgreement.language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ))}
                
                {renderField('arbitrationAgreement.seatAndVenue', 'Seat and Venue', (
                  <Input
                    value={formData.arbitrationAgreement.seatAndVenue}
                    onChange={(e) => handleInputChange('arbitrationAgreement.seatAndVenue', e.target.value)}
                    placeholder="Enter arbitration seat and venue"
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Extracted Clauses */}
          {formData.obligations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI-Extracted Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.obligations.map((obligation: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Clause {obligation.clauseNumber}</Badge>
                      </div>
                      <p className="text-sm font-medium">{obligation.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{obligation.clauseText}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dispute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderField('disputeDetails.natureOfDispute', 'Nature of Dispute', (
                <Input
                  value={formData.disputeDetails.natureOfDispute}
                  onChange={(e) => handleInputChange('disputeDetails.natureOfDispute', e.target.value)}
                  placeholder="Enter the nature of dispute"
                />
              ))}

              {renderField('disputeDetails.amountInDispute', 'Amount in Dispute', (
                <Input
                  value={formData.disputeDetails.amountInDispute}
                  onChange={(e) => handleInputChange('disputeDetails.amountInDispute', e.target.value)}
                  placeholder="Enter the amount in dispute"
                />
              ))}

              {renderField('disputeDetails.disputeDescription', 'Dispute Description', (
                <Textarea
                  value={formData.disputeDetails.disputeDescription}
                  onChange={(e) => handleInputChange('disputeDetails.disputeDescription', e.target.value)}
                  placeholder="Provide a detailed description of the dispute"
                  rows={5}
                />
              ))}
            </CardContent>
          </Card>

          {/* Respondents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Respondents
                <Button onClick={addRespondent} variant="outline" size="sm">
                  Add Respondent
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.respondents.map((respondent, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Respondent {index + 1}</h4>
                    {formData.respondents.length > 1 && (
                      <Button
                        onClick={() => removeRespondent(index)}
                        variant="destructive"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={respondent.type} 
                        onValueChange={(value) => {
                          const newRespondents = [...formData.respondents];
                          newRespondents[index].type = value;
                          setFormData(prev => ({ ...prev, respondents: newRespondents }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                          <SelectItem value="COMPANY">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={respondent.name}
                        onChange={(e) => {
                          const newRespondents = [...formData.respondents];
                          newRespondents[index].name = e.target.value;
                          setFormData(prev => ({ ...prev, respondents: newRespondents }));
                        }}
                        placeholder="Enter name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={respondent.email}
                        onChange={(e) => {
                          const newRespondents = [...formData.respondents];
                          newRespondents[index].email = e.target.value;
                          setFormData(prev => ({ ...prev, respondents: newRespondents }));
                        }}
                        placeholder="Enter email"
                      />
                    </div>
                    
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={respondent.phone}
                        onChange={(e) => {
                          const newRespondents = [...formData.respondents];
                          newRespondents[index].phone = e.target.value;
                          setFormData(prev => ({ ...prev, respondents: newRespondents }));
                        }}
                        placeholder="Enter phone"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <p className="text-muted-foreground">
                Please review all information before submitting your arbitration request.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefilledFields.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">AI-Assisted Form Completion</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    {prefilledFields.length} fields were automatically filled using AI analysis of your contract.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Address:</strong> {formData.address1}, {formData.city}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Arbitration Agreement</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Agreement Date:</strong> {formData.arbitrationAgreement.agreementDate}</p>
                    <p><strong>Place of Signing:</strong> {formData.arbitrationAgreement.placeOfSigning}</p>
                    <p><strong>Language:</strong> {formData.arbitrationAgreement.language}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Dispute Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Nature:</strong> {formData.disputeDetails.natureOfDispute}</p>
                    <p><strong>Amount:</strong> {formData.disputeDetails.amountInDispute}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Respondents</h4>
                  <div className="space-y-2">
                    {formData.respondents.map((respondent, index) => (
                      <div key={index} className="text-sm">
                        <p><strong>{index + 1}.</strong> {respondent.name} ({respondent.email})</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button onClick={handleSubmit} className="flex-1" size="lg">
                  Submit Arbitration Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
