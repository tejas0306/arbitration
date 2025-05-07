import { Metadata } from 'next';
import { Suspense } from 'react';
import ArbitrationFormPage from '@/components/arbitration-form-page';

export const metadata: Metadata = {
  title: 'New Arbitration Request',
  description: 'Submit a new arbitration request',
};

export default function NewArbitrationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ArbitrationFormPage />
    </Suspense>
  );
}