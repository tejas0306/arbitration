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
      // DEBUG: Log the complete data structure received from the form
      console.log('🔧 [ArbitrationFormPage] Received form data:', data);
      console.log('🔧 [ArbitrationFormPage] Claimant:', data.claimant);
      console.log('🔧 [ArbitrationFormPage] Additional Claimants:', data.additionalClaimants);
      console.log('🔧 [ArbitrationFormPage] Manager Details:', data.managerDetails);
      console.log('🔧 [ArbitrationFormPage] Respondents:', data.respondents);
      console.log('🔧 [ArbitrationFormPage] Nature of Dispute:', data.natureOfDispute);
      console.log('🔧 [ArbitrationFormPage] Dispute Descriptions:', data.disputeDescriptions);
      console.log('🔧 [ArbitrationFormPage] Documents Evidence:', data.documentsEvidence);
      console.log('🔧 [ArbitrationFormPage] Prayers:', data.prayers);
      console.log('🔧 [ArbitrationFormPage] Arguments:', data.arguments);
      console.log('🔧 [ArbitrationFormPage] Payment:', data.payment);
      console.log('🔧 [ArbitrationFormPage] Documents:', data.documents);
      
      // VALIDATION: Check if critical sections have data
      if (!data.claimant || !data.claimant.name) {
        console.warn('⚠️ [ArbitrationFormPage] Claimant details are missing!');
      }
      if (!data.additionalClaimants || (Array.isArray(data.additionalClaimants) && data.additionalClaimants.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Additional Claimants are missing or empty!');
      }
      if (!data.managerDetails || (Array.isArray(data.managerDetails) && data.managerDetails.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Manager Details are missing or empty!');
      }
      if (!data.respondents || (Array.isArray(data.respondents) && data.respondents.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Respondents are missing or empty!');
      }
      if (!data.natureOfDispute || (Array.isArray(data.natureOfDispute) && data.natureOfDispute.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Nature of Dispute is missing or empty!');
      }
      if (!data.disputeDescriptions || (Array.isArray(data.disputeDescriptions) && data.disputeDescriptions.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Dispute Descriptions are missing or empty!');
      }
      if (!data.documentsEvidence || (Array.isArray(data.documentsEvidence) && data.documentsEvidence.length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Documents Evidence is missing or empty!');
      }
      if (!data.prayers || (data.prayers && Object.keys(data.prayers).length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Prayers is missing or empty!');
      }
      if (!data.arguments || (data.arguments && Object.keys(data.arguments).length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Arguments is missing or empty!');
      }
      if (!data.payment || (data.payment && Object.keys(data.payment).length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Payment is missing or empty!');
      }
      if (!data.documents || (data.documents && Object.keys(data.documents).length === 0)) {
        console.warn('⚠️ [ArbitrationFormPage] Documents are missing or empty!');
      }
      
      // Create FormData for API submission (matching the main form's logic)
      const formDataForSubmission = new FormData();
      
      // COMPLETE DATA MAPPING - EXACTLY like the main arbitration form submits
      const restructuredData = {
        // Add claimant fields at the top level (required by backend) - EXACTLY like main form
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
        
        // Include ALL form data EXACTLY as the main form submits it
        additionalClaimants: data.additionalClaimants || [],
        managerDetails: data.managerDetails || [],
        respondents: data.respondents || [],
        arbitrationAgreement: data.arbitrationAgreement || {},
        natureOfDispute: data.natureOfDispute || [],
        disputeDescriptions: data.disputeDescriptions || [],
        documentsEvidence: data.documentsEvidence || [],
        prayers: data.prayers || {},
        arguments: data.arguments || {},
        payment: data.payment || {},
        documents: data.documents || {},
        
        // CRITICAL: Add the complete nested structure that backend expects
        claimant: data.claimant || {},
        disputeDetails: {
          natureOfDispute: data.natureOfDispute || [],
          disputeDescriptions: data.disputeDescriptions || [],
          documentsEvidence: data.documentsEvidence || []
        },
        
        // Store the complete form data structure as backup
        formData: data
      };

      // Remove file objects from the JSON data (they're sent separately as FormData)
      const cleanedData = JSON.parse(JSON.stringify(restructuredData, (key, value) => {
        if (value && typeof value === 'object' && value.constructor === File) {
          return undefined; // Remove File objects
        }
        return value;
      }));

      // CRITICAL: Ensure all critical fields have proper structure
      if (!cleanedData.natureOfDispute || (Array.isArray(cleanedData.natureOfDispute) && cleanedData.natureOfDispute.length === 0)) {
        console.error('❌ [ArbitrationFormPage] Nature of Dispute is empty - this will cause database issues!');
        // Provide default structure to prevent empty objects
        cleanedData.natureOfDispute = [{
          category: 'Commercial',
          subCategory: 'Contract Dispute',
          natureOfDispute: 'Default dispute description',
          dateWhenRightToClaimArose: new Date().toISOString().split('T')[0],
          standardisedPrayerClauses: 'Default prayer clauses'
        }];
      }
      
      if (!cleanedData.prayers || Object.keys(cleanedData.prayers).length === 0) {
        console.error('❌ [ArbitrationFormPage] Prayers is empty - this will cause database issues!');
        cleanedData.prayers = { prayers: ['Default prayer for relief'] };
      }
      
      if (!cleanedData.arguments || Object.keys(cleanedData.arguments).length === 0) {
        console.error('❌ [ArbitrationFormPage] Arguments is empty - this will cause database issues!');
        cleanedData.arguments = { argumentsPerIssue: ['Default legal argument'] };
      }
      
      if (!cleanedData.payment || Object.keys(cleanedData.payment).length === 0) {
        console.error('❌ [ArbitrationFormPage] Payment is empty - this will cause database issues!');
        cleanedData.payment = { 
          paymentHead: 'Default payment head',
          paymentAmount: '0',
          paymentDetails: 'Default payment details'
        };
      }

      // DEBUG: Log the final data being sent to the backend
      console.log('🔧 [ArbitrationFormPage] Final data being sent to backend:', cleanedData);
      console.log('🔧 [ArbitrationFormPage] Claimant (final):', cleanedData.type, cleanedData.name, cleanedData.email);
      console.log('🔧 [ArbitrationFormPage] Additional Claimants (final):', cleanedData.additionalClaimants);
      console.log('🔧 [ArbitrationFormPage] Manager Details (final):', cleanedData.managerDetails);
      console.log('🔧 [ArbitrationFormPage] Respondents (final):', cleanedData.respondents);
      console.log('🔧 [ArbitrationFormPage] Nature of Dispute (final):', cleanedData.natureOfDispute);
      console.log('🔧 [ArbitrationFormPage] Dispute Descriptions (final):', cleanedData.disputeDescriptions);
      console.log('🔧 [ArbitrationFormPage] Documents Evidence (final):', cleanedData.documentsEvidence);
      console.log('🔧 [ArbitrationFormPage] Prayers (final):', cleanedData.prayers);
      console.log('🔧 [ArbitrationFormPage] Arguments (final):', cleanedData.arguments);
      console.log('🔧 [ArbitrationFormPage] Payment (final):', cleanedData.payment);
      console.log('🔧 [ArbitrationFormPage] Documents (final):', cleanedData.documents);
      
      // FINAL VALIDATION: Ensure data structure is correct before sending
      console.log('🔧 [ArbitrationFormPage] FINAL VALIDATION:');
      console.log('🔧 Nature of Dispute structure:', Array.isArray(cleanedData.natureOfDispute) ? `Array with ${cleanedData.natureOfDispute.length} items` : 'NOT AN ARRAY!');
      console.log('🔧 Prayers structure:', typeof cleanedData.prayers === 'object' && cleanedData.prayers !== null ? `Object with keys: ${Object.keys(cleanedData.prayers).join(', ')}` : 'NOT AN OBJECT!');
      console.log('🔧 Arguments structure:', typeof cleanedData.arguments === 'object' && cleanedData.arguments !== null ? `Object with keys: ${Object.keys(cleanedData.arguments).join(', ')}` : 'NOT AN OBJECT!');
      console.log('🔧 Payment structure:', typeof cleanedData.payment === 'object' && cleanedData.payment !== null ? `Object with keys: ${Object.keys(cleanedData.payment).join(', ')}` : 'NOT AN OBJECT!');
      
      formDataForSubmission.append('data', JSON.stringify(cleanedData));
      
      if (draftId) {
        // Update existing draft
        formDataForSubmission.append('id', draftId);
        await arbitrationApi.saveDraft(formDataForSubmission);
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

  // Restrict access to CLAIMANT and ADMIN roles only
  if (session?.user?.role && !['CLAIMANT', 'ADMIN'].includes(session.user.role)) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              The Arbitration Request Form is only available to Claimants and Administrators.
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
        <main className="flex-grow pt-6 pb-6">
              <ArbitrationForm 
                onSubmit={handleSubmit}
                mode={draftId ? 'edit' : petitionId ? 'edit' : 'create'}
                petitionId={petitionId || undefined}
                draftId={draftId || undefined}
              />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
} 