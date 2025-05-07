"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { arbitrationApi } from "@/lib/api"
import { toast } from "sonner"

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseDetails, setCaseDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setIsLoading(true)
        const data = await arbitrationApi.getById(params.id)
        setCaseDetails(data)
      } catch (error) {
        console.error("Error fetching case details:", error)
        toast.error("Failed to load case details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaseDetails()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center p-8">
          <p>Loading case details...</p>
        </div>
      </div>
    )
  }

  if (!caseDetails) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Case not found or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/my-cases')}>
              Back to My Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Case #{caseDetails.caseNumber}</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/my-cases')}>
          Back to My Cases
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium capitalize">
              {caseDetails.status.toLowerCase()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date(caseDetails.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Filing Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {new Date(caseDetails.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Dispute Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium capitalize">
              {caseDetails.disputeDetails?.disputeType || 'Not specified'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispute Amount: ₹{caseDetails.disputeDetails?.disputeAmount || 'Not specified'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Claimant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Name:</strong> {caseDetails.name}</div>
              <div><strong>Type:</strong> {caseDetails.type}</div>
              <div><strong>Email:</strong> {caseDetails.email}</div>
              <div><strong>Phone:</strong> {caseDetails.phoneCountryCode} {caseDetails.phone}</div>
              <div><strong>Address:</strong> {caseDetails.address1}, {caseDetails.city}, {caseDetails.state}, {caseDetails.pincode}</div>
              {caseDetails.additionalClaimants && caseDetails.additionalClaimants.length > 0 && (
                <div>
                  <strong>Additional Claimants:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {caseDetails.additionalClaimants.map((claimant: any, index: number) => (
                      <li key={index}>{claimant.name} ({claimant.email})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Respondent Details</CardTitle>
          </CardHeader>
          <CardContent>
            {caseDetails.respondents && caseDetails.respondents.length > 0 ? (
              <div className="space-y-4">
                {caseDetails.respondents.map((respondent: any, index: number) => (
                  <div key={index} className="pb-2 border-b last:border-b-0">
                    <div><strong>Name:</strong> {respondent.name}</div>
                    <div><strong>Type:</strong> {respondent.type}</div>
                    <div><strong>Email:</strong> {respondent.email}</div>
                    {respondent.phone && (
                      <div><strong>Phone:</strong> {respondent.phoneCountryCode} {respondent.phone}</div>
                    )}
                    {respondent.address && (
                      <div><strong>Address:</strong> {respondent.address}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No respondent details available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dispute Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Dispute Type:</strong> {caseDetails.disputeDetails?.disputeType || 'Not specified'}
            </div>
            <div>
              <strong>Dispute Amount:</strong> ₹{caseDetails.disputeDetails?.disputeAmount || 'Not specified'}
            </div>
            <div>
              <strong>Dispute Date:</strong> {caseDetails.disputeDetails?.disputeDate || 'Not specified'}
            </div>
            <div className="md:col-span-2">
              <strong>Description:</strong>
              <p className="mt-1">{caseDetails.disputeDetails?.disputeDescription || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arbitration Agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Agreement Type:</strong> {caseDetails.arbitrationAgreement?.agreementType || 'Not specified'}
            </div>
            <div>
              <strong>Agreement Date:</strong> {caseDetails.arbitrationAgreement?.agreementDate || 'Not specified'}
            </div>
            <div className="md:col-span-2">
              <strong>Agreement File:</strong> {caseDetails.arbitrationAgreement?.agreementFile ? 
                <Button variant="link" className="p-0 h-auto">View Document</Button> : 
                'No file uploaded'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 