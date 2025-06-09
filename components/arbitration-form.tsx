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
        
        {fileNames.length > 0 && (
          <div className="mt-2">
            {fileNames.map((name, index) => (
              <div key={index} className="text-sm flex items-center">
                <span className="mr-2">• {name}</span>
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
    address: z.string().max(MAX_ADDRESS_LENGTH),
    phoneCountryCode: z.string().default("+91"),
  })).default([]),
  
  // Manager details
  managerDetails: z.object({
    name: z.string().max(MAX_NAME_LENGTH),
    email: z.string().email("Must be a valid email").max(MAX_EMAIL_LENGTH).optional(),
    phone: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number").optional(),
    address: z.string().max(MAX_ADDRESS_LENGTH).optional(),
    designation: z.string().max(MAX_NAME_LENGTH).optional(),
    authority: z.string().max(MAX_NAME_LENGTH).optional(),
    phoneCountryCode: z.string().default("+91"),
  }).optional(),
  
  // Respondent details
  respondents: z.array(z.object({
    type: z.string().min(1, "Type is required"),
    name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
    address: z.string().min(1, "Address is required").max(MAX_ADDRESS_LENGTH),
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
    agreementType: z.string().min(1, "Agreement type is required"),
    resolutionMode: z.string().min(1, "Resolution mode is required"),
    seatOfArbitration: z.string().min(1, "Seat of arbitration is required").max(MAX_ARBITRATION_FIELD_LENGTH, `Must be at most ${MAX_ARBITRATION_FIELD_LENGTH} characters`),
    signedOnPlace: z.string().min(1, "Signed-on place is required").max(MAX_ARBITRATION_FIELD_LENGTH, `Must be at most ${MAX_ARBITRATION_FIELD_LENGTH} characters`),
    agreementParties: z.string().min(1, "Agreement parties is required").max(MAX_ARBITRATION_FIELD_LENGTH, `Must be at most ${MAX_ARBITRATION_FIELD_LENGTH} characters`),
    arbitratorSelection: z.string().min(1, "Arbitrator selection is required"),
    // agreementFile handled separately
  }),
  
  // Dispute Details
  disputeDetails: z.object({
    disputeType: z.string().min(1, "Dispute type is required"),
    disputeAmount: z.string().min(1, "Dispute amount is required")
      .max(MAX_DISPUTE_AMOUNT_LENGTH, `Must be at most ${MAX_DISPUTE_AMOUNT_LENGTH} digits`)
      .regex(/^\d+$/, "Must contain only digits")
      .refine(val => parseInt(val) <= MAX_DISPUTE_AMOUNT, `Amount cannot exceed ${MAX_DISPUTE_AMOUNT.toLocaleString()}`),
    disputeDescription: z.string().min(1, "Dispute description is required").max(2000),
    disputeDate: z.string().min(1, "Dispute date is required")
      .refine(val => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(val);
        selected.setHours(0, 0, 0, 0);
        return selected <= today;
      }, "Dispute date cannot be in the future"),
    serviceType: z.string().min(1, "Service type is required"),
    applicableActs: z.array(z.string()).min(1, "At least one applicable act is required"),
    disputeCategory: z.string().min(1, "Dispute category is required"),
    disputeSubCategory: z.string().min(1, "Dispute sub-category is required"),
    natureOfDispute: z.string().min(1, "Nature of dispute is required"),
    factsOfCase: z.string().min(1, "Facts of the case is required").max(2000),
    clauseReferences: z.string().min(1, "Clause references is required").max(500),
  }),
  
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
      .min(1, "Please upload at least one supporting document"),
    evidenceFiles: z.array(z.instanceof(File)).optional(),
    documentTypes: z.record(z.string(), z.string()).optional(),
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

function ArbitrationForm() {
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
  
  // Location lookup state
  const [stateOptions, setStateOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string, label: string }>>([]);
  
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
  
  // File state for document uploads (not managed by react-hook-form)
  const [files, setFiles] = useState<Record<string, File | null>>({
    coi: null,
    panCard: null,
    gstCert: null,
    agreementFile: null,
  });
  
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
      managerDetails: initialManagerDetails,
      respondents: [initialRespondent],
      arbitrationAgreement: initialArbitrationAgreement,
      disputeDetails: initialDisputeDetails,
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
    fields: respondentFields, 
    append: appendRespondent,
    remove: removeRespondentField
  } = useFieldArray({
    control,
    name: "respondents",
  });
  
  const { 
    fields: argumentFields, 
    append: appendArgument,
    remove: removeArgumentField
  } = useFieldArray({
    control,
    name: "arguments.argumentsPerIssue" as any, // Type assertion to work around TypeScript error
  });
  
  // Watch form values
  const formValues = watch();
  
  // Watch for pincode changes and fetch location data
  const pincode = watch('claimant.pincode');
  
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
  
  // Watch for identifier changes and validate them
  const gstNumber = watch('claimant.gst');
  const panNumber = watch('claimant.pan');
  const cinNumber = watch('claimant.cin');
  
  // Helper functions for field arrays
  const addAdditionalClaimant = () => {
    appendAdditionalClaimant(initialAdditionalClaimant);
  };
  
  const addRespondent = () => {
    appendRespondent(initialRespondent);
  };
  
  const addArgument = () => {
    appendArgument("" as any); // Type assertion to work around TypeScript error
  };
  
  // Validate current step
  const validateCurrentStep = async () => {
    let fieldsToValidate: Array<keyof FormData | string> = [];
    
    switch (activeStep) {
      case 0: // Claimant Details
        fieldsToValidate = [
          'claimant.type', 'claimant.name', 'claimant.pincode', 
          'claimant.address1', 'claimant.city', 'claimant.district', 
          'claimant.state', 'claimant.country', 'claimant.email', 
          'claimant.phone'
        ];
        break;
      case 1: // Additional Claimants & Manager
        // Only validate if manager details are provided
        if (formValues.managerDetails?.name) {
          fieldsToValidate = ['managerDetails.name', 'managerDetails.designation'];
        }
        // Validate additional claimants if any exist
        additionalClaimantFields.forEach((_, index) => {
          fieldsToValidate.push(
            `additionalClaimants.${index}.name`,
            `additionalClaimants.${index}.email`,
            `additionalClaimants.${index}.phone`,
            `additionalClaimants.${index}.address`
          );
        });
        break;
      case 2: // Respondent Details
        respondentFields.forEach((_, index) => {
          fieldsToValidate.push(
            `respondents.${index}.type`,
            `respondents.${index}.name`, 
            `respondents.${index}.email`,
            `respondents.${index}.address`
          );
        });
        break;
      case 3: // Arbitration Agreement
        fieldsToValidate = [
          'arbitrationAgreement.agreementDate', 'arbitrationAgreement.agreementType',
          'arbitrationAgreement.resolutionMode', 'arbitrationAgreement.seatOfArbitration',
          'arbitrationAgreement.signedOnPlace', 'arbitrationAgreement.agreementParties',
          'arbitrationAgreement.arbitratorSelection'
        ];
        
        // Check file
        if (!files.agreementFile) {
          toast.error('Agreement file is required');
          return false;
        }
        break;
      case 4: // Dispute Details
        fieldsToValidate = [
          'disputeDetails.disputeType', 'disputeDetails.disputeAmount',
          'disputeDetails.disputeDescription', 'disputeDetails.disputeDate',
          'disputeDetails.serviceType', 'disputeDetails.disputeCategory',
          'disputeDetails.disputeSubCategory', 'disputeDetails.natureOfDispute',
          'disputeDetails.factsOfCase', 'disputeDetails.clauseReferences',
          'disputeDetails.applicableActs'
        ];
        break;
      case 5: // Prayers & Reliefs
        fieldsToValidate = ['prayers.prayers'];
        break;
      case 6: // Documents
        await trigger('documents.supportingDocuments' as any);
        if (!watch('documents.supportingDocuments')?.length) {
          toast.error('Please upload at least one supporting document');
          return false;
        }
        break;
      case 7: // Payment
        fieldsToValidate = [
          'payment.paymentHead', 'payment.paymentAmount', 'payment.paymentDetails'
        ];
        break;
      case 8: // Arguments
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
        console.log('On last step, ready to submit via Submit button...');
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
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: FormData) => {
    console.log('Starting form submission process...', { isSubmitting });
    
    try {
      // Check authentication
      if (!isAuthenticated) {
        console.log('Authentication check failed');
        toast.error('Please log in to submit your petition');
        router.push('/auth/login');
        return;
      }
    
      // Check if files are uploaded when required
      const fileErrors: Record<string, string> = {};
      
      if (!files.agreementFile) {
        fileErrors.agreementFile = "Agreement file is required";
      }
      
      if (Object.keys(fileErrors).length > 0) {
        // Show error for missing files
        console.log('File validation failed:', fileErrors);
        toast.error('Please upload all required files');
        return;
      }
      
      console.log('Files validated, preparing FormData...');
      
      // Create FormData for submission
      const formData = new FormData();
      
      // Add the draft ID if editing
      if (currentDraftId) {
        formData.append('id', currentDraftId);
        console.log('Adding draft ID to formData:', currentDraftId);
      }
      
      // Restructure data to match backend expectations
      // Backend expects claimant fields at the top level, not nested under 'claimant'
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
        arguments: data.arguments
      };
      
      // Add structured data as JSON
      formData.append('data', JSON.stringify(restructuredData));
      console.log('Added structured data to formData');
      
      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
          console.log(`Added file ${key} to formData: ${file.name}`);
        }
      });
      
      // Add document files from React Hook Form state
      const { supportingDocuments = [], evidenceFiles = [], documentTypes = {} } = data.documents;
      
      if (supportingDocuments.length > 0) {
        console.log(`Adding ${supportingDocuments.length} supporting documents`);
        supportingDocuments.forEach((file, index) => {
          formData.append(`supportingDocuments_${index}`, file);
        });
      }
      
      if (evidenceFiles.length > 0) {
        console.log(`Adding ${evidenceFiles.length} evidence files`);
        evidenceFiles.forEach((file, index) => {
          formData.append(`evidenceFiles_${index}`, file);
        });
      }
      
      // Add document types
      formData.append('documentTypes', JSON.stringify(documentTypes));
      
      console.log('FormData prepared, submitting to API...');
      
      // Submit the form
      if (currentDraftId) {
        // If editing a draft, submit it
        console.log('Submitting existing draft with ID:', currentDraftId);
        
        // Directly try the API call
        try {
          const response = await arbitrationApi.submitDraft(currentDraftId);
          console.log('Draft submission successful:', response);
          
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
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500); // Delay to allow toast to be seen
        } catch (submitError) {
          console.error('Error submitting draft:', submitError);
          toast.error(`Failed to submit draft: ${submitError.message || 'Unknown error'}`);
          throw submitError; // Re-throw to be caught by the outer catch
        }
      } else {
        // New submission
        console.log('Creating new arbitration submission...');
        
        // Directly try the API call
        try {
          const response = await arbitrationApi.create(formData);
          console.log('Submission successful:', response);
          
          const caseId = response.caseId;
          if (caseId) {
            toast.success(`Arbitration request submitted successfully with Case ID: ${caseId}`);
          } else {
            toast.success('Arbitration request submitted successfully!');
          }
          
          reset();
          
          // Redirect to dashboard after successful submission
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500); // Delay to allow toast to be seen
        } catch (createError) {
          console.error('Error creating submission:', createError);
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
      
      console.log('Submission completed successfully');
      return true;
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Display appropriate error message
      if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred during submission. Please try again.');
      }
      return false;
    } finally {
      console.log('Resetting submission state in finally block');
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
      
      // Add structured data as JSON
      formData.append('data', JSON.stringify(data));
      
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
      
      // Save the draft
      const response = await arbitrationApi.saveDraft(formData);
      
      if (response.id) {
        setCurrentDraftId(response.id);
        toast.success('Draft saved successfully');
        setLastSaved(new Date());
      }
      
    } catch (error: any) {
      console.error('Draft save error:', error);
      toast.error(`Error saving draft: ${error.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  }, [isAuthenticated, currentDraftId, formValues, files, router]);
  
  // Load draft handler
  const loadDraft = async (draftId: string) => {
    try {
      setIsLoadingDrafts(true);
      
      // Get the specific draft by ID
      console.log(`🔥 DRAFT LOADING: Attempting to load draft with ID: ${draftId}`);
      const draftResponse = await arbitrationApi.getDraft(draftId);
      console.log("🔥 DRAFT LOADING: Draft API response:", draftResponse);
      
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
        console.error("🔥 DRAFT LOADING: Could not find valid draft data in response:", draftResponse);
        toast.error('Failed to load draft: Invalid draft format');
        return;
      }
      
      console.log("🔥 DRAFT LOADING: Found draft data:", draft);
      console.log("🔥 DRAFT LOADING: Draft has formData:", !!draft.formData);
      console.log("🔥 DRAFT LOADING: Draft keys:", Object.keys(draft));
      
      // Check if we have the new formData structure, otherwise fallback to reconstruction
      let completeFormData;
      
      if (draft.formData && typeof draft.formData === 'object') {
        // Use the stored formData structure (new format)
        console.log("🔥 DRAFT LOADING: Using stored formData structure");
        console.log("🔥 DRAFT LOADING: formData keys:", Object.keys(draft.formData));
        
        // Log each section to understand the structure
        if (draft.formData.claimant) {
          console.log("🔥 DRAFT LOADING: Claimant data found:", draft.formData.claimant);
        } else {
          console.log("🔥 DRAFT LOADING: No claimant data in formData");
        }
        
        completeFormData = {
          claimant: draft.formData.claimant || initialClaimant,
          additionalClaimants: draft.formData.additionalClaimants || [initialAdditionalClaimant],
          managerDetails: draft.formData.managerDetails || initialManagerDetails,
          respondents: draft.formData.respondents || [initialRespondent],
          arbitrationAgreement: draft.formData.arbitrationAgreement || initialArbitrationAgreement,
          disputeDetails: draft.formData.disputeDetails || initialDisputeDetails,
          prayers: draft.formData.prayers || initialPrayers,
          documents: draft.formData.documents || initialDocuments,
          payment: draft.formData.payment || initialPayment,
          arguments: draft.formData.arguments || initialArguments,
        };
      } else {
        // Fallback: reconstruct from flattened data (old format)
        console.log("🔥 DRAFT LOADING: Reconstructing from flattened data structure");
        console.log("🔥 DRAFT LOADING: Available fields:", Object.keys(draft));
        
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
          managerDetails: draft.managerDetails || initialManagerDetails,
          respondents: draft.respondents || [initialRespondent],
          arbitrationAgreement: draft.arbitrationAgreement || initialArbitrationAgreement,
          disputeDetails: draft.disputeDetails || initialDisputeDetails,
          prayers: draft.prayers || initialPrayers,
          documents: draft.documents || initialDocuments,
          payment: draft.payment || initialPayment,
          arguments: draft.arguments || initialArguments,
        };
        
        console.log("🔥 DRAFT LOADING: Reconstructed claimant data:", reconstructedFormData.claimant);
        completeFormData = reconstructedFormData;
      }
      
      console.log("🔥 DRAFT LOADING: Final form data structure:", completeFormData);
      console.log("🔥 DRAFT LOADING: Final claimant data:", completeFormData.claimant);
      
      // Reset the form with the form data
      console.log("🔥 DRAFT LOADING: Calling reset() with form data");
      reset(completeFormData);
      
      // Trigger a form validation to update any computed values
      setTimeout(() => {
        console.log("🔥 DRAFT LOADING: Triggering form validation");
        trigger();
      }, 100);
      
      // Set the current draft ID
      setCurrentDraftId(draftId);
      
      // Set files if available
      if (draft.files) {
        setFiles(draft.files);
      }
      
      // Set edit mode
      setEditMode(true);
      
      // Verify the form was updated
      setTimeout(() => {
        const values = watch();
        console.log("🔥 DRAFT LOADING: Form values after reset and delay:", values);
        console.log("🔥 DRAFT LOADING: Claimant name after reset:", values.claimant?.name);
        
        // If the form still doesn't have the data, try a force update
        if (!values.claimant?.name && completeFormData.claimant?.name) {
          console.log("🔥 DRAFT LOADING: Form didn't update properly, forcing update");
          
          // Try setting values individually
          Object.keys(completeFormData.claimant).forEach(key => {
            setValue(`claimant.${key}` as any, completeFormData.claimant[key]);
          });
          
          // Set other sections
          if (completeFormData.respondents?.length > 0) {
            setValue('respondents' as any, completeFormData.respondents);
          }
          
          // Force a re-render
          setActiveStep(activeStep);
        }
      }, 500);
      
      toast.success('Draft loaded successfully');
    } catch (error: any) {
      console.error('🔥 DRAFT LOADING: Draft load error:', error);
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
      disputeDetails, 
      prayers, 
      payment, 
      arguments: { argumentsPerIssue }, 
      documents 
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
                  label="Type"
                  name="claimant.type"
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
                  name="claimant.name"
                  required
                  maxLength={MAX_NAME_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Pincode"
                  name="claimant.pincode"
                  required
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode (numbers only) for automatic location lookup</p>
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Address Line 1"
                  name="claimant.address1"
                  required
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
                  label="City"
                  name="claimant.city"
                  required
                  type="select"
                  options={cityOptions.length > 0 ? cityOptions : [{ value: "", label: "Enter pincode to load cities" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="District"
                  name="claimant.district"
                  required
                  type="select"
                  options={districtOptions.length > 0 ? districtOptions : [{ value: "", label: "Enter pincode to load districts" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="State"
                  name="claimant.state"
                  required
                  type="select"
                  options={stateOptions.length > 0 ? stateOptions : [{ value: "", label: "Enter pincode to load states" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Country"
                  name="claimant.country"
                  required
                  type="select"
                  options={countryOptions.length > 0 ? countryOptions : [{ value: "", label: "Enter pincode to load countries" }]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Email"
                  name="claimant.email"
                  required
                  maxLength={MAX_EMAIL_LENGTH}
                />
              </div>
              <div>
                <PhoneField
                  control={control}
                  phoneFieldName="claimant.phone"
                  countryCodeFieldName="claimant.phoneCountryCode"
                  label="Phone"
                  required
                  error={!formValues.claimant.phone ? "Phone is required" : ""}
                  />
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
                      onClick={() => removeAdditionalClaimantField(index)}
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
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Email"
                        name={`additionalClaimants.${index}.email`}
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                    />
                  </div>
                  <div>
                      <PhoneField
                        control={control}
                        phoneFieldName={`additionalClaimants.${index}.phone`}
                        countryCodeFieldName={`additionalClaimants.${index}.phoneCountryCode`}
                      label="Phone"
                      required
                      />
                  </div>
                  <div>
                      <ControlledFormField
                        control={control}
                      label="Address"
                        name={`additionalClaimants.${index}.address`}
                      required
                      maxLength={MAX_ADDRESS_LENGTH}
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
              <div className="border p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <ControlledFormField
                      control={control}
                      label="Name"
                      name="managerDetails.name"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Designation"
                      name="managerDetails.designation"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Email"
                      name="managerDetails.email"
                    maxLength={MAX_EMAIL_LENGTH}
                  />
                </div>
                <div>
                    <PhoneField
                      control={control}
                      phoneFieldName="managerDetails.phone"
                      countryCodeFieldName="managerDetails.phoneCountryCode"
                    label="Phone"
                    />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Address"
                      name="managerDetails.address"
                    maxLength={MAX_ADDRESS_LENGTH}
                  />
                </div>
                <div>
                    <ControlledFormField
                      control={control}
                    label="Authority"
                      name="managerDetails.authority"
                    maxLength={MAX_NAME_LENGTH}
                  />
                  </div>
                </div>
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
                    <div className="col-span-2">
                      <ControlledFormField
                        control={control}
                      label="Address"
                        name={`respondents.${index}.address`}
                      required
                      maxLength={MAX_ADDRESS_LENGTH}
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
            <h3 className="font-medium text-lg mb-4">Arbitration Agreement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Controller
                  control={control}
                  name="arbitrationAgreement.agreementDate"
                  render={({ field, fieldState }) => (
                <FormField
                  label="Agreement Date"
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
                  label="Agreement Type"
                  name="arbitrationAgreement.agreementType"
                  required
                  type="select"
                  options={[
                    { value: "contract", label: "Contract" },
                    { value: "clause", label: "Arbitration Clause" },
                    { value: "separate", label: "Separate Agreement" },
                    { value: "submission", label: "Submission Agreement" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Resolution Mode"
                  name="arbitrationAgreement.resolutionMode"
                  required
                  type="select"
                  options={[
                    { value: "sole", label: "Sole Arbitrator" },
                    { value: "tribunal", label: "Arbitral Tribunal" },
                    { value: "institutional", label: "Institutional Arbitration" },
                    { value: "fast_track", label: "Fast Track Procedure" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Seat of Arbitration"
                  name="arbitrationAgreement.seatOfArbitration"
                  required
                  maxLength={MAX_ARBITRATION_FIELD_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Signed-on Place"
                  name="arbitrationAgreement.signedOnPlace"
                  required
                  maxLength={MAX_ARBITRATION_FIELD_LENGTH}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Arbitrator Selection"
                  name="arbitrationAgreement.arbitratorSelection"
                  required
                  type="select"
                  options={[
                    { value: "parties", label: "Selected by Parties" },
                    { value: "court", label: "Appointed by Court" },
                    { value: "institution", label: "Selected by Institution" },
                    { value: "default", label: "Default Procedure" },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <ControlledFormField
                  control={control}
                  label="Agreement Parties"
                  name="arbitrationAgreement.agreementParties"
                  required
                  maxLength={MAX_ARBITRATION_FIELD_LENGTH}
                />
              </div>
              <div className="col-span-2">
                <FileField
                  label="Agreement File"
                  name="agreementFile"
                  onChange={(file) => {
                    if (!Array.isArray(file)) {
                      handleFileChange('agreementFile', file);
                    }
                  }}
                  required
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  error={!files.agreementFile ? "Agreement file is required" : ""}
                />
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
                <ControlledFormField
                  control={control}
                  label="Dispute Type"
                  name="disputeDetails.disputeType"
                  required
                  type="select"
                  options={[
                    { value: "commercial", label: "Commercial" },
                    { value: "construction", label: "Construction" },
                    { value: "employment", label: "Employment" },
                    { value: "intellectual_property", label: "Intellectual Property" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Service Type"
                  name="disputeDetails.serviceType"
                  required
                  type="select"
                  options={[
                    { value: "fast_track", label: "Fast Track" },
                    { value: "regular", label: "Regular" },
                    { value: "emergency", label: "Emergency" },
                    { value: "institutional", label: "Institutional" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Dispute Category"
                  name="disputeDetails.disputeCategory"
                  required
                  type="select"
                  options={[
                    { value: "contractual", label: "Contractual" },
                    { value: "corporate", label: "Corporate" },
                    { value: "real_estate", label: "Real Estate" },
                    { value: "banking", label: "Banking & Finance" },
                    { value: "international", label: "International" },
                    { value: "employment", label: "Employment" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              <div>
                <ControlledFormField
                  control={control}
                  label="Dispute Sub-Category"
                  name="disputeDetails.disputeSubCategory"
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
                  label="Dispute Amount (INR)"
                  name="disputeDetails.disputeAmount"
                  type="number"
                  required
                  maxLength={MAX_DISPUTE_AMOUNT_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum amount: {MAX_DISPUTE_AMOUNT.toLocaleString()} INR</p>
              </div>
              <div>
                <Controller
                  control={control}
                  name="disputeDetails.disputeDate"
                  render={({ field, fieldState }) => (
                <FormField
                  label="Dispute Date"
                  name="disputeDate"
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
                  label="Nature of Dispute"
                  name="disputeDetails.natureOfDispute"
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
                  name="disputeDetails.applicableActs"
                  render={({ field, fieldState }) => (
                    <>
                <FormField
                  label="Applicable Acts"
                  name="applicableActs"
                        value={field.value?.join(', ') || ""}
                        onChange={(e) => {
                    const newActs = e.target.value.split(',').map(act => act.trim());
                          field.onChange(newActs);
                          setFormChanged(true);
                        }}
                  required
                  placeholder="Enter applicable acts separated by commas"
                        error={fieldState.error?.message}
                        maxLength={MAX_APPLICABLE_ACTS_LENGTH}
                />
                      <p className="text-xs text-gray-500 mt-1">Maximum {MAX_APPLICABLE_ACTS_LENGTH} characters</p>
                    </>
                )}
                />
              </div>
              <div className="col-span-2">
                <ControlledFormField
                  control={control}
                  label="Contract Clause References"
                  name="disputeDetails.clauseReferences"
                  required
                  maxLength={500}
                  placeholder="e.g., Clause 12.3, 15.2, etc."
                />
              </div>
              <div className="col-span-2">
                <ControlledTextAreaField
                  control={control}
                  label="Facts of the Case"
                  name="disputeDetails.factsOfCase"
                  required
                  maxLength={2000}
                  placeholder="Provide a clear and concise statement of the facts related to the dispute"
                  rows={6}
                />
              </div>
              <div className="col-span-2">
                <ControlledTextAreaField
                  control={control}
                  label="Dispute Description"
                  name="disputeDetails.disputeDescription"
                  required
                  maxLength={2000}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )
      case 5: // Prayers & Reliefs
        return (
          <div className="space-y-4">
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
      case 6: // Documents
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4">Documents</h3>

            {/* Supporting Documents */}
            <Controller
              control={control}
              name="documents.supportingDocuments"
              render={({ field, fieldState }) => (
                <div>
                  <FileField
                    label="Supporting Documents"
                    name="supportingDocuments"
                    multiple={true}
                    onChange={(files) => {
                      if (Array.isArray(files)) {
                        field.onChange(files);
                        setFormChanged(true);
                      }
                    }}
                    error={fieldState.error?.message}
                    required
                  />
                  {Array.isArray(field.value) && field.value.map((file: File, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <span>{file.name}</span>
                      <Controller
                        control={control}
                        name={`documents.documentTypes.supporting_${idx}`}
                        defaultValue=""
                        render={({ field: typeField }) => (
                          <select
                            className="border rounded px-1 py-1"
                            value={typeField.value || ""}
                            onChange={typeField.onChange}
                          >
                            <option value="">Select type</option>
                            <option value="contract">Contract</option>
                            <option value="invoice">Invoice</option>
                            <option value="correspondence">Correspondence</option>
                            <option value="legal">Legal Document</option>
                            <option value="other">Other</option>
                          </select>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            />

            {/* Evidence Files */}
            <Controller
              control={control}
              name="documents.evidenceFiles"
              render={({ field, fieldState }) => (
                <div>
                  <FileField
                    label="Evidence Files"
                    name="evidenceFiles"
                    multiple={true}
                    onChange={(files) => {
                      if (Array.isArray(files)) {
                        field.onChange(files);
                        setFormChanged(true);
                      }
                    }}
                    error={fieldState.error?.message}
                  />
                  {Array.isArray(field.value) && field.value.map((file: File, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <span>{file.name}</span>
                      <Controller
                        control={control}
                        name={`documents.documentTypes.evidence_${idx}`}
                        defaultValue=""
                        render={({ field: typeField }) => (
                          <select
                            className="border rounded px-1 py-1"
                            value={typeField.value || ""}
                            onChange={typeField.onChange}
                          >
                            <option value="">Select type</option>
                            <option value="photo">Photo</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="statement">Statement</option>
                            <option value="expert">Expert Opinion</option>
                            <option value="other">Other</option>
                          </select>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            />

            <div>
              <div className="text-xs text-gray-500 mt-4">
                <p>Tips for document uploads:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Ensure all documents are clear and legible</li>
                  <li>Supported formats: PDF, DOCX, JPG, PNG (max 10MB per file)</li>
                  <li>For large documents, consider splitting them into smaller files</li>
                  <li>Always categorize your documents accurately for easier reference</li>
                </ul>
              </div>
            </div>
          </div>
        )
      case 7: // Payment
        return (
          <div className="space-y-4">
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
                          <PhoneField
                            control={control}
                            phoneFieldName={`additionalClaimants.${index}.phone`}
                            countryCodeFieldName={`additionalClaimants.${index}.phoneCountryCode`}
                            label="Phone"
                            required
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No additional claimants</div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Manager Details</h4>
                  {managerDetails?.name ? (
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {managerDetails?.name}
                      </div>
                      <div>
                        <span className="font-medium">Designation:</span> {managerDetails?.designation}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {managerDetails?.email}
                      </div>
                      <div>
                        <span className="font-medium">Authority:</span> {managerDetails?.authority}
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
                        <PhoneField
                          control={control}
                          phoneFieldName={`respondents.${index}.phone`}
                          countryCodeFieldName={`respondents.${index}.phoneCountryCode`}
                          label="Phone"
                          required
                        />
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
      console.log("Current draft ID changed, triggering form refresh:", currentDraftId);
      
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
                          console.error('Submission error:', error);
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
    </div>
  )
}

// Export with dynamic to disable SSR
export default dynamic(() => Promise.resolve(ArbitrationForm), { 
  ssr: false 
});