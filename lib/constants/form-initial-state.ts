// Initial form state values

export const initialClaimant = {
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
};

export const initialAdditionalClaimant = {
  type: "",
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  pincode: "",
  address1: "",
  address2: "",
  city: "",
  district: "",
  state: "",
  country: "",
  gst: "",
  pan: "",
  cin: "",
  coi: null,
  panCard: null,
  gstCert: null,
};

export const initialManagerDetails = {
  type: "",
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  pincode: "",
  address1: "",
  address2: "",
  city: "",
  district: "",
  state: "",
  country: "",
  gst: "",
  pan: "",
  cin: "",
  coi: null,
  panCard: null,
  gstCert: null,
};

export const initialRespondent = {
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
};

export const initialArbitrationAgreement = {
  agreementDate: "",
  placeOfSigning: "",
  arbitrationText: "",
  stampDutyPercentage: "",
  numberOfArbitrators: "",
};

export const initialNatureOfDispute = [{
  category: "",
  subCategory: "",
  natureOfDispute: "",
  dateWhenRightToClaimArose: "",
  standardisedPrayerClauses: "",
}];

export const initialDisputeDescription = {
  claimType: "",
  claimReason: "",
  lawReliedUpon: "",
  relevantClauseNumber: "",
  clauseSupportingClaim: "",
  clause: "",
  documentSupportingClaim: "",
  reliefSought: "",
};

export const initialDocumentEvidence = {
  documentType: "",
  documentId: "",
  relevantClauseNumber: "",
  supportingClaimNumber: "",
  dateOfIssueSign: "",
  attachedDocuments: [],
};

export const initialPrayers = {
  prayers: [
    {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
      amount: "",
      reliefType: "monetary" as const
    }
  ],
};

export const initialDocuments = {
  supportingDocuments: [] as File[],
  evidenceFiles: [] as File[],
  documentTypes: {} as Record<string, string>,
  
  scannedDocuments: [] as Array<{
    file: File | null,
    description: string,
    isOCREnabled: boolean,
    linkedIssue: string,
    admissionStatus: "pending" | "admitted" | "denied",
    crossExaminationRef: string,
    date: string,
    extractedText?: string,
    keyMetadata?: Array<{key: string, value: string}>
  }>,
  
  affidavits: [] as Array<{
    type: "claimant" | "respondent" | "officer" | "witness",
    file: File | null,
    date: string,
    place: string,
    event: string,
    hasVerificationClause: boolean,
    deponentName: string,
    linkedIssue: string
  }>,
  
  electronicEvidence: [] as Array<{
    certificateFile: File | null,
    supportingFiles: File[],
    description: string,
    linkedIssue: string,
    tabulatedList: string
  }>,
  
  lawsReliedUpon: [] as Array<{
    category: "act" | "rule" | "regulation" | "case" | "other",
    reference: string,
    citation: string,
    paragraphNumbers: string,
    linkedIssue: string
  }>,
  
  issueDocumentMap: {} as Record<string, {
    affidavits: string[],
    documents: string[],
    laws: string[]
  }>
};

export const initialPayment = {
  paymentHead: "",
  paymentAmount: "",
  paymentDetails: "",
};

export const initialArguments = {
  argumentsPerPrayer: [] as Array<{
    prayerId: string;
    prayerTitle: string;
    argument: string;
    legalBasis?: string;
    factualBasis?: string;
    precedents?: string;
  }>,
};

export const initialFormState = {
  claimant: initialClaimant,
  additionalClaimants: [initialAdditionalClaimant],
  managerDetails: [initialManagerDetails],
  respondents: [initialRespondent],
  arbitrationAgreement: initialArbitrationAgreement,
  disputeDetails: initialDisputeDetails,
  prayers: initialPrayers,
  documents: initialDocuments,
  payment: initialPayment,
  arguments: initialArguments,
}; 

export const initialDisputeWithDocument = {
  id: undefined,
  title: "",
  description: "",
  category: "",
  subCategory: "",
  dateWhenRightToClaimArose: "",
  prayer: {
    id: undefined,
    title: "",
    description: "",
    reliefType: "monetary" as const,
    amount: "",
  },
  evidence: {
    id: undefined,
    documentType: "",
    relevantClauseNumber: "",
    dateOfIssue: "",
    description: "",
    attachedDocuments: [],
  },
};

export const initialArgumentWithPrayers = {
  id: undefined,
  title: "",
  description: "",
  legalBasis: "",
  prayers: [
    {
      id: undefined,
      title: "",
      description: "",
      reliefType: "monetary" as const,
      amount: "",
      priority: 1,
    },
  ],
}; 