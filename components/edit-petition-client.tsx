"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ArbitrationForm from "@/components/arbitration-form"
import { arbitrationApi } from "@/lib/api"
import { toast } from "sonner"

interface EditPetitionClientProps {
  petitionId: string
}

export default function EditPetitionClient({ petitionId }: EditPetitionClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [petitionData, setPetitionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPetition = async () => {
      if (!petitionId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log(`Fetching petition data for ID: ${petitionId}`)
        const data = await arbitrationApi.getById(petitionId)
        console.log("Fetched petition data:", data)
        
        if (!data) {
          throw new Error("No petition data found")
        }
        
        setPetitionData(data)
      } catch (err: any) {
        console.error("Error fetching petition:", err)
        setError(err.message || "Failed to load petition data")
        toast.error("Could not load petition data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPetition()
  }, [petitionId])

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Petition</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Petition</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Petition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">ID:</span>
              <p className="font-medium">{petitionData.id}</p>
            </div>
            {petitionData.caseNumber && (
              <div>
                <span className="text-sm text-muted-foreground">Case Number:</span>
                <p className="font-medium">{petitionData.caseNumber}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <p className="font-medium capitalize">{petitionData.status?.toLowerCase().replace(/_/g, ' ') || 'Draft'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Last Updated:</span>
              <p className="font-medium">{new Date(petitionData.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ArbitrationForm initialData={petitionData} petitionId={petitionId} />
    </div>
  )
} 