"use client"

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ArbitrationForm from '@/components/arbitration-form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import { arbitrationApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function ArbitrationFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get('draftId');
  const petitionId = searchParams?.get('petitionId');
  const [title, setTitle] = useState('Arbitration Petition Form');
  
  useEffect(() => {
    if (draftId) {
      setTitle('Edit Draft Petition');
    } else if (petitionId) {
      setTitle('Edit Submitted Petition');
    } else {
      setTitle('Arbitration Petition Form');
    }
  }, [draftId, petitionId]);

  // Handle form submission - Create FormData properly
  const handleSubmit = async (data: any) => {
    try {
      // Create FormData for API submission (matching the main form's logic)
      const formDataForSubmission = new FormData();
      
      // Restructure data to match backend expectations
      const restructuredData = {
        // Add claimant fields at the top level
        type: data.claimant?.type,
        name: data.claimant?.name,
        pincode: data.claimant?.pincode,
        address1: data.claimant?.address1,
        address2: data.claimant?.address2,
        city: data.claimant?.city,
        district: data.claimant?.district,
        state: data.claimant?.state,
        country: data.claimant?.country,
        email: data.claimant?.email,
        phoneCountryCode: data.claimant?.phoneCountryCode,
        phone: data.claimant?.phone,
        gst: data.claimant?.gst,
        pan: data.claimant?.pan,
        cin: data.claimant?.cin,
        
        // Include all other form data
        additionalClaimants: data.additionalClaimants || [],
        managerDetails: data.managerDetails || [],
        respondents: data.respondents || [],
        arbitrationAgreement: data.arbitrationAgreement || {},
        natureOfDispute: data.natureOfDispute || {},
        disputeDescriptions: data.disputeDescriptions || [],
        documentsEvidence: data.documentsEvidence || [],
        prayers: data.prayers || {},
        arguments: data.arguments || {},
        payment: data.payment || {},
        documents: data.documents || {},
        
        // Store the complete form data structure
        formData: data
      };

      // Remove file objects from the JSON data (they're sent separately as FormData)
      const cleanedData = JSON.parse(JSON.stringify(restructuredData, (key, value) => {
        if (value && typeof value === 'object' && value.constructor === File) {
          return undefined; // Remove File objects
        }
        return value;
      }));

      formDataForSubmission.append('data', JSON.stringify(cleanedData));
      
      if (draftId) {
        // Update existing draft
        formDataForSubmission.append('id', draftId);
        await arbitrationApi.updateDraft(draftId, formDataForSubmission);
        toast({
          title: "Success",
          description: "Draft updated successfully!",
        });
      } else if (petitionId) {
        // Update existing petition
        formDataForSubmission.append('id', petitionId);
        await arbitrationApi.update(petitionId, formDataForSubmission);
        toast({
          title: "Success", 
          description: "Petition updated successfully!",
        });
        router.push('/dashboard/my-cases');
      } else {
        // Create new submission
        const result = await arbitrationApi.create(formDataForSubmission);
        toast({
          title: "Success",
          description: "Arbitration request submitted successfully!",
        });
        router.push('/dashboard/my-cases');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Restrict access to CLAIMANT role only
  if (session && session.user?.role !== 'CLAIMANT') {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              The Arbitration Request Form is only available to Claimants.
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-indigo-800">{title}</h1>
              {(draftId || petitionId) && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm">
                  {draftId ? 'Editing Draft' : 'Editing Petition'}
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-8">
              {(draftId || petitionId) 
                ? "You are editing an existing petition. Your changes will be automatically saved as you type."
                : "Please fill out the petition form below to submit your arbitration request. This form will initiate the formal arbitration proceedings. All fields marked with an asterisk (*) are required."}
            </p>
            <div className="bg-white rounded-lg shadow-md p-6 border border-indigo-100">
              <ArbitrationForm 
                onSubmit={handleSubmit}
                mode={draftId ? 'edit' : petitionId ? 'edit' : 'create'}
                petitionId={petitionId || undefined}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
} 