"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { arbitrationApi, auth, api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DocumentsTabs from './evidence/DocumentsTabs';
import { FormStepSidebar } from "@/components/ui/form-step-sidebar"
import PrayersSection from "@/components/ui/prayers-section"
import ArgumentsSection from "@/components/ui/arguments-section"
import { generateApplicationPDF, downloadPDF } from "@/lib/utils/pdf-generator";
import DuplicateCheckDialog from "./duplicate-check-dialog";

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
  "Nature of Dispute & Description",
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
      // Convert to uppercase and remove non-alphanumeric characters
      newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Apply PAN format: 5 letters + 4 digits + 1 letter
      let formattedValue = '';
      
      // First 5 characters: only letters
      if (newValue.length > 0) {
        const firstPart = newValue.slice(0, 5).replace(/[^A-Z]/g, '');
        formattedValue += firstPart;
      }
      
      // Next 4 characters: only digits  
      if (newValue.length > 5) {
        const middlePart = newValue.slice(5, 9).replace(/[^0-9]/g, '');
        formattedValue += middlePart;
      }
      
      // Last character: only letter
      if (newValue.length > 9) {
        const lastPart = newValue.slice(9, 10).replace(/[^A-Z]/g, '');
        formattedValue += lastPart;
      }
      
      newValue = formattedValue.slice(0, 10); // Limit to 10 characters
    } 
    // Handle GST formatting (15 characters: 22AAAAA0000A1Z5)
    else if (name.includes('gst') && type === 'text') {
      // Convert to uppercase and remove non-alphanumeric characters
      newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Apply GST format: 2 digits + 10 chars + 1 digit + 1 char + 1 digit
      let formattedValue = '';
      
      // First 2 characters: only digits (state code)
      if (newValue.length > 0) {
        const statePart = newValue.slice(0, 2).replace(/[^0-9]/g, '');
        formattedValue += statePart;
      }
      
      // Next 10 characters: PAN format (5 letters + 4 digits + 1 letter)
      if (newValue.length > 2) {
        const panPart = newValue.slice(2, 12);
        let panFormatted = '';
        
        // 5 letters
        if (panPart.length > 0) {
          panFormatted += panPart.slice(0, 5).replace(/[^A-Z]/g, '');
        }
        // 4 digits
        if (panPart.length > 5) {
          panFormatted += panPart.slice(5, 9).replace(/[^0-9]/g, '');
        }
        // 1 letter
        if (panPart.length > 9) {
          panFormatted += panPart.slice(9, 10).replace(/[^A-Z]/g, '');
        }
        
        formattedValue += panFormatted;
      }
      
      // Next character: only digit (entity number)
      if (newValue.length > 12) {
        const entityPart = newValue.slice(12, 13).replace(/[^0-9]/g, '');
        formattedValue += entityPart;
      }
      
      // Next character: letter or digit (default is Z)
      if (newValue.length > 13) {
        const defaultPart = newValue.slice(13, 14);
        formattedValue += defaultPart;
      }
      
      // Last character: digit (checksum)
      if (newValue.length > 14) {
        const checksumPart = newValue.slice(14, 15).replace(/[^0-9]/g, '');
        formattedValue += checksumPart;
      }
      
      newValue = formattedValue.slice(0, 15); // Limit to 15 characters
    } 
    // Handle CIN formatting (21 characters: L17110DL1982PLC013403)
    else if (name.includes('cin') && type === 'text') {
      // Convert to uppercase and remove non-alphanumeric characters
      newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Apply CIN format: L + 5 digits + 2 letters + 4 digits + PLC/PTC + 6 digits
      let formattedValue = '';
      
      // First character: L, U, or other letter
      if (newValue.length > 0) {
        const listingPart = newValue.slice(0, 1).replace(/[^A-Z]/g, '');
        formattedValue += listingPart;
      }
      
      // Next 5 characters: only digits (industry code)
      if (newValue.length > 1) {
        const industryPart = newValue.slice(1, 6).replace(/[^0-9]/g, '');
        formattedValue += industryPart;
      }
      
      // Next 2 characters: only letters (state code)
      if (newValue.length > 6) {
        const statePart = newValue.slice(6, 8).replace(/[^A-Z]/g, '');
        formattedValue += statePart;
      }
      
      // Next 4 characters: only digits (year)
      if (newValue.length > 8) {
        const yearPart = newValue.slice(8, 12).replace(/[^0-9]/g, '');
        formattedValue += yearPart;
      }
      
      // Next 3 characters: PLC, PTC, etc.
      if (newValue.length > 12) {
        const typePart = newValue.slice(12, 15).replace(/[^A-Z]/g, '');
        formattedValue += typePart;
      }
      
      // Last 6 characters: only digits (registration number)
      if (newValue.length > 15) {
        const regPart = newValue.slice(15, 21).replace(/[^0-9]/g, '');
        formattedValue += regPart;
      }
      
      newValue = formattedValue.slice(0, 21); // Limit to 21 characters
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
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === "select" ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm transition duration-200 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
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
          max={max}
          placeholder={placeholder}
          inputMode={name.includes('pincode') ? 'numeric' : undefined}
          pattern={name.includes('pincode') ? '[0-9]*' : undefined}
          style={isBusinessId ? { textTransform: 'uppercase' } : undefined}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />
      )}
      
      {error && <div className="text-red-500 text-xs mt-1 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </div>}
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
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 resize-vertical ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
        }`}
      />
      
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {value.length}/{maxLength} characters
        </div>
      )}
      
      {error && <div className="text-red-500 text-xs mt-1 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </div>}
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
  existingFile?: any; // Add existingFile prop
}

export const FileField: React.FC<FileFieldProps> = ({
  label,
  name,
  onChange,
  required = false,
  error,
  accept,
  multiple = false,
  existingFile,
}) => {
  const id = `field-${name}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  
  // Debug logging for existingFile prop
  useEffect(() => {
    if (existingFile) {
      console.log(`🔧 FileField ${name} received existingFile:`, existingFile);
    }
  }, [existingFile, name]);
  
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
    type: z.string().min(1, "Type is required"),
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
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
  })).default([]),
  
  // Manager details - change to array
  managerDetails: z.array(z.object({
    type: z.string().min(1, "Type is required"),
    name: z.string().min(1, "Name is required").max(MAX_NAME_LENGTH),
    email: z.string().min(1, "Email is required").email("Must be a valid email").max(MAX_EMAIL_LENGTH),
    phone: z.string().min(10, "Phone is required").regex(/^\d{10}$/, "Must be a valid 10-digit phone number"),
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
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
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
  
  // Nature of Dispute (can be multiple)
  natureOfDispute: z.array(z.object({
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
  })).min(1, "At least one nature of dispute is required"),

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
        crossExaminationRef: z.string().optional(),
        extractedText: z.string().optional(),
        keyMetadata: z.array(z.object({
          key: z.string(),
          value: z.string()
        })).optional()
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
  mode?: 'create' | 'edit';
  onSubmit: (data: FormData) => Promise<void>;
}

function ArbitrationForm({ onSubmit, initialData, mode = 'create', petitionId }: ArbitrationFormProps) {
  console.log('🔧 ArbitrationForm: Component mounted with:', {
    mode,
    hasInitialData: !!initialData,
    initialDataKeys: initialData ? Object.keys(initialData) : [],
    hasDocuments: !!initialData?.documents,
    documentsKeys: initialData?.documents ? Object.keys(initialData.documents) : [],
    hasFileMetadata: !!initialData?.fileMetadata,
    fileMetadataKeys: initialData?.fileMetadata ? Object.keys(initialData.fileMetadata) : [],
    hasFiles: !!initialData?.files,
    filesKeys: initialData?.files ? Object.keys(initialData.files) : [],
    sampleInitialData: initialData ? {
      claimant: !!initialData.claimant,
      arbitrationAgreement: !!initialData.arbitrationAgreement,
      disputeDetails: !!initialData.disputeDetails,
      respondents: !!initialData.respondents
    } : 'none'
  });

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
  
  // Location options state - CRITICAL FIX: Separate options for each form section
  const [claimantLocationOptions, setClaimantLocationOptions] = useState<{
    states: Array<{ value: string, label: string }>;
    districts: Array<{ value: string, label: string }>;
    cities: Array<{ value: string, label: string }>;
    countries: Array<{ value: string, label: string }>;
  }>({
    states: [],
    districts: [],
    cities: [],
    countries: []
  });
  
  const [respondentLocationOptions, setRespondentLocationOptions] = useState<{
    [key: number]: {
      states: Array<{ value: string, label: string }>;
      districts: Array<{ value: string, label: string }>;
      cities: Array<{ value: string, label: string }>;
      countries: Array<{ value: string, label: string }>;
    }
  }>({});
  
  const [additionalClaimantLocationOptions, setAdditionalClaimantLocationOptions] = useState<{
    [key: number]: {
      states: Array<{ value: string, label: string }>;
      districts: Array<{ value: string, label: string }>;
      cities: Array<{ value: string, label: string }>;
      countries: Array<{ value: string, label: string }>;
    }
  }>({});
  
  // File management state - Store files separately from form data
  const [files, setFiles] = useState<Record<string, File | null>>({});
  
  // Initialize files state
  useEffect(() => {
    if (Object.keys(files).length === 0) {
      setFiles({
        'claimant.coi': null,
        'claimant.panCard': null,
        'claimant.gstCert': null,
        'agreementFile': null,
      });
    }
  }, []);
  
  // Make files accessible to FileField components
  useEffect(() => {
    (window as any).currentFiles = files;
  }, [files]);
  
  // Debug: Monitor files state changes
  useEffect(() => {
    console.log('🔧 Files state changed:', files);
    console.log('🔧 Company files in state:', {
      coi: files['claimant.coi'],
      panCard: files['claimant.panCard'],
      gstCert: files['claimant.gstCert']
    });
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

  // Duplicate check dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<any>(null);
  
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

  // Field array for nature of dispute (multiple)
  const { 
    fields: natureOfDisputeFields, 
    append: appendNatureOfDispute,
    remove: removeNatureOfDispute
  } = useFieldArray({
    control,
    name: "natureOfDispute",
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
          
          console.log('🔧 Initial data loaded:', {
            hasFileMetadata: !!initialData.fileMetadata,
            fileMetadataKeys: initialData.fileMetadata ? Object.keys(initialData.fileMetadata) : [],
            hasFiles: !!initialData.files,
            filesKeys: initialData.files ? Object.keys(initialData.files) : [],
            completeFormData: completeFormData
          });
          
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
            
            console.log('🔧 Loading file metadata for edit mode:', fileDisplayState);
            console.log('🔧 Available file metadata keys:', Object.keys(initialData.fileMetadata));
            
            // CRITICAL DEBUG: Log specific document files
            console.log('🔧 Document files being set:', {
              scannedDocs: Object.keys(fileDisplayState).filter(key => key.startsWith('scannedDoc_')),
              affidavits: Object.keys(fileDisplayState).filter(key => key.startsWith('affidavit_')),
              certificates: Object.keys(fileDisplayState).filter(key => key.startsWith('certificate_')),
              allFiles: Object.keys(fileDisplayState)
            });
            
            setFiles(fileDisplayState);
            
            // CRITICAL FIX: Expose files state globally for FileField components
            (window as any).currentFiles = fileDisplayState;
            
            // Debug: Log the specific company document files
            console.log('🔧 Company document files:', {
              coi: fileDisplayState['claimant.coi'],
              panCard: fileDisplayState['claimant.panCard'],
              gstCert: fileDisplayState['claimant.gstCert']
            });
            
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
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json() as PincodeResponse[];
          
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            
            // Extract unique cities from all post offices
            const cities = Array.from(new Set(data[0].PostOffice.map(po => po.Name)));
            
            // Convert to option objects for dropdowns
            setClaimantLocationOptions({
              states: [{ value: postOffice.State, label: postOffice.State }],
              districts: [{ value: postOffice.District, label: postOffice.District }],
              cities: cities.map(city => ({ value: city, label: city })),
              countries: [{ value: postOffice.Country, label: postOffice.Country }]
            });
            
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
                
                // CRITICAL FIX: Update location options for respondent forms
                setRespondentLocationOptions(prev => ({
                  ...prev,
                  [index]: {
                    states: [{ value: postOffice.State, label: postOffice.State }],
                    districts: [{ value: postOffice.District, label: postOffice.District }],
                    cities: cities.map(city => ({ value: city, label: city })),
                    countries: [{ value: postOffice.Country, label: postOffice.Country }]
                  }
                }));
                
                // Update form fields with new values for this specific respondent
                setValue(`respondents.${index}.country`, postOffice.Country);
                setValue(`respondents.${index}.state`, postOffice.State);
                setValue(`respondents.${index}.district`, postOffice.District);
                setValue(`respondents.${index}.city`, cities[0] || "");
                
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
                
                // CRITICAL FIX: Update location options for additional claimant forms
                setAdditionalClaimantLocationOptions(prev => ({
                  ...prev,
                  [index]: {
                    states: [{ value: postOffice.State, label: postOffice.State }],
                    districts: [{ value: postOffice.District, label: postOffice.District }],
                    cities: cities.map(city => ({ value: city, label: city })),
                    countries: [{ value: postOffice.Country, label: postOffice.Country }]
                  }
                }));
                
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
  
  // Reset verification when email/phone changes
  useEffect(() => {
    // Reset main claimant email verification if email changes (unless it's initial load)
    if (currentEmail && !editMode && !petitionId) {
      // Only reset if we're not in edit mode and this isn't the initial load
      const previousEmail = formValues.claimant?.email;
      if (previousEmail && previousEmail !== currentEmail && emailVerified) {
        setEmailVerified(false);
        toast.info('Email changed. Please verify your new email address.');
      }
    }
  }, [currentEmail, editMode, petitionId, emailVerified, formValues.claimant?.email]);

  useEffect(() => {
    // Reset main claimant phone verification if phone changes (unless it's initial load)
    if (currentPhone && !editMode && !petitionId) {
      // Only reset if we're not in edit mode and this isn't the initial load
      const previousPhone = formValues.claimant?.phone;
      if (previousPhone && previousPhone !== currentPhone && phoneVerified) {
        setPhoneVerified(false);
        toast.info('Phone number changed. Please verify your new phone number.');
      }
    }
  }, [currentPhone, editMode, petitionId, phoneVerified, formValues.claimant?.phone]);

  // Reset additional claimant verification when their contact info changes
  useEffect(() => {
    additionalClaimants.forEach((claimant, index) => {
      if (!editMode && !petitionId) {
        // Check if email changed for this additional claimant
        const previousClaimants = formValues.additionalClaimants || [];
        const previousEmail = previousClaimants[index]?.email;
        if (previousEmail && previousEmail !== claimant.email && additionalClaimantEmailVerified[index]) {
          setAdditionalClaimantEmailVerified(prev => {
            const newVerified = [...prev];
            newVerified[index] = false;
            return newVerified;
          });
          toast.info(`Additional Claimant ${index + 1}: Email changed. Please verify the new email address.`);
        }

        // Check if phone changed for this additional claimant
        const previousPhone = previousClaimants[index]?.phone;
        if (previousPhone && previousPhone !== claimant.phone && additionalClaimantPhoneVerified[index]) {
          setAdditionalClaimantPhoneVerified(prev => {
            const newVerified = [...prev];
            newVerified[index] = false;
            return newVerified;
          });
          toast.info(`Additional Claimant ${index + 1}: Phone number changed. Please verify the new phone number.`);
        }
      }
    });
  }, [additionalClaimants, editMode, petitionId, additionalClaimantEmailVerified, additionalClaimantPhoneVerified, formValues.additionalClaimants]);
  
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

  const addNatureOfDispute = () => {
    appendNatureOfDispute({
      category: "",
      subCategory: "",
      natureOfDispute: "",
      dateWhenRightToClaimArose: "",
      standardisedPrayerClauses: "",
    });
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
  const validateCurrentStep = async (): Promise<boolean> => {
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
      arguments: argumentsData,
      documents
    } = watch();

    let fieldsToValidate: Array<keyof FormData | string> = [];

    switch (activeStep) {
      case 0: // Claimant Details
        fieldsToValidate = ['claimant.type', 'claimant.name', 'claimant.email', 'claimant.phone'];
        break;
      case 1: // Additional Claimants & Manager
        fieldsToValidate = []; // Optional fields
        break;
      case 2: // Respondent Details
        fieldsToValidate = ['respondents'];
        break;
      case 3: // Arbitration Agreement
        fieldsToValidate = ['arbitrationAgreement'];
        break;
      case 4: // Nature of Dispute & Description
        fieldsToValidate = ['natureOfDispute', 'disputeDescriptions'];
        break;
      case 5: // Prayers & Reliefs
        fieldsToValidate = ['prayers'];
        break;
      case 6: // Documents
        fieldsToValidate = ['documents'];
        break;
      case 7: // Payment
        fieldsToValidate = ['payment.paymentHead', 'payment.paymentAmount', 'payment.paymentDetails'];
        break;
      case 8: // Arguments
        fieldsToValidate = ['arguments.argumentsPerPrayer'];
        break;
      case 9: // Review & Submit
        fieldsToValidate = []; // Final review step
        break;
      default:
        return true;
    }

    try {
      if (fieldsToValidate.length > 0) {
        await trigger(fieldsToValidate as any);
      }
      return true;
    } catch (error) {
      return false;
    }
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
    if (Array.isArray(file)) {
      // Handle multiple files
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
    } else {
      // Handle single file
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
      
      // Trigger OCR processing for document uploads
      if (file && fieldName.includes('.')) {
        performOCR(file, fieldName);
      }
    }
  };

  // OCR processing function
  const performOCR = async (file: File, fieldName: string) => {
    try {
      // Show loading toast
      toast.loading("Extracting data from document...", {
        duration: 3000,
        id: `ocr-${fieldName}`
      });

      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR data extraction based on document type
      let extractedData: Record<string, string> = {};
      
      if (fieldName.includes('panCard')) {
        extractedData.pan = 'AAAPL1234C';
      } else if (fieldName.includes('gstCert')) {
        extractedData.gst = '22AAAAA0000A1Z5';
      } else if (fieldName.includes('coi')) {
        extractedData.cin = 'U74140MH2014PTC123456';
      }

      // Extract entity path and index from fieldName
      const parts = fieldName.split('.');
      let entityPath = '';
      let index = -1;

      if (parts[0] === 'claimant') {
        entityPath = 'claimant';
      } else if (parts[0] === 'additionalClaimants') {
        entityPath = 'additionalClaimants';
        index = parseInt(parts[1]);
      } else if (parts[0] === 'managerDetails') {
        entityPath = 'managerDetails';
        index = parseInt(parts[1]);
      } else if (parts[0] === 'respondents') {
        entityPath = 'respondents';
        index = parseInt(parts[1]);
      }

      // Auto-populate form fields
      Object.entries(extractedData).forEach(([key, value]) => {
        if (entityPath && index >= 0) {
          setValue(`${entityPath}.${index}.${key}`, value);
        } else if (entityPath) {
          setValue(`${entityPath}.${key}`, value);
        }
      });

      // Show success toast with extracted values
      const extractedValues = Object.entries(extractedData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join(', ');
      
      toast.success(`OCR completed! Extracted: ${extractedValues}`, {
        id: `ocr-${fieldName}`,
        duration: 5000
      });

    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error("Failed to extract data from document", {
        id: `ocr-${fieldName}`
      });
    }
  };
  
  // CRITICAL FIX: Effect to restore files when navigating between steps
  useEffect(() => {
    const restoreFiles = () => {
      const globalFiles = (window as any).currentFiles;
      if (globalFiles && typeof globalFiles === 'object') {
        setFiles(prev => ({
          ...prev,
          ...globalFiles
        }));
      }
    };
    
    restoreFiles();
  }, [activeStep]); // Restore files when step changes
  
  // Form submission handler
  const handleFormSubmission = async (data: FormData) => {
    setIsSubmitting(true);

    // Validate file requirements before submitting
    const fileErrors: { [key: string]: string } = {};
    
    // Validate claimant documents if required
    if (data.claimant.type !== 'individual') {
      if (data.claimant.gst && !files['claimant.gstCert']) {
        fileErrors['claimant.gstCert'] = 'GST Certificate';
      }
      if (data.claimant.pan && !files['claimant.panCard']) {
        fileErrors['claimant.panCard'] = 'PAN Card';
      }
      if (data.claimant.cin && !files['claimant.coi']) {
        fileErrors['claimant.coi'] = 'Certificate of Incorporation';
      }
    }
    
    // Check if we have validation errors and return
    if (Object.keys(fileErrors).length > 0) {
      setIsSubmitting(false);
      const missingFiles = Object.values(fileErrors).join(', ');
      toast.error(`Please upload required files: ${missingFiles}`);
      return;
    }

    // Create FormData for submission
    const formDataForSubmission = new FormData();
    
    // Add the draft ID if editing
    if (currentDraftId) {
      formDataForSubmission.append('id', currentDraftId);
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
      
      // Include all other form data
      additionalClaimants: data.additionalClaimants,
      managerDetails: data.managerDetails,
      respondents: data.respondents,
      arbitrationAgreement: data.arbitrationAgreement,
      natureOfDispute: data.natureOfDispute,
      disputeDescriptions: data.disputeDescriptions,
      documentsEvidence: data.documentsEvidence,
      prayers: data.prayers,
      arguments: data.arguments,
      payment: data.payment,
      documents: data.documents,
      
      // Store the complete form data structure
      formData: data
    };

    // Remove file objects from the JSON data (they're sent separately as FormData)
    const cleanedData = JSON.parse(JSON.stringify(restructuredData, (key, value) => {
      if (value && typeof value === 'object' && value.constructor === File) {
        return undefined; // Remove File objects
      }
      return value;
    }));

    formDataForSubmission.append('data', JSON.stringify(cleanedData));

    // Append files
    Object.entries(files).forEach(([key, file]) => {
      if (file && file instanceof File) {
        formDataForSubmission.append(key, file);
      }
    });

    // Handle supporting documents
    data.documents?.supportingDocuments?.forEach((doc: any, index: number) => {
      if (doc.file && doc.file instanceof File) {
        formDataForSubmission.append(`supportingDocuments_${index}`, doc.file);
      }
    });

    // Handle evidence files
    data.documents?.evidenceFiles?.forEach((file: any, index: number) => {
      if (file && file instanceof File) {
        formDataForSubmission.append(`evidenceFiles_${index}`, file);
      }
    });

    formDataForSubmission.append('documentTypes', JSON.stringify(documentTypes));

    // Handle scanned documents
    data.documents?.scannedDocuments?.forEach((doc: any, index: number) => {
      if (doc.file && doc.file instanceof File) {
        formDataForSubmission.append(`scannedDoc_${index}`, doc.file);
      }
    });

    // Handle affidavits
    data.documents?.affidavits?.forEach((affidavit: any, index: number) => {
      if (affidavit.file && affidavit.file instanceof File) {
        formDataForSubmission.append(`affidavit_${index}`, affidavit.file);
      }
    });

    // Handle electronic evidence
    data.documents?.electronicEvidence?.forEach((evidence: any, index: number) => {
      if (evidence.certificateFile && evidence.certificateFile instanceof File) {
        formDataForSubmission.append(`certificate_${index}`, evidence.certificateFile);
      }
      
      evidence.supportingFiles?.forEach((file: any, fileIndex: number) => {
        if (file && file instanceof File) {
          formDataForSubmission.append(`supporting_files_${index}`, file);
        }
      });
    });

    // Handle remaining file fields
    Object.entries(files).forEach(([key, file]) => {
      if (file && file instanceof File && !key.includes('.')) {
        const fieldName = key.replace(/\./g, '_');
        formDataForSubmission.append(fieldName, file);
      }
    });

    try {
      // Check for duplicates only for new cases (not updates)
      if (!currentDraftId || (initialData && initialData.isDraft)) {
        toast.loading('Checking for duplicate cases...');
        
        try {
          const duplicateCheck = await arbitrationApi.checkDuplicates(data);
          
          toast.dismiss(); // Dismiss the checking toast
          
          if (duplicateCheck.isDuplicate || (duplicateCheck.matchingCases && duplicateCheck.matchingCases.length > 0)) {
            // Store the submission data and show duplicate dialog
            // Store formData as regular object to avoid .has() method issue
            setPendingSubmissionData({ 
              data, 
              formDataForSubmission, // Store the FormData separately
              restructuredData: cleanedData // Store clean data for resubmission
            });
            setDuplicateCheckResult(duplicateCheck);
            setShowDuplicateDialog(true);
            return; // Stop submission until user decides
          }
        } catch (duplicateError) {
          toast.dismiss();
          console.error('Duplicate check failed:', duplicateError);
          // Continue with submission if duplicate check fails
          toast.warning('Could not check for duplicates, proceeding with submission...');
        }
      }
      
      // Show submission toast
      toast.loading('Submitting your petition...');
      
      // Submit the form
      if (currentDraftId) {
        // If editing a submitted case (not a draft), use update API
        if (initialData && !initialData.isDraft && initialData.status !== 'draft') {
          try {
            const response = await arbitrationApi.update(currentDraftId, formDataForSubmission);
            
            // Dismiss the loading toast
            toast.dismiss();
            
            // Show success message
            const caseId = response.caseId || response.caseNumber || response.id || currentDraftId;
            toast.success(`Your application is submitted successfully and application number is ${caseId}. The PDF of the form is sent to your registered email ID as well as to all managers and respondents.`);
            
            // Generate and download PDF
            try {
              const currentFormData = watch();
              const pdfBlob = await generateApplicationPDF(currentFormData, caseId);
              downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
            } catch (pdfError) {
              console.error('PDF generation failed:', pdfError);
              toast.error('PDF generation failed, but your application was submitted successfully.');
            }
            
            // Navigate to case details
            router.push(`/dashboard/case/${currentDraftId}`);
            return;
          } catch (error: any) {
            toast.dismiss();
            toast.error(error.response?.data?.message || 'Failed to update case');
            return;
          }
        } else {
          // This is a draft being submitted
          try {
            const response = await arbitrationApi.submitDraft(currentDraftId);
            
            // Dismiss the loading toast
            toast.dismiss();
            
            // Show success message
            const caseId = response.caseId || response.caseNumber || response.id;
            if (caseId) {
              toast.success(`Your application is submitted successfully and application number is ${caseId}. The PDF of the form is sent to your registered email ID as well as to all managers and respondents.`);
              
              // Generate and download PDF
              try {
                const currentFormData = watch();
                const pdfBlob = await generateApplicationPDF(currentFormData, caseId);
                downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
              } catch (pdfError) {
                console.error('PDF generation failed:', pdfError);
                toast.error('PDF generation failed, but your application was submitted successfully.');
              }
            } else {
              toast.success('Your application is submitted successfully! The PDF of the form is sent to your registered email ID as well as to all managers and respondents.');
            }
            
            // Navigate back to cases
            router.push('/dashboard/my-cases');
            return;
          } catch (error: any) {
            toast.dismiss();
            toast.error(error.response?.data?.message || 'Failed to submit draft');
            return;
          }
        }
      } else {
        // Creating a new case
        try {
          const response = await arbitrationApi.create(formDataForSubmission, { skipDuplicateCheck: true });
          
          // Dismiss the loading toast
          toast.dismiss();
          
          // Show success message
          const caseId = response.caseId || response.caseNumber || response.id;
          toast.success(`Your application is submitted successfully and application number is ${caseId}. The PDF of the form is sent to your registered email ID as well as to all managers and respondents.`);
          
          // Generate and download PDF
          try {
            const currentFormData = watch();
            const pdfBlob = await generateApplicationPDF(currentFormData, caseId);
            downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            toast.error('PDF generation failed, but your application was submitted successfully.');
          }
          
          // Navigate to cases page
          router.push('/dashboard/my-cases');
          return;
        } catch (error: any) {
          toast.dismiss();
          toast.error(error.response?.data?.message || 'Failed to create case');
          return;
        }
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to submit petition');
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
