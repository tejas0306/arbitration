"use client";

import ArbitrationForm from "@/components/arbitration-form";
import ProtectedRoute from "@/components/protected-route";

export default function SubmitPetitionPage() {
  return (
    <ProtectedRoute>
      <div className="container">
        <h1 className="text-2xl font-bold my-8">Submit Arbitration Petition</h1>
        <ArbitrationForm />
      </div>
    </ProtectedRoute>
  );
} 