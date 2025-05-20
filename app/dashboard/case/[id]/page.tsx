"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { arbitrationApi } from "@/lib/api"
import { toast } from "sonner"
import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  File, 
  Calendar, 
  DollarSign, 
  Users, 
  User, 
  FileText, 
  Award, 
  Scale, 
  Building, 
  Map, 
  Phone, 
  Mail 
} from "lucide-react"

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params as any)
  const caseId = unwrappedParams?.id

  const router = useRouter()
  const [caseDetails, setCaseDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!caseId) {
        toast.error("Missing case ID")
        router.push('/dashboard/my-cases')
        return
      }

      try {
        setIsLoading(true)
        console.log(`Fetching case details for ID: ${caseId}`)
        const data = await arbitrationApi.getById(caseId)
        console.log("Case details fetched successfully:", data ? "SUCCESS" : "EMPTY")
        setCaseDetails(data)
      } catch (error) {
        console.error("Error fetching case details:", error)
        toast.error("Failed to load case details. Please try returning to your cases and selecting again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaseDetails()
  }, [caseId, router])

  const handleViewDocument = (documentUrl: any) => {
    try {
      if (!documentUrl) {
        toast.error('No document file available');
        return;
      }
      
      // Extract the actual filename/path from the document URL object
      let fileUrl = '';
      
      if (typeof documentUrl === 'string') {
        fileUrl = documentUrl;
      } else if (documentUrl.filename || documentUrl.path) {
        fileUrl = documentUrl.filename || documentUrl.path;
      } else if (documentUrl.url) {
        fileUrl = documentUrl.url;
      } else {
        console.error('Unrecognized document format:', documentUrl);
        toast.error('Document format not recognized');
        return;
      }
      
      console.log('Original document URL:', fileUrl);
      
      // Extract just the filename from the path if it exists
      const filename = fileUrl.includes('/') 
        ? fileUrl.split('/').pop() 
        : fileUrl
      
      // Check if it's a full URL or a relative path
      if (fileUrl.startsWith('http')) {
        // It's already a full URL, just open it
        window.open(fileUrl, '_blank');
      } 
      // If it's an agreement file, use the direct access route
      else if (filename && (filename.includes('agreementFile-') || filename.includes('agreement'))) {
        const baseUrl = window.location.origin;
        const directUrl = `${baseUrl}/api/uploads/arbitration/${filename}`;
        console.log(`Opening document directly: ${directUrl}`);
        window.open(directUrl, '_blank');
      }
      // For other files, use the download API
      else {
        const baseUrl = window.location.origin;
        const documentPath = `/api/documents/download?filename=${encodeURIComponent(fileUrl)}`;
        console.log(`Opening document: ${baseUrl}${documentPath}`);
        window.open(`${baseUrl}${documentPath}`, '_blank');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Could not open the document. Please try again later.');
    }
  }

  // Extract all files from the case data
  const getAllDocuments = () => {
    if (!caseDetails) return [];
    
    const documents = [];
    
    // Agreement file
    if (caseDetails.arbitrationAgreement?.agreementFile) {
      documents.push({
        name: 'Arbitration Agreement',
        type: 'Agreement',
        file: caseDetails.arbitrationAgreement.agreementFile,
        date: caseDetails.arbitrationAgreement.agreementDate || caseDetails.createdAt
      });
    }
    
    // Supporting documents
    if (caseDetails.documents?.supportingDocuments?.length) {
      caseDetails.documents.supportingDocuments.forEach((doc: any, index: number) => {
        documents.push({
          name: `Supporting Document ${index + 1}`,
          type: 'Supporting',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Evidence files
    if (caseDetails.documents?.evidenceFiles?.length) {
      caseDetails.documents.evidenceFiles.forEach((doc: any, index: number) => {
        documents.push({
          name: `Evidence ${index + 1}`,
          type: 'Evidence',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Company documents
    if (caseDetails.coi) {
      documents.push({
        name: 'Certificate of Incorporation',
        type: 'Company Document',
        file: caseDetails.coi,
        date: caseDetails.createdAt
      });
    }
    
    if (caseDetails.panCard) {
      documents.push({
        name: 'PAN Card',
        type: 'Company Document',
        file: caseDetails.panCard,
        date: caseDetails.createdAt
      });
    }
    
    if (caseDetails.gstCert) {
      documents.push({
        name: 'GST Certificate',
        type: 'Company Document',
        file: caseDetails.gstCert,
        date: caseDetails.createdAt
      });
    }
    
    return documents;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600">Loading case details...</p>
        </div>
      </div>
    )
  }

  if (!caseDetails) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Case not found or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/my-cases')}>
              Back to My Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const documents = getAllDocuments();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Case #{caseDetails.caseNumber}</h1>
          <p className="text-muted-foreground mt-1">Filed on {new Date(caseDetails.createdAt).toLocaleDateString()}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Case Summary Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-indigo-600 p-4">
          <h2 className="text-white text-xl font-semibold">Case Summary</h2>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <Scale className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Case Status</h3>
                <p className="text-lg font-medium mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${caseDetails.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    caseDetails.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 
                    caseDetails.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                    caseDetails.status?.toLowerCase() === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'}`}>
                    {caseDetails.status ? caseDetails.status.toLowerCase() : 'pending'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Last updated: {new Date(caseDetails.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Dispute Amount</h3>
                <p className="text-lg font-medium mt-1">₹{caseDetails.disputeDetails?.disputeAmount || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <Award className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Arbitrator</h3>
                <p className="text-lg font-medium mt-1">{caseDetails.arbitratorName || 'Not assigned yet'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {caseDetails.arbitratorId ? 'Assigned' : 'Pending assignment'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs defaultValue="details" className="mb-8" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="details">Case Details</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        {/* Case Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dispute Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Dispute Type</h3>
                  <p className="mt-1 text-lg">{caseDetails.disputeDetails?.disputeType || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Dispute Category</h3>
                  <p className="mt-1 text-lg">{caseDetails.type || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Sub-Category</h3>
                  <p className="mt-1 text-lg">{caseDetails.disputeDetails?.subCategory || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Dispute Date</h3>
                  <p className="mt-1 text-lg">{caseDetails.disputeDetails?.disputeDate || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-700">Dispute Description</h3>
                  <div className="mt-2 bg-gray-50 p-4 rounded-md">
                    <p>{caseDetails.disputeDetails?.disputeDescription || 'No description provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Arbitration Agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Agreement Type</h3>
                  <p className="mt-1 text-lg">{caseDetails.arbitrationAgreement?.agreementType || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Agreement Date</h3>
                  <p className="mt-1 text-lg">{caseDetails.arbitrationAgreement?.agreementDate || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
            {caseDetails.arbitrationAgreement?.agreementFile && (
              <CardFooter className="bg-gray-50 border-t">
                <div className="flex items-center w-full justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-indigo-600 mr-2" />
                    <span>Agreement Document</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDocument(caseDetails.arbitrationAgreement.agreementFile)}
                  >
                    View Document
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Claimant Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Name</h3>
                  <p className="mt-1 text-lg">{caseDetails.name || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Type</h3>
                  <p className="mt-1 text-lg">{caseDetails.type || 'Not specified'}</p>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{caseDetails.email || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{caseDetails.phoneCountryCode} {caseDetails.phone || 'Not specified'}</span>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-700">Address</h3>
                  <p className="mt-1">
                    {caseDetails.address1}
                    {caseDetails.address2 ? `, ${caseDetails.address2}` : ''}
                    <br />
                    {caseDetails.city}, {caseDetails.state}, {caseDetails.pincode}
                  </p>
                </div>
                {caseDetails.gst && (
                  <div>
                    <h3 className="font-semibold text-gray-700">GST</h3>
                    <p className="mt-1">{caseDetails.gst}</p>
                  </div>
                )}
                {caseDetails.pan && (
                  <div>
                    <h3 className="font-semibold text-gray-700">PAN</h3>
                    <p className="mt-1">{caseDetails.pan}</p>
                  </div>
                )}
                {caseDetails.cin && (
                  <div>
                    <h3 className="font-semibold text-gray-700">CIN</h3>
                    <p className="mt-1">{caseDetails.cin}</p>
                  </div>
                )}
              </div>
              
              {caseDetails.additionalClaimants && caseDetails.additionalClaimants.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Additional Claimants</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                    {caseDetails.additionalClaimants.map((claimant: any, index: number) => (
                      <div key={index} className="pb-3 last:pb-0 last:border-b-0 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-gray-500 text-sm">Name:</span>
                            <p>{claimant.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Email:</span>
                            <p className="flex items-center">
                              <Mail className="h-3 w-3 text-gray-500 mr-1" />
                              {claimant.email}
                            </p>
                          </div>
                          {claimant.phone && (
                            <div>
                              <span className="text-gray-500 text-sm">Phone:</span>
                              <p className="flex items-center">
                                <Phone className="h-3 w-3 text-gray-500 mr-1" />
                                {claimant.phoneCountryCode} {claimant.phone}
                              </p>
                            </div>
                          )}
                          {claimant.address && (
                            <div>
                              <span className="text-gray-500 text-sm">Address:</span>
                              <p>{claimant.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Respondent Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseDetails.respondents && caseDetails.respondents.length > 0 ? (
                <div className="space-y-6">
                  {caseDetails.respondents.map((respondent: any, index: number) => (
                    <div key={index} className={`${index > 0 ? 'pt-6 border-t border-gray-200' : ''}`}>
                      <h3 className="font-semibold text-gray-700 text-lg mb-3">Respondent {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-700">Name</h4>
                          <p className="mt-1">{respondent.name}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700">Type</h4>
                          <p className="mt-1">{respondent.type}</p>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <span>{respondent.email}</span>
                        </div>
                        {respondent.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{respondent.phoneCountryCode} {respondent.phone}</span>
                          </div>
                        )}
                        {respondent.address && (
                          <div className="md:col-span-2">
                            <h3 className="font-semibold text-gray-700">Address</h3>
                            <p className="mt-1">{respondent.address}</p>
                          </div>
                        )}
                        {respondent.gst && (
                          <div>
                            <h3 className="font-semibold text-gray-700">GST</h3>
                            <p className="mt-1">{respondent.gst}</p>
                          </div>
                        )}
                        {respondent.pan && (
                          <div>
                            <h3 className="font-semibold text-gray-700">PAN</h3>
                            <p className="mt-1">{respondent.pan}</p>
                          </div>
                        )}
                        {respondent.cin && (
                          <div>
                            <h3 className="font-semibold text-gray-700">CIN</h3>
                            <p className="mt-1">{respondent.cin}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No respondent details available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Documents
              </CardTitle>
              <CardDescription>
                All documents submitted as part of this arbitration case
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="divide-y">
                  {documents.map((doc, index) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-start">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                          <File className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>Uploaded: {new Date(doc.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocument(doc.file)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No documents have been uploaded for this case</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 