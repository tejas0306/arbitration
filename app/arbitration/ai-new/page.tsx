import { Metadata } from 'next';
import { Suspense } from 'react';
import AIEnhancedArbitrationPage from './ai-enhanced-arbitration-page';

export const metadata: Metadata = {
  title: 'AI-Enhanced Arbitration Request | Smart Contract Analysis',
  description: 'Submit a new arbitration request with AI-powered contract analysis and automatic form pre-filling',
};

export default function NewAIArbitrationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI-Enhanced Form...</p>
        </div>
      </div>
    }>
      <AIEnhancedArbitrationPage />
    </Suspense>
  );
}
