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
};

export const initialPrayers = {
  prayers: "",
};

export const initialDocuments = {
  supportingDocuments: [] as File[],
  evidenceFiles: [] as File[],
  documentTypes: {} as Record<string, string>,
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