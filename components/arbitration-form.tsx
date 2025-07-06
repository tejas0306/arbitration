"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { arbitrationApi, auth, api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DocumentsTabs from './evidence/DocumentsTabs';

// Add validation constants and regex at the top of the file
const addressRegex = /^[^$%!~`*^+]*$/;
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 200;
const MAX_EMAIL_LENGTH = 100;
const MAX_CITY_LENGTH = 50;
const MAX_DISTRICT_LENGTH = 50;
const MAX_STATE_LENGTH = 50;
const MAX_COUNTRY_LENGTH = 50;
const MAX_PINCODE_LENGTH = 6;
const MAX_PHONE_LENGTH = 10;
const MAX_GST_LENGTH = 15;
const MIN_GST_LENGTH = 15;
const MAX_PAN_LENGTH = 10;
const MIN_PAN_LENGTH = 10;
const MAX_CIN_LENGTH = 21;
const MIN_CIN_LENGTH = 21;
const MAX_ARBITRATION_FIELD_LENGTH = 200;
const MAX_DISPUTE_AMOUNT = 1000000000; // 1 billion
const MAX_DISPUTE_AMOUNT_LENGTH = 12;
const MAX_APPLICABLE_ACTS_LENGTH = 500;
const MAX_PAYMENT_AMOUNT = 1000000000; // 1 billion
const MAX_PAYMENT_AMOUNT_LENGTH = 12;

// Utility function to truncate text based on maximum length
const truncate = (value: string, maxLength: number): string => {
  return value.slice(0, maxLength);
};

// The useDebounce hook would be moved to a separate file (hooks/useDebounce.ts)
// and imported like: import { useDebounce } from '@/hooks/useDebounce';

const steps = [
  "Claimant Details",
  "Additional Claimants & Manager",
  "Respondent Details",
  "Arbitration Agreement",
  "Nature of Dispute",
  "Dispute Description",
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
  pincode: "",
  address1: "",
  address2: "",
  city: "",
  district: "",
  state: "",
  country: "",
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
}

const initialArbitrationAgreement = {
  agreementDate: "",
  placeOfSigning: "",
  arbitrationText: "",
  stampDutyPercentage: "",
  numberOfArbitrators: "",
}

const initialNatureOfDispute = {
  category: "",
  subCategory: "",
  natureOfDispute: "",
  dateWhenRightToClaimArose: "",
  standardisedPrayerClauses: "",
};

const initialDisputeDescription = {
  claimType: "",
  claimReason: "",
  lawReliedUpon: "",
  relevantClauseNumber: "",
  clauseSupportingClaim: "",
  clause: "",
  documentSupportingClaim: "",
  reliefSought: "",
};

const initialDocumentEvidence = {
  documentType: "",
  documentId: "",
  relevantClauseNumber: "",
  supportingClaimNumber: "",
  dateOfIssueSign: "",
  attachedDocuments: [],
};

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
};

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
  data?: any; // The actual form data
  files?: Record<string, File | null>; // Optional files
}

// components/FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  max?: string; // Add max property for date inputs
  error?: string;
  placeholder?: string;
  options?: Array<{ value: string, label: string }>;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  max,
  error,
  placeholder,
  options
}) => {
  const id = `field-${name}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let newValue = e.target.value;
    
    // Handle pincode - only allow numeric input and limit to 6 digits
    if (name.includes('pincode') && type === 'text') {
      newValue = newValue.replace(/\D/g, '').slice(0, 6);
    } 
    // Handle phone number - only allow numeric input
    else if (name.includes('phone') && !name.includes('phoneCountryCode') && type === 'text') {
      newValue = newValue.replace(/\D/g, '').slice(0, MAX_PHONE_LENGTH);
    }
    // Handle PAN formatting (10 characters: AAAPL1234C)
    else if (name.includes('pan') && type === 'text') {
      // Convert to uppercase
      newValue = newValue.toUpperCase();
      
      // Apply PAN format: 5 letters + 4 digits + 1 letter
      if (newValue.length > 5) {
        // Allow only digits for the middle 4 characters (position 5-8)
        const firstPart = newValue.slice(0, 5);
        let middlePart = '';
        let lastPart = '';
        
        // Extract digits for middle part (positions 5-8)
        if (newValue.length > 5) {
          const remainingChars = newValue.slice(5);
          const digitsOnly = remainingChars.replace(/[^0-9]/g, '').slice(0, 4);
          middlePart = digitsOnly;
          
          // Extract last character (should be a letter)
          if (remainingChars.length > 4) {
            const lastChar = remainingChars.slice(4).replace(/[^A-Z]/g, '').slice(0, 1);
            lastPart = lastChar;
          }
        }
        
        newValue = firstPart + middlePart + lastPart;
      }
    } 
    // Handle GST formatting (15 characters, convert to uppercase)
    else if (name.includes('gst') && type === 'text') {
      newValue = newValue.toUpperCase();
    } 
    // Handle CIN formatting (21 characters, convert to uppercase)
    else if (name.includes('cin') && type === 'text') {
      newValue = newValue.toUpperCase();
    }
    
    // Create a new event with the modified value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
    
    onChange(newEvent);
  };
  
  // Determine if this is a business identifier field
  const isBusinessId = name.includes('pan') || name.includes('gst') || name.includes('cin');
  const isPhoneField = name.includes('phone') && !name.includes('phoneCountryCode');
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1">
        {label}{required && '*'}
      </label>
      
      {type === "select" ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className={`w-full border rounded px-2 py-1 ${error ? 'border-red-500' : ''}`}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={name.includes('pincode') ? 'numeric' : undefined}
          pattern={name.includes('pincode') ? '[0-9]*' : undefined}
          style={isBusinessId ? { textTransform: 'uppercase' } : undefined}
          className={`w-full border rounded px-2 py-1 ${error ? 'border-red-500' : ''}`}
        />
      )}
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

