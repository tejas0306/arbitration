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
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch user data first
        try {
          const user = await api.auth.getCurrentUser();
          setUserData(user);
          console.log('🔧 User data:', user);
        } catch (err) {
          console.log('🔧 Failed to get user data:', err);
        }
        
        // Fetch active cases, drafts, and respondent cases separately
        let allCases: any[] = [];
        let draftsList: any[] = [];
        
        try {
          // Fetch claimant cases
          const claimantCases = await arbitrationApi.getAll();
          allCases = [...allCases, ...claimantCases.map((c: any) => ({ ...c, userRole: 'claimant' }))];
          console.log('🔧 Claimant cases fetched:', claimantCases.length);
        } catch (err) {
          console.log('🔧 No claimant cases or error:', err);
        }
        
        try {
          // Fetch respondent cases
          const response = await fetch('/api/respondent/cases', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const respondentCases = await response.json();
            allCases = [...allCases, ...respondentCases.map((c: any) => ({ ...c, userRole: 'respondent' }))];
            console.log('🔧 Respondent cases fetched:', respondentCases.length);
          } else {
            console.log('🔧 Respondent API error:', response.status);
          }
        } catch (err) {
          console.log('🔧 No respondent cases or error:', err);
        }
        
        try {
          // Fetch drafts
          draftsList = await arbitrationApi.getDrafts();
          console.log('🔧 Drafts fetched:', draftsList.length);
        } catch (err) {
          console.log('🔧 No drafts or error:', err);
          draftsList = [];
        }
        
        console.log('🔧 Total cases:', allCases.length);
        
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

  const handleViewCase = (caseItem: any) => {
    console.log('🔧 Viewing case:', caseItem);
    
    // If this is a respondent case, go to respondent form
    if (caseItem.userRole === 'respondent') {
      router.push(`/respondent/case/${caseItem.id}`)
    } else {
      // Otherwise go to regular case view
      router.push(`/dashboard/case/${caseItem.id}`)
    }
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
                {userData?.role === 'CLAIMANT' && (
                  <Button onClick={() => router.push('/dashboard/petition')}>
                    File a New Case
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cases.map((arbitrationCase) => (
                <Card key={arbitrationCase.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{arbitrationCase.name}</h3>
                          {arbitrationCase.userRole === 'respondent' && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              Respondent
                            </span>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <div>Case #{arbitrationCase.caseNumber}</div>
                          <div>Status: <span className="capitalize">{arbitrationCase.status.toLowerCase()}</span></div>
                          <div>Filed: {new Date(arbitrationCase.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewCase(arbitrationCase)}
                      >
                        {arbitrationCase.userRole === 'respondent' ? 'Respond to Case' : 'View Details'}
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
                {userData?.role === 'CLAIMANT' && (
                  <Button onClick={() => router.push('/dashboard/petition')}>
                    Start a New Case
                  </Button>
                )}
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