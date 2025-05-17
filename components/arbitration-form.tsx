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
  "Arbitrator Selection",
  "Documents",
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
  signedAt: {
    taluka: "",
    city: "",
    district: "",
    state: ""
  },
  seatOfArbitration: "",
  agreementBetween: {
    partyA: "",
    partyB: ""
  }
}

const initialDisputeDetails = {
  disputeType: "",
  disputeCategory: "",
  disputeSubCategory: "",
  disputeAmount: "",
  disputeDescription: "",
  disputeDate: "",
  hearingPreference: "physical", // "physical" or "virtual"
}

const initialPrayers = {
  reliefs: "",
}

const initialArbitratorSelection = {
  selectedArbitrators: [] as string[],
  preferredArbitrator: "",
}

const initialArgumentsData = {
  arguments: "",
  argumentsFile: null,
}

const initialDocuments = {
  supportingDocuments: [],
  evidenceFiles: [],
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
  const [respondents, setRespondents] = useState([initialRespondent])
  const [arbitrationAgreement, setArbitrationAgreement] = useState(initialArbitrationAgreement)
  const [disputeDetails, setDisputeDetails] = useState(initialDisputeDetails)
  const [prayers, setPrayers] = useState(initialPrayers)
  const [arbitratorSelection, setArbitratorSelection] = useState(initialArbitratorSelection)
  const [argumentsData, setArgumentsData] = useState(initialArgumentsData)
  const [documents, setDocuments] = useState(initialDocuments)
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
  
  // Add component error state
  const [componentError, setComponentError] = useState<{hasError: boolean; message: string}>({
    hasError: false,
    message: '',
  });

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

  // Function to reset component error state
  const resetComponentError = () => {
    setComponentError({
      hasError: false,
      message: '',
    });
  };

  // Error recovery function
  const recoverFromError = () => {
    resetComponentError();
    // Optionally reload data or reset state
    if (isAuthenticated) {
      loadDrafts().catch(err => {
        console.error('Failed to load drafts during recovery:', err);
        // Don't set error state here to avoid infinite loop
      });
    }
  };

  useEffect(() => {
    setIsClient(true)
    
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('No auth token found, redirecting to login');
          toast.error('Please log in to access this feature');
          router.push('/auth/login');
          return;
        }
        
        // Verify token is valid by getting current user
        try {
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
            loadDrafts().catch(err => {
              console.error('Failed to load drafts:', err);
              // Don't show error to user, just log it
            });
          }
        } catch (userError: any) {
          console.error('Error fetching current user:', userError);
          // If we can't get the current user but have a token, still allow access
          // but don't load drafts or try to edit
          if (userError.response?.status === 404) {
            console.log('User endpoint not found, proceeding without user data');
            setIsAuthenticated(true); // Still consider authenticated with token
          } else {
            console.error('Authentication error:', userError);
            toast.error('Your session has expired. Please log in again.');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Unexpected error in checkAuth:', error);
        setComponentError({
          hasError: true,
          message: 'Failed to initialize the form. Please refresh the page or try again later.'
        });
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
  }, [claimant, additionalClaimants, respondents, arbitrationAgreement, disputeDetails, formChanged]);

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
    
    // Load respondents
    if (data.respondents && data.respondents.length > 0) {
      setRespondents(data.respondents);
    }
    
    // Load arbitration agreement
    if (data.arbitrationAgreement) {
      setArbitrationAgreement({
        agreementDate: data.arbitrationAgreement.agreementDate || '',
        agreementType: data.arbitrationAgreement.agreementType || '',
        agreementFile: null,
        signedAt: {
          taluka: data.arbitrationAgreement.signedAt?.taluka || '',
          city: data.arbitrationAgreement.signedAt?.city || '',
          district: data.arbitrationAgreement.signedAt?.district || '',
          state: data.arbitrationAgreement.signedAt?.state || ''
        },
        seatOfArbitration: data.arbitrationAgreement.seatOfArbitration || '',
        agreementBetween: {
          partyA: data.arbitrationAgreement.agreementBetween?.partyA || '',
          partyB: data.arbitrationAgreement.agreementBetween?.partyB || ''
        }
      });
    }
    
    // Load dispute details
    if (data.disputeDetails) {
      setDisputeDetails({
        disputeType: data.disputeDetails.disputeType || '',
        disputeCategory: data.disputeDetails.disputeCategory || '',
        disputeSubCategory: data.disputeDetails.disputeSubCategory || '',
        disputeAmount: data.disputeDetails.disputeAmount || '',
        disputeDescription: data.disputeDetails.disputeDescription || '',
        disputeDate: data.disputeDetails.disputeDate || '',
        hearingPreference: data.disputeDetails.hearingPreference || 'physical',
      });
    }
    
    // Load prayers
    if (data.prayers) {
      setPrayers({
        reliefs: data.prayers.reliefs || '',
      });
    }
    
    // Load arbitrator selection
    if (data.arbitratorSelection) {
      setArbitratorSelection({
        selectedArbitrators: data.arbitratorSelection.selectedArbitrators || [],
        preferredArbitrator: data.arbitratorSelection.preferredArbitrator || '',
      });
    }
    
    // Load arguments
    if (data.arguments) {
      setArgumentsData({
        arguments: data.arguments.arguments || '',
        argumentsFile: null,
      });
    }
  };

  // Load user's drafts
  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true);
      try {
        const drafts = await arbitrationApi.getDrafts();
        setDraftList(drafts || []);
      } catch (error: any) {
        console.error('Error loading drafts:', error);
        // If the endpoint returns 404, set an empty array and don't show error
        if (error.response?.status === 404) {
          console.log('Draft endpoint not found or not implemented, using empty array');
          setDraftList([]);
        } else {
          // For other errors, log but don't show toast as it might be handled elsewhere
          console.error('Error details:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error('Unexpected error in loadDrafts:', error);
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
      respondents: respondents,
      arbitrationAgreement: {
        agreementDate: arbitrationAgreement.agreementDate,
        agreementType: arbitrationAgreement.agreementType,
        signedAt: arbitrationAgreement.signedAt,
        seatOfArbitration: arbitrationAgreement.seatOfArbitration,
        agreementBetween: arbitrationAgreement.agreementBetween
      },
      disputeDetails: disputeDetails,
      prayers: prayers,
      arbitratorSelection: arbitratorSelection,
      arguments: argumentsData,
      id: currentDraftId || undefined,
    };

    // Add the structured data as a JSON string
    formData.append('data', JSON.stringify(arbitrationData));

    // Add files separately
    if (claimant.coi) formData.append('coi', claimant.coi as File);
    if (claimant.panCard) formData.append('panCard', claimant.panCard as File);
    if (claimant.gstCert) formData.append('gstCert', claimant.gstCert as File);
    
    if (arbitrationAgreement.agreementFile) {
      formData.append('agreementFile', arbitrationAgreement.agreementFile as File);
    }

    // Add supporting documents
    if (documents.supportingDocuments.length > 0) {
      documents.supportingDocuments.forEach((file, index) => {
        formData.append(`supportingDocuments_${index}`, file);
      });
    }
    
    // Add evidence files
    if (documents.evidenceFiles.length > 0) {
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
          throw submitError; // Re-throw to stop execution
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
          } else {
            throw new Error('Failed to save draft before submission');
          }
        } catch (directError: any) {
          console.error('Error in direct submission flow:', directError);
          const errorMessage = directError.message || 'Error submitting arbitration request';
          toast.error(errorMessage);
          throw directError;
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
      setIsSavingDraft(true);
      console.log("Creating form data for draft submission...");
      const formData = createFormData();
      
      // Log the current authentication status
      const token = localStorage.getItem('auth_token');
      console.log('Auth token available?', !!token);
      
      console.log("Submitting draft to API...");
      const response = await arbitrationApi.saveDraft(formData);
      console.log("Draft saved successfully:", response);
      
      if (response && response.id) {
        setCurrentDraftId(response.id);
      }
      
      setLastSaved(new Date());
      setFormChanged(false);
      toast.success('Draft saved successfully');
    } catch (error: any) { // Add proper type annotation
      console.error('Error saving draft:', error);
      // More detailed error logging
      if (error.response) {
        console.error('Server response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      toast.error('Failed to save draft. Please try again.');
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
            signedAt: {
              taluka: draft.arbitrationAgreement.signedAt?.taluka || '',
              city: draft.arbitrationAgreement.signedAt?.city || '',
              district: draft.arbitrationAgreement.signedAt?.district || '',
              state: draft.arbitrationAgreement.signedAt?.state || ''
            },
            seatOfArbitration: draft.arbitrationAgreement.seatOfArbitration || '',
            agreementBetween: {
              partyA: draft.arbitrationAgreement.agreementBetween?.partyA || '',
              partyB: draft.arbitrationAgreement.agreementBetween?.partyB || ''
            }
          });
        }
        
        // Load dispute details
        if (draft.disputeDetails) {
          setDisputeDetails({
            disputeType: draft.disputeDetails.disputeType || '',
            disputeCategory: draft.disputeDetails.disputeCategory || '',
            disputeSubCategory: draft.disputeDetails.disputeSubCategory || '',
            disputeAmount: draft.disputeDetails.disputeAmount || '',
            disputeDescription: draft.disputeDetails.disputeDescription || '',
            disputeDate: draft.disputeDetails.disputeDate || '',
            hearingPreference: draft.disputeDetails.hearingPreference || 'physical',
          });
        }
        
        // Load prayers
        if (draft.prayers) {
          setPrayers({
            reliefs: draft.prayers.reliefs || '',
          });
        }
        
        // Load arbitrator selection
        if (draft.arbitratorSelection) {
          setArbitratorSelection({
            selectedArbitrators: draft.arbitratorSelection.selectedArbitrators || [],
            preferredArbitrator: draft.arbitratorSelection.preferredArbitrator || '',
          });
        }
        
        // Load arguments
        if (draft.arguments) {
          setArgumentsData({
            arguments: draft.arguments.arguments || '',
            argumentsFile: null,
          });
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
    setRespondents([initialRespondent]);
    setArbitrationAgreement(initialArbitrationAgreement);
    setDisputeDetails(initialDisputeDetails);
    setPrayers(initialPrayers);
    setArbitratorSelection(initialArbitratorSelection);
    setArgumentsData(initialArgumentsData);
    setDocuments(initialDocuments);
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
      
      // Validate prayers and reliefs
      if (!prayers.reliefs) newErrors.reliefs = "Prayers/reliefs is required"
      
      // Optional: GST, CIN, COI, PAN card, GST cert validation
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
      
      // Validate signedAt fields
      if (!arbitrationAgreement.signedAt.city) newErrors["signedAt.city"] = "City is required"
      if (!arbitrationAgreement.signedAt.district) newErrors["signedAt.district"] = "District is required"
      if (!arbitrationAgreement.signedAt.state) newErrors["signedAt.state"] = "State is required"
      
      // Validate seatOfArbitration
      if (!arbitrationAgreement.seatOfArbitration) newErrors.seatOfArbitration = "Seat of arbitration is required"
      
      // Validate agreementBetween
      if (!arbitrationAgreement.agreementBetween.partyA) newErrors["agreementBetween.partyA"] = "Party A is required"
      if (!arbitrationAgreement.agreementBetween.partyB) newErrors["agreementBetween.partyB"] = "Party B is required"
      
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 4) {
      // Validate dispute details
      const newErrors: any = {}
      if (!disputeDetails.disputeType) newErrors.disputeType = "Dispute type is required"
      if (!disputeDetails.disputeCategory) newErrors.disputeCategory = "Category is required"
      if (!disputeDetails.disputeSubCategory) newErrors.disputeSubCategory = "Sub-category is required"
      if (!disputeDetails.disputeAmount) newErrors.disputeAmount = "Dispute amount is required"
      if (!disputeDetails.disputeDescription) newErrors.disputeDescription = "Dispute description is required"
      if (!disputeDetails.disputeDate) newErrors.disputeDate = "Dispute date is required"
      
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 5) {
      // Validate arbitrator selection
      const newErrors: any = {}
      if (arbitratorSelection.selectedArbitrators.length === 0) 
        newErrors.selectedArbitrators = "At least one arbitrator must be selected"
      
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
    } else if (activeStep === 7) {
      // Validate arguments
      const newErrors: any = {}
      if (!argumentsData.arguments && !argumentsData.argumentsFile) 
        newErrors.arguments = "Either arguments text or file is required"
      
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

  // Handle GST verification
  const handleVerifyGST = async (gstNumber: string) => {
    // Skip verification if GST is empty
    if (!gstNumber) {
      setVerificationStatus((prev) => ({
        ...prev,
        gst: null,
      }));
      return;
    }

    // Validate GST format first
    if (!validateGST(gstNumber)) {
      setVerificationStatus((prev) => ({
        ...prev,
        gst: {
          verified: false,
          message: "Invalid GST format. Format: 22AAAAA0000A1Z5"
        },
      }));
      return;
    }

    // Start verification
    setIsVerifying((prev) => ({
      ...prev,
      gst: true,
    }));

    try {
      const response = await api.verification.verifyGST(gstNumber);
      
      // Handle response
      if (response && response.valid) {
        setVerificationStatus((prev) => ({
          ...prev,
          gst: {
            verified: true,
            message: response.message || 'GST verified'
          },
        }));
      } else {
        throw new Error(response?.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('GST verification error:', error);
      setVerificationStatus((prev) => ({
        ...prev,
        gst: {
          verified: false,
          message: error.message || "GST verification failed"
        },
      }));
    } finally {
      setIsVerifying((prev) => ({
        ...prev,
        gst: false,
      }));
    }
  };

  // Handle PAN verification
  const handleVerifyPAN = async (panNumber: string) => {
    // Skip verification if PAN is empty
    if (!panNumber) {
      setVerificationStatus((prev) => ({
        ...prev,
        pan: null,
      }));
      return;
    }

    // Validate PAN format first
    if (!validatePAN(panNumber)) {
      setVerificationStatus((prev) => ({
        ...prev,
        pan: {
          verified: false,
          message: "Invalid PAN format. Format: AAAPL1234C"
        },
      }));
      return;
    }

    // Start verification
    setIsVerifying((prev) => ({
      ...prev,
      pan: true,
    }));

    try {
      const response = await api.verification.verifyPAN(panNumber);
      
      // Handle response
      if (response && response.valid) {
        setVerificationStatus((prev) => ({
          ...prev,
          pan: {
            verified: true,
            message: response.message || 'PAN verified'
          },
        }));
      } else {
        throw new Error(response?.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('PAN verification error:', error);
      setVerificationStatus((prev) => ({
        ...prev,
        pan: {
          verified: false,
          message: error.message || "PAN verification failed"
        },
      }));
    } finally {
      setIsVerifying((prev) => ({
        ...prev,
        pan: false,
      }));
    }
  };

  // Handle CIN verification
  const handleVerifyCIN = async (cinNumber: string) => {
    // Skip verification if CIN is empty
    if (!cinNumber) {
      setVerificationStatus((prev) => ({
        ...prev,
        cin: null,
      }));
      return;
    }

    // Validate CIN format first
    if (!validateCIN(cinNumber)) {
      setVerificationStatus((prev) => ({
        ...prev,
        cin: {
          verified: false,
          message: "Invalid CIN format. Format: U74140MH2014PTC123456"
        },
      }));
      return;
    }

    // Start verification
    setIsVerifying((prev) => ({
      ...prev,
      cin: true,
    }));

    try {
      const response = await api.verification.verifyCIN(cinNumber);
      
      // Handle response
      if (response && response.valid) {
        setVerificationStatus((prev) => ({
          ...prev,
          cin: {
            verified: true,
            message: response.message || 'CIN verified'
          },
        }));
      } else {
        throw new Error(response?.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('CIN verification error:', error);
      setVerificationStatus((prev) => ({
        ...prev,
        cin: {
          verified: false,
          message: error.message || "CIN verification failed"
        },
      }));
    } finally {
      setIsVerifying((prev) => ({
        ...prev,
        cin: false,
      }));
    }
  };

  const handleArgumentsChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, files } = e.target as any
    setArgumentsData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
    setFormChanged(true)
  }

  const handlePrayersChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setPrayers((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormChanged(true)
  }

  const handleArbitratorSelectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'selectedArbitrators') {
      // Convert comma-separated string to array
      const arbitratorArray = value.split(',').map(item => item.trim()).filter(item => item !== '')
      setArbitratorSelection((prev) => ({
        ...prev,
        selectedArbitrators: arbitratorArray,
      }))
    } else {
      setArbitratorSelection((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    
    setFormChanged(true)
  }

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files) {
      setDocuments((prev) => ({
        ...prev,
        [name]: Array.from(files),
      }))
      setFormChanged(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as any;
    
    setClaimant((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    
    setFormChanged(true);
    
    // Clear related errors when a field is edited
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldName: string
  ) => {
    const { value } = e.target;
    // Only allow digits and limit to 10 characters
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    
    setter((prev: any) => ({
      ...prev,
      [fieldName]: sanitizedValue,
    }));
    
    setFormChanged(true);
    
    // Clear phone error when field is edited
    if (errors[fieldName]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

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
            
            {/* Add Prayers & Reliefs section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="font-medium text-lg mb-4">Prayers & Reliefs*</h3>
              <textarea
                name="reliefs"
                value={prayers.reliefs}
                onChange={handlePrayersChange}
                placeholder="Enter prayers and reliefs"
                className="w-full border rounded px-2 py-1"
                rows={4}
              />
              {errors.reliefs && <div className="text-red-500 text-xs mt-1">{errors.reliefs}</div>}
            </div>
          </div>
        )
      
      case 1: // Additional Claimants & Manager
        // ... existing code ...
        
      case 2: // Respondent Details
        // ... existing code ...
        
      case 3: // Arbitration Agreement
        // ... existing code ...
        
      case 4: // Dispute Details
        // ... existing code ...
        
      case 5: // Arbitrator Selection
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Arbitrator Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Selected Arbitrators</label>
                <input
                  name="selectedArbitrators"
                  type="text"
                  value={arbitratorSelection.selectedArbitrators.join(', ')}
                  onChange={handleArbitratorSelectionChange}
                  placeholder="Enter arbitrator names"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Preferred Arbitrator</label>
                <input
                  name="preferredArbitrator"
                  value={arbitratorSelection.preferredArbitrator}
                  onChange={handleArbitratorSelectionChange}
                  placeholder="Enter preferred arbitrator name"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        )
        
      case 6: // Documents
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Supporting Documents</label>
                <input
                  name="supportingDocuments"
                  type="file"
                  multiple
                  onChange={handleDocumentsChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Evidence Files</label>
                <input
                  name="evidenceFiles"
                  type="file"
                  multiple
                  onChange={handleDocumentsChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
        )
        
      case 7: // Arguments
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Arguments</h3>
            <textarea
              name="arguments"
              value={argumentsData.arguments}
              onChange={handleArgumentsChange}
              placeholder="Enter arguments"
              className="w-full border rounded px-2 py-1"
              rows={4}
            />
            <input
              name="argumentsFile"
              type="file"
              onChange={handleDocumentsChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        )
        
      case 8: // Review & Submit
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
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Prayers & Reliefs</h4>
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Reliefs:</span> {prayers.reliefs}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Additional Claimants</h4>
                  {additionalClaimants.map((claimant, index) => (
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
                  ))}
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
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Date:</span> {arbitrationAgreement.agreementDate}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {arbitrationAgreement.agreementType}
                    </div>
                    <div>
                      <span className="font-medium">Seat of Arbitration:</span> {arbitrationAgreement.seatOfArbitration}
                    </div>
                    <div>
                      <span className="font-medium">Between:</span> {arbitrationAgreement.agreementBetween.partyA} and {arbitrationAgreement.agreementBetween.partyB}
                    </div>
                    <div>
                      <span className="font-medium">Signed at:</span> {arbitrationAgreement.signedAt.taluka && `${arbitrationAgreement.signedAt.taluka}, `}{arbitrationAgreement.signedAt.city}, {arbitrationAgreement.signedAt.district}, {arbitrationAgreement.signedAt.state}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dispute Details</h4>
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {disputeDetails.disputeType}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {disputeDetails.disputeCategory}
                    </div>
                    <div>
                      <span className="font-medium">SubCategory:</span> {disputeDetails.disputeSubCategory}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ₹{disputeDetails.disputeAmount}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {disputeDetails.disputeDate}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {disputeDetails.disputeDescription}
                    </div>
                    <div>
                      <span className="font-medium">Hearing Preference:</span> {disputeDetails.hearingPreference}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Arbitrator Selection</h4>
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Selected Arbitrators:</span> {arbitratorSelection.selectedArbitrators.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Preferred Arbitrator:</span> {arbitratorSelection.preferredArbitrator}
                    </div>
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
      {/* Error state */}
      {componentError.hasError && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold mb-2 text-red-700">Something went wrong</h2>
              <p className="text-red-600 mb-4">{componentError.message}</p>
              <Button 
                onClick={recoverFromError}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add draft list at the top if there are drafts */}
      {!componentError.hasError && draftList.length > 0 && (
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

      {!componentError.hasError && (
        <>
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
            <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
              {renderFormContent()}
            </CardContent>
          </Card>
          <div className="flex justify-between mt-8">
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
        </>
      )}
    </div>
  )
}
