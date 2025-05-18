"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { arbitrationApi, auth, api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const steps = [
  "Claimant Details",
  "Additional Claimants & Manager",
  "Respondent Details",
  "Arbitration Agreement",
  "Dispute Details",
  "Prayers & Reliefs",
  "Documents",
  "Payment",
  "Arguments",
  "Review & Submit",
]

const initialClaimant = {
  type: "",
  name: "",
  pincode: "",
  address1: "",
  address2: "",
  city: "",
  district: "",
  state: "",
  country: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  gst: "",
  pan: "",
  cin: "",
  coi: null,
  panCard: null,
  gstCert: null,
}

const initialAdditionalClaimant = {
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  address: "",
}

const initialManagerDetails = {
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  address: "",
  designation: "",
  authority: "",
}

const initialRespondent = {
  type: "",
  name: "",
  address: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  gst: "",
  pan: "",
  cin: "",
}

const initialArbitrationAgreement = {
  agreementDate: "",
  agreementType: "",
  agreementFile: null,
  resolutionMode: "",
  seatOfArbitration: "",
  signedOnPlace: "",
  agreementParties: "",
  arbitratorSelection: "",
}

const initialDisputeDetails = {
  disputeType: "",
  disputeAmount: "",
  disputeDescription: "",
  disputeDate: "",
  serviceType: "",
  applicableActs: [] as string[],
  disputeCategory: "",
  disputeSubCategory: "",
  natureOfDispute: "",
  factsOfCase: "",
  clauseReferences: "",
}

const initialPrayers = {
  prayers: "",
}

const initialDocuments = {
  supportingDocuments: [] as File[],
  evidenceFiles: [] as File[],
  documentTypes: {} as Record<string, string>,
}

const initialPayment = {
  paymentHead: "",
  paymentAmount: "",
  paymentDetails: "",
}

const initialArguments = {
  argumentsPerIssue: [] as string[],
}

const countryCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "United States" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+66", country: "Thailand" },
  { code: "+84", country: "Vietnam" },
  { code: "+62", country: "Indonesia" },
]

export interface ArbitrationDraft {
  id: string;
  caseNumber: string;
  type: string;
  name: string;
  isDraft: boolean;
  version: number;
  lastEditedAt: string;
  createdAt: string;
}

