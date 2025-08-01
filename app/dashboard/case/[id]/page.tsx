"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Mail,
  Eye,
  MessageSquare,
  Gavel
} from "lucide-react"
import DashboardLayoutClient from "@/components/dashboard-layout-client"

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const caseId = resolvedParams?.id
  const router = useRouter()
  const [caseDetails, setCaseDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

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
        toast.error("Failed to load case details. Please try again.")
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
      
      console.log('Document URL received:', documentUrl, typeof documentUrl);
      
      let fileUrl = '';
      let fileName = '';
      
      // Handle different document formats
      if (typeof documentUrl === 'string') {
        fileUrl = documentUrl;
        fileName = documentUrl.includes('/') ? documentUrl.split('/').pop() : documentUrl;
      } else if (typeof documentUrl === 'object') {
        // Handle object with various possible properties
        fileUrl = documentUrl.filename || 
                 documentUrl.path || 
                 documentUrl.url || 
                 documentUrl.file || 
                 documentUrl.src ||
                 documentUrl.href ||
                 '';
        
        fileName = documentUrl.originalName || 
                  documentUrl.name || 
                  documentUrl.filename ||
                  (fileUrl.includes('/') ? fileUrl.split('/').pop() : fileUrl) ||
                  'document';
      }
      
      if (!fileUrl) {
        console.error('Could not extract file URL from:', documentUrl);
        toast.error('Document file path not found');
        return;
      }
      
      console.log('Extracted file URL:', fileUrl, 'File name:', fileName);
      
      // Clean the filename
      const cleanFileName = fileName.includes('/') ? fileName.split('/').pop() : fileName;
      
      // Handle different URL types
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Direct HTTP/HTTPS URL
        window.open(fileUrl, '_blank');
      } else if (fileUrl.startsWith('data:')) {
        // Data URL
        window.open(fileUrl, '_blank');
      } else {
        // Relative path - construct proper API URL
        const baseUrl = window.location.origin;
        let documentPath = '';
        
        // Check if it's an agreement file or needs special handling
        if (cleanFileName && (cleanFileName.includes('agreementFile-') || cleanFileName.includes('agreement'))) {
          documentPath = `/files/${cleanFileName}`;
        } else {
          // Use the documents download API
          documentPath = `/api/documents/download?filename=${encodeURIComponent(fileUrl)}`;
        }
        
        const fullUrl = `${baseUrl}${documentPath}`;
        console.log('Opening document at:', fullUrl);
        window.open(fullUrl, '_blank');
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
    
    console.log('Case details for document extraction:', {
      hasArbitrationAgreement: !!caseDetails.arbitrationAgreement,
      hasDocuments: !!caseDetails.documents,
      hasClaimant: !!caseDetails.claimant,
      allFields: Object.keys(caseDetails)
    });
    
    // Agreement file
    if (caseDetails.arbitrationAgreement?.agreementFile) {
      documents.push({
        name: 'Arbitration Agreement',
        type: 'Agreement',
        file: caseDetails.arbitrationAgreement.agreementFile,
        date: caseDetails.arbitrationAgreement.agreementDate || caseDetails.createdAt
      });
    }
    
    // Supporting documents - try multiple possible structures
    const supportingDocs = caseDetails.documents?.supportingDocuments || 
                          caseDetails.supportingDocuments || 
                          [];
    
    if (Array.isArray(supportingDocs) && supportingDocs.length > 0) {
      supportingDocs.forEach((doc: any, index: number) => {
        documents.push({
          name: `Supporting Document ${index + 1}`,
          type: 'Supporting',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Evidence files - try multiple possible structures
    const evidenceFiles = caseDetails.documents?.evidenceFiles || 
                         caseDetails.evidenceFiles || 
                         [];
    
    if (Array.isArray(evidenceFiles) && evidenceFiles.length > 0) {
      evidenceFiles.forEach((doc: any, index: number) => {
        documents.push({
          name: `Evidence ${index + 1}`,
          type: 'Evidence',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Scanned documents - try multiple possible structures
    const scannedDocs = caseDetails.documents?.scannedDocuments ||
                       caseDetails.scannedDocuments ||
                       [];
    
    if (Array.isArray(scannedDocs) && scannedDocs.length > 0) {
      scannedDocs.forEach((doc: any, index: number) => {
        documents.push({
          name: `Scanned Document ${index + 1}`,
          type: 'Scanned',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Affidavits
    const affidavits = caseDetails.documents?.affidavits ||
                      caseDetails.affidavits ||
                      [];
    
    if (Array.isArray(affidavits) && affidavits.length > 0) {
      affidavits.forEach((doc: any, index: number) => {
        documents.push({
          name: `Affidavit ${index + 1}`,
          type: 'Affidavit',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Electronic evidence
    const electronicEvidence = caseDetails.documents?.electronicEvidence ||
                              caseDetails.electronicEvidence ||
                              [];
    
    if (Array.isArray(electronicEvidence) && electronicEvidence.length > 0) {
      electronicEvidence.forEach((doc: any, index: number) => {
        documents.push({
          name: `Electronic Evidence ${index + 1}`,
          type: 'Electronic Evidence',
          file: doc,
          date: caseDetails.createdAt
        });
      });
    }
    
    // Company documents - try both nested and flat structures
    if (caseDetails.claimant?.coi || caseDetails.coi) {
      documents.push({
        name: 'Certificate of Incorporation',
        type: 'Company Document',
        file: caseDetails.claimant?.coi || caseDetails.coi,
        date: caseDetails.createdAt
      });
    }
    
    if (caseDetails.claimant?.panCard || caseDetails.panCard) {
      documents.push({
        name: 'PAN Card',
        type: 'Company Document',
        file: caseDetails.claimant?.panCard || caseDetails.panCard,
        date: caseDetails.createdAt
      });
    }
    
    if (caseDetails.claimant?.gstCert || caseDetails.gstCert) {
      documents.push({
        name: 'GST Certificate',
        type: 'Company Document',
        file: caseDetails.claimant?.gstCert || caseDetails.gstCert,
        date: caseDetails.createdAt
      });
    }
    
    // Additional files that might be stored at the top level
    ['coi', 'panCard', 'gstCert', 'agreementFile'].forEach(fieldName => {
      if (caseDetails[fieldName] && !documents.some(doc => 
        doc.file === caseDetails[fieldName]
      )) {
        documents.push({
          name: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1'),
          type: 'Document',
          file: caseDetails[fieldName],
          date: caseDetails.createdAt
        });
      }
    });
    
    console.log('Extracted documents:', documents.length, documents.map(doc => ({
      name: doc.name,
      type: doc.type,
      hasFile: !!doc.file
    })));
    
    return documents;
  }

  const InfoRow = ({ label, value, className = "" }: { label: string, value: any, className?: string }) => {
    // Convert value to safe display string if it's an object
    const displayValue = () => {
      if (value === null || value === undefined) {
        return 'Not specified';
      }
      
      if (React.isValidElement(value)) {
        return value; // Already a valid React element
      }
      
      if (typeof value === 'object') {
        // Don't render objects directly - convert to JSON string or handle appropriately
        console.warn('InfoRow received object value:', value);
        return JSON.stringify(value);
      }
      
      return value;
    };

    return (
      <div className={`grid grid-cols-3 gap-4 py-3 border-b border-gray-100 ${className}`}>
        <div className="font-medium text-gray-700">{label}</div>
        <div className="col-span-2 text-gray-900">{displayValue()}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayoutClient showHeader={false} showFooter={false}>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
            <p>Loading case details...</p>
          </div>
        </div>
      </DashboardLayoutClient>
    );
  }

  if (!caseDetails) {
    return (
      <DashboardLayoutClient showHeader={false} showFooter={false}>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Case Not Found</h1>
            <p className="text-gray-600 mb-6">The requested case could not be found.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayoutClient>
    );
  }

  // Main component content wrapped in DashboardLayoutClient
  return (
    <DashboardLayoutClient showHeader={false} showFooter={false}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Case #{caseDetails?.caseNumber || 'Loading...'}</h1>
            <p className="text-muted-foreground mt-1">
              {caseDetails ? `Filed on ${new Date(caseDetails.createdAt).toLocaleDateString()}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {caseDetails && (
              <Button 
                variant="default" 
                onClick={() => router.push(`/dashboard/petition/edit/${caseDetails.id}`)}
              >
                Edit Case
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
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
                      ${caseDetails?.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      caseDetails?.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 
                      caseDetails?.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                      caseDetails?.status?.toLowerCase() === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'}`}>
                      {caseDetails?.status ? caseDetails.status.toLowerCase() : 'pending'}
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
                  <p className="text-lg font-medium mt-1">₹{caseDetails?.disputeDetails?.disputeAmount || caseDetails?.payment?.disputeAmount || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Arbitrator</h3>
                  <p className="text-lg font-medium mt-1">{caseDetails?.arbitratorName || 'Not assigned yet'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {caseDetails?.arbitratorId ? 'Assigned' : 'Pending assignment'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Tab Navigation matching the 11-step form */}
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-6 mb-6 h-auto">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="claimant" className="text-xs">Claimant</TabsTrigger>
            <TabsTrigger value="respondents" className="text-xs">Respondents</TabsTrigger>
            <TabsTrigger value="dispute" className="text-xs">Dispute</TabsTrigger>
            <TabsTrigger value="agreement" className="text-xs">Agreement</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Case Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <InfoRow label="Case Number" value={caseDetails?.caseNumber} />
                  <InfoRow label="Case Type" value={caseDetails?.type} />
                  <InfoRow label="Filing Date" value={caseDetails?.createdAt ? new Date(caseDetails.createdAt).toLocaleDateString() : ''} />
                  <InfoRow label="Last Updated" value={caseDetails?.updatedAt ? new Date(caseDetails.updatedAt).toLocaleDateString() : ''} />
                  <InfoRow label="Status" value={
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${caseDetails?.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      caseDetails?.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 
                      caseDetails?.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                      caseDetails?.status?.toLowerCase() === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'}`}>
                      {caseDetails?.status ? caseDetails.status.toLowerCase() : 'pending'}
                    </span>
                  } />
                  
                  {/* Prayers & Reliefs */}
                  {caseDetails?.prayers && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 mb-2">Prayers & Reliefs</h4>
                      {/* Handle old format where prayers is a string */}
                      {typeof caseDetails.prayers.prayers === 'string' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{caseDetails.prayers.prayers}</p>
                        </div>
                      )}
                      
                      {/* Handle new format where prayers is an array of objects */}
                      {Array.isArray(caseDetails.prayers.prayers) && (
                        <div className="space-y-3">
                          {caseDetails.prayers.prayers.map((prayer: any, index: number) => (
                            <div key={prayer.id || index} className="p-3 bg-gray-50 rounded border">
                              <h5 className="font-medium text-sm mb-2">Prayer {index + 1}</h5>
                              {prayer.title && <p><strong>Title:</strong> {prayer.title}</p>}
                              {prayer.reliefType && <p><strong>Relief Type:</strong> {prayer.reliefType}</p>}
                              {prayer.amount && <p><strong>Amount:</strong> ₹{prayer.amount}</p>}
                              {prayer.description && <p><strong>Description:</strong> {prayer.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* If prayers is neither string nor array, show nothing or fallback */}
                      {!caseDetails.prayers.prayers && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-500">No prayers specified</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual Reliefs if they exist as array - keep this for backward compatibility */}
                  {caseDetails?.prayers?.reliefs && Array.isArray(caseDetails.prayers.reliefs) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 mb-2">Relief Details</h4>
                      <div className="space-y-3">
                        {caseDetails.prayers.reliefs.map((relief: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border">
                            <h5 className="font-medium text-sm mb-2">Relief {index + 1}</h5>
                            {relief.title && <p><strong>Title:</strong> {relief.title}</p>}
                            {relief.reliefType && <p><strong>Type:</strong> {relief.reliefType}</p>}
                            {relief.amount && <p><strong>Amount:</strong> ₹{relief.amount}</p>}
                            {relief.description && <p><strong>Description:</strong> {relief.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relief objects from other locations - keep this for backward compatibility */}
                  {caseDetails?.reliefs && Array.isArray(caseDetails.reliefs) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 mb-2">Reliefs Sought</h4>
                      <div className="space-y-3">
                        {caseDetails.reliefs.map((relief: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border">
                            <h5 className="font-medium text-sm mb-2">Relief {index + 1}</h5>
                            {relief.title && <p><strong>Title:</strong> {relief.title}</p>}
                            {relief.reliefType && <p><strong>Type:</strong> {relief.reliefType}</p>}
                            {relief.amount && <p><strong>Amount:</strong> ₹{relief.amount}</p>}
                            {relief.description && <p><strong>Description:</strong> {relief.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Arguments */}
                  {caseDetails?.arguments && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 mb-2">Arguments</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        {caseDetails.arguments.argumentsPerPrayer && Array.isArray(caseDetails.arguments.argumentsPerPrayer) ? (
                          caseDetails.arguments.argumentsPerPrayer.map((arg: any, index: number) => (
                            <div key={index} className="mb-3 p-3 bg-white rounded border-l-4 border-indigo-500">
                              <h5 className="font-medium text-sm text-indigo-700 mb-1">Argument {index + 1}</h5>
                              
                              {/* Handle both string and object formats */}
                              {typeof arg === 'string' ? (
                                <p className="whitespace-pre-wrap">{arg}</p>
                              ) : (
                                <div className="space-y-2">
                                  {arg.prayerTitle && (
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">Prayer:</span>
                                      <p className="text-sm">{arg.prayerTitle}</p>
                                    </div>
                                  )}
                                  {arg.argument && (
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">Argument:</span>
                                      <p className="whitespace-pre-wrap">{arg.argument}</p>
                                    </div>
                                  )}
                                  {arg.legalBasis && (
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">Legal Basis:</span>
                                      <p className="whitespace-pre-wrap">{arg.legalBasis}</p>
                                    </div>
                                  )}
                                  {arg.factualBasis && (
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">Factual Basis:</span>
                                      <p className="whitespace-pre-wrap">{arg.factualBasis}</p>
                                    </div>
                                  )}
                                  {arg.precedents && (
                                    <div>
                                      <span className="font-medium text-sm text-gray-600">Precedents:</span>
                                      <p className="whitespace-pre-wrap">{arg.precedents}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p>No arguments provided</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Claimant Tab */}
          <TabsContent value="claimant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Claimant Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <InfoRow label="Type" value={caseDetails?.claimant?.type || caseDetails?.type} />
                  <InfoRow label="Name" value={caseDetails?.claimant?.name || caseDetails?.name} />
                  <InfoRow label="Email" value={
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      {caseDetails?.claimant?.email || caseDetails?.email}
                    </div>
                  } />
                  <InfoRow label="Phone" value={
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      {(caseDetails?.claimant?.phoneCountryCode || '+91')} {caseDetails?.claimant?.phone || caseDetails?.phone}
                    </div>
                  } />
                  <InfoRow label="Address" value={
                    <div>
                      <p>{caseDetails?.claimant?.address1 || caseDetails?.address1}</p>
                      {(caseDetails?.claimant?.address2 || caseDetails?.address2) && (
                        <p>{caseDetails?.claimant?.address2 || caseDetails?.address2}</p>
                      )}
                      <p>
                        {caseDetails?.claimant?.city || caseDetails?.city}, {caseDetails?.claimant?.state || caseDetails?.state} - {caseDetails?.claimant?.pincode || caseDetails?.pincode}
                      </p>
                      <p>{caseDetails?.claimant?.country || caseDetails?.country}</p>
                    </div>
                  } />
                  
                  {/* Business Details */}
                  {(caseDetails?.claimant?.gst || caseDetails?.gst) && (
                    <InfoRow label="GST Number" value={caseDetails?.claimant?.gst || caseDetails?.gst} />
                  )}
                  {(caseDetails?.claimant?.pan || caseDetails?.pan) && (
                    <InfoRow label="PAN Number" value={caseDetails?.claimant?.pan || caseDetails?.pan} />
                  )}
                  {(caseDetails?.claimant?.cin || caseDetails?.cin) && (
                    <InfoRow label="CIN Number" value={caseDetails?.claimant?.cin || caseDetails?.cin} />
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Claimants */}
            {caseDetails?.additionalClaimants && caseDetails.additionalClaimants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Additional Claimants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseDetails.additionalClaimants.map((claimant: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Additional Claimant {index + 1}</h4>
                        <div className="space-y-3">
                          <InfoRow label="Name" value={claimant.name} />
                          <InfoRow label="Email" value={
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-500 mr-2" />
                              {claimant.email}
                            </div>
                          } />
                          {claimant.phone && (
                            <InfoRow label="Phone" value={
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                                {claimant.phoneCountryCode} {claimant.phone}
                              </div>
                            } />
                          )}
                          {claimant.address1 && (
                            <InfoRow label="Address" value={
                              <div>
                                <p>{claimant.address1}</p>
                                {claimant.address2 && <p>{claimant.address2}</p>}
                                <p>{claimant.city}, {claimant.state} - {claimant.pincode}</p>
                                <p>{claimant.country}</p>
                              </div>
                            } />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Manager Details */}
            {caseDetails?.managerDetails && Array.isArray(caseDetails.managerDetails) && caseDetails.managerDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Manager Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseDetails.managerDetails.map((manager: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Manager {index + 1}</h4>
                        <div className="space-y-3">
                          <InfoRow label="Name" value={manager.name} />
                          <InfoRow label="Email" value={manager.email} />
                          <InfoRow label="Phone" value={`${manager.phoneCountryCode} ${manager.phone}`} />
                          <InfoRow label="Designation" value={manager.designation} />
                          <InfoRow label="Authority" value={manager.authority} />
                          {manager.address && <InfoRow label="Address" value={manager.address} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Respondents Tab */}
          <TabsContent value="respondents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Respondent Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <InfoRow label="Name" value={caseDetails?.respondent?.name || caseDetails?.respondentDetails?.name} />
                  <InfoRow label="Email" value={
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      {caseDetails?.respondent?.email || caseDetails?.respondentDetails?.email}
                    </div>
                  } />
                  {(caseDetails?.respondent?.phone || caseDetails?.respondentDetails?.phone) && (
                    <InfoRow label="Phone" value={
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        {(caseDetails?.respondent?.phoneCountryCode || caseDetails?.respondentDetails?.phoneCountryCode || '+91')} {caseDetails?.respondent?.phone || caseDetails?.respondentDetails?.phone}
                      </div>
                    } />
                  )}
                  {(caseDetails?.respondent?.address1 || caseDetails?.respondentDetails?.address1) && (
                    <InfoRow label="Address" value={
                      <div>
                        <p>{caseDetails?.respondent?.address1 || caseDetails?.respondentDetails?.address1}</p>
                        {(caseDetails?.respondent?.address2 || caseDetails?.respondentDetails?.address2) && (
                          <p>{caseDetails?.respondent?.address2 || caseDetails?.respondentDetails?.address2}</p>
                        )}
                        <p>
                          {caseDetails?.respondent?.city || caseDetails?.respondentDetails?.city}, {caseDetails?.respondent?.state || caseDetails?.respondentDetails?.state} - {caseDetails?.respondent?.pincode || caseDetails?.respondentDetails?.pincode}
                        </p>
                        <p>{caseDetails?.respondent?.country || caseDetails?.respondentDetails?.country}</p>
                      </div>
                    } />
                  )}
                  
                  {/* Business Details */}
                  {(caseDetails?.respondent?.gst || caseDetails?.respondentDetails?.gst) && (
                    <InfoRow label="GST Number" value={caseDetails?.respondent?.gst || caseDetails?.respondentDetails?.gst} />
                  )}
                  {(caseDetails?.respondent?.pan || caseDetails?.respondentDetails?.pan) && (
                    <InfoRow label="PAN Number" value={caseDetails?.respondent?.pan || caseDetails?.respondentDetails?.pan} />
                  )}
                  {(caseDetails?.respondent?.cin || caseDetails?.respondentDetails?.cin) && (
                    <InfoRow label="CIN Number" value={caseDetails?.respondent?.cin || caseDetails?.respondentDetails?.cin} />
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Respondents */}
            {caseDetails?.additionalRespondents && caseDetails.additionalRespondents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Additional Respondents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseDetails.additionalRespondents.map((respondent: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Additional Respondent {index + 1}</h4>
                        <div className="space-y-3">
                          <InfoRow label="Name" value={respondent.name} />
                          <InfoRow label="Email" value={
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-500 mr-2" />
                              {respondent.email}
                            </div>
                          } />
                          {respondent.phone && (
                            <InfoRow label="Phone" value={
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                                {respondent.phoneCountryCode} {respondent.phone}
                              </div>
                            } />
                          )}
                          {respondent.address1 && (
                            <InfoRow label="Address" value={
                              <div>
                                <p>{respondent.address1}</p>
                                {respondent.address2 && <p>{respondent.address2}</p>}
                                <p>{respondent.city}, {respondent.state} - {respondent.pincode}</p>
                                <p>{respondent.country}</p>
                              </div>
                            } />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Dispute Tab */}
          <TabsContent value="dispute" className="space-y-6">
            {/* Nature of Dispute */}
            {caseDetails?.natureOfDispute && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Nature of Dispute
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <InfoRow label="Cause of Action" value={caseDetails.natureOfDispute.causeOfAction} />
                    <InfoRow label="Relief Type" value={caseDetails.natureOfDispute.reliefType} />
                    <InfoRow label="Date When Right to Claim Arose" value={caseDetails.natureOfDispute.dateWhenRightToClaimArose} />
                    {caseDetails.natureOfDispute.standardisedPrayerClauses && (
                      <InfoRow label="Standardised Prayer Clauses" value={caseDetails.natureOfDispute.standardisedPrayerClauses} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Dispute Descriptions */}
            {caseDetails?.disputeDescriptions && Array.isArray(caseDetails.disputeDescriptions) && caseDetails.disputeDescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dispute Descriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseDetails.disputeDescriptions.map((dispute: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Dispute Description {index + 1}</h4>
                        <div className="space-y-3">
                          <InfoRow label="Claim Type" value={dispute.claimType} />
                          <InfoRow label="Claim Reason" value={dispute.claimReason} />
                          <InfoRow label="Law Relied Upon" value={dispute.lawReliedUpon} />
                          <InfoRow label="Relevant Clause Number" value={dispute.relevantClauseNumber} />
                          <InfoRow label="Clause Supporting Claim" value={dispute.clauseSupportingClaim} />
                          <InfoRow label="Clause" value={dispute.clause} />
                          <InfoRow label="Document Supporting Claim" value={dispute.documentSupportingClaim} />
                          <InfoRow label="Relief Sought" value={dispute.reliefSought} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Dispute Details (older structure) */}
            {caseDetails?.disputeDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dispute Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <InfoRow label="Dispute Type" value={caseDetails.disputeDetails.disputeType} />
                    <InfoRow label="Dispute Category" value={caseDetails.disputeDetails.disputeCategory || caseDetails.type} />
                    <InfoRow label="Sub-Category" value={caseDetails.disputeDetails.subCategory} />
                    <InfoRow label="Dispute Date" value={caseDetails.disputeDetails.disputeDate} />
                    <InfoRow label="Dispute Amount" value={`₹${caseDetails.disputeDetails.disputeAmount || 'Not specified'}`} />
                    {caseDetails.disputeDetails.disputeDescription && (
                      <div className="pt-2">
                        <h4 className="font-semibold text-gray-700 mb-2">Dispute Description</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{caseDetails.disputeDetails.disputeDescription}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Payment Information */}
            {caseDetails?.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <InfoRow label="Dispute Amount" value={`₹${caseDetails.payment.disputeAmount || 'Not specified'}`} />
                    <InfoRow label="Filing Fee" value={`₹${caseDetails.payment.filingFee || 'Not specified'}`} />
                    <InfoRow label="Arbitrator Fee" value={`₹${caseDetails.payment.arbitratorFee || 'Not specified'}`} />
                    <InfoRow label="Administrative Fee" value={`₹${caseDetails.payment.administrativeFee || 'Not specified'}`} />
                    <InfoRow label="Total Fee" value={`₹${caseDetails.payment.totalFee || 'Not specified'}`} />
                    {caseDetails.payment.paymentMethod && (
                      <InfoRow label="Payment Method" value={caseDetails.payment.paymentMethod} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Agreement Tab */}
          <TabsContent value="agreement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Arbitration Agreement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseDetails?.arbitrationAgreement ? (
                  <div className="space-y-4">
                    <InfoRow label="Agreement Type" value={caseDetails.arbitrationAgreement.agreementType} />
                    <InfoRow label="Agreement Date" value={caseDetails.arbitrationAgreement.agreementDate} />
                    <InfoRow label="Place of Signing" value={caseDetails.arbitrationAgreement.placeOfSigning} />
                    <InfoRow label="Number of Arbitrators" value={caseDetails.arbitrationAgreement.numberOfArbitrators} />
                    {caseDetails.arbitrationAgreement.arbitrationText && (
                      <InfoRow label="Arbitration Text" value={caseDetails.arbitrationAgreement.arbitrationText} />
                    )}
                    {caseDetails.arbitrationAgreement.stampDutyPercentage && (
                      <InfoRow label="Stamp Duty Percentage" value={`${caseDetails.arbitrationAgreement.stampDutyPercentage}%`} />
                    )}
                    {caseDetails.arbitrationAgreement.stampDutyAmount && (
                      <InfoRow label="Stamp Duty Amount" value={`₹${caseDetails.arbitrationAgreement.stampDutyAmount}`} />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No arbitration agreement details available</p>
                  </div>
                )}
              </CardContent>
              {caseDetails?.arbitrationAgreement?.agreementFile && (
                <div className="bg-gray-50 border-t p-4">
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
                </div>
              )}
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
                {getAllDocuments().length > 0 ? (
                  <div className="divide-y">
                    {getAllDocuments().map((doc, index) => (
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
                ) :
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>No documents have been uploaded for this case</p>
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutClient>
  )
} 