// TextAreaField component for multiline inputs
interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  maxLength?: number;
  error?: string;
  placeholder?: string;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  maxLength,
  error,
  placeholder,
  rows = 4
}) => {
  const id = `field-${name}`;
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1">
        {label}{required && '*'}
      </label>
      
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border rounded px-2 py-1 ${error ? 'border-red-500' : ''}`}
      />
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

// Controlled form field components
interface ControlledFormFieldProps extends Omit<FormFieldProps, 'value' | 'onChange'> {
  control: Control<any>;
  name: string;
  defaultValue?: string;
}

export const ControlledFormField: React.FC<ControlledFormFieldProps> = ({
  control,
  name,
  label,
  type = "text",
  required = false,
  maxLength,
  max,
  error,
  placeholder,
  options,
  defaultValue = "",
}) => {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormField
          label={label}
          name={name}
          value={field.value || ""}
          onChange={field.onChange}
          type={type}
          required={required}
          maxLength={maxLength}
          max={max}
          error={fieldState.error?.message || error}
          placeholder={placeholder}
          options={options}
        />
      )}
    />
  );
};

interface ControlledTextAreaFieldProps extends Omit<TextAreaFieldProps, 'value' | 'onChange'> {
  control: Control<any>;
  name: string;
  defaultValue?: string;
}

export const ControlledTextAreaField: React.FC<ControlledTextAreaFieldProps> = ({
  control,
  name,
  label,
  required = false,
  maxLength,
  error,
  placeholder,
  rows = 4,
  defaultValue = "",
}) => {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <TextAreaField
          label={label}
          name={name}
          value={field.value || ""}
          onChange={field.onChange}
          required={required}
          maxLength={maxLength}
          error={fieldState.error?.message || error}
          placeholder={placeholder}
          rows={rows}
        />
      )}
    />
  );
};

// Add a FileField component for file uploads
interface FileFieldProps {
  label: string;
  name: string;
  onChange: (file: File | null | File[]) => void;
  required?: boolean;
  error?: string;
  accept?: string;
  multiple?: boolean;
}

export const FileField: React.FC<FileFieldProps> = ({
  label,
  name,
  onChange,
  required = false,
  error,
  accept,
  multiple = false,
}) => {
  const id = `field-${name}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  
  // Get existing file info from the parent component's files state
  const existingFile = (window as any).currentFiles?.[name];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple) {
      const files = e.target.files ? Array.from(e.target.files) : [];
      onChange(files);
      setFileNames(files.map(f => f.name));
        } else {
      const file = e.target.files && e.target.files[0];
      onChange(file || null);
      setFileNames(file ? [file.name] : []);
    }
  };
  
  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(multiple ? [] : null);
    setFileNames([]);
  };
  
  // Show existing file name if available
  const displayFileNames = fileNames.length > 0 ? fileNames : 
    (existingFile && existingFile.name ? [existingFile.name] : []);
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1">
        {label}{required && '*'}
      </label>
      
      <div className="flex flex-col">
        <input
          id={id}
          type="file"
          name={name}
          ref={fileInputRef}
          onChange={handleChange}
          multiple={multiple}
          accept={accept}
          className={`w-full border rounded px-2 py-1 ${error ? 'border-red-500' : ''}`}
        />
        
        {displayFileNames.length > 0 && (
          <div className="mt-2">
            {displayFileNames.map((name, index) => (
              <div key={index} className="text-sm flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="mr-2">📎 {name}</span>
                {existingFile && existingFile.isExisting && fileNames.length === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xs">(Previously uploaded)</span>
                    {existingFile.path && (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(`/api/arbitration/files/${existingFile.path.split('/').pop()}`, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button 
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 mt-1"
            >
              Clear {multiple ? 'files' : 'file'}
            </button>
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

// Define your validation schema
const formSchema = z.object({
  // Claimant details
  claimant: z.object({
    type: z.string().min(1, "Type is required"),
    name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
    pincode: z.string()
      .min(6, "Pincode must be 6 digits")
      .max(6, "Pincode must be 6 digits")
      .regex(/^\d{6}$/, "Must be a valid 6-digit pincode"),
    address1: z.string().min(1, "Address is required").max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters"),
    address2: z.string().max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters").optional(),
    city: z.string().min(1, "City is required").max(MAX_CITY_LENGTH),
    district: z.string().min(1, "District is required").max(MAX_DISTRICT_LENGTH),
    state: z.string().min(1, "State is required").max(MAX_STATE_LENGTH),
    country: z.string().min(1, "Country is required").max(MAX_COUNTRY_LENGTH),
    email: z.string().min(1, "Email is required").max(MAX_EMAIL_LENGTH)
      .email("Must be a valid email address"),
    phone: z.string().min(10, "Phone is required").max(MAX_PHONE_LENGTH)
      .regex(/^\d{10}$/, "Must be a valid 10-digit phone number"),
    phoneCountryCode: z.string().default("+91"),
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    // File fields don't need validation here as they're handled separately
  }),
  
  // Additional Claimants
  additionalClaimants: z.array(z.object({
    name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
    email: z.string().email("Must be a valid email").max(MAX_EMAIL_LENGTH),
    phone: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number"),
    phoneCountryCode: z.string().default("+91"),
    pincode: z.string()
      .min(6, "Pincode must be 6 digits")
      .max(6, "Pincode must be 6 digits")
      .regex(/^\d{6}$/, "Must be a valid 6-digit pincode"),
    address1: z.string().min(1, "Address is required").max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters"),
    address2: z.string().max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters").optional(),
    city: z.string().min(1, "City is required").max(MAX_CITY_LENGTH),
    district: z.string().min(1, "District is required").max(MAX_DISTRICT_LENGTH),
    state: z.string().min(1, "State is required").max(MAX_STATE_LENGTH),
    country: z.string().min(1, "Country is required").max(MAX_COUNTRY_LENGTH),
  })).default([]),
  
  // Manager details - change to array
  managerDetails: z.array(z.object({
    name: z.string().max(MAX_NAME_LENGTH),
    email: z.string().email("Must be a valid email").max(MAX_EMAIL_LENGTH).optional(),
    phone: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number").optional(),
    address: z.string().max(MAX_ADDRESS_LENGTH).optional(),
    designation: z.string().max(MAX_NAME_LENGTH).optional(),
    authority: z.string().max(MAX_NAME_LENGTH).optional(),
    phoneCountryCode: z.string().default("+91"),
  })).default([]),
  
  // Respondent details
  respondents: z.array(z.object({
    type: z.string().min(1, "Type is required"),
    name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
    pincode: z.string()
      .min(6, "Pincode must be 6 digits")
      .max(6, "Pincode must be 6 digits")
      .regex(/^\d{6}$/, "Must be a valid 6-digit pincode"),
    address1: z.string().min(1, "Address is required").max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters"),
    address2: z.string().max(MAX_ADDRESS_LENGTH)
      .regex(addressRegex, "Address contains invalid characters").optional(),
    city: z.string().min(1, "City is required").max(MAX_CITY_LENGTH),
    district: z.string().min(1, "District is required").max(MAX_DISTRICT_LENGTH),
    state: z.string().min(1, "State is required").max(MAX_STATE_LENGTH),
    country: z.string().min(1, "Country is required").max(MAX_COUNTRY_LENGTH),
    email: z.string().min(1, "Email is required").max(MAX_EMAIL_LENGTH)
      .email("Must be a valid email address"),
    phone: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number").optional(),
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    phoneCountryCode: z.string().default("+91"),
  })).min(1, "At least one respondent is required"),
  
  // Arbitration Agreement
  arbitrationAgreement: z.object({
    agreementDate: z.string().min(1, "Agreement date is required")
      .refine(val => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(val);
        selected.setHours(0, 0, 0, 0);
        return selected <= today;
      }, "Agreement date cannot be in the future"),
    placeOfSigning: z.string().min(1, "Place of signing is required").max(MAX_ARBITRATION_FIELD_LENGTH, `Must be at most ${MAX_ARBITRATION_FIELD_LENGTH} characters`),
    arbitrationText: z.string().min(1, "Text of Arbitration Agreement/clause is required").max(2000, "Text cannot exceed 2000 characters"),
    stampDutyPercentage: z.string().min(1, "Stamp duty percentage/amount is required"),
    numberOfArbitrators: z.string().min(1, "Number of Arbitrators is required"),
    // agreementFile handled separately
  }),
  
  // Nature of Dispute
  natureOfDispute: z.object({
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().min(1, "Sub Category is required"),
    natureOfDispute: z.string().min(1, "Nature of Dispute is required"),
    dateWhenRightToClaimArose: z.string().min(1, "Date when right to claim arose is required")
      .refine(val => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(val);
        selected.setHours(0, 0, 0, 0);
        return selected <= today;
      }, "Date cannot be in the future"),
    standardisedPrayerClauses: z.string().min(1, "Standardised prayer clauses is required"),
  }),

  // Dispute Description (can be multiple)
  disputeDescriptions: z.array(z.object({
    claimType: z.string().min(1, "Claim Type is required"),
    claimReason: z.string().min(1, "Claim Reason is required"),
    lawReliedUpon: z.string().min(1, "Law relied upon by Claimant is required"),
    relevantClauseNumber: z.string().min(1, "Relevant Clause Number/Page Number is required"),
    clauseSupportingClaim: z.string().min(1, "Clause Supporting Claim is required"),
    clause: z.string().min(1, "Clause is required"),
    documentSupportingClaim: z.string().min(1, "Document Supporting Claim is required"),
    reliefSought: z.string().min(1, "Relief Sought is required"),
  })).min(1, "At least one dispute description is required"),

  // Documents/Evidence (can be multiple) - Made optional since we removed the duplicate step
  documentsEvidence: z.array(z.object({
    documentType: z.string().min(1, "Document Type is required"),
    documentId: z.string().optional(), // Auto generated
    relevantClauseNumber: z.string().min(1, "Relevant Clause Number/Page Number is required"),
    supportingClaimNumber: z.string().min(1, "Supporting Claim Number is required"),
    dateOfIssueSign: z.string().min(1, "Date of Issue/Sign of the document is required"),
    attachedDocuments: z.array(z.any()).min(1, "At least one document must be attached"),
  })).optional().default([]),
  
  // Prayers & Reliefs
  prayers: z.object({
    prayers: z.string().min(1, "Prayers & reliefs is required").max(3000),
  }),
  
  // Documents - Handled separately as they are File objects
  
  // Payment
  payment: z.object({
    paymentHead: z.string().min(1, "Payment head is required"),
    paymentAmount: z.string().min(1, "Payment amount is required")
      .max(MAX_PAYMENT_AMOUNT_LENGTH, `Must be at most ${MAX_PAYMENT_AMOUNT_LENGTH} digits`)
      .regex(/^\d+$/, "Must contain only digits")
      .refine(val => parseInt(val) <= MAX_PAYMENT_AMOUNT, `Amount cannot exceed ${MAX_PAYMENT_AMOUNT.toLocaleString()}`),
    paymentDetails: z.string().min(1, "Payment details is required").max(1000),
  }),
  
  // Arguments
  arguments: z.object({
    argumentsPerIssue: z.array(z.string().max(2000))
      .min(1, "At least one argument is required"),
  }),
  
  documents: z.object({
    supportingDocuments: z
      .array(z.instanceof(File))
      .optional(),
    evidenceFiles: z.array(z.instanceof(File)).optional(),
    documentTypes: z.record(z.string(), z.string()).optional(),
    
    // Add the new document fields
    scannedDocuments: z.array(
      z.object({
        file: z.any(),
        description: z.string().min(1, "Description is required").optional(),
        isOCREnabled: z.boolean().default(false),
        linkedIssue: z.string().min(1, "Linked issue is required").optional(),
        admissionStatus: z.enum(["pending", "admitted", "denied"]).default("pending"),
        crossExaminationRef: z.string().optional()
      })
    ).optional().default([]),
    
    affidavits: z.array(
      z.object({
        type: z.enum(["claimant", "respondent", "officer", "witness"]),
        file: z.any(),
        date: z.string().min(1, "Date is required").optional(),
        place: z.string().min(1, "Place is required").optional(),
        event: z.string().min(1, "Event is required").optional(),
        hasVerificationClause: z.boolean().default(false),
        deponentName: z.string().min(1, "Deponent name is required").optional(),
        linkedIssue: z.string().min(1, "Linked issue is required").optional()
      })
    ).optional().default([]),
    
    electronicEvidence: z.array(
      z.object({
        certificateFile: z.any(),
        supportingFiles: z.array(z.any()).default([]),
        description: z.string().min(1, "Description is required").optional(),
        linkedIssue: z.string().min(1, "Linked issue is required").optional(),
        tabulatedList: z.string().min(1, "Tabulated list is required").optional()
      })
    ).optional().default([]),
    
    lawsReliedUpon: z.array(
      z.object({
        category: z.enum(["act", "rule", "regulation", "case", "other"]),
        reference: z.string().min(1, "Reference is required").optional(),
        citation: z.string().min(1, "Citation is required").optional(),
        paragraphNumbers: z.string().optional(),
        linkedIssue: z.string().min(1, "Linked issue is required").optional()
      })
    ).optional().default([]),
    
    issueDocumentMap: z.record(
      z.object({
        affidavits: z.array(z.string()).default([]),
        documents: z.array(z.string()).default([]),
        laws: z.array(z.string()).default([])
      })
    ).optional().default({})
  }),
});

// Define the form schema type
type FormData = z.infer<typeof formSchema>;

// Type for arguments field array item
type ArgumentItem = string;

// Add an interface for location data response
interface LocationResponse {
  success: boolean;
  country: string;
  state: string;
  district: string;
  cities: string[];
}

// Update the location response interface to match the actual API response
interface PostOffice {
  Name: string;
  Description: string;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  State: string;
  Country: string;
}

interface PincodeResponse {
  Message: string;
  Status: string;
  PostOffice: PostOffice[] | null;
}

// Create a specialized PhoneField component with country code selector
interface PhoneFieldProps {
  control: Control<any>;
  phoneFieldName: string;
  countryCodeFieldName: string;
  label: string;
  required?: boolean;
  error?: string;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  control,
  phoneFieldName,
  countryCodeFieldName,
  label,
  required = false,
  error,
}) => {
  return (
    <div>
      <label htmlFor={phoneFieldName} className="block text-sm mb-1">
        {label}{required && '*'}
      </label>
      <div className="flex">
        <div className="w-2/5 pr-2">
          <Controller
            control={control}
            name={countryCodeFieldName}
            defaultValue="+91"
            render={({ field }) => (
              <select
                value={field.value}
                onChange={field.onChange}
                className="w-full border rounded px-2 py-1"
              >
                {countryCodes.map((cc) => (
                  <option key={cc.code} value={cc.code}>
                    {cc.code} ({cc.country})
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="w-3/5">
          <Controller
            control={control}
            name={phoneFieldName}
            render={({ field, fieldState }) => (
              <>
                <input
                  type="text"
                  value={field.value || ""}
                  onChange={(e) => {
                    // Only allow numbers and limit to 10 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, MAX_PHONE_LENGTH);
                    field.onChange(value);
                  }}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={MAX_PHONE_LENGTH}
                  className={`w-full border rounded px-2 py-1 ${fieldState.error ? 'border-red-500' : ''}`}
                />
                {fieldState.error && (
                  <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>
                )}
              </>
            )}
          />
        </div>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      <p className="text-xs text-gray-500 mt-1">Enter a valid phone number with country code</p>
    </div>
  );
};

interface ArbitrationFormProps {
  initialData?: any;
  petitionId?: string;
}

function ArbitrationForm({ initialData, petitionId }: ArbitrationFormProps = {}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  
  // State for UI and non-form data
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftList, setDraftList] = useState<ArbitrationDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // Replace state with ref for timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formChanged, setFormChanged] = useState(false);
  
  // Keep track of processed pincodes to avoid infinite loading
  const processedPincodes = useRef<Record<string, boolean>>({});
  
  // Location lookup state
  const [stateOptions, setStateOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string, label: string }>>([]);
  
  // File management state - Store files separately from form data
  const [files, setFiles] = useState<Record<string, File | null>>({});
  
  // Make files accessible to FileField components
  useEffect(() => {
    (window as any).currentFiles = files;
  }, [files]);
  
  // Check authentication status on component mount - using an empty dependency array to run only once
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Use the correct auth methods that are available
        const isLoggedIn = await auth.isAuthenticated();
        
        if (isMounted) {
          setIsAuthenticated(isLoggedIn);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once
  
  // Separate effect for fetching drafts when authenticated
  useEffect(() => {
    // Only fetch drafts when authenticated
    if (isAuthenticated) {
      const fetchDrafts = async () => {
        try {
          setIsLoadingDrafts(true);
          const drafts = await arbitrationApi.getDrafts();
          setDraftList(drafts);
        } catch (error) {
          console.error("Error fetching drafts:", error);
          toast.error("Failed to load drafts");
        } finally {
          setIsLoadingDrafts(false);
        }
      };

      fetchDrafts();
    }
  }, [isAuthenticated]); // Only depends on authentication state

  // Email/Phone verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Additional claimant verification states (arrays to handle multiple claimants)
  const [additionalClaimantEmailVerified, setAdditionalClaimantEmailVerified] = useState<boolean[]>([]);
  const [additionalClaimantPhoneVerified, setAdditionalClaimantPhoneVerified] = useState<boolean[]>([]);
  
  // Main claimant verification states
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [sentEmailOTP, setSentEmailOTP] = useState("");
  const [sentPhoneOTP, setSentPhoneOTP] = useState("");
  
  // Additional claimant modal states
  const [showAdditionalEmailOTP, setShowAdditionalEmailOTP] = useState<boolean[]>([]);
  const [showAdditionalPhoneOTP, setShowAdditionalPhoneOTP] = useState<boolean[]>([]);
  const [additionalEmailOTP, setAdditionalEmailOTP] = useState<string[]>([]);
  const [additionalPhoneOTP, setAdditionalPhoneOTP] = useState<string[]>([]);
  const [sentAdditionalEmailOTP, setSentAdditionalEmailOTP] = useState<string[]>([]);
  const [sentAdditionalPhoneOTP, setSentAdditionalPhoneOTP] = useState<string[]>([]);
  
  const stepRefs = useRef<(HTMLElement | null)[]>(Array(steps.length).fill(null));
  
  // Setup React Hook Form
  const { 
    control,
    handleSubmit, 
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors: formErrors, isValid, isDirty }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      claimant: initialClaimant,
      additionalClaimants: [initialAdditionalClaimant],
      managerDetails: [initialManagerDetails],
      respondents: [initialRespondent],
      arbitrationAgreement: initialArbitrationAgreement,
      natureOfDispute: initialNatureOfDispute,
      disputeDescriptions: [initialDisputeDescription],
      documentsEvidence: [initialDocumentEvidence],
      prayers: initialPrayers,
      payment: initialPayment,
      arguments: initialArguments,
      documents: {
        supportingDocuments: [],
        evidenceFiles: [],
        documentTypes: {},
      },
    }
  });
  
  // Setup field arrays for dynamic fields
  const { 
    fields: additionalClaimantFields, 
    append: appendAdditionalClaimant,
    remove: removeAdditionalClaimantField
  } = useFieldArray({
    control,
    name: "additionalClaimants",
  });
  
  const { 
    fields: managerFields, 
    append: appendManager,
    remove: removeManagerField
  } = useFieldArray({
    control,
    name: "managerDetails",
  });
  
  const { 
    fields: respondentFields, 
    append: appendRespondent,
    remove: removeRespondentField
  } = useFieldArray({
    name: "respondents",
    control,
  });
  
  const { 
    fields: argumentFields, 
    append: appendArgument,
    remove: removeArgumentField
  } = useFieldArray({
    control,
    name: "arguments.argumentsPerIssue" as any, // Type assertion to work around TypeScript error
  });

  // Field arrays for new dispute structure
  const { 
    fields: disputeDescriptionFields, 
    append: appendDisputeDescription,
    remove: removeDisputeDescription
  } = useFieldArray({
    control,
    name: "disputeDescriptions",
  });

  // Removed documentsEvidence field array since we eliminated the duplicate Documents/Evidence step
  
  // Watch form values
  const formValues = watch();

  // Effect to load initial data when in edit mode (after useForm is defined)
  useEffect(() => {
    if (initialData && petitionId) {
      
      // Set edit mode and current draft ID
      setEditMode(true);
      setCurrentDraftId(petitionId);
      
      // Transform the data to match the form structure
      const loadInitialData = () => {
        try {
          let completeFormData;
          
          // Check if we have the new formData structure, otherwise fallback to reconstruction
          if (initialData.formData && typeof initialData.formData === 'object') {
  
            completeFormData = {
              claimant: initialData.formData.claimant || initialClaimant,
              additionalClaimants: initialData.formData.additionalClaimants || [initialAdditionalClaimant],
              managerDetails: Array.isArray(initialData.formData.managerDetails) 
                ? initialData.formData.managerDetails 
                : initialData.formData.managerDetails 
                  ? [initialData.formData.managerDetails] 
                  : [initialManagerDetails],
              respondents: initialData.formData.respondents || [initialRespondent],
              arbitrationAgreement: initialData.formData.arbitrationAgreement || initialArbitrationAgreement,
              natureOfDispute: initialData.formData.natureOfDispute || initialNatureOfDispute,
              disputeDescriptions: initialData.formData.disputeDescriptions || [initialDisputeDescription],
              documentsEvidence: initialData.formData.documentsEvidence || [initialDocumentEvidence],
              prayers: initialData.formData.prayers || initialPrayers,
              documents: initialData.formData.documents || initialDocuments,
              payment: initialData.formData.payment || initialPayment,
              arguments: initialData.formData.arguments || initialArguments,
            };
          } else {
            // Fallback: reconstruct from flattened data (old format)
            const managerDetails = Array.isArray(initialData.managerDetails) 
              ? initialData.managerDetails 
              : initialData.managerDetails 
                ? [initialData.managerDetails] 
                : [initialManagerDetails];
            
            completeFormData = {
              claimant: {
                type: initialData.type || initialClaimant.type,
                name: initialData.name || initialClaimant.name,
                pincode: initialData.pincode || initialClaimant.pincode,
                address1: initialData.address1 || initialClaimant.address1,
                address2: initialData.address2 || initialClaimant.address2,
                city: initialData.city || initialClaimant.city,
                district: initialData.district || initialClaimant.district,
                state: initialData.state || initialClaimant.state,
                country: initialData.country || initialClaimant.country,
                email: initialData.email || initialClaimant.email,
                phoneCountryCode: initialData.phoneCountryCode || initialClaimant.phoneCountryCode,
                phone: initialData.phone || initialClaimant.phone,
                gst: initialData.gst || initialClaimant.gst,
                pan: initialData.pan || initialClaimant.pan,
                cin: initialData.cin || initialClaimant.cin,
              },
              additionalClaimants: initialData.additionalClaimants || [initialAdditionalClaimant],
              managerDetails: managerDetails,
              respondents: initialData.respondents || [initialRespondent],
              arbitrationAgreement: initialData.arbitrationAgreement || initialArbitrationAgreement,
              natureOfDispute: initialData.natureOfDispute || initialNatureOfDispute,
              disputeDescriptions: initialData.disputeDescriptions || [initialDisputeDescription],
              documentsEvidence: initialData.documentsEvidence || [initialDocumentEvidence],
              prayers: initialData.prayers || initialPrayers,
              documents: initialData.documents || initialDocuments,
              payment: initialData.payment || initialPayment,
              arguments: initialData.arguments || initialArguments,
            };
          }
          
          // Reset the form with the loaded data
          reset(completeFormData);
          
          // Update field arrays
          if (completeFormData.disputeDescriptions && completeFormData.disputeDescriptions.length > 0) {
            setValue('disputeDescriptions', completeFormData.disputeDescriptions);
          }
          
          if (completeFormData.documentsEvidence && completeFormData.documentsEvidence.length > 0) {
            setValue('documentsEvidence', completeFormData.documentsEvidence);
          }
          
                                // CRITICAL FIX: Restore file metadata for file visibility
          if (initialData.fileMetadata) {
            // Create a file metadata state for display purposes
            const fileDisplayState: Record<string, any> = {};
            
            Object.keys(initialData.fileMetadata).forEach(fieldName => {
              const fileInfo = initialData.fileMetadata[fieldName];
              if (fileInfo && fileInfo.name) {
                // Create a mock file object for display
                fileDisplayState[fieldName] = {
                  name: fileInfo.name,
                  size: fileInfo.size,
                  type: fileInfo.type,
                  path: fileInfo.path,
                  isExisting: true, // Flag to indicate this is an existing file
                };
              }
            });
            
            setFiles(fileDisplayState);
            
            // ENHANCEMENT: Also populate DocumentsTabs file fields
            // Map backend field names to frontend form structure
            const documentsData = completeFormData.documents || {};
            
            // Handle scanned documents
            if (documentsData.scannedDocuments) {
              documentsData.scannedDocuments.forEach((doc: any, index: number) => {
                const fieldName = `scannedDoc_${index}`;
                if (initialData.fileMetadata[fieldName]) {
                  // Set the file info in the form data
                  setValue(`documents.scannedDocuments.${index}.file`, {
                    name: initialData.fileMetadata[fieldName].name,
                    isExisting: true,
                    path: initialData.fileMetadata[fieldName].path
                  });
                }
              });
            }
            
            // Handle affidavits
            if (documentsData.affidavits) {
              documentsData.affidavits.forEach((affidavit: any, index: number) => {
                const fieldName = `affidavit_${index}`;
                if (initialData.fileMetadata[fieldName]) {
                  setValue(`documents.affidavits.${index}.file`, {
                    name: initialData.fileMetadata[fieldName].name,
                    isExisting: true,
                    path: initialData.fileMetadata[fieldName].path
                  });
                }
              });
            }
            
            // Handle electronic evidence
            if (documentsData.electronicEvidence) {
              documentsData.electronicEvidence.forEach((evidence: any, index: number) => {
                const certificateFieldName = `certificate_${index}`;
                if (initialData.fileMetadata[certificateFieldName]) {
                  setValue(`documents.electronicEvidence.${index}.certificateFile`, {
                    name: initialData.fileMetadata[certificateFieldName].name,
                    isExisting: true,
                    path: initialData.fileMetadata[certificateFieldName].path
                  });
                }
                
                // Handle supporting files
                const supportingFieldName = `supporting_files_${index}`;
                if (initialData.fileMetadata[supportingFieldName]) {
                  setValue(`documents.electronicEvidence.${index}.supportingFiles`, [{
                    name: initialData.fileMetadata[supportingFieldName].name,
                    isExisting: true,
                    path: initialData.fileMetadata[supportingFieldName].path
                  }]);
                }
              });
            }
          } else if (initialData.files) {
            // Fallback to old format
            setFiles(initialData.files);
          }
            
            // CRITICAL FIX: Restore verification states if available
            if (initialData.verificationStates) {
              setEmailVerified(initialData.verificationStates.emailVerified || false);
              setPhoneVerified(initialData.verificationStates.phoneVerified || false);
              setAdditionalClaimantEmailVerified(initialData.verificationStates.additionalClaimantEmailVerified || []);
              setAdditionalClaimantPhoneVerified(initialData.verificationStates.additionalClaimantPhoneVerified || []);
            } else {
              // In edit mode or when loading existing data, assume verification is already done
              // This prevents asking for re-verification of already saved data
              setEmailVerified(true);
              setPhoneVerified(true);
              setAdditionalClaimantEmailVerified(Array(additionalClaimantFields.length).fill(true));
              setAdditionalClaimantPhoneVerified(Array(additionalClaimantFields.length).fill(true));
            }
          
          // CRITICAL FIX: Restore verification states in edit mode
          if (initialData.verificationStates) {
            setEmailVerified(initialData.verificationStates.emailVerified || false);
            setPhoneVerified(initialData.verificationStates.phoneVerified || false);
            setAdditionalClaimantEmailVerified(initialData.verificationStates.additionalClaimantEmailVerified || []);
            setAdditionalClaimantPhoneVerified(initialData.verificationStates.additionalClaimantPhoneVerified || []);
          } else {
            // For existing data without verification states, assume verified if email/phone exist
            const hasEmail = completeFormData.claimant?.email;
            const hasPhone = completeFormData.claimant?.phone;
            
            if (hasEmail) setEmailVerified(true);
            if (hasPhone) setPhoneVerified(true);
            
            // Set verification for additional claimants
            if (completeFormData.additionalClaimants) {
              const emailStates = completeFormData.additionalClaimants.map(ac => !!ac.email);
              const phoneStates = completeFormData.additionalClaimants.map(ac => !!ac.phone);
              setAdditionalClaimantEmailVerified(emailStates);
              setAdditionalClaimantPhoneVerified(phoneStates);
            }
          }
          
          toast.success('Case data loaded successfully');
        } catch (error: any) {
          toast.error(`Error loading case data: ${error.message}`);
        }
      };
      
      loadInitialData();
    }
  }, [initialData, petitionId]); // Removed reset and setValue from dependencies to avoid circular dependency
  
  // Watch for pincode changes and fetch location data
  const pincode = watch('claimant.pincode');
  
  // Initialize processedPincodes when component mounts
  useEffect(() => {
    processedPincodes.current = {};
  }, []);
  
  // Track all respondent pincodes
  const respondentPincodes = watch('respondents')?.map(r => r.pincode) || [];
  
  // Track all additional claimant pincodes
  const additionalClaimantPincodes = watch('additionalClaimants')?.map(ac => ac.pincode) || [];
  
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      const fetchLocationData = async () => {
        try {
          // Use the actual Indian postal pincode API
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json() as PincodeResponse[];
          
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            
            // Extract unique cities from all post offices
            const cities = Array.from(new Set(data[0].PostOffice.map(po => po.Name)));
            
            // Convert to option objects for dropdowns
            setCountryOptions([{ value: postOffice.Country, label: postOffice.Country }]);
            setStateOptions([{ value: postOffice.State, label: postOffice.State }]);
            setDistrictOptions([{ value: postOffice.District, label: postOffice.District }]);
            setCityOptions(cities.map(city => ({ value: city, label: city })));
            
            // Update form fields with new values
            setValue('claimant.country', postOffice.Country);
            setValue('claimant.state', postOffice.State);
            setValue('claimant.district', postOffice.District);
            setValue('claimant.city', cities[0] || "");
            
            toast.success(`Pincode ${pincode} found, location details loaded.`);
          } else {
            toast.error(`No data found for pincode ${pincode}`);
          }
        } catch (error) {
          console.error("Error fetching location data:", error);
          toast.error(`Error fetching location data for pincode ${pincode}`);
        }
      };
      
      fetchLocationData();
    }
  }, [pincode, setValue]);
  
  // Watch for respondent pincode changes
  useEffect(() => {
    // Check if we have any respondent with a valid pincode
    if (respondentPincodes && respondentPincodes.length > 0) {
      respondentPincodes.forEach((respPincode, index) => {
        // Keep track of processed pincodes to avoid infinite loading
        const processedPincodeKey = `respondent_${index}_${respPincode}`;
        if (respPincode && respPincode.length === 6 && !processedPincodes.current[processedPincodeKey]) {
          // Mark this pincode as processed
          processedPincodes.current[processedPincodeKey] = true;
          
          const fetchRespondentLocationData = async () => {
            try {
              // Use the actual Indian postal pincode API
              const response = await fetch(`https://api.postalpincode.in/pincode/${respPincode}`);
              const data = await response.json() as PincodeResponse[];
              
              if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                const postOffice = data[0].PostOffice[0];
                
                // Extract unique cities from all post offices
                const cities = Array.from(new Set(data[0].PostOffice.map(po => po.Name)));
                
                // Update form fields with new values for this specific respondent
                setValue(`respondents.${index}.country`, postOffice.Country);
                setValue(`respondents.${index}.state`, postOffice.State);
                setValue(`respondents.${index}.district`, postOffice.District);
                setValue(`respondents.${index}.city`, cities[0] || "");
                
                // CRITICAL FIX: Update location options for respondent forms
                setCountryOptions(prev => {
                  const existing = prev.find(opt => opt.value === postOffice.Country);
                  if (!existing) {
                    return [...prev, { value: postOffice.Country, label: postOffice.Country }];
                  }
                  return prev;
                });
                
                setStateOptions(prev => {
                  const existing = prev.find(opt => opt.value === postOffice.State);
                  if (!existing) {
                    return [...prev, { value: postOffice.State, label: postOffice.State }];
                  }
                  return prev;
                });
                
                setDistrictOptions(prev => {
                  const existing = prev.find(opt => opt.value === postOffice.District);
                  if (!existing) {
                    return [...prev, { value: postOffice.District, label: postOffice.District }];
                  }
                  return prev;
                });
                
                setCityOptions(prev => {
                  const newCities = cities.map(city => ({ value: city, label: city }));
                  const existingValues = prev.map(opt => opt.value);
                  const filteredNewCities = newCities.filter(city => !existingValues.includes(city.value));
                  return [...prev, ...filteredNewCities];
                });
                
                toast.success(`Respondent ${index + 1}: Pincode ${respPincode} found, location details loaded.`);
              } else {
                toast.error(`No data found for respondent ${index + 1} pincode ${respPincode}`);
              }
            } catch (error) {
              console.error(`Error fetching location data for respondent ${index + 1}:`, error);
              toast.error(`Error fetching location data for respondent ${index + 1} pincode ${respPincode}`);
            }
          };
          
          fetchRespondentLocationData();
        }
      });
    }
  }, [respondentPincodes, setValue]);

  // Watch for additional claimant pincode changes
  useEffect(() => {
    // Check if we have any additional claimant with a valid pincode
    if (additionalClaimantPincodes && additionalClaimantPincodes.length > 0) {
      additionalClaimantPincodes.forEach((acPincode, index) => {
        // Keep track of processed pincodes to avoid infinite loading
        const processedPincodeKey = `additional_claimant_${index}_${acPincode}`;
        if (acPincode && acPincode.length === 6 && !processedPincodes.current[processedPincodeKey]) {
          // Mark this pincode as processed
          processedPincodes.current[processedPincodeKey] = true;
          
          const fetchAdditionalClaimantLocationData = async () => {
            try {
              // Use the actual Indian postal pincode API
              const response = await fetch(`https://api.postalpincode.in/pincode/${acPincode}`);
              const data = await response.json() as PincodeResponse[];
              
              if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                const postOffice = data[0].PostOffice[0];
                
                // Extract unique cities from all post offices
                const cities = Array.from(new Set(data[0].PostOffice.map(po => po.Name)));
                
                // Update form fields with new values
                setValue(`additionalClaimants.${index}.country`, postOffice.Country);
                setValue(`additionalClaimants.${index}.state`, postOffice.State);
                setValue(`additionalClaimants.${index}.district`, postOffice.District);
                setValue(`additionalClaimants.${index}.city`, cities[0] || "");
                
                toast.success(`Additional Claimant ${index + 1}: Pincode ${acPincode} found, location details loaded.`);
              } else {
                toast.error(`No data found for Additional Claimant ${index + 1} pincode ${acPincode}`);
              }
            } catch (error) {
              console.error(`Error fetching location data for Additional Claimant ${index + 1}:`, error);
              toast.error(`Error fetching location data for Additional Claimant ${index + 1} pincode ${acPincode}`);
            }
          };
          
          fetchAdditionalClaimantLocationData();
        }
      });
    }
  }, [additionalClaimantPincodes, setValue]);
  
  // Watch for identifier changes and validate them
  const gstNumber = watch('claimant.gst');
  const panNumber = watch('claimant.pan');
  const cinNumber = watch('claimant.cin');
  
  // Watch for email and phone changes to auto-verify if they match existing data
  const currentEmail = watch('claimant.email');
  const currentPhone = watch('claimant.phone');
  
  useEffect(() => {
    // Auto-verify if email/phone match the initial loaded data (existing verified data)
    if (initialData && (editMode || petitionId)) {
      const initialEmail = initialData.email || initialData.claimant?.email || initialData.formData?.claimant?.email;
      const initialPhone = initialData.phone || initialData.claimant?.phone || initialData.formData?.claimant?.phone;
      
      if (currentEmail && currentEmail === initialEmail && !emailVerified) {
        setEmailVerified(true);
      }
      if (currentPhone && currentPhone === initialPhone && !phoneVerified) {
        setPhoneVerified(true);
      }
    }
  }, [currentEmail, currentPhone, initialData, editMode, petitionId, emailVerified, phoneVerified]);
  
  // Watch for additional claimant email/phone changes to auto-verify
  const additionalClaimants = watch('additionalClaimants') || [];
  
  useEffect(() => {
    // Auto-verify additional claimants if their email/phone match existing data
    if (initialData && (editMode || petitionId) && additionalClaimants.length > 0) {
      const initialAdditionalClaimants = initialData.additionalClaimants || initialData.formData?.additionalClaimants || [];
      
      additionalClaimants.forEach((claimant, index) => {
        if (initialAdditionalClaimants[index]) {
          const initialEmail = initialAdditionalClaimants[index].email;
          const initialPhone = initialAdditionalClaimants[index].phone;
          
          if (claimant.email && claimant.email === initialEmail && !additionalClaimantEmailVerified[index]) {
            setAdditionalClaimantEmailVerified(prev => {
              const newVerified = [...prev];
              newVerified[index] = true;
              return newVerified;
            });
          }
          
          if (claimant.phone && claimant.phone === initialPhone && !additionalClaimantPhoneVerified[index]) {
            setAdditionalClaimantPhoneVerified(prev => {
              const newVerified = [...prev];
              newVerified[index] = true;
              return newVerified;
            });
          }
        }
      });
    }
  }, [additionalClaimants, initialData, editMode, petitionId, additionalClaimantEmailVerified, additionalClaimantPhoneVerified]);
  
  // Helper functions for field arrays
  const addAdditionalClaimant = () => {
    appendAdditionalClaimant(initialAdditionalClaimant);
    // Add verification states for the new claimant
    setAdditionalClaimantEmailVerified(prev => [...prev, false]);
    setAdditionalClaimantPhoneVerified(prev => [...prev, false]);
    // Add modal states for the new claimant
    setShowAdditionalEmailOTP(prev => [...prev, false]);
    setShowAdditionalPhoneOTP(prev => [...prev, false]);
    setAdditionalEmailOTP(prev => [...prev, ""]);
    setAdditionalPhoneOTP(prev => [...prev, ""]);
    setSentAdditionalEmailOTP(prev => [...prev, ""]);
    setSentAdditionalPhoneOTP(prev => [...prev, ""]);
  };

  const removeAdditionalClaimant = (index: number) => {
    removeAdditionalClaimantField(index);
    // Remove verification states for the removed claimant
    setAdditionalClaimantEmailVerified(prev => prev.filter((_, i) => i !== index));
    setAdditionalClaimantPhoneVerified(prev => prev.filter((_, i) => i !== index));
    // Remove modal states for the removed claimant
    setShowAdditionalEmailOTP(prev => prev.filter((_, i) => i !== index));
    setShowAdditionalPhoneOTP(prev => prev.filter((_, i) => i !== index));
    setAdditionalEmailOTP(prev => prev.filter((_, i) => i !== index));
    setAdditionalPhoneOTP(prev => prev.filter((_, i) => i !== index));
    setSentAdditionalEmailOTP(prev => prev.filter((_, i) => i !== index));
    setSentAdditionalPhoneOTP(prev => prev.filter((_, i) => i !== index));
  };
  
  const addManager = () => {
    appendManager(initialManagerDetails);
  };
  
  const addRespondent = () => {
    // Use the updated initialRespondent structure from form-initial-state.ts
    appendRespondent({
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
    });
  };
  
  const addArgument = () => {
    appendArgument("" as any); // Type assertion to work around TypeScript error
  };

  const addDisputeDescription = () => {
    appendDisputeDescription(initialDisputeDescription);
  };

  // Removed addDocumentEvidence function since we eliminated the duplicate Documents/Evidence step

  // Verification functions
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  const sendEmailVerification = async () => {
    const email = watch('claimant.email');
    if (!email) {
      toast.error('Please enter an email address first');
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const otp = generateOTP();
    setSentEmailOTP(otp);
    setShowEmailOTP(true);
    
    // In a real application, you would send this OTP via email
    // For demo purposes, we'll show it in a toast
    toast.success(`Email OTP sent to ${email}. Demo OTP: ${otp}`);
  };

  const sendPhoneVerification = async () => {
    const phone = watch('claimant.phone');
    if (!phone) {
      toast.error('Please enter a phone number first');
      return;
    }
    
    // Validate phone format (exactly 10 digits)
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    const otp = generateOTP();
    setSentPhoneOTP(otp);
    setShowPhoneOTP(true);
    
    // In a real application, you would send this OTP via SMS
    // For demo purposes, we'll show it in a toast
    toast.success(`SMS OTP sent to ${phone}. Demo OTP: ${otp}`);
  };

  const verifyEmailOTP = () => {
    if (emailOTP === sentEmailOTP) {
      setEmailVerified(true);
      setShowEmailOTP(false);
      setEmailOTP("");
      toast.success('Email verified successfully!');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const verifyPhoneOTP = () => {
    if (phoneOTP === sentPhoneOTP) {
      setPhoneVerified(true);
      setShowPhoneOTP(false);
      setPhoneOTP("");
      toast.success('Phone verified successfully!');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  // Additional claimant verification functions
  const sendAdditionalClaimantEmailVerification = async (index: number) => {
    const email = watch(`additionalClaimants.${index}.email`);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      // Generate OTP for demo
      const otp = generateOTP();
      
      toast.success(`Demo OTP sent to ${email}: ${otp}`);
      
      // Update arrays to show modal for this specific claimant
      const newSentOTPs = [...sentAdditionalEmailOTP];
      const newShowModals = [...showAdditionalEmailOTP];
      
      // Ensure arrays are large enough
      while (newSentOTPs.length <= index) newSentOTPs.push("");
      while (newShowModals.length <= index) newShowModals.push(false);
      
      newSentOTPs[index] = otp;
      newShowModals[index] = true;
      
      setSentAdditionalEmailOTP(newSentOTPs);
      setShowAdditionalEmailOTP(newShowModals);
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  const sendAdditionalClaimantPhoneVerification = async (index: number) => {
    const phone = watch(`additionalClaimants.${index}.phone`);
    const countryCode = watch(`additionalClaimants.${index}.phoneCountryCode`);
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    try {
      // Generate OTP for demo
      const otp = generateOTP();
      
      toast.success(`Demo OTP sent to ${countryCode} ${phone}: ${otp}`);
      
      // Update arrays to show modal for this specific claimant
      const newSentOTPs = [...sentAdditionalPhoneOTP];
      const newShowModals = [...showAdditionalPhoneOTP];
      
      // Ensure arrays are large enough
      while (newSentOTPs.length <= index) newSentOTPs.push("");
      while (newShowModals.length <= index) newShowModals.push(false);
      
      newSentOTPs[index] = otp;
      newShowModals[index] = true;
      
      setSentAdditionalPhoneOTP(newSentOTPs);
      setShowAdditionalPhoneOTP(newShowModals);
    } catch (error) {
      toast.error('Failed to send verification SMS');
    }
  };

  const verifyAdditionalClaimantEmailOTP = (index: number) => {
    const enteredOTP = additionalEmailOTP[index] || "";
    const sentOTP = sentAdditionalEmailOTP[index] || "";
    
    if (enteredOTP === sentOTP) {
      // Mark as verified
      const newEmailVerified = [...additionalClaimantEmailVerified];
      newEmailVerified[index] = true;
      setAdditionalClaimantEmailVerified(newEmailVerified);
      
      // Hide modal and clear OTP
      const newShowModals = [...showAdditionalEmailOTP];
      const newOTPs = [...additionalEmailOTP];
      newShowModals[index] = false;
      newOTPs[index] = "";
      setShowAdditionalEmailOTP(newShowModals);
      setAdditionalEmailOTP(newOTPs);
      
      toast.success(`Email verified successfully for Additional Claimant ${index + 1}`);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const verifyAdditionalClaimantPhoneOTP = (index: number) => {
    const enteredOTP = additionalPhoneOTP[index] || "";
    const sentOTP = sentAdditionalPhoneOTP[index] || "";
    
    if (enteredOTP === sentOTP) {
      // Mark as verified
      const newPhoneVerified = [...additionalClaimantPhoneVerified];
      newPhoneVerified[index] = true;
      setAdditionalClaimantPhoneVerified(newPhoneVerified);
      
      // Hide modal and clear OTP
      const newShowModals = [...showAdditionalPhoneOTP];
      const newOTPs = [...additionalPhoneOTP];
      newShowModals[index] = false;
      newOTPs[index] = "";
      setShowAdditionalPhoneOTP(newShowModals);
      setAdditionalPhoneOTP(newOTPs);
      
      toast.success(`Phone verified successfully for Additional Claimant ${index + 1}`);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const verifyAdditionalClaimantEmail = (index: number) => {
    // Simulate email verification
    const newEmailVerified = [...additionalClaimantEmailVerified];
    newEmailVerified[index] = true;
    setAdditionalClaimantEmailVerified(newEmailVerified);
    toast.success('Email verified successfully');
  };

  const verifyAdditionalClaimantPhone = (index: number) => {
    // Simulate phone verification
    const newPhoneVerified = [...additionalClaimantPhoneVerified];
    newPhoneVerified[index] = true;
    setAdditionalClaimantPhoneVerified(newPhoneVerified);
    toast.success('Phone number verified successfully');
  };

  // Helper functions for OTP input handling
  const handleAdditionalEmailOTPChange = (index: number, value: string) => {
    const newOTPs = [...additionalEmailOTP];
    while (newOTPs.length <= index) newOTPs.push("");
    newOTPs[index] = value.replace(/\D/g, '').slice(0, 6);
    setAdditionalEmailOTP(newOTPs);
  };

  const handleAdditionalPhoneOTPChange = (index: number, value: string) => {
    const newOTPs = [...additionalPhoneOTP];
    while (newOTPs.length <= index) newOTPs.push("");
    newOTPs[index] = value.replace(/\D/g, '').slice(0, 6);
    setAdditionalPhoneOTP(newOTPs);
  };

  const closeAdditionalEmailModal = (index: number) => {
    const newShowModals = [...showAdditionalEmailOTP];
    const newOTPs = [...additionalEmailOTP];
    newShowModals[index] = false;
    newOTPs[index] = "";
    setShowAdditionalEmailOTP(newShowModals);
    setAdditionalEmailOTP(newOTPs);
  };

  const closeAdditionalPhoneModal = (index: number) => {
    const newShowModals = [...showAdditionalPhoneOTP];
    const newOTPs = [...additionalPhoneOTP];
    newShowModals[index] = false;
    newOTPs[index] = "";
    setShowAdditionalPhoneOTP(newShowModals);
    setAdditionalPhoneOTP(newOTPs);
  };
  
  // Validate current step
  const validateCurrentStep = async (isDraftSave = false) => {
    let fieldsToValidate: Array<keyof FormData | string> = [];
    
    switch (activeStep) {
      case 0: // Claimant Details
        fieldsToValidate = [
          'claimant.type', 'claimant.name', 'claimant.pincode', 
          'claimant.address1', 'claimant.city', 'claimant.district', 
          'claimant.state', 'claimant.country', 'claimant.email', 
          'claimant.phone'
        ];
        
        // Check if email and phone are verified (skip if already verified or in edit mode)
        if (!emailVerified) {
          toast.error('Please verify your email address before proceeding');
          return false;
        }
        if (!phoneVerified) {
          toast.error('Please verify your phone number before proceeding');
          return false;
        }
        
        // Check required document uploads (only when not saving draft)
        if (!isDraftSave) {
          if (!files['claimant.coi']) {
            toast.error('Certificate of Incorporation (COI) is required');
            return false;
          }
          if (!files['claimant.panCard']) {
            toast.error('PAN Card document is required');
            return false;
          }
          if (!files['claimant.gstCert']) {
            toast.error('GST Registration Certificate is required');
            return false;
          }
        }
        break;
      case 1: // Additional Claimants & Manager
        // Validate managers if any exist
        managerFields.forEach((_, index) => {
          // If name is provided, validate required fields
          if (formValues.managerDetails?.[index]?.name) {
            fieldsToValidate.push(
              `managerDetails.${index}.name`,
              `managerDetails.${index}.designation`,
              `managerDetails.${index}.authority`
            );
            
            // If email is provided, validate it's in correct format
            if (formValues.managerDetails?.[index]?.email) {
              fieldsToValidate.push(`managerDetails.${index}.email`);
            }
            
            // If phone is provided, validate it's in correct format
            if (formValues.managerDetails?.[index]?.phone) {
              fieldsToValidate.push(`managerDetails.${index}.phone`);
            }
          }
        });
        
        // Validate additional claimants if any exist
        additionalClaimantFields.forEach((_, index) => {
          fieldsToValidate.push(
            `additionalClaimants.${index}.name`,
            `additionalClaimants.${index}.email`,
            `additionalClaimants.${index}.phone`,
            `additionalClaimants.${index}.pincode`,
            `additionalClaimants.${index}.address1`,
            `additionalClaimants.${index}.city`,
            `additionalClaimants.${index}.district`,
            `additionalClaimants.${index}.state`,
            `additionalClaimants.${index}.country`
          );
        });
        
        // Check if additional claimant email and phone are verified (skip if already verified or in edit mode)
        for (let index = 0; index < additionalClaimantFields.length; index++) {
          if (!additionalClaimantEmailVerified[index]) {
            toast.error(`Please verify email for Additional Claimant ${index + 1}`);
            return false;
          }
          if (!additionalClaimantPhoneVerified[index]) {
            toast.error(`Please verify phone number for Additional Claimant ${index + 1}`);
            return false;
          }
        }
        break;
      case 2: // Respondent Details
        respondentFields.forEach((_, index) => {
          fieldsToValidate.push(
            `respondents.${index}.type`,
            `respondents.${index}.name`, 
            `respondents.${index}.email`,
            `respondents.${index}.pincode`,
            `respondents.${index}.address1`,
            `respondents.${index}.city`,
            `respondents.${index}.district`,
            `respondents.${index}.state`,
            `respondents.${index}.country`
          );
        });
        break;
      case 3: // Arbitration Agreement
        fieldsToValidate = [
          'arbitrationAgreement.agreementDate', 'arbitrationAgreement.placeOfSigning',
          'arbitrationAgreement.arbitrationText', 'arbitrationAgreement.stampDutyPercentage',
          'arbitrationAgreement.numberOfArbitrators'
        ];
        break;
      case 4: // Nature of Dispute
        fieldsToValidate = [
          'natureOfDispute.category', 'natureOfDispute.subCategory',
          'natureOfDispute.natureOfDispute', 'natureOfDispute.dateWhenRightToClaimArose',
          'natureOfDispute.standardisedPrayerClauses'
        ];
        break;
      case 5: // Dispute Description
        // Validate all dispute descriptions
        const disputeDescriptions = watch('disputeDescriptions') || [];
        if (disputeDescriptions.length === 0) {
          toast.error('Please add at least one dispute description');
          return false;
        }
        
        for (let i = 0; i < disputeDescriptions.length; i++) {
          const fieldPaths = [
            `disputeDescriptions.${i}.claimType`,
            `disputeDescriptions.${i}.claimReason`,
            `disputeDescriptions.${i}.lawReliedUpon`,
            `disputeDescriptions.${i}.relevantClauseNumber`,
            `disputeDescriptions.${i}.clauseSupportingClaim`,
            `disputeDescriptions.${i}.clause`,
            `disputeDescriptions.${i}.documentSupportingClaim`,
            `disputeDescriptions.${i}.reliefSought`
          ];
          const result = await trigger(fieldPaths as any);
          if (!result) return false;
        }
        return true;
      case 6: // Prayers & Reliefs
        fieldsToValidate = ['prayers.prayers'];
        break;
      case 7: // Documents
        // Check at least one of the document types has been uploaded
        const scannedDocs = watch('documents.scannedDocuments') || [];
        const affidavits = watch('documents.affidavits') || [];
        const electronicEvidence = watch('documents.electronicEvidence') || [];
        const oldSupportingDocs = watch('documents.supportingDocuments') || [];
        
        // Ensure at least one document of any type exists
        if (
          scannedDocs.length === 0 &&
          affidavits.length === 0 &&
          electronicEvidence.length === 0 &&
          oldSupportingDocs.length === 0
        ) {
          toast.error('Please upload at least one document or affidavit');
          return false;
        }
        
        // Validate any scanned documents that exist
        if (scannedDocs.length > 0) {
          for (let i = 0; i < scannedDocs.length; i++) {
            const fieldPaths = [
              `documents.scannedDocuments.${i}.file`,
              `documents.scannedDocuments.${i}.description`,
              `documents.scannedDocuments.${i}.linkedIssue`,
              `documents.scannedDocuments.${i}.date`
            ];
            const result = await trigger(fieldPaths as any);
            if (!result) return false;
          }
        }
        
        // Validate any affidavits that exist
        if (affidavits.length > 0) {
          for (let i = 0; i < affidavits.length; i++) {
            const fieldPaths = [
              `documents.affidavits.${i}.file`,
              `documents.affidavits.${i}.type`,
              `documents.affidavits.${i}.deponentName`,
              `documents.affidavits.${i}.date`,
              `documents.affidavits.${i}.place`,
              `documents.affidavits.${i}.event`,
              `documents.affidavits.${i}.linkedIssue`
            ];
            const result = await trigger(fieldPaths as any);
            if (!result) return false;
          }
        }
        
        // Validate any electronic evidence that exist
        if (electronicEvidence.length > 0) {
          for (let i = 0; i < electronicEvidence.length; i++) {
            const fieldPaths = [
              `documents.electronicEvidence.${i}.certificateFile`,
              `documents.electronicEvidence.${i}.description`,
              `documents.electronicEvidence.${i}.linkedIssue`,
              `documents.electronicEvidence.${i}.tabulatedList`
            ];
            const result = await trigger(fieldPaths as any);
            if (!result) return false;
          }
        }
        
        // For backward compatibility, check old supporting documents field
        if (oldSupportingDocs.length > 0) {
          await trigger('documents.supportingDocuments' as any);
        }
        
        return true;
      case 8: // Payment
        fieldsToValidate = [
          'payment.paymentHead', 'payment.paymentAmount', 'payment.paymentDetails'
        ];
        break;
      case 9: // Arguments
        if (argumentFields.length > 0) {
          argumentFields.forEach((_, index) => {
            fieldsToValidate.push(`arguments.argumentsPerIssue.${index}`);
          });
        } else {
          // If no argument fields yet, create an error
          toast.error('Please add at least one argument');
          return false;
        }
        break;
      default:
        return true;
    }
    
    if (fieldsToValidate.length > 0) {
      const result = await trigger(fieldsToValidate as any); // Type assertion to work around TypeScript error
      return result;
    }
    
    return true;
  };
  
  // Handle next button click
  const handleNext = async () => {
    // Validate current step
    const isStepValid = await validateCurrentStep();
    
    if (isStepValid) {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
        
        // Focus the first input in the next step
        setTimeout(() => {
          const nextStepEl = stepRefs.current[activeStep + 1];
          const firstInput = nextStepEl?.querySelector('input, select, textarea');
          if (firstInput instanceof HTMLElement) {
            firstInput.focus();
          }
        }, 50);
    } else {
        // We're on the last step, but we don't submit here
        // Instead, the Submit button will directly call onSubmit

      }
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  
  // Handle file changes
  const handleFileChange = (fieldName: string, file: File | null | File[]) => {
    // Only handle single file uploads here, not arrays
    if (!Array.isArray(file)) {
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
      setFormChanged(true);
      
      // CRITICAL FIX: Also store file info in form data for documents sections
      if (fieldName.includes('documentsEvidence') && file) {
        // Extract indices from field name like "documentsEvidence_0_attachedDocuments_0"
        const matches = fieldName.match(/documentsEvidence_(\d+)_attachedDocuments_(\d+)/);
        if (matches) {
          const evidenceIndex = parseInt(matches[1]);
          const fileIndex = parseInt(matches[2]);
          
          // Update the form data to include this file
          const currentEvidence = watch('documentsEvidence') || [];
          if (currentEvidence[evidenceIndex]) {
            const updatedAttachedDocs = [...(currentEvidence[evidenceIndex].attachedDocuments || [])];
            updatedAttachedDocs[fileIndex] = file;
            setValue(`documentsEvidence.${evidenceIndex}.attachedDocuments`, updatedAttachedDocs);
          }
        }
      }
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: FormData) => {
    try {
      // Check authentication
      if (!isAuthenticated) {
        toast.error('Please log in to submit your petition');
        router.push('/auth/login');
        return;
      }
    
      // Check if files are uploaded when required
      const fileErrors: Record<string, string> = {};
      
      // Check required files based on form structure (using correct field names)
      if (!files['claimant.coi']) {
        fileErrors.coi = "Certificate of Incorporation (COI) is required";
      }
      
      if (!files['claimant.panCard']) {
        fileErrors.panCard = "PAN Card is required";
      }
      
      // Agreement file is only required if there's an arbitration agreement
      if (data.arbitrationAgreement?.agreementType && !files.agreementFile) {
        fileErrors.agreementFile = "Agreement file is required";
      }
      
      if (Object.keys(fileErrors).length > 0) {
        // Show specific error messages for missing files
        const missingFiles = Object.values(fileErrors).join(', ');
        toast.error(`Please upload all required files: ${missingFiles}`);
        return;
      }

      // Create FormData for submission
      const formData = new FormData();
      
      // Add the draft ID if editing
      if (currentDraftId) {
        formData.append('id', currentDraftId);
      }
      
      // Restructure data to match backend expectations
      // Backend expects claimant fields at the top level, not nested under 'claimant'
      // All data will be properly saved to the NestJS backend database
      const restructuredData = {
        // Add claimant fields at the top level
        type: data.claimant.type,
        name: data.claimant.name,
        pincode: data.claimant.pincode,
        address1: data.claimant.address1,
        address2: data.claimant.address2,
        city: data.claimant.city,
        district: data.claimant.district,
        state: data.claimant.state,
        country: data.claimant.country,
        email: data.claimant.email,
        phoneCountryCode: data.claimant.phoneCountryCode,
        phone: data.claimant.phone,
        gst: data.claimant.gst,
        pan: data.claimant.pan,
        cin: data.claimant.cin,
        
        // Include other data as is
        additionalClaimants: data.additionalClaimants,
        managerDetails: data.managerDetails,
        respondents: data.respondents,
        arbitrationAgreement: data.arbitrationAgreement,
        disputeDetails: data.disputeDetails,
        prayers: data.prayers,
        payment: data.payment,
        arguments: data.arguments,
        
        // Include documents and evidence data (but not the file objects, just metadata)
        documents: data.documents,
        documentsEvidence: data.documentsEvidence ? data.documentsEvidence.map(evidence => ({
          ...evidence,
          // Remove file objects from the JSON data (they're sent separately as FormData)
          attachedDocuments: evidence.attachedDocuments ? evidence.attachedDocuments.map((file, index) => 
            file instanceof File ? { name: file.name, size: file.size, type: file.type, index } : file
          ) : []
        })) : []
      };
      
      // Add structured data as JSON
      formData.append('data', JSON.stringify(restructuredData));
      
      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      
      // Add document files from React Hook Form state
      const { supportingDocuments = [], evidenceFiles = [], documentTypes = {} } = data.documents;
      
      if (supportingDocuments.length > 0) {
        supportingDocuments.forEach((file, index) => {
          formData.append(`supportingDocuments_${index}`, file);
        });
      }
      
      if (evidenceFiles.length > 0) {
        evidenceFiles.forEach((file, index) => {
          formData.append(`evidenceFiles_${index}`, file);
        });
      }
      
      // Add document types
      formData.append('documentTypes', JSON.stringify(documentTypes));
      
      // Add files from the new DocumentsTabs component (using correct field names)
      const { scannedDocuments = [], affidavits = [], electronicEvidence = [] } = data.documents;
      
      // Add scanned documents files (backend expects scannedDoc_${index})
      if (scannedDocuments.length > 0) {
        scannedDocuments.forEach((doc, index) => {
          if (doc && doc.file instanceof File) {
            formData.append(`scannedDoc_${index}`, doc.file);
          }
        });
      }
      
      // Add affidavit files (backend expects affidavit_${index})
      if (affidavits.length > 0) {
        affidavits.forEach((affidavit, index) => {
          if (affidavit && affidavit.file instanceof File) {
            formData.append(`affidavit_${index}`, affidavit.file);
          }
        });
      }
      
      // Add electronic evidence files (backend expects certificate_${index} and supporting_files_${index})
      if (electronicEvidence.length > 0) {
        electronicEvidence.forEach((evidence, index) => {
          if (evidence && evidence.certificateFile instanceof File) {
            formData.append(`certificate_${index}`, evidence.certificateFile);
          }
          if (evidence && evidence.supportingFiles && Array.isArray(evidence.supportingFiles)) {
            evidence.supportingFiles.forEach((file, fileIndex) => {
              if (file instanceof File) {
                formData.append(`supporting_files_${index}`, file);
              }
            });
          }
        });
      }
      
      // Add documentsEvidence files (legacy support for existing data)
      if (data.documentsEvidence && Array.isArray(data.documentsEvidence)) {
        data.documentsEvidence.forEach((evidence, evidenceIndex) => {
          if (evidence && evidence.attachedDocuments && Array.isArray(evidence.attachedDocuments)) {
            evidence.attachedDocuments.forEach((file, fileIndex) => {
              if (file instanceof File) {
                // Use exact field name format expected by backend controller
                const fieldName = `documentsEvidence_${evidenceIndex}_attachedDocuments_${fileIndex}`;
                formData.append(fieldName, file);
              }
            });
          }
        });
      }
      
      // Show submission toast
      toast.loading('Submitting your petition...');
      
      // Submit the form
      if (currentDraftId) {
        // If editing a submitted case (not a draft), use update API
        if (initialData && !initialData.isDraft && initialData.status !== 'draft') {
          try {
            const response = await arbitrationApi.update(currentDraftId, formData);
            
            // Dismiss the loading toast
            toast.dismiss();
            
            toast.success('Case updated successfully!');
            
            // Redirect back to the case detail page
            router.push(`/dashboard/case/${currentDraftId}`);
          } catch (updateError: any) {
            // Dismiss the loading toast
            toast.dismiss();
            
            toast.error(`Failed to update case: ${updateError.message || 'Unknown error'}`);
            throw updateError;
          }
        } else {
          // If editing a draft, submit it
          try {
            const response = await arbitrationApi.submitDraft(currentDraftId);
          
          // Dismiss the loading toast
          toast.dismiss();
          
        const caseId = response.caseId;
        if (caseId) {
          toast.success(`Arbitration request submitted successfully with Case ID: ${caseId}`);
        } else {
          toast.success('Arbitration request submitted successfully!');
        }
      
        // Reload drafts
        const drafts = await arbitrationApi.getDrafts();
        setDraftList(drafts);
        setCurrentDraftId(null);
        reset();
        
        // Redirect to dashboard after successful submission
        router.push("/dashboard");
      } catch (submitError: any) {
        // Dismiss the loading toast
        toast.dismiss();
        
        toast.error(`Failed to submit draft: ${submitError.message || "Unknown error"}`);
        throw submitError; // Re-throw to be caught by the outer catch
      }
    }
  } else {
    // New submission
    try {
        const response = await arbitrationApi.create(formData);
          
          // Dismiss the loading toast
          toast.dismiss();
          
        const caseId = response.caseId;
        if (caseId) {
          toast.success(`Arbitration request submitted successfully with Case ID: ${caseId}`);
        } else {
          toast.success('Arbitration request submitted successfully!');
        }
          
        reset();
        
        // Redirect to dashboard after successful submission
          router.push('/dashboard');
        } catch (createError: any) {
          // Dismiss the loading toast
          toast.dismiss();
          
          toast.error(`Failed to submit: ${createError.message || 'Unknown error'}`);
          throw createError; // Re-throw to be caught by the outer catch
        }
      }
      
      // Reset form and files
      setFiles({
        coi: null,
        panCard: null,
        gstCert: null,
        agreementFile: null,
      });
      
      // Reset to first step
      setActiveStep(0);
      
      return true;
      
    } catch (error: any) {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Display appropriate error message
      if (error.message) {
      toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred during submission. Please try again.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Save draft handler
  const saveDraft = useCallback(async () => {
    try {
      // Check if user is authenticated before saving draft
      if (!isAuthenticated) {
        toast.error('Please log in to save your draft');
        router.push('/auth/login');
        return;
      }
      
      setIsSavingDraft(true);
      
      // Get form data
      const data = formValues;
      
      // Create FormData
      const formData = new FormData();
      
      // Add the draft ID if editing
      if (currentDraftId) {
        formData.append('id', currentDraftId);
      }
      
      // Transform data structure to match backend expectations
      const transformedData = {
        ...data,
        // Ensure claimant data is properly structured
        claimant: data.claimant || {},
        // Ensure arrays are properly initialized
        additionalClaimants: data.additionalClaimants || [],
        managerDetails: data.managerDetails || [],
        respondents: data.respondents || [],
        // Ensure objects are properly initialized
        arbitrationAgreement: data.arbitrationAgreement || {},
        disputeDetails: data.disputeDetails || {},
        // Include new dispute structure
        natureOfDispute: data.natureOfDispute || {},
        disputeDescriptions: data.disputeDescriptions || [],
        documentsEvidence: data.documentsEvidence || [],
        prayers: data.prayers || {},
        documents: data.documents || {},
        payment: data.payment || {},
        arguments: data.arguments || {},
        // CRITICAL FIX: Save verification states
        verificationStates: {
          emailVerified,
          phoneVerified,
          additionalClaimantEmailVerified,
          additionalClaimantPhoneVerified
        }
      };
      
      // Add structured data as JSON
      formData.append('data', JSON.stringify(transformedData));
      
      // Add files (only if they exist - drafts allow incomplete data)
      // Map frontend file keys to backend expected keys
      const fileKeyMapping = {
        'claimant.coi': 'coi',
        'claimant.panCard': 'panCard', 
        'claimant.gstCert': 'gstCert',
        'agreementFile': 'agreementFile'
      };
      
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          const backendKey = fileKeyMapping[key] || key;
          formData.append(backendKey, file);
        }
      });
      
      // CRITICAL FIX: Add file metadata to indicate which files are present
      const fileMetadata = {
        hasCoiFile: !!files['claimant.coi'],
        hasPanCardFile: !!files['claimant.panCard'],
        hasGstCertFile: !!files['claimant.gstCert'],
        hasAgreementFile: !!files['agreementFile'],
        // Include all file keys for restoration
        fileKeys: Object.keys(files).filter(key => files[key] !== null)
      };
      formData.append('fileMetadata', JSON.stringify(fileMetadata));
      
      // Add document files from React Hook Form state
      const { supportingDocuments = [], evidenceFiles = [], documentTypes = {} } = data.documents;
      
      if (supportingDocuments.length > 0) {
        supportingDocuments.forEach((file, index) => {
          formData.append(`supportingDocuments_${index}`, file);
        });
      }
      
      if (evidenceFiles.length > 0) {
        evidenceFiles.forEach((file, index) => {
          formData.append(`evidenceFiles_${index}`, file);
        });
      }
      
      // Add document types
      formData.append('documentTypes', JSON.stringify(documentTypes));
      
      // Add files from the new DocumentsTabs component (for draft saving - using correct field names)
      const { scannedDocuments = [], affidavits = [], electronicEvidence = [] } = data.documents;
      
      // Add scanned documents files (backend expects scannedDoc_${index})
      if (scannedDocuments.length > 0) {
        scannedDocuments.forEach((doc, index) => {
          if (doc && doc.file instanceof File) {
            formData.append(`scannedDoc_${index}`, doc.file);
          }
        });
      }
      
      // Add affidavit files (backend expects affidavit_${index})
      if (affidavits.length > 0) {
        affidavits.forEach((affidavit, index) => {
          if (affidavit && affidavit.file instanceof File) {
            formData.append(`affidavit_${index}`, affidavit.file);
          }
        });
      }
      
      // Add electronic evidence files (backend expects certificate_${index} and supporting_files_${index})
      if (electronicEvidence.length > 0) {
        electronicEvidence.forEach((evidence, index) => {
          if (evidence && evidence.certificateFile instanceof File) {
            formData.append(`certificate_${index}`, evidence.certificateFile);
          }
          if (evidence && evidence.supportingFiles && Array.isArray(evidence.supportingFiles)) {
            evidence.supportingFiles.forEach((file, fileIndex) => {
              if (file instanceof File) {
                formData.append(`supporting_files_${index}`, file);
              }
            });
          }
        });
      }
      
      // Add documentsEvidence files (legacy support for existing data)
      if (data.documentsEvidence && Array.isArray(data.documentsEvidence)) {
        data.documentsEvidence.forEach((evidence, evidenceIndex) => {
          if (evidence && evidence.attachedDocuments && Array.isArray(evidence.attachedDocuments)) {
            evidence.attachedDocuments.forEach((file, fileIndex) => {
              if (file instanceof File) {
                // Use exact field name format expected by backend controller
                const fieldName = `documentsEvidence_${evidenceIndex}_attachedDocuments_${fileIndex}`;
                formData.append(fieldName, file);
              }
            });
          }
        });
      }
      
      // Save the draft
      const response = await arbitrationApi.saveDraft(formData);
      
      if (response.id) {
        setCurrentDraftId(response.id);
        toast.success('Draft saved successfully');
        setLastSaved(new Date());
      }
      
    } catch (error: any) {
      // Show more specific error message
      if (error.response?.status === 400) {
        toast.error('Error saving draft: Invalid form data. Please check your inputs.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
        router.push('/auth/login');
      } else {
        toast.error(`Error saving draft: ${error.message}`);
      }
    } finally {
      setIsSavingDraft(false);
    }
  }, [isAuthenticated, currentDraftId, formValues, files, router, emailVerified, phoneVerified, additionalClaimantEmailVerified, additionalClaimantPhoneVerified]);
  
  // Load draft handler
  const loadDraft = async (draftId: string) => {
    try {
      setIsLoadingDrafts(true);
      
      // Get the specific draft by ID
      const draftResponse = await arbitrationApi.getDraft(draftId);
      
      // The response might be directly the draft or it might contain the draft in a property
      // Try to find the actual draft data in common response formats
      let draft = null;
      if (draftResponse) {
        // Try various common response formats
        if (draftResponse.draft) {
          draft = draftResponse.draft;
        } else if (draftResponse.data) {
          draft = draftResponse.data;
        } else if (draftResponse.id) {
          // Response itself might be the draft
          draft = draftResponse;
        } else if (Array.isArray(draftResponse) && draftResponse.length > 0) {
          // Might be an array with a single draft
          draft = draftResponse[0];
        }
      }
      
      // Check if we found a draft
      if (!draft) {
        toast.error('Failed to load draft: Invalid draft format');
        return;
      }
      
      // Check if we have the new formData structure, otherwise fallback to reconstruction
      let completeFormData;
      
      if (draft.formData && typeof draft.formData === 'object') {
        // Use the stored formData structure (new format)
        
        // Ensure managerDetails is an array
        const managerDetails = Array.isArray(draft.formData.managerDetails) 
          ? draft.formData.managerDetails 
          : draft.formData.managerDetails 
            ? [draft.formData.managerDetails] 
            : [initialManagerDetails];
        
        completeFormData = {
          claimant: draft.formData.claimant || initialClaimant,
          additionalClaimants: draft.formData.additionalClaimants || [initialAdditionalClaimant],
          managerDetails: managerDetails,
          respondents: draft.formData.respondents || [initialRespondent],
          arbitrationAgreement: draft.formData.arbitrationAgreement || initialArbitrationAgreement,
          natureOfDispute: draft.formData.natureOfDispute || initialNatureOfDispute,
          disputeDescriptions: draft.formData.disputeDescriptions || [initialDisputeDescription],
          documentsEvidence: draft.formData.documentsEvidence || [initialDocumentEvidence],
          prayers: draft.formData.prayers || initialPrayers,
          documents: draft.formData.documents || initialDocuments,
          payment: draft.formData.payment || initialPayment,
          arguments: draft.formData.arguments || initialArguments,
        };
      } else {
        // Fallback: reconstruct from flattened data (old format)
        
        // Ensure managerDetails is an array
        const managerDetails = Array.isArray(draft.managerDetails) 
          ? draft.managerDetails 
          : draft.managerDetails 
            ? [draft.managerDetails] 
            : [initialManagerDetails];
        
        const reconstructedFormData = {
          claimant: {
            type: draft.type || initialClaimant.type,
            name: draft.name || initialClaimant.name,
            pincode: draft.pincode || initialClaimant.pincode,
            address1: draft.address1 || initialClaimant.address1,
            address2: draft.address2 || initialClaimant.address2,
            city: draft.city || initialClaimant.city,
            district: draft.district || initialClaimant.district,
            state: draft.state || initialClaimant.state,
            country: draft.country || initialClaimant.country,
            email: draft.email || initialClaimant.email,
            phoneCountryCode: draft.phoneCountryCode || initialClaimant.phoneCountryCode,
            phone: draft.phone || initialClaimant.phone,
            gst: draft.gst || initialClaimant.gst,
            pan: draft.pan || initialClaimant.pan,
            cin: draft.cin || initialClaimant.cin,
          },
          additionalClaimants: draft.additionalClaimants || [initialAdditionalClaimant],
          managerDetails: managerDetails,
          respondents: draft.respondents || [initialRespondent],
          arbitrationAgreement: draft.arbitrationAgreement || initialArbitrationAgreement,
          natureOfDispute: draft.natureOfDispute || initialNatureOfDispute,
          disputeDescriptions: draft.disputeDescriptions || [initialDisputeDescription],
          documentsEvidence: draft.documentsEvidence || [initialDocumentEvidence],
          prayers: draft.prayers || initialPrayers,
          documents: draft.documents || initialDocuments,
          payment: draft.payment || initialPayment,
          arguments: draft.arguments || initialArguments,
        };
        
        completeFormData = reconstructedFormData;
      }
      
      // Reset the form with the form data
      reset(completeFormData);
      
      // Manually update field arrays to match the loaded data
      
      // Update field arrays by setting values directly (useFieldArray will sync automatically)
      if (completeFormData.disputeDescriptions && completeFormData.disputeDescriptions.length > 0) {
        setValue('disputeDescriptions', completeFormData.disputeDescriptions);
      }
      
      if (completeFormData.documentsEvidence && completeFormData.documentsEvidence.length > 0) {
        setValue('documentsEvidence', completeFormData.documentsEvidence);
      }
      
      trigger();
      
      // Set the current draft ID
      setCurrentDraftId(draftId);
      
      // CRITICAL FIX: Restore file metadata for file visibility
      if (draft.fileMetadata) {
        // Create a file metadata state for display purposes
        const fileDisplayState: Record<string, any> = {};
        
        Object.keys(draft.fileMetadata).forEach(fieldName => {
          const fileInfo = draft.fileMetadata[fieldName];
          if (fileInfo && fileInfo.name) {
            // Create a mock file object for display
            fileDisplayState[fieldName] = {
              name: fileInfo.name,
              size: fileInfo.size,
              type: fileInfo.type,
              path: fileInfo.path,
              isExisting: true, // Flag to indicate this is an existing file
            };
          }
        });
        
        setFiles(fileDisplayState);
        
        // ENHANCEMENT: Also populate DocumentsTabs file fields
        // Map backend field names to frontend form structure
        const documentsData = completeFormData.documents || {};
        
        // Handle scanned documents
        if (documentsData.scannedDocuments) {
          documentsData.scannedDocuments.forEach((doc: any, index: number) => {
            const fieldName = `scannedDoc_${index}`;
            if (draft.fileMetadata[fieldName]) {
              // Set the file info in the form data
              setValue(`documents.scannedDocuments.${index}.file`, {
                name: draft.fileMetadata[fieldName].name,
                isExisting: true,
                path: draft.fileMetadata[fieldName].path
              });
            }
          });
        }
        
        // Handle affidavits
        if (documentsData.affidavits) {
          documentsData.affidavits.forEach((affidavit: any, index: number) => {
            const fieldName = `affidavit_${index}`;
            if (draft.fileMetadata[fieldName]) {
              setValue(`documents.affidavits.${index}.file`, {
                name: draft.fileMetadata[fieldName].name,
                isExisting: true,
                path: draft.fileMetadata[fieldName].path
              });
            }
          });
        }
        
        // Handle electronic evidence
        if (documentsData.electronicEvidence) {
          documentsData.electronicEvidence.forEach((evidence: any, index: number) => {
            const certificateFieldName = `certificate_${index}`;
            if (draft.fileMetadata[certificateFieldName]) {
              setValue(`documents.electronicEvidence.${index}.certificateFile`, {
                name: draft.fileMetadata[certificateFieldName].name,
                isExisting: true,
                path: draft.fileMetadata[certificateFieldName].path
              });
            }
            
            // Handle supporting files
            const supportingFieldName = `supporting_files_${index}`;
            if (draft.fileMetadata[supportingFieldName]) {
              setValue(`documents.electronicEvidence.${index}.supportingFiles`, [{
                name: draft.fileMetadata[supportingFieldName].name,
                isExisting: true,
                path: draft.fileMetadata[supportingFieldName].path
              }]);
            }
          });
        }
      } else if (draft.files) {
        // Fallback to old format
        setFiles(draft.files);
      }
      
      // Set edit mode
      setEditMode(true);
      
      toast.success('Draft loaded successfully');
    } catch (error: any) {
      toast.error(`Error loading draft: ${error.message}`);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Render form steps
  const renderFormContent = () => {
    // Get current form values for review page
    const { 
      claimant, 
      additionalClaimants, 
      managerDetails, 
      respondents, 
      arbitrationAgreement, 
      natureOfDispute,
      disputeDescriptions,
      documentsEvidence,
      prayers, 
      payment, 
      arguments: { argumentsPerIssue }, 
      documents,
      disputeDetails
    } = watch();
    
    switch (activeStep) {
      case 0: // Claimant Details
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[0] = el; }}>
            <h3 className="font-medium text-lg mb-4">Claimant Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ControlledFormField
                  control={control}
                  label="Type*"
                  name="claimant.type"
                  type="select"
                  options={[
                    { value: "individual", label: "Individual" },
                    { value: "company", label: "Company" },
                    { value: "partnership", label: "Partnership" },
                    { value: "llp", label: "LLP" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Name*"
                  name="claimant.name"
                  maxLength={MAX_NAME_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Pincode*"
                  name="claimant.pincode"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode (numbers only) for automatic location lookup</p>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Address Line 1*"
                  name="claimant.address1"
                  maxLength={MAX_ADDRESS_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Address Line 2"
                  name="claimant.address2"
                  maxLength={MAX_ADDRESS_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="City*"
                  name="claimant.city"
                  type="select"
                  options={cityOptions.length > 0 ? cityOptions : [{ value: "", label: "Select City" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="District*"
                  name="claimant.district"
                  type="select"
                  options={districtOptions.length > 0 ? districtOptions : [{ value: "", label: "Select District" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="State*"
                  name="claimant.state"
                  type="select"
                  options={stateOptions.length > 0 ? stateOptions : [{ value: "", label: "Select State" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Country*"
                  name="claimant.country"
                  type="select"
                  options={countryOptions.length > 0 ? countryOptions : [{ value: "", label: "Select Country" }]}
                />
              </div>
              <div className="relative">
                <ControlledFormField
                  control={control}
                  label={emailVerified ? "Email* ✓" : "Email*"}
                  name="claimant.email"
                  maxLength={MAX_EMAIL_LENGTH}
                />
                <Button 
                  type="button" 
                  variant={emailVerified ? "default" : "outline"}
                  size="sm"
                  className={`absolute top-6 right-2 h-8 px-3 ${emailVerified ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  onClick={emailVerified ? undefined : sendEmailVerification}
                  disabled={emailVerified || !watch('claimant.email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watch('claimant.email') || '')}
                >
                  {emailVerified ? "✓ Verified" : "Verify"}
                </Button>
              </div>
              <div className="relative">
                <PhoneField
                  control={control}
                  phoneFieldName="claimant.phone"
                  countryCodeFieldName="claimant.phoneCountryCode"
                  label={phoneVerified ? "Phone* ✓" : "Phone*"}
                  error={!formValues.claimant.phone ? "Phone is required" : ""}
                />
                <Button 
                  type="button" 
                  variant={phoneVerified ? "default" : "outline"}
                  size="sm"
                  className={`absolute top-6 right-2 h-8 px-3 ${phoneVerified ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  onClick={phoneVerified ? undefined : sendPhoneVerification}
                  disabled={phoneVerified || !watch('claimant.phone') || !/^\d{10}$/.test(watch('claimant.phone') || '')}
                >
                  {phoneVerified ? "✓ Verified" : "Verify"}
                </Button>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="GST Number"
                  name="claimant.gst"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={MAX_GST_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="PAN Number"
                  name="claimant.pan"
                  placeholder="AAAPL1234C"
                  maxLength={MAX_PAN_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="CIN"
                  name="claimant.cin"
                  placeholder="U74140MH2014PTC123456"
                  maxLength={MAX_CIN_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
              </div>
              <div>
                {/* Empty div to maintain 2-column layout */}
              </div>
            </div>
            
            {/* Document Upload Section */}
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium text-md mb-4">Document Upload</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FileField
                    label="Certificate of Incorporation (COI)*"
                    name="claimant.coi"
                    onChange={(file) => handleFileChange('claimant.coi', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
                <div>
                  <FileField
                    label="PAN Card*"
                    name="claimant.panCard"
                    onChange={(file) => handleFileChange('claimant.panCard', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="col-span-2">
                  <FileField
                    label="GST Registration Certificate*"
                    name="claimant.gstCert"
                    onChange={(file) => handleFileChange('claimant.gstCert', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 1: // Additional Claimants & Manager
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[1] = el; }}>
            <h3 className="font-medium text-lg mb-4">Additional Claimants</h3>
            <div className="space-y-6">
              {additionalClaimantFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Additional Claimant {index + 1}</h4>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAdditionalClaimant(index)}
                    >
                      Remove
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Name"
                        name={`additionalClaimants.${index}.name`}
                      required
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </div>
                  <div className="relative">
                      <ControlledFormField
                        control={control}
                        label={additionalClaimantEmailVerified[index] ? "Email* ✓" : "Email*"}
                        name={`additionalClaimants.${index}.email`}
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                    />
                    <Button 
                      type="button" 
                      variant={additionalClaimantEmailVerified[index] ? "default" : "outline"}
                      size="sm"
                      className={`absolute top-6 right-2 h-8 px-3 ${additionalClaimantEmailVerified[index] ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                      onClick={additionalClaimantEmailVerified[index] ? undefined : () => sendAdditionalClaimantEmailVerification(index)}
                      disabled={additionalClaimantEmailVerified[index] || !watch(`additionalClaimants.${index}.email`) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watch(`additionalClaimants.${index}.email`) || '')}
                    >
                      {additionalClaimantEmailVerified[index] ? "✓ Verified" : "Verify"}
                    </Button>
                  </div>
                  <div className="relative">
                      <PhoneField
                        control={control}
                        phoneFieldName={`additionalClaimants.${index}.phone`}
                        countryCodeFieldName={`additionalClaimants.${index}.phoneCountryCode`}
                        label={additionalClaimantPhoneVerified[index] ? "Phone* ✓" : "Phone*"}
                      required
                      />
                    <Button 
                      type="button" 
                      variant={additionalClaimantPhoneVerified[index] ? "default" : "outline"}
                      size="sm"
                      className={`absolute top-6 right-2 h-8 px-3 ${additionalClaimantPhoneVerified[index] ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                      onClick={additionalClaimantPhoneVerified[index] ? undefined : () => sendAdditionalClaimantPhoneVerification(index)}
                      disabled={additionalClaimantPhoneVerified[index] || !watch(`additionalClaimants.${index}.phone`) || !/^\d{10}$/.test(watch(`additionalClaimants.${index}.phone`) || '')}
                    >
                      {additionalClaimantPhoneVerified[index] ? "✓ Verified" : "Verify"}
                    </Button>
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Pincode"
                        name={`additionalClaimants.${index}.pincode`}
                      required
                      maxLength={MAX_PINCODE_LENGTH}
                    />
                  </div>
                  <div className="col-span-2">
                      <ControlledFormField
                        control={control}
                      label="Address Line 1"
                        name={`additionalClaimants.${index}.address1`}
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </div>
                  <div className="col-span-2">
                      <ControlledFormField
                        control={control}
                      label="Address Line 2"
                        name={`additionalClaimants.${index}.address2`}
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="City*"
                        name={`additionalClaimants.${index}.city`}
                      type="select"
                      options={cityOptions.length > 0 ? cityOptions : [{ value: "", label: "Select City" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="District*"
                        name={`additionalClaimants.${index}.district`}
                      type="select"
                      options={districtOptions.length > 0 ? districtOptions : [{ value: "", label: "Select District" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="State*"
                        name={`additionalClaimants.${index}.state`}
                      type="select"
                      options={stateOptions.length > 0 ? stateOptions : [{ value: "", label: "Select State" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Country*"
                        name={`additionalClaimants.${index}.country`}
                      type="select"
                      options={countryOptions.length > 0 ? countryOptions : [{ value: "", label: "Select Country" }]}
                    />
                  </div>
                </div>
              </div>
            ))}
              
              <div className="flex justify-end">
            <Button onClick={addAdditionalClaimant} variant="outline">
                  Add Another Claimant
            </Button>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium text-lg mb-4">Manager Details</h3>
              {managerFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Manager {index + 1}</h4>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeManagerField(index)}
                    >
                      Remove
                    </Button>
                  </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <ControlledFormField
                      control={control}
                      label="Name"
                        name={`managerDetails.${index}.name`}
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Designation"
                        name={`managerDetails.${index}.designation`}
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Email"
                        name={`managerDetails.${index}.email`}
                    maxLength={MAX_EMAIL_LENGTH}
                  />
                </div>
                <div>
                    <PhoneField
                      control={control}
                        phoneFieldName={`managerDetails.${index}.phone`}
                        countryCodeFieldName={`managerDetails.${index}.phoneCountryCode`}
                    label="Phone"
                    />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Address"
                        name={`managerDetails.${index}.address`}
                    maxLength={MAX_ADDRESS_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Authority"
                        name={`managerDetails.${index}.authority`}
                    maxLength={MAX_NAME_LENGTH}
                  />
                  </div>
                </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={addManager} variant="outline">
                  Add Another Manager
                </Button>
              </div>
            </div>
          </div>
        )
      case 2: // Respondent Details
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[2] = el; }}>
            <h3 className="font-medium text-lg mb-4">Respondent Details</h3>
            <div className="space-y-6">
              {respondentFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Respondent {index + 1}</h4>
                    {respondentFields.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                        onClick={() => removeRespondentField(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Type"
                        name={`respondents.${index}.type`}
                      required
                        type="select"
                      options={[
                        { value: "individual", label: "Individual" },
                        { value: "company", label: "Company" },
                        { value: "partnership", label: "Partnership" },
                        { value: "llp", label: "LLP" },
                      ]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Name"
                        name={`respondents.${index}.name`}
                      required
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Email"
                        name={`respondents.${index}.email`}
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                    />
                  </div>
                  <div>
                      <PhoneField
                        control={control}
                        phoneFieldName={`respondents.${index}.phone`}
                        countryCodeFieldName={`respondents.${index}.phoneCountryCode`}
                      label="Phone"
                      />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Pincode"
                        name={`respondents.${index}.pincode`}
                      required
                      maxLength={MAX_PINCODE_LENGTH}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode (numbers only) for automatic location lookup</p>
                  </div>
                    <div className="col-span-2">
                      <ControlledFormField
                        control={control}
                      label="Address Line 1"
                        name={`respondents.${index}.address1`}
                      required
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </div>
                  <div className="col-span-2">
                      <ControlledFormField
                        control={control}
                      label="Address Line 2"
                        name={`respondents.${index}.address2`}
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="City*"
                        name={`respondents.${index}.city`}
                      type="select"
                      options={cityOptions.length > 0 ? cityOptions : [{ value: "", label: "Select City" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="District*"
                        name={`respondents.${index}.district`}
                      type="select"
                      options={districtOptions.length > 0 ? districtOptions : [{ value: "", label: "Select District" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="State*"
                        name={`respondents.${index}.state`}
                      type="select"
                      options={stateOptions.length > 0 ? stateOptions : [{ value: "", label: "Select State" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Country*"
                        name={`respondents.${index}.country`}
                      type="select"
                      options={countryOptions.length > 0 ? countryOptions : [{ value: "", label: "Select Country" }]}
                    />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="GST Number"
                        name={`respondents.${index}.gst`}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={MAX_GST_LENGTH}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="PAN Number"
                        name={`respondents.${index}.pan`}
                        placeholder="AAAPL1234C"
                        maxLength={MAX_PAN_LENGTH}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="CIN"
                        name={`respondents.${index}.cin`}
                        placeholder="U74140MH2014PTC123456"
                        maxLength={MAX_CIN_LENGTH}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                        </div>
                </div>
              </div>
            ))}
              
              <div className="flex justify-end">
            <Button onClick={addRespondent} variant="outline">
                  Add Another Respondent
            </Button>
              </div>
            </div>
          </div>
        )
      case 3: // Arbitration Agreement
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[3] = el; }}>
            <h3 className="font-medium text-lg mb-4">Arbitration Agreement Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Controller
                  control={control}
                  name="arbitrationAgreement.agreementDate"
                  render={({ field, fieldState }) => (
                <FormField
                  label="Date of Arbitration Agreement / Agreement containing the arbitration clause*"
                  name="agreementDate"
                  type="date"
                      value={field.value || ""}
                      onChange={field.onChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                      error={fieldState.error?.message}
                />
                )}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Place where the Arbitration Agreement / Agreement containing the arbitration clause was signed*"
                  name="arbitrationAgreement.placeOfSigning"
                  required
                  maxLength={MAX_ARBITRATION_FIELD_LENGTH}
                  placeholder="Enter the place where the agreement was signed"
                />
              </div>
              <div>
                <ControlledTextAreaField
                  control={control}
                  label="Text of Arbitration Agreement/clause*"
                  name="arbitrationAgreement.arbitrationText"
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder="Enter the exact text of the arbitration agreement or clause"
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Percentage of the Agreement value / Amount of stamp duty paid on the Arbitration Agreement / Agreement containing the arbitration clause*"
                  name="arbitrationAgreement.stampDutyPercentage"
                  required
                  placeholder="Enter percentage or amount"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Enter as percentage of agreement value or actual amount paid</p>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Number of Arbitrators as per Agreement*"
                  name="arbitrationAgreement.numberOfArbitrators"
                  required
                  type="select"
                  options={[
                    { value: "1", label: "1 (Sole Arbitrator)" },
                    { value: "3", label: "3 (Tribunal)" },
                    { value: "5", label: "5" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
            </div>
          </div>
        )
      case 4: // Nature of Dispute
        return (
          <div className="space-y-6">
            {/* Nature of Dispute Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Nature of Dispute</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ControlledFormField
                    control={control}
                    label="Category"
                    name="natureOfDispute.category"
                    required
                    type="select"
                    options={[
                      { value: "commercial", label: "Commercial" },
                      { value: "construction", label: "Construction" },
                      { value: "employment", label: "Employment" },
                      { value: "intellectual_property", label: "Intellectual Property" },
                      { value: "corporate", label: "Corporate" },
                      { value: "real_estate", label: "Real Estate" },
                      { value: "banking", label: "Banking & Finance" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
                <div>
                  <ControlledFormField
                    control={control}
                    label="Sub Category"
                    name="natureOfDispute.subCategory"
                    required
                    type="select"
                    options={[
                      { value: "breach", label: "Breach of Contract" },
                      { value: "payment", label: "Payment Dispute" },
                      { value: "quality", label: "Quality/Performance Issue" },
                      { value: "delivery", label: "Delivery Delay" },
                      { value: "warranty", label: "Warranty Claim" },
                      { value: "termination", label: "Contract Termination" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
                <div>
                  <ControlledFormField
                    control={control}
                    label="Nature of Dispute"
                    name="natureOfDispute.natureOfDispute"
                    required
                    type="select"
                    options={[
                      { value: "civil", label: "Civil" },
                      { value: "commercial", label: "Commercial" },
                      { value: "constitutional", label: "Constitutional" },
                      { value: "family", label: "Family" },
                      { value: "property", label: "Property" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
                <div>
                  <Controller
                    control={control}
                    name="natureOfDispute.dateWhenRightToClaimArose"
                    render={({ field, fieldState }) => (
                      <FormField
                        label="Date when right to claim arose"
                        name="dateWhenRightToClaimArose"
                        type="date"
                        value={field.value || ""}
                        onChange={field.onChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <ControlledFormField
                    control={control}
                    label="Standardised prayer clauses"
                    name="natureOfDispute.standardisedPrayerClauses"
                    required
                    type="select"
                    options={[
                      { value: "monetary_relief", label: "Monetary Relief" },
                      { value: "specific_performance", label: "Specific Performance" },
                      { value: "declaratory_relief", label: "Declaratory Relief" },
                      { value: "injunctive_relief", label: "Injunctive Relief" },
                      { value: "damages", label: "Damages" },
                      { value: "costs", label: "Costs and Expenses" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 5: // Dispute Description
        return (
          <div className="space-y-6">
            {/* Dispute Description Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Dispute Description</h3>
              <p className="text-sm text-gray-600 mb-4">You can add multiple dispute descriptions. Each entry represents a separate claim or issue.</p>
              
              {disputeDescriptionFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Dispute Description {index + 1}</h4>
                    {disputeDescriptionFields.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDisputeDescription(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <ControlledFormField
                        control={control}
                        label="Claim Type"
                        name={`disputeDescriptions.${index}.claimType`}
                        required
                        type="select"
                        options={[
                          { value: "monetary", label: "Monetary" },
                          { value: "specific_performance", label: "Specific Performance" },
                          { value: "declaratory", label: "Declaratory Relief" },
                          { value: "injunctive", label: "Injunctive Relief" },
                          { value: "combination", label: "Combination of Above" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </div>
                    <div>
                      <ControlledTextAreaField
                        control={control}
                        label="Claim Reason"
                        name={`disputeDescriptions.${index}.claimReason`}
                        required
                        rows={2}
                        placeholder="Provide the primary reason for this claim"
                      />
                    </div>
                    <div className="col-span-2">
                      <ControlledTextAreaField
                        control={control}
                        label="Law relied upon by Claimant to be listed (Acts/Rules/Regulations/Others)"
                        name={`disputeDescriptions.${index}.lawReliedUpon`}
                        required
                        rows={3}
                        placeholder="List specific Acts, Rules, Regulations, or other legal provisions relied upon"
                      />
                    </div>
                    <div>
                      <ControlledFormField
                        control={control}
                        label="Relevant Clause Number/Page Number"
                        name={`disputeDescriptions.${index}.relevantClauseNumber`}
                        required
                        placeholder="e.g., Clause 5.2 or Page 7"
                      />
                    </div>
                    <div>
                      <ControlledTextAreaField
                        control={control}
                        label="Clause Supporting Claim"
                        name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                        required
                        rows={2}
                        placeholder="Describe how this clause supports your claim"
                      />
                    </div>
                    <div className="col-span-2">
                      <ControlledTextAreaField
                        control={control}
                        label="Clause"
                        name={`disputeDescriptions.${index}.clause`}
                        required
                        rows={3}
                        placeholder="Enter the exact text of the relevant clause"
                      />
                    </div>
                    <div>
                      <ControlledFormField
                        control={control}
                        label="Document Supporting Claim"
                        name={`disputeDescriptions.${index}.documentSupportingClaim`}
                        required
                        placeholder="Name/reference of supporting document"
                      />
                    </div>
                    <div>
                      <ControlledFormField
                        control={control}
                        label="Relief Sought"
                        name={`disputeDescriptions.${index}.reliefSought`}
                        required
                        type="select"
                        options={[
                          { value: "monetary_compensation", label: "Monetary Compensation" },
                          { value: "specific_performance", label: "Specific Performance" },
                          { value: "declaratory_relief", label: "Declaratory Relief" },
                          { value: "injunctive_relief", label: "Injunctive Relief" },
                          { value: "restitution", label: "Restitution" },
                          { value: "rescission", label: "Rescission of Contract" },
                          { value: "rectification", label: "Rectification" },
                          { value: "damages_costs", label: "Damages and Costs" },
                          { value: "interest_penalty", label: "Interest and Penalty" },
                          { value: "termination", label: "Contract Termination" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDisputeDescription}
                  className="mt-4"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )
      case 6: // Prayers & Reliefs
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[6] = el; }}>
            <h3 className="font-medium text-lg mb-4">Prayers & Reliefs</h3>
            <div>
              <ControlledTextAreaField
                control={control}
                label="Prayers & Reliefs Sought"
                name="prayers.prayers"
                required
                maxLength={3000}
                placeholder="Detail the specific remedies, compensation, or actions you are seeking from the arbitral tribunal"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-2">
                Clearly state each prayer point separately, including monetary claims, specific performance requests, 
                declaratory reliefs, costs, and any interim measures sought.
              </p>
            </div>
          </div>
        )
      case 7: // Documents
        // Create default issues in case arguments don't exist yet
        const disputeIssues = (watch('arguments.argumentsPerIssue') || []).length > 0 ? 
          (watch('arguments.argumentsPerIssue') || []).map((arg, index) => ({
            value: `issue_${index + 1}`,
            label: `Issue ${index + 1}${arg ? ` - ${arg.substring(0, 30)}...` : ''}`
          })) : 
          [
            { value: "issue_default_1", label: "Issue 1 - Breach of Contract" },
            { value: "issue_default_2", label: "Issue 2 - Non-payment of Invoice" },
            { value: "issue_default_3", label: "Issue 3 - Delay in Delivery" }
          ];
          
  
        
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[7] = el; }}>
            <DocumentsTabs 
              control={control}
              watch={watch}
              disputeIssues={disputeIssues}
            />
          </div>
        )
      case 8: // Payment
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[8] = el; }}>
            <h3 className="font-medium text-lg mb-4">Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ControlledFormField
                  control={control}
                  label="Payment Head"
                  name="payment.paymentHead"
                  type="select"
                  required
                  options={[
                    { value: "filing_fee", label: "Filing Fee" },
                    { value: "arbitrator_fee", label: "Arbitrator Fee" },
                    { value: "administrative_fee", label: "Administrative Fee" },
                    { value: "emergency_fee", label: "Emergency Arbitration Fee" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Payment Amount (INR)"
                  name="payment.paymentAmount"
                  type="number"
                  required
                  maxLength={MAX_PAYMENT_AMOUNT_LENGTH}
                  placeholder="Enter amount in INR"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum amount: {MAX_PAYMENT_AMOUNT.toLocaleString()} INR</p>
              </div>
              <div>
                <ControlledTextAreaField
                  control={control}
                  label="Payment Details"
                  name="payment.paymentDetails"
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Provide detailed payment information"
                />
              </div>
            </div>
                      </div>
          )
      case 9: // Arguments
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[9] = el; }}>
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
              
              {argumentFields.length > 0 ? (
                argumentFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Issue/Argument {index + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeArgumentField(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <ControlledTextAreaField
                      control={control}
                      label={`Argument ${index + 1}`}
                      name={`arguments.argumentsPerIssue.${index}`}
                      required
                      rows={6}
                      maxLength={2000}
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
      case 10: // Review & Submit
        return (
          <div ref={(el) => { stepRefs.current[10] = el; }}>
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
                      <div key={index} className="mb-4 text-sm border-b pb-2 last:border-b-0">
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Name:</span> {claimant.name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {claimant.email}
                        </div>
                        <div>
                            <span className="font-medium">Phone:</span> {claimant.phoneCountryCode} {claimant.phone}
                          </div>
                          <div>
                            <span className="font-medium">Pincode:</span> {claimant.pincode}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Address:</span> {claimant.address1}
                            {claimant.address2 && `, ${claimant.address2}`}, {claimant.city}, {claimant.district}, {claimant.state}, {claimant.country}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No additional claimants</div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Manager Details</h4>
                  {managerDetails.length > 0 ? (
                    managerDetails.map((manager, index) => (
                      <div key={index} className="mb-3 text-sm border-b pb-2 last:border-b-0">
                        <p className="font-medium">Manager {index + 1}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                            <span className="font-medium">Name:</span> {manager.name}
                      </div>
                      <div>
                            <span className="font-medium">Designation:</span> {manager.designation}
                      </div>
                      <div>
                            <span className="font-medium">Email:</span> {manager.email}
                      </div>
                      <div>
                            <span className="font-medium">Authority:</span> {manager.authority}
                      </div>
                    </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No manager details provided</div>
                  )}
                </div>

                {/* Respondents */}
                <div>
                  <h4 className="font-medium mb-2">Respondents</h4>
                  {respondents.map((respondent, index) => (
                    <div key={index} className="mb-4 text-sm border-b pb-2 last:border-b-0">
                      <div className="grid grid-cols-2 gap-2">
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
                        <div className="col-span-2">
                          <span className="font-medium">Address:</span> {respondent.address1}
                          {respondent.address2 && `, ${respondent.address2}`}, {respondent.city}, {respondent.district}, {respondent.state}, {respondent.country} - {respondent.pincode}
                        </div>
                        {respondent.gst && (
                          <div>
                            <span className="font-medium">GST:</span> {respondent.gst}
                          </div>
                        )}
                        {respondent.pan && (
                          <div>
                            <span className="font-medium">PAN:</span> {respondent.pan}
                          </div>
                        )}
                        {respondent.cin && (
                          <div>
                            <span className="font-medium">CIN:</span> {respondent.cin}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CRITICAL FIX: Enhanced preview with complete information */}
                
                <div>
                  <h4 className="font-medium mb-2">Arbitration Agreement</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Agreement Date:</span> {arbitrationAgreement?.agreementDate || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Place of Signing:</span> {arbitrationAgreement?.placeOfSigning || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Number of Arbitrators:</span> {arbitrationAgreement?.numberOfArbitrators || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Arbitration Text:</span> 
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                        {arbitrationAgreement?.arbitrationText || 'Not provided'}
                      </div>
                    </div>
                    {files.agreementFile && (
                      <div>
                        <span className="font-medium">Agreement File:</span> 
                        <div className="mt-1 p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                          <span>📎 {files.agreementFile.name}</span>
                          {files.agreementFile.isExisting && files.agreementFile.path && (
                            <button
                              type="button"
                              onClick={() => window.open(`/api/arbitration/files/${files.agreementFile.path.split('/').pop()}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Nature of Dispute</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Category:</span> {natureOfDispute?.category || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Sub-category:</span> {natureOfDispute?.subCategory || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Nature of Dispute:</span> {natureOfDispute?.natureOfDispute || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Date when right to claim arose:</span> {natureOfDispute?.dateWhenRightToClaimArose || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dispute Descriptions</h4>
                  {disputeDescriptions && disputeDescriptions.length > 0 ? (
                    disputeDescriptions.map((description, index) => (
                      <div key={index} className="mb-3 text-sm border-b pb-2 last:border-b-0">
                        <div>
                          <span className="font-medium">Issue #{index + 1}:</span> {description.issueDescription || 'Not provided'}
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Facts:</span> {description.factsOfDispute || 'Not provided'}
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Relief Sought:</span> {description.reliefSought || 'Not provided'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No dispute descriptions provided</div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Documents Evidence</h4>
                  {documentsEvidence && documentsEvidence.length > 0 ? (
                    documentsEvidence.map((evidence, index) => (
                      <div key={index} className="mb-3 text-sm border-b pb-2 last:border-b-0">
                        <div>
                          <span className="font-medium">Document Type:</span> {evidence.documentType || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Relevant Clause:</span> {evidence.relevantClauseNumber || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Supporting Claim:</span> {evidence.supportingClaimNumber || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Date of Issue/Sign:</span> {evidence.dateOfIssueSign || 'Not specified'}
                        </div>
                        {evidence.attachedDocuments && evidence.attachedDocuments.length > 0 && (
                          <div>
                            <span className="font-medium">Attached Documents:</span>
                            <div className="mt-1 space-y-1">
                              {evidence.attachedDocuments.map((doc, docIndex) => {
                                const fileKey = `documentsEvidence_${index}_attachedDocuments_${docIndex}`;
                                const fileInfo = files[fileKey];
                                return (
                                  <div key={docIndex} className="p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                                    <span>📎 {doc instanceof File ? doc.name : (doc?.name || fileInfo?.name || `Document ${docIndex + 1}`)}</span>
                                    {fileInfo?.isExisting && fileInfo?.path && (
                                      <button
                                        type="button"
                                        onClick={() => window.open(`/api/arbitration/files/${fileInfo.path.split('/').pop()}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No documents evidence provided</div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Uploaded Files</h4>
                  <div className="text-sm space-y-2">
                    {files['claimant.coi'] && (
                      <div className="p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                        <span>📎 Certificate of Incorporation: {files['claimant.coi'].name}</span>
                        {files['claimant.coi'].isExisting && files['claimant.coi'].path && (
                          <button
                            type="button"
                            onClick={() => window.open(`/api/arbitration/files/${files['claimant.coi'].path.split('/').pop()}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View
                          </button>
                        )}
                      </div>
                    )}
                    {files['claimant.panCard'] && (
                      <div className="p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                        <span>📎 PAN Card: {files['claimant.panCard'].name}</span>
                        {files['claimant.panCard'].isExisting && files['claimant.panCard'].path && (
                          <button
                            type="button"
                            onClick={() => window.open(`/api/arbitration/files/${files['claimant.panCard'].path.split('/').pop()}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View
                          </button>
                        )}
                      </div>
                    )}
                    {files['claimant.gstCert'] && (
                      <div className="p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                        <span>📎 GST Certificate: {files['claimant.gstCert'].name}</span>
                        {files['claimant.gstCert'].isExisting && files['claimant.gstCert'].path && (
                          <button
                            type="button"
                            onClick={() => window.open(`/api/arbitration/files/${files['claimant.gstCert'].path.split('/').pop()}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View
                          </button>
                        )}
                      </div>
                    )}
                    {Object.keys(files).filter(key => files[key] && !['claimant.coi', 'claimant.panCard', 'claimant.gstCert', 'agreementFile'].includes(key)).length > 0 && (
                      <div>
                        <span className="font-medium">Other Documents:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(files)
                            .filter(([key, file]) => file && !['claimant.coi', 'claimant.panCard', 'claimant.gstCert', 'agreementFile'].includes(key))
                            .map(([key, file]) => (
                              <div key={key} className="p-2 bg-blue-50 rounded text-xs flex items-center justify-between">
                                <span>📎 {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}: {file!.name}</span>
                                {file!.isExisting && file!.path && (
                                  <button
                                    type="button"
                                    onClick={() => window.open(`/api/arbitration/files/${file!.path.split('/').pop()}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {Object.keys(files).filter(key => files[key]).length === 0 && (
                      <div className="text-gray-500">No files uploaded</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Prayers & Reliefs</h4>
                  <div className="text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      {prayers?.prayers || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Payment Details</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Payment Head:</span> {payment?.paymentHead || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> {payment?.paymentAmount || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Details:</span> {payment?.paymentDetails || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Arguments</h4>
                  {argumentsPerIssue && argumentsPerIssue.length > 0 ? (
                    argumentsPerIssue.map((argument, index) => (
                      <div key={index} className="mb-2 text-sm">
                        <span className="font-medium">Argument {index + 1}:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                          {argument || 'Not provided'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No arguments provided</div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Arbitration Agreement Details</h4>
                  <div className="text-sm space-y-3">
                    <div>
                      <span className="font-medium">Date of Arbitration Agreement:</span> {arbitrationAgreement.agreementDate}
                    </div>
                    <div>
                      <span className="font-medium">Place of Signing:</span> {arbitrationAgreement.placeOfSigning}
                    </div>
                    <div>
                      <span className="font-medium">Text of Arbitration Agreement/clause:</span>
                      <p className="mt-1 whitespace-pre-line">{arbitrationAgreement.arbitrationText}</p>
                    </div>
                    <div>
                      <span className="font-medium">Stamp Duty Percentage/Amount:</span> {arbitrationAgreement.stampDutyPercentage}
                    </div>
                    <div>
                      <span className="font-medium">Number of Arbitrators:</span> {arbitrationAgreement.numberOfArbitrators}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dispute Details</h4>
                  {disputeDetails ? (
                    <div className="text-sm grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Type:</span> {disputeDetails.disputeType || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Service Type:</span> {disputeDetails.serviceType || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {disputeDetails.disputeCategory || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Sub-Category:</span> {disputeDetails.disputeSubCategory || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Claim Type:</span> {disputeDetails.claimType || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹{disputeDetails.disputeAmount || '0'}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {disputeDetails.disputeDate || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Nature:</span> {disputeDetails.natureOfDispute || 'Not specified'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Claim Reason:</span>
                        <p className="mt-1">{disputeDetails.claimReason || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Applicable Acts:</span> {disputeDetails.applicableActs?.join(', ') || 'Not specified'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Laws Relied Upon:</span>
                        <p className="mt-1">{disputeDetails.lawsReliedUpon || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Clause References:</span> {disputeDetails.clauseReferences || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Clause/Page Number:</span> {disputeDetails.clauseNumber || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Supporting Document:</span> {disputeDetails.documentSupportingClaim || 'Not specified'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Clause Supporting Claim:</span>
                        <p className="mt-1">{disputeDetails.clauseSupportingClaim || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Clause Text:</span>
                        <p className="mt-1">{disputeDetails.clause || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Relief Sought:</span>
                        <p className="mt-1">{disputeDetails.reliefSought || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Facts of the Case:</span>
                        <p className="mt-1">{disputeDetails.factsOfCase || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Description:</span>
                        <p className="mt-1">{disputeDetails.disputeDescription || 'Not specified'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No dispute details available
                    </div>
                  )}
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
                      <span className="font-medium">Evidence Files:</span> {documents.evidenceFiles?.length || 0} files
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
                    {argumentsPerIssue && argumentsPerIssue.length > 0 ? (
                      <div>
                        <span className="font-medium">{argumentsPerIssue.length} argument(s) provided</span>
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

  // Update the auto-save effect
  useEffect(() => {
    // only run when the "dirty & changed" flags become true
    if (!formChanged || !isAuthenticated || !isDirty) return;

    // clear any existing debounce
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // schedule a new save
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
      setFormChanged(false);
    }, 30000);

    // cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formChanged, isAuthenticated, isDirty, saveDraft]);

  // Effect to ensure form refreshes when a draft is loaded
  useEffect(() => {
    if (currentDraftId) {
  
      
      // Force UI to update
      const timer = setTimeout(() => {
        // Re-apply current form values to trigger a redraw
        const currentValues = watch();
        reset({...currentValues});
        
        // Force active step to refresh
        const currentStep = activeStep;
        setActiveStep(0);
        setTimeout(() => {
          setActiveStep(currentStep);
        }, 100);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentDraftId]);

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
              
              {activeStep === steps.length - 1 ? (
              <Button
                  variant="default"
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsSubmitting(true);
                      // Get the current form values directly
                      const currentFormValues = watch();
                      // Call onSubmit directly
                      onSubmit(currentFormValues as any)
                        .catch(error => {
                  
                          toast.error(`Error: ${error?.message || 'An unexpected error occurred'}`);
                        })
                        .finally(() => {
                          // This should be redundant as onSubmit also sets it false in finally,
                          // but we'll keep it as a safety measure
                          setIsSubmitting(false);
                        });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                  Next
              </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email OTP Modal */}
      {showEmailOTP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Email Verification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit OTP sent to {watch('claimant.email')}
            </p>
            <input
              type="text"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full border rounded px-3 py-2 mb-4 text-center text-lg tracking-wider"
              maxLength={6}
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailOTP(false);
                  setEmailOTP("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyEmailOTP}
                disabled={emailOTP.length !== 6}
                className="flex-1"
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phone OTP Modal */}
      {showPhoneOTP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Phone Verification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit OTP sent to {watch('claimant.phoneCountryCode')} {watch('claimant.phone')}
            </p>
            <input
              type="text"
              value={phoneOTP}
              onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full border rounded px-3 py-2 mb-4 text-center text-lg tracking-wider"
              maxLength={6}
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhoneOTP(false);
                  setPhoneOTP("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyPhoneOTP}
                disabled={phoneOTP.length !== 6}
                className="flex-1"
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Claimant Email OTP Modals */}
      {showAdditionalEmailOTP.map((show, index) => 
        show && (
          <div key={`email-${index}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Email Verification - Additional Claimant {index + 1}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP sent to {watch(`additionalClaimants.${index}.email`)}
              </p>
              <input
                type="text"
                value={additionalEmailOTP[index] || ""}
                onChange={(e) => handleAdditionalEmailOTPChange(index, e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full border rounded px-3 py-2 mb-4 text-center text-lg tracking-wider"
                maxLength={6}
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => closeAdditionalEmailModal(index)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyAdditionalClaimantEmailOTP(index)}
                  disabled={(additionalEmailOTP[index] || "").length !== 6}
                  className="flex-1"
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Additional Claimant Phone OTP Modals */}
      {showAdditionalPhoneOTP.map((show, index) => 
        show && (
          <div key={`phone-${index}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Phone Verification - Additional Claimant {index + 1}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP sent to {watch(`additionalClaimants.${index}.phoneCountryCode`)} {watch(`additionalClaimants.${index}.phone`)}
              </p>
              <input
                type="text"
                value={additionalPhoneOTP[index] || ""}
                onChange={(e) => handleAdditionalPhoneOTPChange(index, e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full border rounded px-3 py-2 mb-4 text-center text-lg tracking-wider"
                maxLength={6}
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => closeAdditionalPhoneModal(index)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyAdditionalClaimantPhoneOTP(index)}
                  disabled={(additionalPhoneOTP[index] || "").length !== 6}
                  className="flex-1"
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}

// Export with dynamic to disable SSR
export default dynamic(() => Promise.resolve(ArbitrationForm), { 
  ssr: false 
});