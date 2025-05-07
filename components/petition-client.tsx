"use client"

import { useState } from "react"
import ArbitrationFormWrapper from "@/components/arbitration-form-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PetitionClient() {
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">File an Arbitration Petition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Use this form to file a new arbitration petition. You'll need to provide details about all parties 
            involved, the arbitration agreement, dispute details, and any supporting documents.
          </p>
          <p className="text-gray-700 mb-4">
            The form is divided into steps for easier navigation. You can save your progress
            as a draft at any time and come back to complete it later.
          </p>
        </CardContent>
      </Card>
      
      <ArbitrationFormWrapper />
    </div>
  )
} 