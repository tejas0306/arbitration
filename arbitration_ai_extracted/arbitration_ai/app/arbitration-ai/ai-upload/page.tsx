import { Metadata } from 'next';
import { Suspense } from 'react';
import ArbitrationAIFormPage from '@/components/arbitration-ai-form-page';

export const metadata: Metadata = {
  title: 'New AI Assisted Arbitration Request',
  description: 'AI Generated arbitration request',
};

export default function NewArbitrationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitrationAIFormPage />
    </Suspense>
  );
}