export default function ArbitrationForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0)
  const [claimant, setClaimant] = useState(initialClaimant)
  const [additionalClaimants, setAdditionalClaimants] = useState([initialAdditionalClaimant])
  const [managerDetails, setManagerDetails] = useState(initialManagerDetails)
  const [respondents, setRespondents] = useState([initialRespondent])
  const [arbitrationAgreement, setArbitrationAgreement] = useState(initialArbitrationAgreement)
  const [disputeDetails, setDisputeDetails] = useState(initialDisputeDetails)
  const [prayers, setPrayers] = useState(initialPrayers)
  const [documents, setDocuments] = useState(initialDocuments)
  const [payment, setPayment] = useState(initialPayment)
  const [argumentsData, setArgumentsData] = useState(initialArguments)
  const [errors, setErrors] = useState<any>({})
  const [isClient, setIsClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [draftList, setDraftList] = useState<ArbitrationDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [formChanged, setFormChanged] = useState(false)

  // Add new state for verification loading
  const [isVerifying, setIsVerifying] = useState<{
    gst: boolean;
    pan: boolean;
    cin: boolean;
    respondentGst: Record<number, boolean>;
    respondentPan: Record<number, boolean>;
    respondentCin: Record<number, boolean>;
  }>({
    gst: false,
    pan: false,
    cin: false,
    respondentGst: {},
    respondentPan: {},
    respondentCin: {},
  });
  
  // Add new state for verification status
  const [verificationStatus, setVerificationStatus] = useState<{
    gst: { verified: boolean; message?: string } | null;
    pan: { verified: boolean; message?: string } | null;
    cin: { verified: boolean; message?: string } | null;
    respondentGst: Record<number, { verified: boolean; message?: string } | null>;
    respondentPan: Record<number, { verified: boolean; message?: string } | null>;
    respondentCin: Record<number, { verified: boolean; message?: string } | null>;
  }>({
    gst: null,
    pan: null,
    cin: null,
    respondentGst: {},
    respondentPan: {},
    respondentCin: {},
  });

  useEffect(() => {
    setIsClient(true)
    
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          toast.error('Please log in to access this feature');
          router.push('/auth/login');
          return;
        }
        
        // Verify token is valid by getting current user
        const user = await auth.getCurrentUser();
        setIsAuthenticated(true);
        
        // Check if we're in edit mode (URL contains draftId or petitionId query param)
        const url = new URL(window.location.href);
        const draftId = url.searchParams.get('draftId');
        const petitionId = url.searchParams.get('petitionId');
        
        if (draftId) {
          setEditMode(true);
          await loadDraft(draftId);
        } else if (petitionId) {
          setEditMode(true);
          await loadPetition(petitionId);
        } else {
          // Load user's drafts only if authenticated and not in edit mode
          loadDrafts();
        }
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
    };
    
    checkAuth();
    
    // Set up auto-save when component unmounts
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [router]);
  
  // Effect for auto-saving when form changes
  useEffect(() => {
    if (formChanged && currentDraftId) {
      // Clear any existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set a new timer to auto-save after 3 seconds of inactivity
      const timer = setTimeout(() => {
        autoSaveDraft();
      }, 3000);
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [claimant, additionalClaimants, managerDetails, respondents, arbitrationAgreement, 
      disputeDetails, prayers, documents, payment, argumentsData, formChanged]);

  // Auto-save draft function
  const autoSaveDraft = async () => {
    if (!currentDraftId || !formChanged) return;
    
    try {
      setIsSavingDraft(true);
      const formData = createFormData();
      await arbitrationApi.saveDraft(formData);
      setLastSaved(new Date());
      setFormChanged(false);
      // Don't show toast for auto-save to avoid too many notifications
    } catch (error) {
      console.error('Error auto-saving draft:', error);
      // Don't show error toast for auto-save
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load a petition for editing
  const loadPetition = async (petitionId: string) => {
    try {
      setIsLoadingDrafts(true);
      console.log(`Attempting to load petition with ID: ${petitionId}`);
      
      const petition = await arbitrationApi.getById(petitionId);
      console.log('Petition data received:', petition ? 'SUCCESS' : 'EMPTY');
      
      if (petition) {
        // Create a new draft from the petition
        console.log('Creating new draft from petition data');
        const formData = createFormDataFromPetition(petition);
        const response = await arbitrationApi.saveDraft(formData);
        
        if (response && response.id) {
          console.log(`New draft created with ID: ${response.id}`);
          const newDraftId = response.id;
          setCurrentDraftId(newDraftId);
          
          // Populate form with petition data
          console.log('Populating form with petition data');
          populateFormFromData(petition);
          
          toast.success('Petition loaded for editing. Changes will be saved as a draft.');
        } else {
          throw new Error('Failed to create draft from petition');
        }
      } else {
        throw new Error('No petition data received');
      }
    } catch (error: any) {
      console.error('Error loading petition for editing:', error);
      
      let errorMessage = 'Failed to load petition. Please try again.';
      
      // Provide more specific error messages based on the error
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data
        });
        
        if (error.response.status === 404) {
          errorMessage = 'Petition not found. It may have been deleted or you may not have access.';
        } else if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          router.push('/auth/login');
        } else if (error.response.status === 500) {
          errorMessage = 'Server error while loading petition. Please try again later.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoadingDrafts(false);
    }
  };
  
  // Helper to create form data from a petition
  const createFormDataFromPetition = (petition: any) => {
    const formData = new FormData();
    
    // Add petitionId as reference
    formData.append('petitionId', petition.id);
    
    // Add all petition data to form
    formData.append('data', JSON.stringify(petition));
    
    return formData;
  };
  
  // Helper to populate form from either draft or petition data
  const populateFormFromData = (data: any) => {
    // Populate claimant data
    setClaimant({
      type: data.type || '',
      name: data.name || '',
      pincode: data.pincode || '',
      address1: data.address1 || '',
      address2: data.address2 || '',
      city: data.city || '',
      district: data.district || '',
      state: data.state || '',
      country: data.country || '',
      email: data.email || '',
      phoneCountryCode: data.phoneCountryCode || '+91',
      phone: data.phone || '',
      gst: data.gst || '',
      pan: data.pan || '',
      cin: data.cin || '',
      coi: null,
      panCard: null,
      gstCert: null,
    });
    
    // Load additional claimants
    if (data.additionalClaimants && data.additionalClaimants.length > 0) {
      setAdditionalClaimants(data.additionalClaimants);
    }
    
    // Load manager details
    if (data.managerDetails) {
      setManagerDetails(data.managerDetails);
    }
    
    // Load respondents
    if (data.respondents && data.respondents.length > 0) {
      setRespondents(data.respondents);
    }
    
    // Load arbitration agreement
    if (data.arbitrationAgreement) {
      setArbitrationAgreement({
        agreementDate: data.arbitrationAgreement.agreementDate || '',
        agreementType: data.arbitrationAgreement.agreementType || '',
        resolutionMode: data.arbitrationAgreement.resolutionMode || '',
        seatOfArbitration: data.arbitrationAgreement.seatOfArbitration || '',
        signedOnPlace: data.arbitrationAgreement.signedOnPlace || '',
        agreementParties: data.arbitrationAgreement.agreementParties || '',
        arbitratorSelection: data.arbitrationAgreement.arbitratorSelection || '',
        agreementFile: null,
      });
    }
    
    // Load dispute details
    if (data.disputeDetails) {
      setDisputeDetails({
        disputeType: data.disputeDetails.disputeType || '',
        disputeAmount: data.disputeDetails.disputeAmount || '',
        disputeDescription: data.disputeDetails.disputeDescription || '',
        disputeDate: data.disputeDetails.disputeDate || '',
        serviceType: data.disputeDetails.serviceType || '',
        applicableActs: data.disputeDetails.applicableActs || [],
        disputeCategory: data.disputeDetails.disputeCategory || '',
        disputeSubCategory: data.disputeDetails.disputeSubCategory || '',
        natureOfDispute: data.disputeDetails.natureOfDispute || '',
        factsOfCase: data.disputeDetails.factsOfCase || '',
        clauseReferences: data.disputeDetails.clauseReferences || '',
      });
      
      // If prayers data is in the disputeDetails.reliefSought field, use that
      if (data.disputeDetails.reliefSought) {
        setPrayers({
          prayers: data.disputeDetails.reliefSought
        });
      } else if (data.disputeDetails.prayerClauses) {
        setPrayers({
          prayers: data.disputeDetails.prayerClauses
        });
      }
    }
    
    // Load prayers and reliefs from root object (for backward compatibility)
    if (data.prayers) {
      setPrayers(data.prayers);
    }
    
    // Load payment information
    if (data.payment) {
      setPayment(data.payment);
    }
    
    // Load arguments
    if (data.arguments) {
      setArgumentsData(data.arguments);
    }
    
    // Load document types
    if (data.documentTypes) {
      setDocuments(prev => ({
        ...prev,
        documentTypes: data.documentTypes
      }));
    }
  };

  // Load user's drafts
  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true);
      const drafts = await arbitrationApi.getDrafts();
      setDraftList(drafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      // Don't show error toast here as it might be due to auth issues which are handled elsewhere
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Helper function to create FormData from the current state
  const createFormData = () => {
    const formData = new FormData();

    // Add the draft ID if we're editing an existing draft
    if (currentDraftId) {
      formData.append('id', currentDraftId);
    }

    // Create a structured data object first
    const arbitrationData = {
      type: claimant.type,
      name: claimant.name,
      pincode: claimant.pincode,
      address1: claimant.address1,
      address2: claimant.address2,
      city: claimant.city,
      district: claimant.district,
      state: claimant.state,
      country: claimant.country,
      email: claimant.email,
      phoneCountryCode: claimant.phoneCountryCode,
      phone: claimant.phone,
      gst: claimant.gst,
      pan: claimant.pan,
      cin: claimant.cin,
      additionalClaimants: additionalClaimants,
      managerDetails: managerDetails,
      respondents: respondents,
      arbitrationAgreement: {
        agreementDate: arbitrationAgreement.agreementDate,
        agreementType: arbitrationAgreement.agreementType,
        resolutionMode: arbitrationAgreement.resolutionMode,
        seatOfArbitration: arbitrationAgreement.seatOfArbitration,
        signedOnPlace: arbitrationAgreement.signedOnPlace,
        agreementParties: arbitrationAgreement.agreementParties,
        arbitratorSelection: arbitrationAgreement.arbitratorSelection,
      },
      disputeDetails: {
        ...disputeDetails,
        // Add prayers as reliefSought in the dispute details
        reliefSought: prayers.prayers,
        prayerClauses: prayers.prayers, // Adding to both fields to ensure compatibility
      },
      // Keep prayers in the root object for backward compatibility with frontend
      prayers: prayers,
      payment: payment,
      arguments: argumentsData,
      documentTypes: documents.documentTypes,
      id: currentDraftId || undefined,
      // Track which files are included
      includedFiles: {
        coi: claimant.coi ? true : false,
        panCard: claimant.panCard ? true : false,
        gstCert: claimant.gstCert ? true : false,
        agreementFile: arbitrationAgreement.agreementFile ? true : false,
        supportingDocuments: documents.supportingDocuments.length > 0,
        evidenceFiles: documents.evidenceFiles.length > 0,
      }
    };

    // Add the structured data as a JSON string
    formData.append('data', JSON.stringify(arbitrationData));

    // Add files separately
    if (claimant.coi) {
      console.log('Appending COI file:', claimant.coi);
      formData.append('coi', claimant.coi);
    }
    
    if (claimant.panCard) {
      console.log('Appending PAN card file:', claimant.panCard);
      formData.append('panCard', claimant.panCard);
    }
    
    if (claimant.gstCert) {
      console.log('Appending GST cert file:', claimant.gstCert);
      formData.append('gstCert', claimant.gstCert);
    }
    
    if (arbitrationAgreement.agreementFile) {
      console.log('Appending agreement file:', arbitrationAgreement.agreementFile);
      formData.append('agreementFile', arbitrationAgreement.agreementFile);
    }

    // Add supporting documents
    if (documents.supportingDocuments.length > 0) {
      console.log(`Appending ${documents.supportingDocuments.length} supporting documents`);
      documents.supportingDocuments.forEach((file, index) => {
        formData.append(`supportingDocuments_${index}`, file);
      });
    }
    
    // Add evidence files
    if (documents.evidenceFiles.length > 0) {
      console.log(`Appending ${documents.evidenceFiles.length} evidence files`);
      documents.evidenceFiles.forEach((file, index) => {
        formData.append(`evidenceFiles_${index}`, file);
      });
    }

    return formData;
  };

  const handleSubmit = async () => {
    try {
      // Check if user is authenticated before submission
      if (!isAuthenticated) {
        toast.error('Please log in to submit your petition');
        router.push('/auth/login');
        return;
      }
      
      setIsSubmitting(true);
      
      if (currentDraftId) {
        // If we have a draft ID, submit the draft
        console.log(`Submitting draft with ID: ${currentDraftId}`);
        
        try {
          // First, save the latest changes to ensure everything is up-to-date
          await saveDraft();
          
          // Then submit the draft
          await arbitrationApi.submitDraft(currentDraftId);
          toast.success('Arbitration request submitted successfully!');
          
          // Update draft list and reset form
          const drafts = await arbitrationApi.getDrafts();
          setDraftList(drafts);
          setCurrentDraftId(null);
          resetForm();
        } catch (submitError: any) {
          console.error('Error in draft submission flow:', submitError);
          const errorMessage = submitError.message || 'Error submitting draft';
          toast.error(errorMessage);
          // Don't rethrow to continue execution
          return; // Exit function but don't throw
        }
      } else {
        // Otherwise, save as draft first, then submit
        try {
          // Save as draft first
          const formData = createFormData();
          const saveDraftResponse = await arbitrationApi.saveDraft(formData);
          
          if (saveDraftResponse && saveDraftResponse.id) {
            // Now submit the saved draft
            await arbitrationApi.submitDraft(saveDraftResponse.id);
            toast.success('Arbitration request submitted successfully!');
            
            // Reset form and go back to first step on success
            setCurrentDraftId(null);
            resetForm();
          } else {
            throw new Error('Failed to save draft before submission');
          }
        } catch (directError: any) {
          console.error('Error in direct submission flow:', directError);
          const errorMessage = directError.message || 'Error submitting arbitration request';
          toast.error(errorMessage);
          // Don't rethrow to continue execution
          return; // Exit function but don't throw
        }
      }
      
      // Reset form and go back to first step on success
      setActiveStep(0);
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // More detailed error information
      if (error.response) {
        console.error('Server responded with error:', {
          status: error.response.status,
          data: error.response.data
        });
        toast.error(`Submission failed: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        toast.error(`Error: ${error.message}`);
      }
      
      // Handle 401 specifically
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        router.push('/auth/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    try {
      // Check if user is authenticated before saving draft
      if (!isAuthenticated) {
        toast.error('Please log in to save your draft');
        router.push('/auth/login');
        return;
      }
      
      setIsSavingDraft(true);
      // Use the helper function to create FormData
      const formData = createFormData();
      
      // Log the draft data being sent for debugging
      console.log('Saving draft with data:', formData);

      // Submit as draft
      const response = await arbitrationApi.saveDraft(formData);
      
      // Update the current draft ID for future saves
      if (response && response.id) {
        setCurrentDraftId(response.id);
        setLastSaved(new Date());
        setFormChanged(false);
        
        // Update the drafts list
        const drafts = await arbitrationApi.getDrafts();
        setDraftList(drafts);
      }
      
      // Show success message
      toast.success('Draft saved successfully!');
      
    } catch (error: any) {
      console.error('Error saving draft:', error);
      
      // More detailed error information
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          router.push('/auth/login');
        } else {
          toast.error(`Failed to save draft: ${error.response.data?.message || 'Server error'}`);
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = async (draftId: string) => {
    try {
      setIsLoadingDrafts(true);
      const draft = await arbitrationApi.getById(draftId);
      
      if (draft) {
        // Set current draft ID
        setCurrentDraftId(draft.id);
        
        // Populate form fields
        setClaimant({
          type: draft.type || '',
          name: draft.name || '',
          pincode: draft.pincode || '',
          address1: draft.address1 || '',
          address2: draft.address2 || '',
          city: draft.city || '',
          district: draft.district || '',
          state: draft.state || '',
          country: draft.country || '',
          email: draft.email || '',
          phoneCountryCode: draft.phoneCountryCode || '+91',
          phone: draft.phone || '',
          gst: draft.gst || '',
          pan: draft.pan || '',
          cin: draft.cin || '',
          coi: null,
          panCard: null,
          gstCert: null,
        });
        
        // Load additional claimants
        if (draft.additionalClaimants && draft.additionalClaimants.length > 0) {
          setAdditionalClaimants(draft.additionalClaimants);
        }
        
        // Load manager details
        if (draft.managerDetails) {
          setManagerDetails(draft.managerDetails);
        }
        
        // Load respondents
        if (draft.respondents && draft.respondents.length > 0) {
          setRespondents(draft.respondents);
        }
        
        // Load arbitration agreement
        if (draft.arbitrationAgreement) {
          setArbitrationAgreement({
            agreementDate: draft.arbitrationAgreement.agreementDate || '',
            agreementType: draft.arbitrationAgreement.agreementType || '',
            agreementFile: null,
            resolutionMode: draft.arbitrationAgreement.resolutionMode || '',
            seatOfArbitration: draft.arbitrationAgreement.seatOfArbitration || '',
            signedOnPlace: draft.arbitrationAgreement.signedOnPlace || '',
            agreementParties: draft.arbitrationAgreement.agreementParties || '',
            arbitratorSelection: draft.arbitrationAgreement.arbitratorSelection || '',
          });
        }
        
        // Load dispute details
        if (draft.disputeDetails) {
          setDisputeDetails({
            disputeType: draft.disputeDetails.disputeType || '',
            disputeAmount: draft.disputeDetails.disputeAmount || '',
            disputeDescription: draft.disputeDetails.disputeDescription || '',
            disputeDate: draft.disputeDetails.disputeDate || '',
            serviceType: draft.disputeDetails.serviceType || '',
            applicableActs: draft.disputeDetails.applicableActs || [],
            disputeCategory: draft.disputeDetails.disputeCategory || '',
            disputeSubCategory: draft.disputeDetails.disputeSubCategory || '',
            natureOfDispute: draft.disputeDetails.natureOfDispute || '',
            factsOfCase: draft.disputeDetails.factsOfCase || '',
            clauseReferences: draft.disputeDetails.clauseReferences || '',
          });
          
          // If prayers data is in the disputeDetails.reliefSought field, use that
          if (draft.disputeDetails.reliefSought) {
            setPrayers({
              prayers: draft.disputeDetails.reliefSought
            });
          } else if (draft.disputeDetails.prayerClauses) {
            setPrayers({
              prayers: draft.disputeDetails.prayerClauses
            });
          }
        }
        
        // Load prayers and reliefs from root object (for backward compatibility)
        if (draft.prayers) {
          setPrayers(draft.prayers);
        }
        
        // Load payment information
        if (draft.payment) {
          setPayment(draft.payment);
        }
        
        // Load arguments
        if (draft.arguments) {
          setArgumentsData(draft.arguments);
        }
        
        // Load document types
        if (draft.documentTypes) {
          setDocuments(prev => ({
            ...prev,
            documentTypes: draft.documentTypes
          }));
        }
        
        toast.success('Draft loaded successfully!');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft. Please try again.');
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const resetForm = () => {
    setClaimant(initialClaimant);
    setAdditionalClaimants([initialAdditionalClaimant]);
    setManagerDetails(initialManagerDetails);
    setRespondents([initialRespondent]);
    setArbitrationAgreement(initialArbitrationAgreement);
    setDisputeDetails(initialDisputeDetails);
    setPrayers(initialPrayers);
    setDocuments(initialDocuments);
    setPayment(initialPayment);
    setArgumentsData(initialArguments);
    setCurrentDraftId(null);
    setActiveStep(0);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate claimant fields
      const newErrors: any = {}
      if (!claimant.type) newErrors.type = "Type is required"
      if (!claimant.name) newErrors.name = "Name is required"
      if (!claimant.pincode || claimant.pincode.length !== 6) newErrors.pincode = "Valid 6-digit pincode is required"
      if (!claimant.address1) newErrors.address1 = "Address Line 1 is required"
      if (!claimant.city) newErrors.city = "City is required"
      if (!claimant.district) newErrors.district = "District is required"
      if (!claimant.state) newErrors.state = "State is required"
      if (!claimant.country) newErrors.country = "Country is required"
      if (!claimant.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(claimant.email)) newErrors.email = "Valid email is required"
      if (!claimant.phone || claimant.phone.length !== 10 || !/^\d{10}$/.test(claimant.phone)) 
        newErrors.phone = "Valid 10-digit Indian mobile number is required"
      
      // Validate PAN if provided (not required but must be valid if present)
      if (claimant.pan && !validatePAN(claimant.pan)) 
        newErrors.pan = "Invalid PAN format. Should be like AAAPL1234C"
      
      // Optional: GST, CIN, COI, PAN card, GST cert validation
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 1) {
      // Validate manager details
      const newErrors: any = {}
      if (managerDetails.name && !managerDetails.designation) {
        newErrors.managerDesignation = "Manager designation is required if name is provided"
      }
      if (managerDetails.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(managerDetails.email)) {
        newErrors.managerEmail = "Valid email is required"
      }
      if (managerDetails.phone && (managerDetails.phone.length !== 10 || !/^\d{10}$/.test(managerDetails.phone))) {
        newErrors.managerPhone = "Valid 10-digit Indian mobile number is required"
      }
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 2) {
      // Validate respondent details
      const newErrors: any = {}
      respondents.forEach((respondent, index) => {
        if (!respondent.type) newErrors[`respondent${index}Type`] = "Type is required"
        if (!respondent.name) newErrors[`respondent${index}Name`] = "Name is required"
        if (!respondent.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(respondent.email)) 
          newErrors[`respondent${index}Email`] = "Valid email is required"
      })
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 3) {
      // Validate arbitration agreement
      const newErrors: any = {}
      if (!arbitrationAgreement.agreementDate) newErrors.agreementDate = "Agreement date is required"
      if (!arbitrationAgreement.agreementType) newErrors.agreementType = "Agreement type is required"
      if (!arbitrationAgreement.agreementFile) newErrors.agreementFile = "Agreement file is required"
      if (!arbitrationAgreement.resolutionMode) newErrors.resolutionMode = "Resolution mode is required"
      if (!arbitrationAgreement.seatOfArbitration) newErrors.seatOfArbitration = "Seat of arbitration is required"
      if (!arbitrationAgreement.signedOnPlace) newErrors.signedOnPlace = "Signed-on place is required"
      if (!arbitrationAgreement.agreementParties) newErrors.agreementParties = "Agreement parties is required"
      if (!arbitrationAgreement.arbitratorSelection) newErrors.arbitratorSelection = "Arbitrator selection is required"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 4) {
      // Validate dispute details
      const newErrors: any = {}
      if (!disputeDetails.disputeType) newErrors.disputeType = "Dispute type is required"
      if (!disputeDetails.disputeAmount) newErrors.disputeAmount = "Dispute amount is required"
      if (!disputeDetails.disputeDescription) newErrors.disputeDescription = "Dispute description is required"
      if (!disputeDetails.disputeDate) newErrors.disputeDate = "Dispute date is required"
      if (!disputeDetails.serviceType) newErrors.serviceType = "Service type is required"
      if (!disputeDetails.disputeCategory) newErrors.disputeCategory = "Dispute category is required"
      if (!disputeDetails.disputeSubCategory) newErrors.disputeSubCategory = "Dispute sub-category is required"
      if (!disputeDetails.natureOfDispute) newErrors.natureOfDispute = "Nature of dispute is required"
      if (!disputeDetails.factsOfCase) newErrors.factsOfCase = "Facts of the case is required"
      if (!disputeDetails.clauseReferences) newErrors.clauseReferences = "Clause references is required"
      if (disputeDetails.applicableActs.length === 0) newErrors.applicableActs = "At least one applicable act is required"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 5) {
      // Validate prayers & reliefs
      const newErrors: any = {}
      if (!prayers.prayers) newErrors.prayers = "Prayers & reliefs is required"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 7) {
      // Validate payment details
      const newErrors: any = {}
      if (!payment.paymentHead) newErrors.paymentHead = "Payment head is required"
      if (!payment.paymentAmount) newErrors.paymentAmount = "Payment amount is required"
      if (!payment.paymentDetails) newErrors.paymentDetails = "Payment details is required"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 8) {
      // Validate arguments
      const newErrors: any = {}
      if (argumentsData.argumentsPerIssue.length === 0) newErrors.argumentsPerIssue = "At least one argument is required"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 9) {
      // Validate review & submit
      const newErrors: any = {}
      if (!isAuthenticated) newErrors.authentication = "Please log in to submit your petition"
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // If we're on the last step, submit the form
      handleSubmit();
    }
  };
  const handleBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1)
  }

  // PAN Validation - Indian Permanent Account Number format: AAAPL1234C
  // First 5 characters are letters, next 4 are digits, and the last is a letter
  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  // CIN Validation - Corporate Identification Number format: U74140MH2014PTC123456
  // 21 characters: First character is alphabet for company type, next 5 are digits for ROC code,
  // next 2 are state code, next 4 are year of incorporation, next 3 are company type (PLC, PTC, etc),
  // and the last 6 are sequential registration number
  const validateCIN = (cin: string): boolean => {
    const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    return cinRegex.test(cin);
  };

  // GST Validation - GST Number format: 22AAAAA0000A1Z5
  // 15 characters: First 2 are state code, next 10 are PAN number, 
  // next 1 is entity number, next 1 is Z by default, and the last 1 is checksum digit
  const validateGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any
    
    // Special handling for pincode field
    if (name === 'pincode') {
      // Only allow digits and limit to 6 characters
      const sanitizedValue = value.replace(/\D/g, '').substring(0, 6);
      setClaimant((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }))
    } 
    // Special handling for PAN number - convert to uppercase and validate format
    else if (name === 'pan') {
      const uppercasePAN = value.toUpperCase();
      
      // Store validation error if PAN is not empty and invalid
      if (uppercasePAN && !validatePAN(uppercasePAN)) {
        setErrors((prev: any) => ({
          ...prev,
          pan: 'Invalid PAN format. Should be like AAAPL1234C'
        }));
      } else {
        // Clear error if PAN is valid or empty
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.pan;
          return newErrors;
        });
      }
      
      setClaimant((prev) => ({
        ...prev,
        [name]: uppercasePAN,
      }))
    }
    // Special handling for CIN - convert to uppercase and validate format
    else if (name === 'cin') {
      const uppercaseCIN = value.toUpperCase();
      
      // Store validation error if CIN is not empty and invalid
      if (uppercaseCIN && !validateCIN(uppercaseCIN)) {
        setErrors((prev: any) => ({
          ...prev,
          cin: 'Invalid CIN format. Should be like U74140MH2014PTC123456'
        }));
      } else {
        // Clear error if CIN is valid or empty
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.cin;
          return newErrors;
        });
      }
      
      setClaimant((prev) => ({
        ...prev,
        [name]: uppercaseCIN,
      }))
    }
    // Special handling for GST - convert to uppercase and validate format
    else if (name === 'gst') {
      const uppercaseGST = value.toUpperCase();
      
      // Store validation error if GST is not empty and invalid
      if (uppercaseGST && !validateGST(uppercaseGST)) {
        setErrors((prev: any) => ({
          ...prev,
          gst: 'Invalid GST format. Should be like 22AAAAA0000A1Z5'
        }));
      } else {
        // Clear error if GST is valid or empty
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.gst;
          return newErrors;
        });
      }
      
      setClaimant((prev) => ({
        ...prev,
        [name]: uppercaseGST,
      }))
    }
    else {
      setClaimant((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }))
    }
    setFormChanged(true)
  }

  const handleAdditionalClaimantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newClaimants = [...additionalClaimants]
    newClaimants[index] = { ...newClaimants[index], [name]: value }
    setAdditionalClaimants(newClaimants)
    setFormChanged(true)
  }

  const handleRespondentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Special handling for PAN number validation
    if (name === 'pan') {
      const uppercasePAN = value.toUpperCase();
      const newRespondents = [...respondents]
      newRespondents[index] = { ...newRespondents[index], [name]: uppercasePAN }
      setRespondents(newRespondents)
    } 
    // Special handling for CIN number validation
    else if (name === 'cin') {
      const uppercaseCIN = value.toUpperCase();
      const newRespondents = [...respondents]
      newRespondents[index] = { ...newRespondents[index], [name]: uppercaseCIN }
      setRespondents(newRespondents)
    } 
    // Special handling for GST number validation
    else if (name === 'gst') {
      const uppercaseGST = value.toUpperCase();
      const newRespondents = [...respondents]
      newRespondents[index] = { ...newRespondents[index], [name]: uppercaseGST }
      setRespondents(newRespondents)
    } else {
      const newRespondents = [...respondents]
      newRespondents[index] = { ...newRespondents[index], [name]: value }
      setRespondents(newRespondents)
    }
    
    setFormChanged(true)
  }

  const handleArbitrationAgreementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any
    
    if (files && files.length > 0) {
      console.log(`Handling file upload for ${name}: ${files[0].name} (${files[0].type}, ${files[0].size} bytes)`);
      setArbitrationAgreement((prev) => {
        const newState = {
          ...prev,
          [name]: files[0]
        };
        return newState;
      });
    } else {
      console.log(`Setting ${name} value:`, value);
      setArbitrationAgreement((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setFormChanged(true);
  }

  const handleDisputeDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDisputeDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormChanged(true)
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files.length > 0) {
      console.log(`Handling ${files.length} files for ${name}`);
      // Log file info for debugging
      Array.from(files).forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.type}, ${file.size} bytes)`);
      });
      
      // Only update if the name is a valid property of our documents state
      if (name === 'supportingDocuments' || name === 'evidenceFiles') {
        setDocuments((prev) => {
          const newState = {
            ...prev,
            [name]: Array.from(files),
          };
          console.log(`Updated ${name} array, now has ${newState[name as keyof typeof newState].length} files`);
          return newState;
        });
        setFormChanged(true);
      } else {
        console.error(`Invalid document field name: ${name}`);
      }
    } else {
      console.log(`No files selected for ${name}`);
    }
  }

  const addAdditionalClaimant = () => {
    setAdditionalClaimants([...additionalClaimants, initialAdditionalClaimant])
  }

  const addRespondent = () => {
    setRespondents([...respondents, initialRespondent])
  }

  const removeAdditionalClaimant = (index: number) => {
    const newClaimants = additionalClaimants.filter((_, i) => i !== index)
    setAdditionalClaimants(newClaimants)
  }

  const removeRespondent = (index: number) => {
    const newRespondents = respondents.filter((_, i) => i !== index)
    setRespondents(newRespondents)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '')
    // Limit to 10 digits for Indian phone numbers
    return cleaned.slice(0, 10)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function, field: string) => {
    const { value } = e.target
    const formattedValue = formatPhoneNumber(value)
    setter((prev: any) => ({
      ...prev,
      [field]: formattedValue
    }))
    setFormChanged(true)
  }

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: Function, field: string) => {
    // For this implementation, we're restricting to Indian phone numbers only,
    // so we'll always force it to +91 regardless of selection
    setter((prev: any) => ({
      ...prev,
      [field]: '+91'
    }))
    setFormChanged(true)
  }

  // Add verification handlers
  const handleVerifyGST = async (gstNumber: string) => {
    if (!gstNumber || gstNumber.length !== 15) return;
    
    setIsVerifying(prev => ({ ...prev, gst: true }));
    try {
      const result = await api.verification.verifyGST(gstNumber);
      setVerificationStatus(prev => ({
        ...prev,
        gst: {
          verified: result.valid,
          message: result.message,
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          gst: result.message || 'Invalid GST number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.gst;
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('GST verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        gst: {
          verified: false,
          message: 'Verification service unavailable. Please try again later.',
        },
      }));
    } finally {
      setIsVerifying(prev => ({ ...prev, gst: false }));
    }
  };
  
  const handleVerifyPAN = async (panNumber: string) => {
    if (!panNumber || panNumber.length !== 10) return;
    
    setIsVerifying(prev => ({ ...prev, pan: true }));
    try {
      const result = await api.verification.verifyPAN(panNumber);
      setVerificationStatus(prev => ({
        ...prev,
        pan: {
          verified: result.valid,
          message: result.message,
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          pan: result.message || 'Invalid PAN number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.pan;
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('PAN verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        pan: {
          verified: false,
          message: 'Verification service unavailable. Please try again later.',
        },
      }));
    } finally {
      setIsVerifying(prev => ({ ...prev, pan: false }));
    }
  };
  
  const handleVerifyCIN = async (cinNumber: string) => {
    if (!cinNumber || cinNumber.length !== 21) return;
    
    setIsVerifying(prev => ({ ...prev, cin: true }));
    try {
      const result = await api.verification.verifyCIN(cinNumber);
      setVerificationStatus(prev => ({
        ...prev,
        cin: {
          verified: result.valid,
          message: result.message,
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          cin: result.message || 'Invalid CIN number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors.cin;
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('CIN verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        cin: {
          verified: false,
          message: 'Verification service unavailable. Please try again later.',
        },
      }));
    } finally {
      setIsVerifying(prev => ({ ...prev, cin: false }));
    }
  };
  
  const handleVerifyRespondentGST = async (index: number, gstNumber: string) => {
    if (!gstNumber || gstNumber.length !== 15) return;
    
    setIsVerifying(prev => ({
      ...prev,
      respondentGst: {
        ...prev.respondentGst,
        [index]: true,
      },
    }));
    
    try {
      const result = await api.verification.verifyGST(gstNumber);
      setVerificationStatus(prev => ({
        ...prev,
        respondentGst: {
          ...prev.respondentGst,
          [index]: {
            verified: result.valid,
            message: result.message,
          },
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          [`respondent${index}GST`]: result.message || 'Invalid GST number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors[`respondent${index}GST`];
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('Respondent GST verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        respondentGst: {
          ...prev.respondentGst,
          [index]: {
            verified: false,
            message: 'Verification service unavailable. Please try again later.',
          },
        },
      }));
    } finally {
      setIsVerifying(prev => ({
        ...prev,
        respondentGst: {
          ...prev.respondentGst,
          [index]: false,
        },
      }));
    }
  };
  
  const handleVerifyRespondentPAN = async (index: number, panNumber: string) => {
    if (!panNumber || panNumber.length !== 10) return;
    
    setIsVerifying(prev => ({
      ...prev,
      respondentPan: {
        ...prev.respondentPan,
        [index]: true,
      },
    }));
    
    try {
      const result = await api.verification.verifyPAN(panNumber);
      setVerificationStatus(prev => ({
        ...prev,
        respondentPan: {
          ...prev.respondentPan,
          [index]: {
            verified: result.valid,
            message: result.message,
          },
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          [`respondent${index}PAN`]: result.message || 'Invalid PAN number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors[`respondent${index}PAN`];
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('Respondent PAN verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        respondentPan: {
          ...prev.respondentPan,
          [index]: {
            verified: false,
            message: 'Verification service unavailable. Please try again later.',
          },
        },
      }));
    } finally {
      setIsVerifying(prev => ({
        ...prev,
        respondentPan: {
          ...prev.respondentPan,
          [index]: false,
        },
      }));
    }
  };
  
  const handleVerifyRespondentCIN = async (index: number, cinNumber: string) => {
    if (!cinNumber || cinNumber.length !== 21) return;
    
    setIsVerifying(prev => ({
      ...prev,
      respondentCin: {
        ...prev.respondentCin,
        [index]: true,
      },
    }));
    
    try {
      const result = await api.verification.verifyCIN(cinNumber);
      setVerificationStatus(prev => ({
        ...prev,
        respondentCin: {
          ...prev.respondentCin,
          [index]: {
            verified: result.valid,
            message: result.message,
          },
        },
      }));
      
      // If not valid, also set error state
      if (!result.valid) {
        setErrors((prev: any) => ({
          ...prev,
          [`respondent${index}CIN`]: result.message || 'Invalid CIN number',
        }));
      } else {
        // Clear any existing error
        setErrors((prev: any) => {
          const newErrors = {...prev};
          delete newErrors[`respondent${index}CIN`];
          return newErrors;
        });
      }
    } catch (error: any) {
      console.error('Respondent CIN verification error:', error);
      setVerificationStatus(prev => ({
        ...prev,
        respondentCin: {
          ...prev.respondentCin,
          [index]: {
            verified: false,
            message: 'Verification service unavailable. Please try again later.',
          },
        },
      }));
    } finally {
      setIsVerifying(prev => ({
        ...prev,
        respondentCin: {
          ...prev.respondentCin,
          [index]: false,
        },
      }));
    }
  };

  const handlePrayersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPrayers((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormChanged(true)
  }

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPayment((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormChanged(true)
  }

  const handleArgumentChange = (index: number, value: string) => {
    const newArguments = [...argumentsData.argumentsPerIssue]
    newArguments[index] = value
    setArgumentsData((prev) => ({
      ...prev,
      argumentsPerIssue: newArguments,
    }))
    setFormChanged(true)
  }

  const addArgument = () => {
    setArgumentsData((prev) => ({
      ...prev,
      argumentsPerIssue: [...prev.argumentsPerIssue, ""],
    }))
  }

  const removeArgument = (index: number) => {
    const newArguments = argumentsData.argumentsPerIssue.filter((_, i) => i !== index)
    setArgumentsData((prev) => ({
      ...prev,
      argumentsPerIssue: newArguments,
    }))
  }

  const handleManagerDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setManagerDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormChanged(true)
  }

  const handleDocumentTypeChange = (docType: string, category: string, index: number) => {
    setDocuments((prev) => ({
      ...prev,
      documentTypes: {
        ...prev.documentTypes,
        [`${category}_${index}`]: docType
      }
    }))
    setFormChanged(true)
  }

  if (!isClient) {
    return null // or a loading spinner
  }

  // If not authenticated, show message
  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-4">Please log in to access the petition form</p>
            <Button onClick={() => router.push('/auth/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render form steps
  const renderFormContent = () => {
    switch (activeStep) {
      case 0: // Claimant Details
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Claimant Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Type*</label>
                <select
                  name="type"
                  value={claimant.type}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select type</option>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                  <option value="llp">LLP</option>
                </select>
                {errors.type && <div className="text-red-500 text-xs mt-1">{errors.type}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Name*</label>
                <input
                  name="name"
                  value={claimant.name}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Pincode*</label>
                <input
                  name="pincode"
                  value={claimant.pincode}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.pincode && <div className="text-red-500 text-xs mt-1">{errors.pincode}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Address Line 1*</label>
                <input
                  name="address1"
                  value={claimant.address1}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.address1 && <div className="text-red-500 text-xs mt-1">{errors.address1}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Address Line 2</label>
                <input
                  name="address2"
                  value={claimant.address2}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">City*</label>
                <input
                  name="city"
                  value={claimant.city}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">District*</label>
                <input
                  name="district"
                  value={claimant.district}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.district && <div className="text-red-500 text-xs mt-1">{errors.district}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">State*</label>
                <input
                  name="state"
                  value={claimant.state}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.state && <div className="text-red-500 text-xs mt-1">{errors.state}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Country*</label>
                <input
                  name="country"
                  value={claimant.country}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.country && <div className="text-red-500 text-xs mt-1">{errors.country}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Email*</label>
                <input
                  name="email"
                  value={claimant.email}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Phone*</label>
                <div className="flex gap-2">
                  <select
                    name="phoneCountryCode"
                    value="+91"
                    disabled={true}
                    className="w-24 border rounded px-2 py-1 bg-gray-100"
                  >
                    <option value="+91">+91 (India)</option>
                  </select>
                  <input
                    name="phone"
                    value={claimant.phone}
                    onChange={(e) => handlePhoneChange(e, setClaimant, 'phone')}
                    placeholder="10-digit Indian mobile number"
                    className="flex-1 border rounded px-2 py-1"
                  />
                </div>
                {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                <p className="text-xs text-gray-500 mt-1">Only 10-digit Indian mobile numbers are accepted</p>
              </div>
              <div>
                <label className="block text-sm mb-1">GST Number</label>
                <div className="flex">
                  <input
                    name="gst"
                    value={claimant.gst}
                    onChange={handleChange}
                    onBlur={(e) => handleVerifyGST(e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    className={`w-full border rounded px-2 py-1 ${errors.gst ? 'border-red-500' : verificationStatus.gst?.verified ? 'border-green-500' : ''}`}
                  />
                  {isVerifying.gst && (
                    <div className="ml-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!isVerifying.gst && verificationStatus.gst && (
                    <div className="ml-2 flex items-center">
                      {verificationStatus.gst.verified ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {errors.gst && <div className="text-red-500 text-xs mt-1">{errors.gst}</div>}
                {!errors.gst && verificationStatus.gst?.message && (
                  <div className={`text-xs mt-1 ${verificationStatus.gst.verified ? 'text-green-600' : 'text-red-500'}`}>
                    {verificationStatus.gst.message}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">15-digit GST identification number</p>
              </div>
              <div>
                <label className="block text-sm mb-1">PAN Number</label>
                <div className="flex">
                  <input
                    name="pan"
                    value={claimant.pan}
                    onChange={handleChange}
                    onBlur={(e) => handleVerifyPAN(e.target.value)}
                    placeholder="AAAPL1234C"
                    className={`w-full border rounded px-2 py-1 ${errors.pan ? 'border-red-500' : verificationStatus.pan?.verified ? 'border-green-500' : ''}`}
                  />
                  {isVerifying.pan && (
                    <div className="ml-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!isVerifying.pan && verificationStatus.pan && (
                    <div className="ml-2 flex items-center">
                      {verificationStatus.pan.verified ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {errors.pan && <div className="text-red-500 text-xs mt-1">{errors.pan}</div>}
                {!errors.pan && verificationStatus.pan?.message && (
                  <div className={`text-xs mt-1 ${verificationStatus.pan.verified ? 'text-green-600' : 'text-red-500'}`}>
                    {verificationStatus.pan.message}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Format: 5 letters, 4 digits, 1 letter</p>
              </div>
              <div>
                <label className="block text-sm mb-1">CIN</label>
                <div className="flex">
                  <input
                    name="cin"
                    value={claimant.cin}
                    onChange={handleChange}
                    onBlur={(e) => handleVerifyCIN(e.target.value)}
                    placeholder="U74140MH2014PTC123456"
                    className={`w-full border rounded px-2 py-1 ${errors.cin ? 'border-red-500' : verificationStatus.cin?.verified ? 'border-green-500' : ''}`}
                  />
                  {isVerifying.cin && (
                    <div className="ml-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!isVerifying.cin && verificationStatus.cin && (
                    <div className="ml-2 flex items-center">
                      {verificationStatus.cin.verified ? (
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {errors.cin && <div className="text-red-500 text-xs mt-1">{errors.cin}</div>}
                {!errors.cin && verificationStatus.cin?.message && (
                  <div className={`text-xs mt-1 ${verificationStatus.cin.verified ? 'text-green-600' : 'text-red-500'}`}>
                    {verificationStatus.cin.message}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Corporate Identification Number (21 characters)</p>
              </div>
              <div>
                <label className="block text-sm mb-1">Certificate of Incorporation (COI)</label>
                <input
                  name="coi"
                  type="file"
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">PAN Card</label>
                <input
                  name="panCard"
                  type="file"
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">GST Registration Certificate</label>
                <input
                  name="gstCert"
                  type="file"
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        )
      case 1: // Additional Claimants & Manager
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Additional Claimants & Manager</h3>
            {additionalClaimants.map((claimant, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Additional Claimant {index + 1}</h4>
                  {index > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAdditionalClaimant(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input
                      name="name"
                      value={claimant.name}
                      onChange={(e) => handleAdditionalClaimantChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={claimant.email}
                      onChange={(e) => handleAdditionalClaimantChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Phone</label>
                    <div className="flex gap-2">
                      <select
                        name="phoneCountryCode"
                        value="+91"
                        disabled={true}
                        className="w-24 border rounded px-2 py-1 bg-gray-100"
                      >
                        <option value="+91">+91 (India)</option>
                      </select>
                      <input
                        name="phone"
                        value={additionalClaimants[index].phone}
                        onChange={(e) => handlePhoneChange(e, (unused: any) => {
                          const newClaimants = [...additionalClaimants]
                          newClaimants[index] = { ...newClaimants[index], phone: formatPhoneNumber(e.target.value) }
                          setAdditionalClaimants(newClaimants)
                        }, 'phone')}
                        placeholder="10-digit Indian mobile number"
                        className="flex-1 border rounded px-2 py-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Only 10-digit Indian mobile numbers are accepted</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Address</label>
                    <input
                      name="address"
                      value={claimant.address}
                      onChange={(e) => handleAdditionalClaimantChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={addAdditionalClaimant} variant="outline">
              Add Additional Claimant
            </Button>
            
            <div className="mt-8 border-t pt-6">
              <h4 className="font-medium mb-4">Manager Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Manager Name</label>
                  <input
                    name="name"
                    value={managerDetails.name}
                    onChange={handleManagerDetailsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Designation</label>
                  <input
                    name="designation"
                    value={managerDetails.designation}
                    onChange={handleManagerDetailsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                  {errors.managerDesignation && (
                    <div className="text-red-500 text-xs mt-1">{errors.managerDesignation}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={managerDetails.email}
                    onChange={handleManagerDetailsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                  {errors.managerEmail && (
                    <div className="text-red-500 text-xs mt-1">{errors.managerEmail}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone</label>
                  <div className="flex gap-2">
                    <select
                      name="phoneCountryCode"
                      value="+91"
                      disabled={true}
                      className="w-24 border rounded px-2 py-1 bg-gray-100"
                    >
                      <option value="+91">+91 (India)</option>
                    </select>
                    <input
                      name="phone"
                      value={managerDetails.phone}
                      onChange={(e) => handlePhoneChange(e, setManagerDetails, 'phone')}
                      placeholder="10-digit Indian mobile number"
                      className="flex-1 border rounded px-2 py-1"
                    />
                  </div>
                  {errors.managerPhone && (
                    <div className="text-red-500 text-xs mt-1">{errors.managerPhone}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Address</label>
                  <input
                    name="address"
                    value={managerDetails.address}
                    onChange={handleManagerDetailsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Authority</label>
                  <input
                    name="authority"
                    value={managerDetails.authority}
                    onChange={handleManagerDetailsChange}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Authority to represent claimants"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 2: // Respondent Details
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Respondent Details</h3>
            {respondents.map((respondent, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Respondent {index + 1}</h4>
                  {index > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRespondent(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Type*</label>
                    <select
                      name="type"
                      value={respondent.type}
                      onChange={(e) => handleRespondentChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Select type</option>
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="llp">LLP</option>
                    </select>
                    {errors[`respondent${index}Type`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}Type`]}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Name*</label>
                    <input
                      name="name"
                      value={respondent.name}
                      onChange={(e) => handleRespondentChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                    {errors[`respondent${index}Name`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}Name`]}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email*</label>
                    <input
                      name="email"
                      type="email"
                      value={respondent.email}
                      onChange={(e) => handleRespondentChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                    {errors[`respondent${index}Email`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}Email`]}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Phone</label>
                    <div className="flex gap-2">
                      <select
                        name="phoneCountryCode"
                        value="+91"
                        disabled={true}
                        className="w-24 border rounded px-2 py-1 bg-gray-100"
                      >
                        <option value="+91">+91 (India)</option>
                      </select>
                      <input
                        name="phone"
                        value={respondent.phone}
                        onChange={(e) => handlePhoneChange(e, (index: number) => {
                          const newRespondents = [...respondents]
                          newRespondents[index] = { ...newRespondents[index], phone: formatPhoneNumber(e.target.value) }
                          setRespondents(newRespondents)
                        }, 'phone')}
                        placeholder="10-digit Indian mobile number"
                        className="flex-1 border rounded px-2 py-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Only 10-digit Indian mobile numbers are accepted</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Address</label>
                    <input
                      name="address"
                      value={respondent.address}
                      onChange={(e) => handleRespondentChange(index, e)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">GST Number</label>
                    <div className="flex">
                      <input
                        name="gst"
                        value={respondent.gst}
                        onChange={(e) => handleRespondentChange(index, e)}
                        onBlur={(e) => handleVerifyRespondentGST(index, e.target.value)}
                        placeholder="22AAAAA0000A1Z5"
                        className={`w-full border rounded px-2 py-1 ${
                          errors[`respondent${index}GST`] ? 'border-red-500' : 
                          verificationStatus.respondentGst[index]?.verified ? 'border-green-500' : ''
                        }`}
                      />
                      {isVerifying.respondentGst[index] && (
                        <div className="ml-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {!isVerifying.respondentGst[index] && verificationStatus.respondentGst[index] && (
                        <div className="ml-2 flex items-center">
                          {verificationStatus.respondentGst[index]?.verified ? (
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {errors[`respondent${index}GST`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}GST`]}</div>
                    )}
                    {!errors[`respondent${index}GST`] && verificationStatus.respondentGst[index]?.message && (
                      <div className={`text-xs mt-1 ${
                        verificationStatus.respondentGst[index]?.verified ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {verificationStatus.respondentGst[index]?.message}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">15-digit GST identification number</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">PAN Number</label>
                    <div className="flex">
                      <input
                        name="pan"
                        value={respondent.pan}
                        onChange={(e) => handleRespondentChange(index, e)}
                        onBlur={(e) => handleVerifyRespondentPAN(index, e.target.value)}
                        placeholder="AAAPL1234C"
                        className={`w-full border rounded px-2 py-1 ${
                          errors[`respondent${index}PAN`] ? 'border-red-500' : 
                          verificationStatus.respondentPan[index]?.verified ? 'border-green-500' : ''
                        }`}
                      />
                      {isVerifying.respondentPan[index] && (
                        <div className="ml-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {!isVerifying.respondentPan[index] && verificationStatus.respondentPan[index] && (
                        <div className="ml-2 flex items-center">
                          {verificationStatus.respondentPan[index]?.verified ? (
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {errors[`respondent${index}PAN`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}PAN`]}</div>
                    )}
                    {!errors[`respondent${index}PAN`] && verificationStatus.respondentPan[index]?.message && (
                      <div className={`text-xs mt-1 ${
                        verificationStatus.respondentPan[index]?.verified ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {verificationStatus.respondentPan[index]?.message}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Format: 5 letters, 4 digits, 1 letter</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">CIN</label>
                    <div className="flex">
                      <input
                        name="cin"
                        value={respondent.cin}
                        onChange={(e) => handleRespondentChange(index, e)}
                        onBlur={(e) => handleVerifyRespondentCIN(index, e.target.value)}
                        placeholder="U74140MH2014PTC123456"
                        className={`w-full border rounded px-2 py-1 ${
                          errors[`respondent${index}CIN`] ? 'border-red-500' : 
                          verificationStatus.respondentCin[index]?.verified ? 'border-green-500' : ''
                        }`}
                      />
                      {isVerifying.respondentCin[index] && (
                        <div className="ml-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {!isVerifying.respondentCin[index] && verificationStatus.respondentCin[index] && (
                        <div className="ml-2 flex items-center">
                          {verificationStatus.respondentCin[index]?.verified ? (
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {errors[`respondent${index}CIN`] && (
                      <div className="text-red-500 text-xs mt-1">{errors[`respondent${index}CIN`]}</div>
                    )}
                    {!errors[`respondent${index}CIN`] && verificationStatus.respondentCin[index]?.message && (
                      <div className={`text-xs mt-1 ${
                        verificationStatus.respondentCin[index]?.verified ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {verificationStatus.respondentCin[index]?.message}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Corporate Identification Number (21 characters)</p>
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={addRespondent} variant="outline">
              Add Respondent
            </Button>
          </div>
        )
      case 3: // Arbitration Agreement
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Arbitration Agreement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Agreement Date*</label>
                <input
                  name="agreementDate"
                  type="date"
                  value={arbitrationAgreement.agreementDate}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.agreementDate && (
                  <div className="text-red-500 text-xs mt-1">{errors.agreementDate}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Agreement Type*</label>
                <select
                  name="agreementType"
                  value={arbitrationAgreement.agreementType}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select type</option>
                  <option value="contract">Contract</option>
                  <option value="agreement">Agreement</option>
                  <option value="other">Other</option>
                </select>
                {errors.agreementType && (
                  <div className="text-red-500 text-xs mt-1">{errors.agreementType}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Resolution Mode*</label>
                <select
                  name="resolutionMode"
                  value={arbitrationAgreement.resolutionMode}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select mode</option>
                  <option value="physical">Physical</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                {errors.resolutionMode && (
                  <div className="text-red-500 text-xs mt-1">{errors.resolutionMode}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Seat of Arbitration*</label>
                <input
                  name="seatOfArbitration"
                  value={arbitrationAgreement.seatOfArbitration}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g., Mumbai, Delhi"
                />
                {errors.seatOfArbitration && (
                  <div className="text-red-500 text-xs mt-1">{errors.seatOfArbitration}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Signed-on Place*</label>
                <input
                  name="signedOnPlace"
                  value={arbitrationAgreement.signedOnPlace}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Location where agreement was signed"
                />
                {errors.signedOnPlace && (
                  <div className="text-red-500 text-xs mt-1">{errors.signedOnPlace}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Agreement Between Parties*</label>
                <input
                  name="agreementParties"
                  value={arbitrationAgreement.agreementParties}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Names of parties to the agreement"
                />
                {errors.agreementParties && (
                  <div className="text-red-500 text-xs mt-1">{errors.agreementParties}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Arbitrator Selection*</label>
                <select
                  name="arbitratorSelection"
                  value={arbitrationAgreement.arbitratorSelection}
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select option</option>
                  <option value="sole">Sole Arbitrator</option>
                  <option value="panel">Panel of Arbitrators</option>
                  <option value="institution">Institutional Appointment</option>
                  <option value="court">Court Appointment</option>
                </select>
                {errors.arbitratorSelection && (
                  <div className="text-red-500 text-xs mt-1">{errors.arbitratorSelection}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Agreement File*</label>
                <input
                  name="agreementFile"
                  type="file"
                  onChange={handleArbitrationAgreementChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.agreementFile && (
                  <div className="text-red-500 text-xs mt-1">{errors.agreementFile}</div>
                )}
              </div>
            </div>
          </div>
        )
      case 4: // Dispute Details
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Dispute Details & Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Dispute Type*</label>
                <select
                  name="disputeType"
                  value={disputeDetails.disputeType}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select type</option>
                  <option value="commercial">Commercial</option>
                  <option value="construction">Construction</option>
                  <option value="employment">Employment</option>
                  <option value="intellectual_property">Intellectual Property</option>
                  <option value="other">Other</option>
                </select>
                {errors.disputeType && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeType}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Service Type*</label>
                <select
                  name="serviceType"
                  value={disputeDetails.serviceType}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select service type</option>
                  <option value="fast_track">Fast Track</option>
                  <option value="regular">Regular</option>
                  <option value="emergency">Emergency</option>
                  <option value="institutional">Institutional</option>
                </select>
                {errors.serviceType && (
                  <div className="text-red-500 text-xs mt-1">{errors.serviceType}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Dispute Category*</label>
                <select
                  name="disputeCategory"
                  value={disputeDetails.disputeCategory}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select category</option>
                  <option value="contractual">Contractual</option>
                  <option value="corporate">Corporate</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="banking">Banking & Finance</option>
                  <option value="international">International</option>
                  <option value="employment">Employment</option>
                  <option value="other">Other</option>
                </select>
                {errors.disputeCategory && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeCategory}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Dispute Sub-Category*</label>
                <select
                  name="disputeSubCategory"
                  value={disputeDetails.disputeSubCategory}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select sub-category</option>
                  <option value="breach">Breach of Contract</option>
                  <option value="payment">Payment Dispute</option>
                  <option value="quality">Quality/Performance Issue</option>
                  <option value="delivery">Delivery Delay</option>
                  <option value="warranty">Warranty Claim</option>
                  <option value="termination">Contract Termination</option>
                  <option value="other">Other</option>
                </select>
                {errors.disputeSubCategory && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeSubCategory}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Dispute Amount (INR)*</label>
                <input
                  name="disputeAmount"
                  type="number"
                  value={disputeDetails.disputeAmount}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.disputeAmount && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeAmount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Dispute Date*</label>
                <input
                  name="disputeDate"
                  type="date"
                  value={disputeDetails.disputeDate}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                />
                {errors.disputeDate && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeDate}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Nature of Dispute*</label>
                <select
                  name="natureOfDispute"
                  value={disputeDetails.natureOfDispute}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select nature</option>
                  <option value="civil">Civil</option>
                  <option value="commercial">Commercial</option>
                  <option value="constitutional">Constitutional</option>
                  <option value="family">Family</option>
                  <option value="property">Property</option>
                  <option value="other">Other</option>
                </select>
                {errors.natureOfDispute && (
                  <div className="text-red-500 text-xs mt-1">{errors.natureOfDispute}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Applicable Acts*</label>
                <div className="border rounded p-2 h-28 overflow-y-auto">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="arbitration_act"
                        checked={disputeDetails.applicableActs.includes('arbitration_act')}
                        onChange={(e) => {
                          const newActs = e.target.checked 
                            ? [...disputeDetails.applicableActs, 'arbitration_act'] 
                            : disputeDetails.applicableActs.filter(act => act !== 'arbitration_act');
                          setDisputeDetails(prev => ({ ...prev, applicableActs: newActs }));
                          setFormChanged(true);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="arbitration_act" className="text-sm">Arbitration and Conciliation Act, 1996</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="contract_act"
                        checked={disputeDetails.applicableActs.includes('contract_act')}
                        onChange={(e) => {
                          const newActs = e.target.checked 
                            ? [...disputeDetails.applicableActs, 'contract_act'] 
                            : disputeDetails.applicableActs.filter(act => act !== 'contract_act');
                          setDisputeDetails(prev => ({ ...prev, applicableActs: newActs }));
                          setFormChanged(true);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="contract_act" className="text-sm">Indian Contract Act, 1872</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="specific_relief_act"
                        checked={disputeDetails.applicableActs.includes('specific_relief_act')}
                        onChange={(e) => {
                          const newActs = e.target.checked 
                            ? [...disputeDetails.applicableActs, 'specific_relief_act'] 
                            : disputeDetails.applicableActs.filter(act => act !== 'specific_relief_act');
                          setDisputeDetails(prev => ({ ...prev, applicableActs: newActs }));
                          setFormChanged(true);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="specific_relief_act" className="text-sm">Specific Relief Act, 1963</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="companies_act"
                        checked={disputeDetails.applicableActs.includes('companies_act')}
                        onChange={(e) => {
                          const newActs = e.target.checked 
                            ? [...disputeDetails.applicableActs, 'companies_act'] 
                            : disputeDetails.applicableActs.filter(act => act !== 'companies_act');
                          setDisputeDetails(prev => ({ ...prev, applicableActs: newActs }));
                          setFormChanged(true);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="companies_act" className="text-sm">Companies Act, 2013</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="other_act"
                        checked={disputeDetails.applicableActs.includes('other_act')}
                        onChange={(e) => {
                          const newActs = e.target.checked 
                            ? [...disputeDetails.applicableActs, 'other_act'] 
                            : disputeDetails.applicableActs.filter(act => act !== 'other_act');
                          setDisputeDetails(prev => ({ ...prev, applicableActs: newActs }));
                          setFormChanged(true);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="other_act" className="text-sm">Other Acts</label>
                    </div>
                  </div>
                </div>
                {errors.applicableActs && (
                  <div className="text-red-500 text-xs mt-1">{errors.applicableActs}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Contract Clause References*</label>
                <input
                  name="clauseReferences"
                  value={disputeDetails.clauseReferences}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g., Clause 12.3, 15.2, etc."
                />
                {errors.clauseReferences && (
                  <div className="text-red-500 text-xs mt-1">{errors.clauseReferences}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Facts of the Case*</label>
                <textarea
                  name="factsOfCase"
                  value={disputeDetails.factsOfCase}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                  rows={4}
                  placeholder="Provide a clear and concise statement of the facts related to the dispute"
                />
                {errors.factsOfCase && (
                  <div className="text-red-500 text-xs mt-1">{errors.factsOfCase}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Dispute Description*</label>
                <textarea
                  name="disputeDescription"
                  value={disputeDetails.disputeDescription}
                  onChange={handleDisputeDetailsChange}
                  className="w-full border rounded px-2 py-1"
                  rows={4}
                />
                {errors.disputeDescription && (
                  <div className="text-red-500 text-xs mt-1">{errors.disputeDescription}</div>
                )}
              </div>
            </div>
          </div>
        )
      case 5: // Prayers & Reliefs
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Prayers & Reliefs</h3>
            <div>
              <label className="block text-sm mb-1">Prayers & Reliefs Sought*</label>
              <textarea
                name="prayers"
                value={prayers.prayers}
                onChange={handlePrayersChange}
                className="w-full border rounded px-2 py-1"
                rows={8}
                placeholder="Detail the specific remedies, compensation, or actions you are seeking from the arbitral tribunal"
              />
              {errors.prayers && (
                <div className="text-red-500 text-xs mt-1">{errors.prayers}</div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Clearly state each prayer point separately, including monetary claims, specific performance requests, 
                declaratory reliefs, costs, and any interim measures sought.
              </p>
            </div>
          </div>
        )
      case 7: // Payment
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Payment Head*</label>
                <select
                  name="paymentHead"
                  value={payment.paymentHead}
                  onChange={handlePaymentChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select payment head</option>
                  <option value="filing_fee">Filing Fee</option>
                  <option value="arbitrator_fee">Arbitrator Fee</option>
                  <option value="administrative_fee">Administrative Fee</option>
                  <option value="emergency_fee">Emergency Arbitration Fee</option>
                  <option value="other">Other</option>
                </select>
                {errors.paymentHead && (
                  <div className="text-red-500 text-xs mt-1">{errors.paymentHead}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Payment Amount (INR)*</label>
                <input
                  name="paymentAmount"
                  type="number"
                  value={payment.paymentAmount}
                  onChange={handlePaymentChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Enter amount in INR"
                />
                {errors.paymentAmount && (
                  <div className="text-red-500 text-xs mt-1">{errors.paymentAmount}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Payment Details*</label>
                <textarea
                  name="paymentDetails"
                  value={payment.paymentDetails}
                  onChange={handlePaymentChange}
                  className="w-full border rounded px-2 py-1"
                  rows={4}
                  placeholder="Provide detailed payment information"
                />
                {errors.paymentDetails && (
                  <div className="text-red-500 text-xs mt-1">{errors.paymentDetails}</div>
                )}
              </div>
            </div>
          </div>
        )
      case 8: // Arguments
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Arguments</h3>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm">
                  Present your arguments in support of your claims, organized by issue.
                </p>
                <Button onClick={addArgument} variant="outline" size="sm">
                  Add Argument
                </Button>
              </div>
              
              {argumentsData.argumentsPerIssue.length > 0 ? (
                argumentsData.argumentsPerIssue.map((arg, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Issue/Argument {index + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeArgument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <textarea
                      value={arg}
                      onChange={(e) => handleArgumentChange(index, e.target.value)}
                      className="w-full border rounded px-2 py-1"
                      rows={6}
                      placeholder={`Present your argument for issue ${index + 1} (limit: 1 page)`}
                    />
                  </div>
                ))
              ) : (
                <div className="border p-4 rounded-lg text-center">
                  <p className="text-gray-500 mb-4">No arguments added yet</p>
                  <Button onClick={addArgument} variant="outline">
                    Add Your First Argument
                  </Button>
                </div>
              )}
              
              {errors.argumentsPerIssue && (
                <div className="text-red-500 text-xs mt-1">{errors.argumentsPerIssue}</div>
              )}
              
              <div className="text-xs text-gray-500 mt-4">
                Tips:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Structure each argument around a specific issue or claim</li>
                  <li>Reference relevant facts, laws, and contract clauses</li>
                  <li>Limit each argument to approximately one page</li>
                  <li>Present your strongest arguments first</li>
                </ul>
              </div>
            </div>
          </div>
        )
      case 6: // Documents
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Documents</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="font-medium mb-2">Supporting Documents</h4>
                <div className="space-y-4">
                  {documents.supportingDocuments.length > 0 ? (
                    documents.supportingDocuments.map((file, index) => (
                      <div key={index} className="border p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">{file.name}</div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newDocs = [...documents.supportingDocuments];
                              newDocs.splice(index, 1);
                              setDocuments(prev => ({
                                ...prev,
                                supportingDocuments: newDocs
                              }));
                              setFormChanged(true);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Document Type*</label>
                          <select
                            value={documents.documentTypes[`supportingDocuments_${index}`] || ""}
                            onChange={(e) => handleDocumentTypeChange(e.target.value, "supportingDocuments", index)}
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="">Select document type</option>
                            <option value="contract">Contract</option>
                            <option value="invoice">Invoice</option>
                            <option value="correspondence">Correspondence</option>
                            <option value="legal_notice">Legal Notice</option>
                            <option value="expert_report">Expert Report</option>
                            <option value="witness_statement">Witness Statement</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No supporting documents uploaded yet</div>
                  )}
                  <input
                    name="supportingDocuments"
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                  <p className="text-xs text-gray-500">
                    Upload contracts, correspondence, invoices, and any other documents relevant to your case
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Evidence Files</h4>
                <div className="space-y-4">
                  {documents.evidenceFiles.length > 0 ? (
                    documents.evidenceFiles.map((file, index) => (
                      <div key={index} className="border p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">{file.name}</div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newDocs = [...documents.evidenceFiles];
                              newDocs.splice(index, 1);
                              setDocuments(prev => ({
                                ...prev,
                                evidenceFiles: newDocs
                              }));
                              setFormChanged(true);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Document Type*</label>
                          <select
                            value={documents.documentTypes[`evidenceFiles_${index}`] || ""}
                            onChange={(e) => handleDocumentTypeChange(e.target.value, "evidenceFiles", index)}
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="">Select document type</option>
                            <option value="photo">Photographs</option>
                            <option value="video">Video Evidence</option>
                            <option value="audio">Audio Recording</option>
                            <option value="report">Technical Report</option>
                            <option value="test_results">Test Results</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No evidence files uploaded yet</div>
                  )}
                  <input
                    name="evidenceFiles"
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="w-full border rounded px-2 py-1"
                  />
                  <p className="text-xs text-gray-500">
                    Upload evidence such as photographs, videos, audio recordings, or other proof
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case 9: // Review & Submit
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Review Your Petition</h2>
            
            {/* Save/Edit Status */}
            {editMode && (
              <div className={`mb-4 p-3 rounded-md ${isSavingDraft ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                <div className="flex items-center">
                  {isSavingDraft ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                      <span>Auto-saving your changes...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {lastSaved 
                          ? `Last saved at ${lastSaved.toLocaleTimeString()}` 
                          : 'All changes saved'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-indigo-50 p-4 rounded-md mb-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Claimant Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {claimant.type}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {claimant.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {claimant.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {claimant.phoneCountryCode} {claimant.phone}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span> {claimant.address1}, {claimant.address2 && `${claimant.address2}, `}{claimant.city}, {claimant.district}, {claimant.state}, {claimant.country} - {claimant.pincode}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Additional Claimants</h4>
                  {additionalClaimants.length > 0 ? (
                    additionalClaimants.map((claimant, index) => (
                      <div key={index} className="mb-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {claimant.name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {claimant.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {claimant.phoneCountryCode} {claimant.phone}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No additional claimants</div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Manager Details</h4>
                  {managerDetails.name ? (
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {managerDetails.name}
                      </div>
                      <div>
                        <span className="font-medium">Designation:</span> {managerDetails.designation}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {managerDetails.email}
                      </div>
                      <div>
                        <span className="font-medium">Authority:</span> {managerDetails.authority}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No manager details provided</div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Respondents</h4>
                  {respondents.map((respondent, index) => (
                    <div key={index} className="mb-2 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {respondent.type}
                      </div>
                      <div>
                        <span className="font-medium">Name:</span> {respondent.name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {respondent.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {respondent.phoneCountryCode} {respondent.phone}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Arbitration Agreement</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Date:</span> {arbitrationAgreement.agreementDate}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {arbitrationAgreement.agreementType}
                    </div>
                    <div>
                      <span className="font-medium">Resolution Mode:</span> {arbitrationAgreement.resolutionMode}
                    </div>
                    <div>
                      <span className="font-medium">Seat of Arbitration:</span> {arbitrationAgreement.seatOfArbitration}
                    </div>
                    <div>
                      <span className="font-medium">Signed-on Place:</span> {arbitrationAgreement.signedOnPlace}
                    </div>
                    <div>
                      <span className="font-medium">Arbitrator Selection:</span> {arbitrationAgreement.arbitratorSelection}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Agreement Parties:</span> {arbitrationAgreement.agreementParties}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dispute Details</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Type:</span> {disputeDetails.disputeType}
                    </div>
                    <div>
                      <span className="font-medium">Service Type:</span> {disputeDetails.serviceType}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {disputeDetails.disputeCategory}
                    </div>
                    <div>
                      <span className="font-medium">Sub-Category:</span> {disputeDetails.disputeSubCategory}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ₹{disputeDetails.disputeAmount}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {disputeDetails.disputeDate}
                    </div>
                    <div>
                      <span className="font-medium">Nature:</span> {disputeDetails.natureOfDispute}
                    </div>
                    <div>
                      <span className="font-medium">Applicable Acts:</span> {disputeDetails.applicableActs.join(', ')}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Clause References:</span> {disputeDetails.clauseReferences}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Facts of the Case:</span>
                      <p className="mt-1">{disputeDetails.factsOfCase}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span>
                      <p className="mt-1">{disputeDetails.disputeDescription}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prayers & Reliefs</h4>
                  <div className="text-sm">
                    <p className="whitespace-pre-line">{prayers.prayers}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Documents</h4>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium">Supporting Documents:</span> {documents.supportingDocuments.length} files
                    </div>
                    <div>
                      <span className="font-medium">Evidence Files:</span> {documents.evidenceFiles.length} files
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Payment</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Payment Head:</span> {payment.paymentHead}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ₹{payment.paymentAmount}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Payment Details:</span> {payment.paymentDetails}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Arguments</h4>
                  <div className="text-sm">
                    {argumentsData.argumentsPerIssue.length > 0 ? (
                      <div>
                        <span className="font-medium">{argumentsData.argumentsPerIssue.length} argument(s) provided</span>
                      </div>
                    ) : (
                      <div className="text-gray-500">No arguments provided</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null;
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Add draft list at the top if there are drafts */}
      {draftList.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Your Drafts</h2>
            {isLoadingDrafts ? (
              <p>Loading drafts...</p>
            ) : (
              <div className="space-y-2">
                {draftList.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{draft.name || 'Untitled Draft'}</p>
                      <p className="text-sm text-gray-500">
                        Last edited: {new Date(draft.lastEditedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      onClick={() => loadDraft(draft.id)}
                      variant="outline"
                    >
                      Continue Editing
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-8">
        {steps.map((label, idx) => (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${
                idx === activeStep
                  ? "bg-blue-600"
                  : idx < activeStep
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              {idx + 1}
            </div>
            <span className="text-xs mt-2 text-center w-20 truncate">{label}</span>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="p-8 min-h-[300px] flex flex-col justify-between">
          <div className="flex-1">
            {renderFormContent()}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                variant={activeStep === steps.length - 1 ? "default" : "outline"}
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {activeStep === steps.length - 1 
                  ? (isSubmitting ? 'Submitting...' : 'Submit') 
                  : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}