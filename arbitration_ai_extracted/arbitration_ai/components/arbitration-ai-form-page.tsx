"use client"

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ArbitrationAIForm from '@/components/arbitration-ai-form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';

export default function ArbitrationAIFormPage() {
  const { data: session } = useSession();
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
      setTitle('Arbitration AI Assistant Petition Form');
    }
  }, [draftId, petitionId]);

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
                : "Please upload contract document, System will autofetch details and fill the Arbitration form.As details are extracted through AI, validate the details before submitting the application. This form will initiate the formal arbitration proceedings. All fields marked with an asterisk (*) are required."}
            </p>
            <div className="bg-white rounded-lg shadow-md p-6 border border-indigo-100">
              <ArbitrationAIForm />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
} 