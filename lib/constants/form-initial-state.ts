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
};

export const initialManagerDetails = {
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phone: "",
  address: "",
  designation: "",
  authority: "",
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
};

export const initialArbitrationAgreement = {
  agreementDate: "",
  agreementType: "",
  agreementFile: null,
  resolutionMode: "",
  seatOfArbitration: "",
  signedOnPlace: "",
  agreementParties: "",
  arbitratorSelection: "",
  placeOfSigning: "",
  arbitrationText: "",
  stampDutyPercentage: "",
  stampDutyAmount: "",
  numberOfArbitrators: "",
};

export const initialDisputeDetails = {
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
  claimType: "",
  claimReason: "",
  lawsReliedUpon: "",
  clauseNumber: "",
  clauseSupportingClaim: "",
  clause: "",
  documentSupportingClaim: "",
  reliefSought: "",
};

export const initialPrayers = {
  prayers: "",
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
    date: string
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
  argumentsPerIssue: [] as string[],
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