import { z } from 'zod';

// Validation constants
const addressRegex = /^[^$%!~`*^+]*$/;
export const MAX_NAME_LENGTH = 100;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 100;
export const MAX_CITY_LENGTH = 50;
export const MAX_DISTRICT_LENGTH = 50;
export const MAX_STATE_LENGTH = 50;
export const MAX_COUNTRY_LENGTH = 50;
export const MAX_PINCODE_LENGTH = 6;
export const MAX_PHONE_LENGTH = 10;

// PAN Validation - Indian Permanent Account Number format: AAAPL1234C
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// CIN Validation - Corporate Identification Number format: U74140MH2014PTC123456
const cinRegex = /^[LU][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;

// GST Validation - GST Number format: 22AAAAA0000A1Z5
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Base contact schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters`),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(MAX_EMAIL_LENGTH, `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`),
  phoneCountryCode: z.string().default("+91"),
  phone: z.string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d{10}$/, "Phone number must contain only digits"),
});

// Claimant schema
export const claimantSchema = z.object({
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters`),
  pincode: z.string()
    .length(MAX_PINCODE_LENGTH, "Pincode must be exactly 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain only digits"),
  address1: z.string()
    .min(1, "Address Line 1 is required")
    .max(MAX_ADDRESS_LENGTH, `Address Line 1 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters"),
  address2: z.string()
    .max(MAX_ADDRESS_LENGTH, `Address Line 2 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters")
    .optional(),
  city: z.string()
    .min(1, "City is required")
    .max(MAX_CITY_LENGTH, `City cannot exceed ${MAX_CITY_LENGTH} characters`),
  district: z.string()
    .min(1, "District is required")
    .max(MAX_DISTRICT_LENGTH, `District cannot exceed ${MAX_DISTRICT_LENGTH} characters`),
  state: z.string()
    .min(1, "State is required")
    .max(MAX_STATE_LENGTH, `State cannot exceed ${MAX_STATE_LENGTH} characters`),
  country: z.string()
    .min(1, "Country is required")
    .max(MAX_COUNTRY_LENGTH, `Country cannot exceed ${MAX_COUNTRY_LENGTH} characters`),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(MAX_EMAIL_LENGTH, `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`),
  phoneCountryCode: z.string().default("+91"),
  phone: z.string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d{10}$/, "Phone number must contain only digits"),
  gst: z.string()
    .regex(gstRegex, "Invalid GST format. Should be like 22AAAAA0000A1Z5")
    .optional()
    .or(z.literal("")),
  pan: z.string()
    .regex(panRegex, "Invalid PAN format. Should be like AAAPL1234C")
    .optional()
    .or(z.literal("")),
  cin: z.string()
    .regex(cinRegex, "Invalid CIN format. Should be like U74140MH2014PTC123456")
    .optional()
    .or(z.literal("")),
  coi: z.any().optional(),
  panCard: z.any().optional(),
  gstCert: z.any().optional(),
});

// Additional claimant schema
export const additionalClaimantSchema = contactSchema.extend({
  pincode: z.string()
    .length(MAX_PINCODE_LENGTH, "Pincode must be exactly 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain only digits"),
  address1: z.string()
    .min(1, "Address Line 1 is required")
    .max(MAX_ADDRESS_LENGTH, `Address Line 1 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters"),
  address2: z.string()
    .max(MAX_ADDRESS_LENGTH, `Address Line 2 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters")
    .optional(),
  city: z.string()
    .min(1, "City is required")
    .max(MAX_CITY_LENGTH, `City cannot exceed ${MAX_CITY_LENGTH} characters`),
  district: z.string()
    .min(1, "District is required")
    .max(MAX_DISTRICT_LENGTH, `District cannot exceed ${MAX_DISTRICT_LENGTH} characters`),
  state: z.string()
    .min(1, "State is required")
    .max(MAX_STATE_LENGTH, `State cannot exceed ${MAX_STATE_LENGTH} characters`),
  country: z.string()
    .min(1, "Country is required")
    .max(MAX_COUNTRY_LENGTH, `Country cannot exceed ${MAX_COUNTRY_LENGTH} characters`),
});

// Manager details schema
export const managerSchema = contactSchema.extend({
  address: z.string()
    .max(MAX_ADDRESS_LENGTH, `Address cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters"),
  designation: z.string().min(1, "Designation is required").max(MAX_NAME_LENGTH),
  authority: z.string().min(1, "Authority is required").max(MAX_NAME_LENGTH),
});

// Respondent schema
export const respondentSchema = z.object({
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
  pincode: z.string()
    .length(MAX_PINCODE_LENGTH, "Pincode must be exactly 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain only digits"),
  address1: z.string()
    .min(1, "Address Line 1 is required")
    .max(MAX_ADDRESS_LENGTH, `Address Line 1 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters"),
  address2: z.string()
    .max(MAX_ADDRESS_LENGTH, `Address Line 2 cannot exceed ${MAX_ADDRESS_LENGTH} characters`)
    .regex(addressRegex, "Address contains invalid characters")
    .optional(),
  city: z.string()
    .min(1, "City is required")
    .max(MAX_CITY_LENGTH, `City cannot exceed ${MAX_CITY_LENGTH} characters`),
  district: z.string()
    .min(1, "District is required")
    .max(MAX_DISTRICT_LENGTH, `District cannot exceed ${MAX_DISTRICT_LENGTH} characters`),
  state: z.string()
    .min(1, "State is required")
    .max(MAX_STATE_LENGTH, `State cannot exceed ${MAX_STATE_LENGTH} characters`),
  country: z.string()
    .min(1, "Country is required")
    .max(MAX_COUNTRY_LENGTH, `Country cannot exceed ${MAX_COUNTRY_LENGTH} characters`),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(MAX_EMAIL_LENGTH, `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`),
  phoneCountryCode: z.string().default("+91"),
  phone: z.string()
    .regex(/^\d{10}$/, "Phone number must contain only digits")
    .optional(),
  gst: z.string()
    .regex(gstRegex, "Invalid GST format")
    .optional()
    .or(z.literal("")),
  pan: z.string()
    .regex(panRegex, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  cin: z.string()
    .regex(cinRegex, "Invalid CIN format")
    .optional()
    .or(z.literal("")),
});

// Arbitration agreement schema
export const arbitrationAgreementSchema = z.object({
  agreementDate: z.string().min(1, "Agreement date is required"),
  placeOfSigning: z.string().min(1, "Place of signing is required"),
  arbitrationText: z.string().min(1, "Text of Arbitration Agreement/clause is required").max(2000, "Text cannot exceed 2000 characters"),
  stampDutyPercentage: z.string().min(1, "Stamp duty percentage/amount is required"),
  numberOfArbitrators: z.string().min(1, "Number of Arbitrators is required"),
  agreementFile: z.any().optional(),
});

// Dispute details schema
export const disputeDetailsSchema = z.object({
  disputeType: z.string().min(1, "Dispute type is required"),
  disputeAmount: z.string().min(1, "Dispute amount is required"),
  disputeDescription: z.string().min(1, "Dispute description is required").max(2000),
  disputeDate: z.string().min(1, "Dispute date is required"),
  serviceType: z.string().min(1, "Service type is required"),
  applicableActs: z.array(z.string()).min(1, "At least one applicable act is required"),
  disputeCategory: z.string().min(1, "Dispute category is required"),
  disputeSubCategory: z.string().min(1, "Dispute sub-category is required"),
  natureOfDispute: z.string().min(1, "Nature of dispute is required"),
  factsOfCase: z.string().min(1, "Facts of case is required").max(2000),
  clauseReferences: z.string().min(1, "Clause references is required").max(500),
  claimType: z.string().min(1, "Claim type is required"),
  claimReason: z.string().min(1, "Claim reason is required").max(1000),
  lawsReliedUpon: z.string().min(1, "Laws relied upon is required").max(1000),
  clauseNumber: z.string().min(1, "Clause number/page number is required"),
  clauseSupportingClaim: z.string().min(1, "Clause supporting claim is required").max(1000),
  clause: z.string().min(1, "Clause is required").max(1000),
  documentSupportingClaim: z.string().min(1, "Document supporting claim is required"),
  reliefSought: z.string().min(1, "Relief sought is required").max(1000),
});

// Prayers schema
export const prayersSchema = z.object({
  prayers: z.string().min(1, "Prayers is required").max(3000),
});

// Documents schema
export const documentsSchema = z.object({
  supportingDocuments: z.array(z.any()).optional(),
  evidenceFiles: z.array(z.any()).optional(),
  documentTypes: z.record(z.string()).optional(),
  
  // Scanned Documents validation
  scannedDocuments: z.array(
    z.object({
      file: z.any(),
      description: z.string().min(1, "Description is required").optional(),
      isOCREnabled: z.boolean().default(false),
      linkedIssue: z.string().min(1, "Linked issue is required").optional(),
      admissionStatus: z.enum(["pending", "admitted", "denied"]).default("pending"),
      crossExaminationRef: z.string().optional(),
      date: z.string().min(1, "Document date is required").optional()
    })
  ).optional().default([]),
  
  // Affidavits validation
  affidavits: z.array(
    z.object({
      type: z.enum(["claimant", "respondent", "officer", "witness"]),
      file: z.any(),
      date: z.string().min(1, "Date is required"),
      place: z.string().min(1, "Place is required"),
      event: z.string().min(1, "Event is required"),
      hasVerificationClause: z.boolean().default(false),
      deponentName: z.string().min(1, "Deponent name is required"),
      linkedIssue: z.string().min(1, "Linked issue is required")
    })
  ).optional().default([]),
  
  // Electronic Evidence validation
  electronicEvidence: z.array(
    z.object({
      certificateFile: z.any(),
      supportingFiles: z.array(z.any()).default([]),
      description: z.string().min(1, "Description is required"),
      linkedIssue: z.string().min(1, "Linked issue is required"),
      tabulatedList: z.string().min(1, "Tabulated list is required")
    })
  ).optional().default([]),
  
  // Laws Relied Upon validation
  lawsReliedUpon: z.array(
    z.object({
      category: z.enum(["act", "rule", "regulation", "case", "other"]),
      reference: z.string().min(1, "Reference is required"),
      citation: z.string().min(1, "Citation is required"),
      paragraphNumbers: z.string().optional(),
      linkedIssue: z.string().min(1, "Linked issue is required")
    })
  ).optional().default([]),
  
  // Document indexing by issue
  issueDocumentMap: z.record(
    z.object({
      affidavits: z.array(z.string()).default([]),
      documents: z.array(z.string()).default([]),
      laws: z.array(z.string()).default([])
    })
  ).optional().default({})
});

// Payment schema
export const paymentSchema = z.object({
  paymentHead: z.string().min(1, "Payment head is required"),
  paymentAmount: z.string().min(1, "Payment amount is required"),
  paymentDetails: z.string().min(1, "Payment details is required").max(1000),
});

// Arguments schema
export const argumentsSchema = z.object({
  argumentsPerIssue: z.array(z.string()).min(1, "At least one argument is required"),
});

// Complete form schema
export const formSchema = z.object({
  claimant: claimantSchema,
  additionalClaimants: z.array(additionalClaimantSchema),
  managerDetails: z.array(managerSchema),
  respondents: z.array(respondentSchema).min(1, "At least one respondent is required"),
  arbitrationAgreement: arbitrationAgreementSchema,
  disputeDetails: disputeDetailsSchema,
  prayers: prayersSchema,
  documents: documentsSchema,
  payment: paymentSchema,
  arguments: argumentsSchema,
});

// Define form data type
export type FormData = z.infer<typeof formSchema>;
export type ClaimantData = z.infer<typeof claimantSchema>;
export type AdditionalClaimantData = z.infer<typeof additionalClaimantSchema>;
export type ManagerData = z.infer<typeof managerSchema>;
export type RespondentData = z.infer<typeof respondentSchema>;
export type ArbitrationAgreementData = z.infer<typeof arbitrationAgreementSchema>;
export type DisputeDetailsData = z.infer<typeof disputeDetailsSchema>;
export type PrayersData = z.infer<typeof prayersSchema>;
export type DocumentsData = z.infer<typeof documentsSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type ArgumentsData = z.infer<typeof argumentsSchema>; 