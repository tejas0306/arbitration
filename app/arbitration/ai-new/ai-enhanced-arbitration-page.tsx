"use client"

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AIEnhancedForm from '@/components/arbitration/ai-enhanced-form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function AIEnhancedArbitrationPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams?.get('draftId');
  const petitionId = searchParams?.get('petitionId');
  const [title, setTitle] = useState('AI-Enhanced Arbitration Form');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (draftId) {
      setTitle('Edit Draft with AI Assistance');
    } else if (petitionId) {
      setTitle('Edit Petition with AI Enhancement');
    } else {
      setTitle('AI-Enhanced Arbitration Request');
    }
  }, [draftId, petitionId]);

  // Restrict access to CLAIMANT and ADMIN roles only
  if (session && !['CLAIMANT', 'ADMIN'].includes(session.user?.role)) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              The AI-Enhanced Arbitration Request Form is only available to Claimants and Administrators.
            </p>
            <p className="text-sm text-red-600">
              Your role: <span className="font-medium">{session.user.role}</span>
            </p>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    );
  }

  const handleFormSubmit = async (formData: any) => {
    setLoading(true);
    try {
      console.log('Submitting AI-enhanced arbitration form:', formData);
      
      // Convert form data to API format
      const apiFormData = new FormData();
      
      // Basic information
      apiFormData.append('type', formData.type || '');
      apiFormData.append('name', formData.name || '');
      apiFormData.append('email', formData.email || '');
      apiFormData.append('phone', formData.phone || '');
      apiFormData.append('address1', formData.address1 || '');
      apiFormData.append('address2', formData.address2 || '');
      apiFormData.append('city', formData.city || '');
      apiFormData.append('state', formData.state || '');
      apiFormData.append('country', formData.country || 'India');
      apiFormData.append('pincode', formData.pincode || '');
      
      if (formData.gst) apiFormData.append('gst', formData.gst);
      if (formData.pan) apiFormData.append('pan', formData.pan);
      if (formData.cin) apiFormData.append('cin', formData.cin);
      
      // Arbitration agreement
      if (formData.arbitrationAgreement) {
        apiFormData.append('arbitrationAgreement', JSON.stringify(formData.arbitrationAgreement));
      }
      
      // Dispute details
      if (formData.disputeDetails) {
        apiFormData.append('disputeDetails', JSON.stringify(formData.disputeDetails));
      }
      
      // Respondents
      if (formData.respondents && formData.respondents.length > 0) {
        apiFormData.append('respondents', JSON.stringify(formData.respondents));
      }
      
      // AI extracted data for reference
      if (formData.aiExtractedData) {
        apiFormData.append('aiExtractedData', JSON.stringify(formData.aiExtractedData));
      }
      
      // Submit the form
      const response = await api.arbitration.create(apiFormData);
      
      toast.success('🎉 Arbitration request submitted successfully with AI assistance!');
      
      // Redirect to dashboard or case details
      router.push('/dashboard?tab=cases');
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to submit arbitration request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="relative">
                  <Brain className="h-12 w-12 text-purple-600" />
                  <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
              </div>
              
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                {(draftId || petitionId) 
                  ? "You are editing an existing petition with AI assistance. Upload a new contract to update information, or continue editing manually."
                  : "Upload your contract document and let our AI extract key information to automatically pre-fill your arbitration form. Save time and ensure accuracy with intelligent document analysis."}
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardContent className="p-4 text-center">
                    <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-800">AI Analysis</h3>
                    <p className="text-sm text-purple-700">Smart contract analysis with GPT-4</p>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-800">Auto Pre-filling</h3>
                    <p className="text-sm text-blue-700">Automatic form completion from documents</p>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-800">Smart Extraction</h3>
                    <p className="text-sm text-green-700">Party details and clause identification</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <AIEnhancedForm 
                onSubmit={handleFormSubmit}
                initialData={null} // TODO: Load initial data if editing
              />
            </div>

            {/* Additional Information */}
            <div className="mt-8 text-center">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    How AI Assistance Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>1. Upload Contract:</strong> Upload your contract or agreement document (PDF, JPEG, PNG)
                  </p>
                  <p>
                    <strong>2. AI Analysis:</strong> Our AI analyzes the document to extract party details, arbitration clauses, and obligations
                  </p>
                  <p>
                    <strong>3. Auto Pre-fill:</strong> Key form fields are automatically filled based on the extracted information
                  </p>
                  <p>
                    <strong>4. Review & Submit:</strong> Review the pre-filled information, make any necessary edits, and submit
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
