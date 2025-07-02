"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, arbitrationApi } from "@/lib/api"
import { toast } from "sonner"

export default function MyCasesClient() {
  const router = useRouter()
  const [cases, setCases] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch active cases and drafts separately
        const [allCases, draftsList] = await Promise.all([
          arbitrationApi.getAll(),
          arbitrationApi.getDrafts()
        ]).catch(error => {
          // Return default values if fetch fails
          return [[], []];
        });
        
        
        // Filter out drafts from regular cases
        const submittedCases = allCases.filter((c: any) => c.status !== 'DRAFT');
        
        setDrafts(draftsList || []);
        setCases(submittedCases || []);
      } catch (error) {
        toast.error("Failed to load your cases")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleViewCase = (id: string) => {
    router.push(`/dashboard/case/${id}`)
  }

  const handleContinueDraft = (id: string) => {
    router.push(`/dashboard/petition/edit/${id}`)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Cases</h1>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <p>Loading cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You don't have any active cases yet.</p>
                <Button onClick={() => router.push('/dashboard/petition')}>
                  File a New Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cases.map((arbitrationCase) => (
                <Card key={arbitrationCase.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{arbitrationCase.name}</h3>
                        <div className="flex gap-6 text-sm text-muted-foreground mt-1">
                          <div>Case #{arbitrationCase.caseNumber}</div>
                          <div>Status: <span className="capitalize">{arbitrationCase.status.toLowerCase()}</span></div>
                          <div>Filed: {new Date(arbitrationCase.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewCase(arbitrationCase.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="drafts">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <p>Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You don't have any draft cases.</p>
                <Button onClick={() => router.push('/dashboard/petition')}>
                  Start a New Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <Card key={draft.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{draft.name || 'Untitled Draft'}</h3>
                        <div className="flex gap-6 text-sm text-muted-foreground mt-1">
                          <div>Draft #{draft.caseNumber || draft.id.substring(0,8)}</div>
                          <div>Last saved: {new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleContinueDraft(draft.id)}
                      >
                        Continue Editing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 