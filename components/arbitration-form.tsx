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

import PrayersSection from "@/components/ui/prayers-section"
import ArgumentsSection from "@/components/ui/arguments-section"
import { generateApplicationPDF, downloadPDF } from "@/lib/utils/pdf-generator";
import DuplicateCheckDialog from "./duplicate-check-dialog";
import { FormStepSidebar } from "@/components/ui/form-step-sidebar";
import { Users, Gavel, Scale, FileText, DollarSign, MessageSquare, Eye } from 'lucide-react';

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

const sidebarSteps = [
  {
    id: 0,
    title: "Step 1: Claimant Details",
    description: "Personal and business information",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 1,
    title: "Step 2: Additional Claimants",
    description: "Co-claimants and authorized managers",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Step 3: Respondent Details",
    description: "Opposing party information",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Step 4: Arbitration Agreement",
    description: "Agreement terms and arbitrator selection",
    icon: <Gavel className="w-5 h-5" />
  },
  {
    id: 4,
    title: "Step 5: Nature of Dispute",
    description: "Category and background details",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 5,
    title: "Step 6: Dispute Description",
    description: "Detailed claims and supporting facts",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 6,
    title: "Step 7: Prayers & Reliefs",
    description: "Specific remedies sought",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 7,
    title: "Step 8: Documents",
    description: "Evidence and supporting files",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 8,
    title: "Step 9: Payment",
    description: "Fee structure and payment details",
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 9,
    title: "Step 10: Arguments",
    description: "Legal arguments for each prayer",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 10,
    title: "Step 11: Review & Submit",
    description: "Final review before submission",
    icon: <Eye className="w-5 h-5" />
  },
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
  coi: null,
  panCard: null,
  gstCert: null,
}

const initialManagerDetails = {
  type: "",
  name: "",
  pincode: "",
  address1: "",
  city: "",
  district: "",
  state: "",
  country: "",
  email: "",
  phone: "",
  phoneCountryCode: "+91",
  address2: "",
  designation: "",
  authority: "",
  managerId: "",
  coi: null,
  panCard: null,
  gstCert: null,
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
  coi: null,
  panCard: null,
  gstCert: null,
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
  prayers: [{
    id: Math.random().toString(36).substr(2, 9),
    title: "",
    description: "",
    amount: "",
    reliefType: "monetary"
  }]
}

const initialDocuments = {
  supportingDocuments: [] as File[],
  evidenceFiles: [] as File[],
  documentTypes: {} as Record<string, string>,
  scannedDocuments: [{
    documentType: "",
    date: "",
    file: null,
    linkedIssue: "",
    admissionStatus: "pending" as const,
    description: "",
    isOCREnabled: false,
    extractedText: "",
    keyMetadata: []
  }]
}

const initialPayment = {
  paymentHead: "",
  paymentAmount: "",
  paymentDetails: "",
}

const initialArguments = {
  argumentsPerIssue: [] as string[],
  argumentsPerPrayer: [] as any[],
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
          className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm transition duration-200 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'hover:border-gray-300'
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
          className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'hover:border-gray-300'
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
        className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 resize-vertical ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'hover:border-gray-300'
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
      console.log(`🔧 FileField ${name} received existingFile:`, existingFile);
    if (existingFile) {
      console.log(`🔧 FileField ${name} has existingFile with name:`, existingFile.name);
    } else {
      console.log(`🔧 FileField ${name} has NO existingFile`);
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
    // Document upload requirements
    coi: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "Certificate of Incorporation is required",
    }),
    panCard: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "PAN Card is required",
    }),
    gstCert: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "GST Certificate is required",
    }),
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
    // Manager ID Number - NEW MANDATORY FIELD
    managerId: z.string().min(1, "Manager ID Number is required").max(50, "Manager ID must be less than 50 characters"),
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    // Document upload requirements
    coi: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "Certificate of Incorporation is required",
    }),
    panCard: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "PAN Card is required",
    }),
    gstCert: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "GST Certificate is required",
    }),
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
    phone: z.string().min(10, "Phone is required").regex(/^\d{10}$/, "Must be a valid 10-digit phone number"),
    phoneCountryCode: z.string().default("+91"),
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string().min(MIN_PAN_LENGTH, "PAN must be 10 characters").max(MAX_PAN_LENGTH, "PAN must be 10 characters").optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    // Document upload requirements
    coi: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "Certificate of Incorporation is required",
    }),
    panCard: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "PAN Card is required",
    }),
    gstCert: z.any().refine((file) => file instanceof File || (file && file.isExisting), {
      message: "GST Certificate is required",
    }),
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
    prayers: z.array(z.object({
      id: z.string(),
      title: z.string().min(1, "Prayer title is required"),
      description: z.string().min(1, "Prayer description is required"),
      amount: z.string().optional(),
      reliefType: z.enum(["monetary", "specific_performance", "declaratory", "injunction", "costs", "interim", "other"])
    })).min(1, "At least one prayer is required"),
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
    argumentsPerPrayer: z.array(z.object({
      prayerId: z.string(),
      prayerTitle: z.string(),
      argument: z.string().max(2000),
      legalBasis: z.string().max(1000).optional(),
      factualBasis: z.string().max(1000).optional(),
      precedents: z.string().max(1000).optional()
    })).optional(),
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
  draftId?: string;
  mode?: 'create' | 'edit';
  onSubmit: (data: FormData) => Promise<void>;
}

function ArbitrationForm({ onSubmit, initialData, mode = 'create', petitionId, draftId }: ArbitrationFormProps) {
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
  
  // Submission confirmation modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    caseId: string;
    applicationNumber: string;
  } | null>(null);
  
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
  
  // Manager verification states (arrays to handle multiple managers)
  const [managerEmailVerified, setManagerEmailVerified] = useState<boolean[]>([]);
  const [managerPhoneVerified, setManagerPhoneVerified] = useState<boolean[]>([]);
  
  // Respondent verification states (arrays to handle multiple respondents)
  const [respondentEmailVerified, setRespondentEmailVerified] = useState<boolean[]>([]);
  const [respondentPhoneVerified, setRespondentPhoneVerified] = useState<boolean[]>([]);
  
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

  // Respondent modal states
  const [showRespondentEmailModal, setShowRespondentEmailModal] = useState<boolean[]>([]);
  const [showRespondentPhoneModal, setShowRespondentPhoneModal] = useState<boolean[]>([]);
  const [respondentEmailOTPs, setRespondentEmailOTPs] = useState<string[]>([]);
  const [respondentPhoneOTPs, setRespondentPhoneOTPs] = useState<string[]>([]);
  const [respondentEmailOTPInputs, setRespondentEmailOTPInputs] = useState<string[]>([]);
  const [respondentPhoneOTPInputs, setRespondentPhoneOTPInputs] = useState<string[]>([]);

  // Duplicate check dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<any>(null);
  
  // Draft list modal state
  const [showDraftList, setShowDraftList] = useState(false);
  
  // Define steps for navigation
  const steps = [
    { id: 0, title: "Step 1: Claimant Details", description: "Personal and business information" },
    { id: 1, title: "Step 2: Additional Claimants", description: "Co-claimants and authorized managers" },
    { id: 2, title: "Step 3: Respondent Details", description: "Opposing party information" },
    { id: 3, title: "Step 4: Arbitration Agreement", description: "Agreement terms and arbitrator selection" },
    { id: 4, title: "Step 5: Nature of Dispute", description: "Category and background details" },
    { id: 5, title: "Step 6: Dispute Description", description: "Detailed claims and supporting facts" },
    { id: 6, title: "Step 7: Prayers & Reliefs", description: "Specific remedies sought" },
    { id: 7, title: "Step 8: Documents", description: "Evidence and supporting files" },
    { id: 8, title: "Step 9: Payment", description: "Fee structure and payment details" },
    { id: 9, title: "Step 10: Arguments", description: "Legal arguments for each prayer" },
    { id: 10, title: "Step 11: Review & Submit", description: "Final review before submission" }
  ];
  
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
      natureOfDispute: [initialNatureOfDispute], // Add default nature of dispute
      disputeDescriptions: [initialDisputeDescription],
      documentsEvidence: [initialDocumentEvidence],
      prayers: initialPrayers,
      payment: initialPayment,
      arguments: initialArguments,
      documents: initialDocuments,
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

  // Field array for prayers
  const { 
    fields: prayerFields, 
    append: appendPrayer,
    remove: removePrayer
  } = useFieldArray({
    control,
    name: "prayers.prayers",
  });

  // Field array for documents
  const { 
    fields: documentFields, 
    append: appendDocument,
    remove: removeDocument
  } = useFieldArray({
    control,
    name: "documents.scannedDocuments",
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
              const emailStates = completeFormData.additionalClaimants.map((ac: any) => !!ac.email);
              const phoneStates = completeFormData.additionalClaimants.map((ac: any) => !!ac.phone);
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
  
  // Load draft when draftId is provided
  useEffect(() => {
    if (draftId && isAuthenticated) {
      console.log('🔧 ArbitrationForm: Loading draft with ID:', draftId);
      loadDraft(draftId);
    }
  }, [draftId, isAuthenticated]);
  
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
    // Add verification states for the new manager
    setManagerEmailVerified(prev => [...prev, false]);
    setManagerPhoneVerified(prev => [...prev, false]);
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
    // Add verification states for the new respondent
    setRespondentEmailVerified(prev => [...prev, false]);
    setRespondentPhoneVerified(prev => [...prev, false]);
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



    try {
      // Send OTP via email
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'otp'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.otp) {
        setSentEmailOTP(result.otp);
        setShowEmailOTP(true);
        toast.success(`Email OTP sent to ${email}. Please check your inbox.`);
      } else {
        toast.error('Failed to send email OTP. Please try again.');
        console.error('Email error:', result.error);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to send email OTP. Please try again.');
    }
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

  // Draft management functions
  const hasSavedDraft = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('arbitration_draft_timestamp');
  };

  const loadLocalDraft = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const draftData = localStorage.getItem('arbitration_draft_data');
      const savedStep = localStorage.getItem('arbitration_draft_step');
      
      if (draftData) {
        const parsedData = JSON.parse(draftData);
        reset(parsedData);
        
        if (savedStep) {
          setActiveStep(parseInt(savedStep));
        }
        
        toast.success('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
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
      // Send OTP via email
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'otp'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.otp) {
      // Update arrays to show modal for this specific claimant
      const newSentOTPs = [...sentAdditionalEmailOTP];
      const newShowModals = [...showAdditionalEmailOTP];
      
      // Ensure arrays are large enough
      while (newSentOTPs.length <= index) newSentOTPs.push("");
      while (newShowModals.length <= index) newShowModals.push(false);
      
        newSentOTPs[index] = result.otp;
      newShowModals[index] = true;
      
      setSentAdditionalEmailOTP(newSentOTPs);
      setShowAdditionalEmailOTP(newShowModals);
        
        toast.success(`Email OTP sent to ${email}. Please check your inbox.`);
      } else {
        toast.error('Failed to send email OTP. Please try again.');
        console.error('Email error:', result.error);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to send email OTP. Please try again.');
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

  // Manager verification functions
  const sendManagerPhoneVerification = async (index: number) => {
    const phone = watch(`managerDetails.${index}.phone`);
    const countryCode = watch(`managerDetails.${index}.phoneCountryCode`);
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }


    
    try {
      // Generate OTP for demo
      const otp = generateOTP();
      
      toast.success(`Demo OTP sent to ${countryCode} ${phone}: ${otp}`);
      
      // Mark as verified for demo
      setManagerPhoneVerified(prev => {
        const newVerified = [...prev];
        newVerified[index] = true;
        return newVerified;
      });
      
      toast.success(`Phone verified successfully for Manager ${index + 1}`);
    } catch (error) {
      toast.error('Failed to send verification SMS');
    }
  };

  const sendManagerEmailVerification = async (index: number) => {
    const email = watch(`managerDetails.${index}.email`);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }


    
    try {
      // Send OTP via email
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'otp'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.otp) {
        // Store OTP for verification
        setManagerEmailOTPs(prev => {
          const newOTPs = [...prev];
          newOTPs[index] = result.otp;
          return newOTPs;
        });
        
        // Show OTP modal
        setShowManagerEmailModal(prev => {
          const newModals = [...prev];
          newModals[index] = true;
          return newModals;
        });
        
        toast.success(`Email OTP sent to ${email}. Please check your inbox.`);
      } else {
        toast.error('Failed to send email OTP. Please try again.');
        console.error('Email error:', result.error);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to send email OTP. Please try again.');
    }
  };

  // Respondent verification functions
  const sendRespondentPhoneVerification = async (index: number) => {
    const phone = watch(`respondents.${index}.phone`);
    const countryCode = watch(`respondents.${index}.phoneCountryCode`);
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }


    
    try {
      // Generate OTP for demo
      const otp = generateOTP();
      
      // Store OTP for verification
      setRespondentPhoneOTPs(prev => {
        const newOTPs = [...prev];
        newOTPs[index] = otp;
        return newOTPs;
      });
      
      // Show OTP modal
      setShowRespondentPhoneModal(prev => {
        const newModals = [...prev];
        newModals[index] = true;
        return newModals;
      });
      
      toast.success(`Demo OTP sent to ${countryCode} ${phone}: ${otp}`);
    } catch (error) {
      toast.error('Failed to send verification SMS');
    }
  };

  const sendRespondentEmailVerification = async (index: number) => {
    const email = watch(`respondents.${index}.email`);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }


    
    try {
      // Send OTP via email
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'otp'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.otp) {
      // Store OTP for verification
      setRespondentEmailOTPs(prev => {
        const newOTPs = [...prev];
          newOTPs[index] = result.otp;
        return newOTPs;
      });
      
      // Show OTP modal
      setShowRespondentEmailModal(prev => {
        const newModals = [...prev];
        newModals[index] = true;
        return newModals;
      });
      
        toast.success(`Email OTP sent to ${email}. Please check your inbox.`);
      } else {
        toast.error('Failed to send email OTP. Please try again.');
        console.error('Email error:', result.error);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('Failed to send email OTP. Please try again.');
    }
  };

  const verifyRespondentEmailOTP = (index: number) => {
    const enteredOTP = respondentEmailOTPInputs[index];
    const correctOTP = respondentEmailOTPs[index];
    
    if (enteredOTP === correctOTP) {
      setRespondentEmailVerified(prev => {
        const newVerified = [...prev];
        newVerified[index] = true;
        return newVerified;
      });
      
      // Clear OTP input
      setRespondentEmailOTPInputs(prev => {
        const newInputs = [...prev];
        newInputs[index] = '';
        return newInputs;
      });
      
      // Close modal
      setShowRespondentEmailModal(prev => {
        const newModals = [...prev];
        newModals[index] = false;
        return newModals;
      });
      
      toast.success(`Email verified successfully for Respondent ${index + 1}`);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const verifyRespondentPhoneOTP = (index: number) => {
    const enteredOTP = respondentPhoneOTPInputs[index];
    const correctOTP = respondentPhoneOTPs[index];
    
    if (enteredOTP === correctOTP) {
      setRespondentPhoneVerified(prev => {
        const newVerified = [...prev];
        newVerified[index] = true;
        return newVerified;
      });
      
      // Clear OTP input
      setRespondentPhoneOTPInputs(prev => {
        const newInputs = [...prev];
        newInputs[index] = '';
        return newInputs;
      });
      
      // Close modal
      setShowRespondentPhoneModal(prev => {
        const newModals = [...prev];
        newModals[index] = false;
        return newModals;
      });
      
      toast.success(`Phone verified successfully for Respondent ${index + 1}`);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const handleRespondentEmailOTPChange = (index: number, value: string) => {
    setRespondentEmailOTPInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };

  const handleRespondentPhoneOTPChange = (index: number, value: string) => {
    setRespondentPhoneOTPInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };

  const closeRespondentEmailModal = (index: number) => {
    setShowRespondentEmailModal(prev => {
      const newModals = [...prev];
      newModals[index] = false;
      return newModals;
    });
    
    // Clear OTP input
    setRespondentEmailOTPInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = '';
      return newInputs;
    });
  };

  const closeRespondentPhoneModal = (index: number) => {
    setShowRespondentPhoneModal(prev => {
      const newModals = [...prev];
      newModals[index] = false;
      return newModals;
    });
    
    // Clear OTP input
    setRespondentPhoneOTPInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = '';
      return newInputs;
    });
  };
  
  // Validate current step
  const validateCurrentStep = async (isDraftSave = false) => {
    console.log('🔧 validateCurrentStep: Starting validation for step', activeStep, 'isDraftSave:', isDraftSave);
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
        console.log('🔧 Claimant verification check:', {
          emailVerified,
          phoneVerified,
          editMode,
          mode
        });
        
        if (!emailVerified && mode !== 'edit') {
          console.log('🔧 EMAIL NOT VERIFIED - blocking progression');
          toast.error('Please verify your email address before proceeding');
          console.log('🔧 About to return false for email verification');
          return false;
        }
        if (!phoneVerified && mode !== 'edit') {
          console.log('🔧 PHONE NOT VERIFIED - blocking progression');
          toast.error('Please verify your phone number before proceeding');
          console.log('🔧 About to return false for phone verification');
          return false;
        }
        
        console.log('🔧 Email and phone verification passed, continuing...');
        
        // Check required document uploads (only when not saving draft)
        if (!isDraftSave) {
          const claimantData = watch('claimant');
          
          // Smart document validation - only require documents for filled fields
          if (claimantData.pan && !files['claimant.panCard']) {
            toast.error('PAN Card document is required when PAN number is provided');
            return false;
          }
          
          if (claimantData.gst && !files['claimant.gstCert']) {
            toast.error('GST Registration Certificate is required when GST number is provided');
            return false;
          }
          
          if (claimantData.cin && !files['claimant.coi']) {
            toast.error('Certificate of Incorporation is required when CIN is provided');
            return false;
          }
          
          // At least one identification field must be filled and corresponding document uploaded
          const hasAnyIdField = claimantData.pan || claimantData.gst || claimantData.cin;
          const hasAnyIdDoc = (claimantData.pan && files['claimant.panCard']) || 
                              (claimantData.gst && files['claimant.gstCert']) || 
                              (claimantData.cin && files['claimant.coi']);
          
          if (!hasAnyIdField) {
            toast.error('Please provide at least one identification number (PAN, GST, or CIN)');
            return false;
          }
          
          if (!hasAnyIdDoc) {
            toast.error('Please upload the document for at least one identification field you have filled');
            return false;
          }
        } else {
          // Even for draft save, ensure if any field is filled, at least one field is provided
          const claimantData = watch('claimant');
          const hasAnyIdField = claimantData.pan || claimantData.gst || claimantData.cin;
          
          if (!hasAnyIdField) {
            toast.error('Please provide at least one identification number (PAN, GST, or CIN) before proceeding');
            return false;
          }
        }
        break;
      case 1: // Additional Claimants & Manager
        console.log('🔧 Step 2 validation started');
        // CRITICAL FIX: Enforce mandatory validation for Additional Claimants
        const additionalClaimantFields = watch('additionalClaimants') || [];
        console.log('🔧 Additional claimants:', additionalClaimantFields);
        
        // ENFORCE: At least 1 additional claimant required
        if (additionalClaimantFields.length === 0) {
          toast.error('At least one additional claimant is required');
          return false;
        }
        
        for (let index = 0; index < additionalClaimantFields.length; index++) {
          const claimant = formValues.additionalClaimants?.[index];
          
          // ALL mandatory fields must be filled for each additional claimant
          if (claimant) {
          fieldsToValidate.push(
              `additionalClaimants.${index}.type`,
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
            
            // Smart document validation - check files state, not form data
            if (!isDraftSave) {
              console.log(`🔧 Validating Additional Claimant ${index + 1}:`, {
                pan: claimant.pan,
                gst: claimant.gst,
                cin: claimant.cin,
                panCardFile: files[`additionalClaimants.${index}.panCard`],
                gstCertFile: files[`additionalClaimants.${index}.gstCert`],
                coiFile: files[`additionalClaimants.${index}.coi`]
              });
              
              // Check specific ID field requirements using files state
              if (claimant.pan && !files[`additionalClaimants.${index}.panCard`]) {
                toast.error(`PAN Card document is required for Additional Claimant ${index + 1} when PAN number is provided`);
                return false;
              }
              
              if (claimant.gst && !files[`additionalClaimants.${index}.gstCert`]) {
                toast.error(`GST Registration Certificate is required for Additional Claimant ${index + 1} when GST number is provided`);
                return false;
              }
              
              if (claimant.cin && !files[`additionalClaimants.${index}.coi`]) {
                toast.error(`Certificate of Incorporation is required for Additional Claimant ${index + 1} when CIN is provided`);
                return false;
              }
              
              // At least one identification field must be filled and corresponding document uploaded
              const hasAnyIdField = claimant.pan || claimant.gst || claimant.cin;
              const hasAnyIdDoc = (claimant.pan && files[`additionalClaimants.${index}.panCard`]) || 
                                  (claimant.gst && files[`additionalClaimants.${index}.gstCert`]) || 
                                  (claimant.cin && files[`additionalClaimants.${index}.coi`]);
              
              if (!hasAnyIdField) {
                toast.error(`Please provide at least one identification number (PAN, GST, or CIN) for Additional Claimant ${index + 1}`);
                return false;
              }
              
              if (!hasAnyIdDoc) {
                toast.error(`Please upload the document for at least one identification field for Additional Claimant ${index + 1}`);
                return false;
              }
            }
          }
        }
        
        // CRITICAL FIX: Enforce mandatory validation for Manager Details
        const managerFields = watch('managerDetails') || [];
        console.log('🔧 Manager fields:', managerFields);
        
        // ENFORCE: At least 1 manager required
        if (managerFields.length === 0) {
          toast.error('At least one manager is required');
          return false;
        }
        
        for (let index = 0; index < managerFields.length; index++) {
          const manager = formValues.managerDetails?.[index];
          
          // ALL mandatory fields must be filled for each manager
          if (manager) {
            fieldsToValidate.push(
              `managerDetails.${index}.name`,
              `managerDetails.${index}.email`,
              `managerDetails.${index}.phone`,
              `managerDetails.${index}.address1`,
              `managerDetails.${index}.managerId`
            );
            
            // Smart document validation - check files state, not form data
            if (!isDraftSave) {
              console.log(`🔧 Validating Manager ${index + 1}:`, {
                pan: manager.pan,
                gst: manager.gst,
                cin: manager.cin,
                panCardFile: files[`managerDetails.${index}.panCard`],
                gstCertFile: files[`managerDetails.${index}.gstCert`],
                coiFile: files[`managerDetails.${index}.coi`]
              });
              
              // Check specific ID field requirements using files state
              if (manager.pan && !files[`managerDetails.${index}.panCard`]) {
                toast.error(`PAN Card document is required for Manager ${index + 1} when PAN number is provided`);
                return false;
              }
              
              if (manager.gst && !files[`managerDetails.${index}.gstCert`]) {
                toast.error(`GST Registration Certificate is required for Manager ${index + 1} when GST number is provided`);
                return false;
              }
              
              if (manager.cin && !files[`managerDetails.${index}.coi`]) {
                toast.error(`Certificate of Incorporation is required for Manager ${index + 1} when CIN is provided`);
                return false;
              }
              
              // At least one identification field must be filled and corresponding document uploaded
              const hasAnyIdField = manager.pan || manager.gst || manager.cin;
              const hasAnyIdDoc = (manager.pan && files[`managerDetails.${index}.panCard`]) || 
                                  (manager.gst && files[`managerDetails.${index}.gstCert`]) || 
                                  (manager.cin && files[`managerDetails.${index}.coi`]);
              
              if (!hasAnyIdField) {
                toast.error(`Please provide at least one identification number (PAN, GST, or CIN) for Manager ${index + 1}`);
                return false;
              }
              
              if (!hasAnyIdDoc) {
                toast.error(`Please upload the document for at least one identification field for Manager ${index + 1}`);
                return false;
              }
            }
          }
        }
        
        // Check if additional claimant email and phone are verified (skip if already verified or in edit mode)
        for (let index = 0; index < additionalClaimantFields.length; index++) {
          const claimant = formValues.additionalClaimants?.[index];
          console.log(`🔧 Checking verification for Additional Claimant ${index + 1}:`, {
            email: claimant?.email,
            phone: claimant?.phone,
            emailVerified: additionalClaimantEmailVerified[index],
            phoneVerified: additionalClaimantPhoneVerified[index]
          });
          
          // Only check verification if the field is actually filled
          if (claimant && claimant.email && claimant.email.trim() !== '' && !additionalClaimantEmailVerified[index]) {
            toast.error(`Please verify email for Additional Claimant ${index + 1}`);
            return false;
          }
          if (claimant && claimant.phone && claimant.phone.trim() !== '' && !additionalClaimantPhoneVerified[index]) {
            toast.error(`Please verify phone number for Additional Claimant ${index + 1}`);
            return false;
          }
        }
        break;
      case 2: // Respondent Details
        // CRITICAL FIX: Enforce mandatory validation for Respondents
        const respondentFields = watch('respondents') || [];
        for (let index = 0; index < respondentFields.length; index++) {
          const respondent = formValues.respondents?.[index];
          
          // If any field is filled, ALL mandatory fields must be filled
          if (respondent && (respondent.name || respondent.email || respondent.phone || respondent.address1)) {
          fieldsToValidate.push(
            `respondents.${index}.type`,
            `respondents.${index}.name`, 
            `respondents.${index}.email`,
              `respondents.${index}.phone`,
            `respondents.${index}.pincode`,
            `respondents.${index}.address1`,
            `respondents.${index}.city`,
            `respondents.${index}.district`,
            `respondents.${index}.state`,
            `respondents.${index}.country`
          );
            
            // Smart document validation - check files state, not form data
            if (!isDraftSave) {
              console.log(`🔧 Validating Respondent ${index + 1}:`, {
                pan: respondent.pan,
                gst: respondent.gst,
                cin: respondent.cin,
                panCardFile: files[`respondents.${index}.panCard`],
                gstCertFile: files[`respondents.${index}.gstCert`],
                coiFile: files[`respondents.${index}.coi`]
              });
              
              // Check specific ID field requirements using files state
              if (respondent.pan && !files[`respondents.${index}.panCard`]) {
                toast.error(`PAN Card document is required for Respondent ${index + 1} when PAN number is provided`);
                return false;
              }
              
              if (respondent.gst && !files[`respondents.${index}.gstCert`]) {
                toast.error(`GST Registration Certificate is required for Respondent ${index + 1} when GST number is provided`);
                return false;
              }
              
              if (respondent.cin && !files[`respondents.${index}.coi`]) {
                toast.error(`Certificate of Incorporation is required for Respondent ${index + 1} when CIN is provided`);
                return false;
              }
              
              // At least one identification field must be filled and corresponding document uploaded
              const hasAnyIdField = respondent.pan || respondent.gst || respondent.cin;
              const hasAnyIdDoc = (respondent.pan && files[`respondents.${index}.panCard`]) || 
                                  (respondent.gst && files[`respondents.${index}.gstCert`]) || 
                                  (respondent.cin && files[`respondents.${index}.coi`]);
              
              if (!hasAnyIdField) {
                toast.error(`Please provide at least one identification number (PAN, GST, or CIN) for Respondent ${index + 1}`);
                return false;
              }
              
              if (!hasAnyIdDoc) {
                toast.error(`Please upload the document for at least one identification field for Respondent ${index + 1}`);
                return false;
              }
            }
          }
        }
        break;
      case 3: // Arbitration Agreement
        fieldsToValidate = [
          'arbitrationAgreement.agreementDate', 'arbitrationAgreement.placeOfSigning',
          'arbitrationAgreement.arbitrationText', 'arbitrationAgreement.stampDutyPercentage',
          'arbitrationAgreement.numberOfArbitrators'
        ];
        break;
      case 4: // Nature of Dispute
        // Validate all nature of dispute entries
        const natureOfDisputeEntries = watch('natureOfDispute') || [];
        if (natureOfDisputeEntries.length === 0) {
          toast.error('Please add at least one nature of dispute');
          return false;
        }
        
        for (let i = 0; i < natureOfDisputeEntries.length; i++) {
          const fieldPaths = [
            `natureOfDispute.${i}.category`,
            `natureOfDispute.${i}.subCategory`,
            `natureOfDispute.${i}.natureOfDispute`,
            `natureOfDispute.${i}.dateWhenRightToClaimArose`,
            `natureOfDispute.${i}.standardisedPrayerClauses`
          ];
          
          for (const fieldPath of fieldPaths) {
            const isValid = await trigger(fieldPath as any);
            if (!isValid) {
              toast.error(`Please complete all required fields for Nature of Dispute ${i + 1}`);
              return false;
            }
          }
        }
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
        // Validate all prayers
        const prayers = watch('prayers.prayers') || [];
        if (prayers.length === 0) {
          toast.error('Please add at least one prayer');
          return false;
        }
        
        // Validate each prayer has required fields
        if (Array.isArray(prayers)) {
          for (let i = 0; i < prayers.length; i++) {
            const prayer = prayers[i];
            if (typeof prayer === 'object' && prayer !== null) {
              if (!prayer.title?.trim()) {
                toast.error(`Prayer ${i + 1}: Title is required`);
                return false;
              }
              if (!prayer.description?.trim()) {
                toast.error(`Prayer ${i + 1}: Description is required`);
                return false;
              }
              if (prayer.reliefType === 'monetary' && (!prayer.amount || parseFloat(prayer.amount) <= 0)) {
                toast.error(`Prayer ${i + 1}: Amount is required for monetary relief`);
                return false;
              }
            }
          }
        }
        return true;
      case 7: // Documents
        // Validate that at least one document is uploaded
        const scannedDocuments = watch('documents.scannedDocuments') || [];
        const affidavits = watch('documents.affidavits') || [];
        const electronicEvidence = watch('documents.electronicEvidence') || [];
        
        const totalDocuments = scannedDocuments.length + affidavits.length + electronicEvidence.length;
        
        if (totalDocuments === 0) {
          toast.error('Please upload at least one document before proceeding');
          return false;
        }
        
        // Validate that each document has required fields
        for (let i = 0; i < scannedDocuments.length; i++) {
          const doc = scannedDocuments[i];
          if (!doc.documentType?.trim()) {
            toast.error(`Scanned Document ${i + 1}: Document Type is required`);
            return false;
          }
          if (!doc.file) {
            toast.error(`Scanned Document ${i + 1}: Document File is required`);
            return false;
          }
          if (!doc.date?.trim()) {
            toast.error(`Scanned Document ${i + 1}: Document Date is required`);
            return false;
          }
          if (!doc.linkedIssue?.trim()) {
            toast.error(`Scanned Document ${i + 1}: Linked Issue is required`);
            return false;
          }
          if (!doc.description?.trim()) {
            toast.error(`Scanned Document ${i + 1}: Description is required`);
            return false;
          }
        }
        
        for (let i = 0; i < affidavits.length; i++) {
          const doc = affidavits[i];
          if (!doc.documentType?.trim()) {
            toast.error(`Affidavit ${i + 1}: Document Type is required`);
            return false;
          }
          if (!doc.file) {
            toast.error(`Affidavit ${i + 1}: Document File is required`);
            return false;
          }
          if (!doc.date?.trim()) {
            toast.error(`Affidavit ${i + 1}: Document Date is required`);
            return false;
          }
          if (!doc.linkedIssue?.trim()) {
            toast.error(`Affidavit ${i + 1}: Linked Issue is required`);
            return false;
          }
          if (!doc.description?.trim()) {
            toast.error(`Affidavit ${i + 1}: Description is required`);
            return false;
          }
        }
        
        for (let i = 0; i < electronicEvidence.length; i++) {
          const doc = electronicEvidence[i];
          if (!doc.documentType?.trim()) {
            toast.error(`Electronic Evidence ${i + 1}: Document Type is required`);
            return false;
          }
          if (!doc.file) {
            toast.error(`Electronic Evidence ${i + 1}: Document File is required`);
            return false;
          }
          if (!doc.date?.trim()) {
            toast.error(`Electronic Evidence ${i + 1}: Document Date is required`);
            return false;
          }
          if (!doc.linkedIssue?.trim()) {
            toast.error(`Electronic Evidence ${i + 1}: Linked Issue is required`);
            return false;
          }
          if (!doc.description?.trim()) {
            toast.error(`Electronic Evidence ${i + 1}: Description is required`);
            return false;
          }
        }
        
        return true;
      case 8: // Payment
        // Validate payment fields
        fieldsToValidate = [
          'payment.paymentHead',
          'payment.paymentAmount', 
          'payment.paymentDetails'
        ];
        break;
      case 6: // Prayers & Reliefs (Rendering)
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[6] = el; }}>
            <PrayersSection 
              control={control}
              name="prayers.prayers"
            />
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
              control={control as any}
              watch={watch}
              setValue={setValue}
              disputeIssues={disputeIssues}
              files={files}
            />
          </div>
        )
      case 8: // Payment
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[8] = el; }}>
            <h3 className="font-medium text-lg mb-4">Payment</h3>
            <div className="space-y-4">
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
            <ArgumentsSection 
              control={control}
              prayersName="prayers.prayers"
              argumentsName="arguments.argumentsPerPrayer"
            />
          </div>
        )
      case 10: // Review & Submit
        // For the final step, just return true as validation is complete
        return true;
        break;
    }
    
    // First check form field validation
    if (fieldsToValidate.length > 0) {
      console.log('🔧 validateCurrentStep: Triggering validation for fields:', fieldsToValidate);
      const result = await trigger(fieldsToValidate as any); // Type assertion to work around TypeScript error
      console.log('🔧 validateCurrentStep: Trigger result:', result);
      if (!result) {
        console.log('🔧 validateCurrentStep: Form field validation failed');
        return false;
      }
    }
    
    console.log('🔧 validateCurrentStep: All validation passed, returning true');
    return true;
  };
  
  // Handle next button click
  const handleNext = async () => {
    // Validate current step
    console.log('🔧 handleNext: Starting validation for step', activeStep);
    const isStepValid = await validateCurrentStep();
    console.log('🔧 handleNext: Validation result:', isStepValid);
    
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
      // Handle multiple files - store first file for now since Record expects single file
      const firstFile = file.length > 0 ? file[0] : null;
      setFiles(prev => {
        const newFiles = {
        ...prev,
        [fieldName]: firstFile
        };
        // Store files in localStorage for persistence
        localStorage.setItem('arbitrationFormFiles', JSON.stringify(
          Object.fromEntries(
            Object.entries(newFiles).map(([key, value]) => [
              key, 
              value ? { name: value.name, size: value.size, type: value.type } : null
            ])
          )
        ));
        return newFiles;
      });
      
      // Trigger OCR processing for document uploads
      if (firstFile && fieldName.includes('.')) {
        performOCR(firstFile, fieldName);
      }
    } else {
      // Handle single file
      setFiles(prev => {
        const newFiles = {
        ...prev,
        [fieldName]: file
        };
        // Store files in localStorage for persistence
        localStorage.setItem('arbitrationFormFiles', JSON.stringify(
          Object.fromEntries(
            Object.entries(newFiles).map(([key, value]) => [
              key, 
              value ? { name: value.name, size: value.size, type: value.type } : null
            ])
          )
        ));
        return newFiles;
      });
      
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

      // Convert File to base64 for OCR processing
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      // Determine document type based on field name
      let cardType = 'PAN';
      if (fieldName.includes('aadhaar') || fieldName.includes('uidai')) {
        cardType = 'AADHAAR';
      }

      // Call backend OCR API
      const response = await fetch('/api/ocr/extract-fast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          cardType: cardType,
          fieldName: fieldName
        }),
      });

      if (!response.ok) {
        throw new Error('OCR API request failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'OCR extraction failed');
      }

      // Check if we got any extracted data
      if (!result.extractedData || Object.keys(result.extractedData).length === 0) {
        console.log('No data extracted from document');
        toast.info('No specific data found in document. Please check the document quality or try a different image.', {
          id: `ocr-${fieldName}`,
          duration: 5000
        });
        return;
      }

      const extractedData = result.extractedData || {};

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

      // Auto-populate form fields (only if field is empty to avoid overriding user data)
      Object.entries(extractedData).forEach(([key, value]) => {
        let fieldPath = '';
        if (entityPath && index >= 0) {
          fieldPath = `${entityPath}.${index}.${key}`;
        } else if (entityPath) {
          fieldPath = `${entityPath}.${key}`;
        }
        
        if (fieldPath) {
          // Only update if the field is empty or undefined
          const currentValue = getValues(fieldPath as any);
          if (!currentValue || currentValue === '') {
            setValue(fieldPath as any, value);
            console.log(`✅ OCR updated ${fieldPath}: ${value}`);
          } else {
            console.log(`⚠️ OCR skipped ${fieldPath}: already has value "${currentValue}"`);
          }
        }
      });

      // Show success toast with extracted values
      const extractedValues = Object.entries(extractedData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join(', ');
      
      // Log the raw text for debugging
      if (result.rawText) {
        console.log('OCR Raw Text:', result.rawText);
      }
      
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
      // Try to restore files from localStorage first
      try {
        const storedFiles = localStorage.getItem('arbitrationFormFiles');
        if (storedFiles) {
          const parsedFiles = JSON.parse(storedFiles);
          // Note: We can't restore the actual File objects from localStorage
          // but we can show the file names to indicate they were uploaded
          setFiles(prev => ({
            ...prev,
            ...parsedFiles
          }));
        }
      } catch (error) {
        console.log('No stored files found or error loading files');
      }
      
      // Also try global files as fallback
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

    // Get document types from documents object
    const documentTypes = data.documents?.documentTypes || {};
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
            
            // Send confirmation emails to all parties
            try {
              const formData = getValues();
              const caseId = response.caseId || response.caseNumber || response.id || currentDraftId;
              const caseLink = `${window.location.origin}/dashboard/cases/${caseId}`;
              
              const emailResponse = await fetch('/api/email/test', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: formData.claimant?.email || 'test@example.com',
                  type: 'case-submission-all-parties',
                  caseLink: caseLink
                }),
              });

              const result = await emailResponse.json();
              if (result.success) {
                console.log('✅ Confirmation emails sent to all parties successfully');
              } else {
                console.error('❌ Failed to send confirmation emails:', result.error);
              }
            } catch (error) {
              console.error('Email confirmation error:', error);
            }
            
            // Show success modal
            const caseId = response.caseId || response.caseNumber || response.id || currentDraftId;
            console.log('🔧 About to call showSubmissionSuccess with caseId:', caseId);
            showSubmissionSuccess(caseId);
            
            // Generate and download PDF
            try {
              const currentFormData = watch();
              // Add missing disputeDetails for PDF generation
              const pdfData = {
                ...currentFormData,
                disputeDetails: currentFormData.disputeDetails || {
                  disputeType: '',
                  disputeAmount: '',
                  disputeDescription: '',
                  disputeDate: ''
                }
              };
              const pdfBlob = await generateApplicationPDF(pdfData as any, caseId);
              downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
            } catch (pdfError) {
              console.error('PDF generation failed:', pdfError);
              toast.error('PDF generation failed, but your application was submitted successfully.');
            }
            
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
          
            // Show success modal
            const caseId = response.caseId || response.caseNumber || response.id;
        if (caseId) {
              console.log('🔧 About to call showSubmissionSuccess with caseId (draft submit):', caseId);
              showSubmissionSuccess(caseId);
              
              // Send confirmation emails to all parties
              try {
                console.log('🔧 Starting email sending process (draft submit)...');
                const formData = watch();
                console.log('🔧 Form data for email (draft submit):', formData.claimant?.email);
                console.log('🔧 Backend response for email (draft submit):', response);
                const caseLink = `${window.location.origin}/dashboard/cases/${caseId}`;
                console.log('🔧 Case link (draft submit):', caseLink);
                
                // Use backend response data (includes database ID) combined with form data
                const caseDataForEmail = {
                  ...formData,
                  id: response.id, // CRITICAL: Include database ID from backend
                  caseNumber: response.caseNumber,
                  createdAt: response.createdAt,
                  updatedAt: response.updatedAt
                };
                
                const emailResponse = await fetch('/api/email/test', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: 'case-submission-all-parties',
                    caseLink: caseLink,
                    caseData: caseDataForEmail,
                    caseNumber: response.caseNumber || caseId
                  }),
                });

                const result = await emailResponse.json();
                console.log('🔧 Email API response (draft submit):', result);
                if (result.success) {
                  console.log('✅ Confirmation emails sent to all parties successfully');
                  
                                  toast.success('Confirmation emails sent to all parties');
                } else {
                  console.error('❌ Failed to send confirmation emails:', result.error);
                  toast.error('Failed to send confirmation emails');
                }
              } catch (error) {
                console.error('Email confirmation error:', error);
                toast.error('Email confirmation failed');
              }
              
              // Generate and download PDF
              try {
                const currentFormData = watch();
                // Add missing disputeDetails for PDF generation
                const pdfData = {
                  ...currentFormData,
                  disputeDetails: currentFormData.disputeDetails || {
                    disputeType: '',
                    disputeAmount: '',
                    disputeDescription: '',
                    disputeDate: ''
                  }
                };
                const pdfBlob = await generateApplicationPDF(pdfData as any, caseId);
                downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
              } catch (pdfError) {
                console.error('PDF generation failed:', pdfError);
                toast.error('PDF generation failed, but your application was submitted successfully.');
              }
        } else {
              // Show success modal even if no caseId
              showSubmissionSuccess('DRAFT_SUBMITTED');
            }
            
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
          
          // Show success modal
          const caseId = response.caseId || response.caseNumber || response.id;
          console.log('🔧 About to call showSubmissionSuccess with caseId (new case):', caseId);
          showSubmissionSuccess(caseId);
          
                      // Send confirmation emails to all parties
            try {
              console.log('🔧 Starting email sending process...');
              const formData = watch();
              console.log('🔧 Form data for email:', formData.claimant?.email);
              console.log('🔧 Backend response for email:', response);
              const caseLink = `${window.location.origin}/dashboard/cases/${caseId}`;
              console.log('🔧 Case link:', caseLink);
              
              // Use backend response data (includes database ID) combined with form data
              const caseDataForEmail = {
                ...formData,
                id: response.id, // CRITICAL: Include database ID from backend
                caseNumber: response.caseNumber,
                createdAt: response.createdAt,
                updatedAt: response.updatedAt
              };
              
              const emailResponse = await fetch('/api/email/test', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'case-submission-all-parties',
                  caseLink: caseLink,
                  caseData: caseDataForEmail,
                  caseNumber: response.caseNumber || caseId
                }),
              });

              const result = await emailResponse.json();
              console.log('🔧 Email API response:', result);
              if (result.success) {
                console.log('✅ Confirmation emails sent to all parties successfully');
                
                toast.success('Confirmation emails sent to all parties');
              } else {
                console.error('❌ Failed to send confirmation emails:', result.error);
                toast.error('Failed to send confirmation emails');
              }
            } catch (error) {
              console.error('Email confirmation error:', error);
              toast.error('Email confirmation failed');
            }
          
          // Generate and download PDF
          try {
            const currentFormData = watch();
            // Add missing disputeDetails for PDF generation
            const pdfData = {
              ...currentFormData,
              disputeDetails: currentFormData.disputeDetails || {
                disputeType: '',
                disputeAmount: '',
                disputeDescription: '',
                disputeDate: ''
              }
            };
            const pdfBlob = await generateApplicationPDF(pdfData as any, caseId);
            downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            toast.error('PDF generation failed, but your application was submitted successfully.');
          }
          
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
        disputeDetails: {
          disputeType: '',
          disputeAmount: '',
          disputeDescription: '',
          disputeDate: ''
        },
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
          additionalClaimantPhoneVerified,
          managerEmailVerified,
          managerPhoneVerified,
          respondentEmailVerified,
          respondentPhoneVerified
        }
      };
      
      // Add structured data as JSON
      formData.append('data', JSON.stringify(transformedData));
      
      // Add files (only if they exist - drafts allow incomplete data)
      // Map frontend file keys to backend expected keys
      const fileKeyMapping: Record<string, string> = {
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
      
      // CRITICAL FIX: Add Additional Claimants, Manager Details, and Respondent files
      // Additional Claimants files
      if (data.additionalClaimants && Array.isArray(data.additionalClaimants)) {
        data.additionalClaimants.forEach((claimant, index) => {
          if (claimant && claimant.coi instanceof File) {
            formData.append(`additionalClaimants.${index}.coi`, claimant.coi);
          }
          if (claimant && claimant.panCard instanceof File) {
            formData.append(`additionalClaimants.${index}.panCard`, claimant.panCard);
          }
          if (claimant && claimant.gstCert instanceof File) {
            formData.append(`additionalClaimants.${index}.gstCert`, claimant.gstCert);
          }
        });
      }
      
      // Manager Details files
      if (data.managerDetails && Array.isArray(data.managerDetails)) {
        data.managerDetails.forEach((manager, index) => {
          if (manager && manager.coi instanceof File) {
            formData.append(`managerDetails.${index}.coi`, manager.coi);
          }
          if (manager && manager.panCard instanceof File) {
            formData.append(`managerDetails.${index}.panCard`, manager.panCard);
          }
          if (manager && manager.gstCert instanceof File) {
            formData.append(`managerDetails.${index}.gstCert`, manager.gstCert);
          }
        });
      }
      
      // Respondent Details files
      if (data.respondents && Array.isArray(data.respondents)) {
        data.respondents.forEach((respondent, index) => {
          if (respondent && respondent.coi instanceof File) {
            formData.append(`respondents.${index}.coi`, respondent.coi);
          }
          if (respondent && respondent.panCard instanceof File) {
            formData.append(`respondents.${index}.panCard`, respondent.panCard);
          }
          if (respondent && respondent.gstCert instanceof File) {
            formData.append(`respondents.${index}.gstCert`, respondent.gstCert);
          }
        });
      }
      
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
      console.log('🔧 loadDraft: Starting to load draft with ID:', draftId);
      setIsLoadingDrafts(true);
      
      // Get the specific draft by ID
      console.log('🔧 loadDraft: Calling arbitrationApi.getDraft...');
      const draftResponse = await arbitrationApi.getDraft(draftId);
      console.log('🔧 loadDraft: Received draft response:', draftResponse);
      
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
      console.log('🔧 loadDraft: Processing draft data:', draft);
      if (!draft) {
        console.error('🔧 loadDraft: No draft found in response');
        toast.error('Failed to load draft: Invalid draft format');
        return;
      }
      
      // Check if we have the new formData structure, otherwise fallback to reconstruction
      let completeFormData;
      
      console.log('🔧 loadDraft: Checking draft structure...');
      console.log('🔧 loadDraft: draft.formData exists:', !!draft.formData);
      console.log('🔧 loadDraft: draft.formData type:', typeof draft.formData);
      
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
        // DEBUG: Log what file metadata we received from backend
        console.log('🔧 RECEIVED FILE METADATA FROM BACKEND:', draft.fileMetadata);
        console.log('🔧 FILE METADATA KEYS:', Object.keys(draft.fileMetadata));
        
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

        // CRITICAL FIX: Handle Additional Claimants documents
        if (completeFormData.additionalClaimants) {
          completeFormData.additionalClaimants.forEach((ac: any, index: number) => {
            // Handle COI files
            const coiFieldName = `additionalClaimants.${index}.coi`;
            if (draft.fileMetadata[coiFieldName]) {
              fileDisplayState[coiFieldName] = {
                name: draft.fileMetadata[coiFieldName].name,
                size: draft.fileMetadata[coiFieldName].size,
                type: draft.fileMetadata[coiFieldName].type,
                path: draft.fileMetadata[coiFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle PAN Card files
            const panCardFieldName = `additionalClaimants.${index}.panCard`;
            if (draft.fileMetadata[panCardFieldName]) {
              fileDisplayState[panCardFieldName] = {
                name: draft.fileMetadata[panCardFieldName].name,
                size: draft.fileMetadata[panCardFieldName].size,
                type: draft.fileMetadata[panCardFieldName].type,
                path: draft.fileMetadata[panCardFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle GST Certificate files
            const gstCertFieldName = `additionalClaimants.${index}.gstCert`;
            if (draft.fileMetadata[gstCertFieldName]) {
              fileDisplayState[gstCertFieldName] = {
                name: draft.fileMetadata[gstCertFieldName].name,
                size: draft.fileMetadata[gstCertFieldName].size,
                type: draft.fileMetadata[gstCertFieldName].type,
                path: draft.fileMetadata[gstCertFieldName].path,
                isExisting: true,
              };
            }
          });
        }

        // CRITICAL FIX: Handle Manager Details documents
        if (completeFormData.managerDetails) {
          completeFormData.managerDetails.forEach((manager: any, index: number) => {
            // Handle COI files
            const coiFieldName = `managerDetails.${index}.coi`;
            if (draft.fileMetadata[coiFieldName]) {
              fileDisplayState[coiFieldName] = {
                name: draft.fileMetadata[coiFieldName].name,
                size: draft.fileMetadata[coiFieldName].size,
                type: draft.fileMetadata[coiFieldName].type,
                path: draft.fileMetadata[coiFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle PAN Card files
            const panCardFieldName = `managerDetails.${index}.panCard`;
            if (draft.fileMetadata[panCardFieldName]) {
              fileDisplayState[panCardFieldName] = {
                name: draft.fileMetadata[panCardFieldName].name,
                size: draft.fileMetadata[panCardFieldName].size,
                type: draft.fileMetadata[panCardFieldName].type,
                path: draft.fileMetadata[panCardFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle GST Certificate files
            const gstCertFieldName = `managerDetails.${index}.gstCert`;
            if (draft.fileMetadata[gstCertFieldName]) {
              fileDisplayState[gstCertFieldName] = {
                name: draft.fileMetadata[gstCertFieldName].name,
                size: draft.fileMetadata[gstCertFieldName].size,
                type: draft.fileMetadata[gstCertFieldName].type,
                path: draft.fileMetadata[gstCertFieldName].path,
                isExisting: true,
              };
            }
          });
        }

        // CRITICAL FIX: Handle Respondent Details documents
        if (completeFormData.respondents) {
          completeFormData.respondents.forEach((respondent: any, index: number) => {
            // Handle COI files
            const coiFieldName = `respondents.${index}.coi`;
            if (draft.fileMetadata[coiFieldName]) {
              fileDisplayState[coiFieldName] = {
                name: draft.fileMetadata[coiFieldName].name,
                size: draft.fileMetadata[coiFieldName].size,
                type: draft.fileMetadata[coiFieldName].type,
                path: draft.fileMetadata[coiFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle PAN Card files
            const panCardFieldName = `respondents.${index}.panCard`;
            if (draft.fileMetadata[panCardFieldName]) {
              fileDisplayState[panCardFieldName] = {
                name: draft.fileMetadata[panCardFieldName].name,
                size: draft.fileMetadata[panCardFieldName].size,
                type: draft.fileMetadata[panCardFieldName].type,
                path: draft.fileMetadata[panCardFieldName].path,
                isExisting: true,
              };
            }
            
            // Handle GST Certificate files
            const gstCertFieldName = `respondents.${index}.gstCert`;
            if (draft.fileMetadata[gstCertFieldName]) {
              fileDisplayState[gstCertFieldName] = {
                name: draft.fileMetadata[gstCertFieldName].name,
                size: draft.fileMetadata[gstCertFieldName].size,
                type: draft.fileMetadata[gstCertFieldName].type,
                path: draft.fileMetadata[gstCertFieldName].path,
                isExisting: true,
              };
            }
          });
        }

        // DEBUG: Log the complete file display state being set
        console.log('🔧 CRITICAL DEBUG - Complete fileDisplayState being set:', fileDisplayState);
        console.log('🔧 CRITICAL DEBUG - Additional Claimants files:', Object.keys(fileDisplayState).filter(key => key.includes('additionalClaimants')));
        console.log('🔧 CRITICAL DEBUG - Manager Details files:', Object.keys(fileDisplayState).filter(key => key.includes('managerDetails')));
        console.log('🔧 CRITICAL DEBUG - Respondent files:', Object.keys(fileDisplayState).filter(key => key.includes('respondents')));

        // Update the files state with all file information
        setFiles(fileDisplayState);
      } else if (draft.files) {
        // Fallback to old format
        setFiles(draft.files);
      }
      
      // Set edit mode
      setEditMode(true);

      // CRITICAL FIX: Restore verification states if available
      if (draft.verificationStates) {
        setEmailVerified(draft.verificationStates.emailVerified || false);
        setPhoneVerified(draft.verificationStates.phoneVerified || false);
        setAdditionalClaimantEmailVerified(draft.verificationStates.additionalClaimantEmailVerified || []);
        setAdditionalClaimantPhoneVerified(draft.verificationStates.additionalClaimantPhoneVerified || []);
        setManagerEmailVerified(draft.verificationStates.managerEmailVerified || []);
        setManagerPhoneVerified(draft.verificationStates.managerPhoneVerified || []);
        setRespondentEmailVerified(draft.verificationStates.respondentEmailVerified || []);
        setRespondentPhoneVerified(draft.verificationStates.respondentPhoneVerified || []);
      } else {
        // For existing data without verification states, assume verified if email/phone exist
        const hasEmail = completeFormData.claimant?.email;
        const hasPhone = completeFormData.claimant?.phone;
        
        if (hasEmail) setEmailVerified(true);
        if (hasPhone) setPhoneVerified(true);
        
        // Set verification for additional claimants based on existing data
        if (completeFormData.additionalClaimants) {
          const emailStates = completeFormData.additionalClaimants.map((ac: any) => !!ac.email);
          const phoneStates = completeFormData.additionalClaimants.map((ac: any) => !!ac.phone);
          setAdditionalClaimantEmailVerified(emailStates);
          setAdditionalClaimantPhoneVerified(phoneStates);
        }
        
        // Set verification for managers based on existing data
        if (completeFormData.managerDetails) {
          const emailStates = completeFormData.managerDetails.map((md: any) => !!md.email);
          const phoneStates = completeFormData.managerDetails.map((md: any) => !!md.phone);
          setManagerEmailVerified(emailStates);
          setManagerPhoneVerified(phoneStates);
        }
        
        // Set verification for respondents based on existing data
        if (completeFormData.respondents) {
          const emailStates = completeFormData.respondents.map((r: any) => !!r.email);
          const phoneStates = completeFormData.respondents.map((r: any) => !!r.phone);
          setRespondentEmailVerified(emailStates);
          setRespondentPhoneVerified(phoneStates);
        }
      }
      
      toast.success('Draft loaded successfully');
    } catch (error: any) {
      toast.error(`Error loading draft: ${error.message}`);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Show submission success modal
  const showSubmissionSuccess = (caseId: string) => {
    console.log('🔧 showSubmissionSuccess called with caseId:', caseId);
    setSubmissionResult({
      caseId: caseId,
      applicationNumber: caseId
    });
    setShowSubmissionModal(true);
    console.log('🔧 Modal state set to true');
  };

  // Handle modal actions
  const handleViewDashboard = () => {
    setShowSubmissionModal(false);
    router.push('/dashboard');
  };

  const handleGoToMyCases = () => {
    setShowSubmissionModal(false);
    router.push('/dashboard/my-cases');
  };

  // Render form steps
  const renderFormContent = () => {
    // Get current form values for review page
    const formData = watch();
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
    } = formData;
    
      // Debug: Log Nature of Dispute data
  console.log('🔧 Nature of Dispute data:', natureOfDispute);
  console.log('🔧 Nature of Dispute fields:', natureOfDisputeFields);
  if (natureOfDispute && natureOfDispute.length > 0) {
    console.log('🔧 First dispute entry:', natureOfDispute[0]);
  }
  if (natureOfDisputeFields && natureOfDisputeFields.length > 0) {
    console.log('🔧 First dispute field:', natureOfDisputeFields[0]);
  }
  
  // Auto-add default Nature of Dispute entry if none exists
  React.useEffect(() => {
    if (natureOfDisputeFields.length === 0) {
      appendNatureOfDispute({
        category: "",
        subCategory: "",
        natureOfDispute: "",
        dateWhenRightToClaimArose: "",
        standardisedPrayerClauses: "",
      });
    }
  }, [natureOfDisputeFields.length, appendNatureOfDispute]);
  
  // Auto-add default Dispute Description entry if none exists
  React.useEffect(() => {
    if (disputeDescriptionFields.length === 0) {
      appendDisputeDescription({
        claimType: "",
        claimReason: "",
        lawReliedUpon: "",
        relevantClauseNumber: "",
        clauseSupportingClaim: "",
        clause: "",
        documentSupportingClaim: "",
        reliefSought: "",
      });
    }
  }, [disputeDescriptionFields.length, appendDisputeDescription]);
  
  // Auto-add default Argument entry if none exists
  React.useEffect(() => {
    if (argumentFields.length === 0) {
      appendArgument("");
    }
  }, [argumentFields.length, appendArgument]);
    
    const argumentsPerIssue = argumentsData?.argumentsPerIssue || [];
    
    switch (activeStep) {
      case 0: // Claimant Details
        return (
          <div className="space-y-6" ref={(el) => { stepRefs.current[0] = el; }}>
            <h3 className="text-lg font-medium mb-4">Step 1: Claimant Details</h3>
            
            {/* Basic Information */}
            <div className="space-y-4">
              <Controller
                control={control}
                name="claimant.type"
                render={({ field, fieldState }) => (
                  <FormField
                    label="1.1 Type"
                    name="claimant.type"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={[
                      { value: "individual", label: "Individual" },
                      { value: "company", label: "Company" },
                      { value: "partnership", label: "Partnership" },
                      { value: "llp", label: "LLP" },
                    ]}
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="claimant.name"
                render={({ field, fieldState }) => (
                  <FormField
                    label="1.2 Name"
                    name="claimant.name"
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    maxLength={MAX_NAME_LENGTH}
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="claimant.email"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        1.3 Email Address {emailVerified ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={field.value || ""}
                          onChange={field.onChange}
                          disabled={emailVerified}
                          className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                            emailVerified ? 'border-green-500 bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                          }`}
                        />
                        {!emailVerified && field.value && (
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={sendEmailVerification}
                            disabled={!field.value}
                          >
                            Verify
                          </Button>
                        )}
                        {emailVerified && (
                          <Button 
                            type="button" 
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setEmailVerified(false);
                              field.onChange('');
                              toast.info('Please enter a new email address and verify it');
                            }}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Change
                          </Button>
                        )}
                      </div>
                      {fieldState.error && (
                        <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                      )}
                      {emailVerified && (
                        <div className="text-green-600 text-xs mt-1 flex items-center">
                          <span className="mr-1">✓</span> Email address verified
                        </div>
                      )}
                    </div>
                  )}
                />
                
                <Controller
                  control={control}
                  name="claimant.phone"
                  render={({ field: phoneField, fieldState }) => (
                    <Controller
                      control={control}
                      name="claimant.phoneCountryCode"
                      render={({ field: countryCodeField }) => (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            1.4 Phone Number {phoneVerified ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCodeField.value || "+91"}
                              onChange={countryCodeField.onChange}
                              disabled={phoneVerified}
                              className={`px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm hover:border-gray-300 ${
                                phoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="+91">+91</option>
                              <option value="+1">+1</option>
                              <option value="+44">+44</option>
                              <option value="+49">+49</option>
                              <option value="+86">+86</option>
                            </select>
                            <input
                              type="tel"
                              value={phoneField.value || ""}
                              onChange={(e) => {
                                // Only allow numbers and limit to 10 digits
                                const value = e.target.value.replace(/\D/g, '').slice(0, MAX_PHONE_LENGTH);
                                phoneField.onChange(value);
                              }}
                              placeholder="10-digit number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={MAX_PHONE_LENGTH}
                              disabled={phoneVerified}
                              className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                                phoneVerified ? 'border-green-500 bg-gray-100' : 'hover:border-gray-300'
                              } ${phoneVerified ? 'cursor-not-allowed' : ''}`}
                            />
                            {!phoneVerified && phoneField.value && phoneField.value.length === 10 && (
                              <Button 
                                type="button" 
                                variant="outline"
                                size="sm"
                                onClick={sendPhoneVerification}
                                disabled={!phoneField.value}
                              >
                                Verify
                              </Button>
                            )}
                            {phoneVerified && (
                              <Button 
                                type="button" 
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setPhoneVerified(false);
                                  phoneField.onChange('');
                                  toast.info('Please enter a new phone number and verify it');
                                }}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Change
                              </Button>
                            )}
                          </div>
                          {fieldState.error && (
                            <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                          )}
                          {phoneVerified && (
                            <div className="text-green-600 text-xs mt-1 flex items-center">
                              <span className="mr-1">✓</span> Phone number verified
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Enter a valid phone number (max 10 digits)</p>
                        </div>
                      )}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name="claimant.pincode"
                render={({ field, fieldState }) => (
                  <FormField
                    label="1.5 Pincode"
                    name="claimant.pincode"
                    value={field.value || ""}
                    onChange={field.onChange}
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="claimant.address1"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="1.6 Address Line 1"
                      name="claimant.address1"
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="claimant.address2"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="1.7 Address Line 2"
                      name="claimant.address2"
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Controller
                  control={control}
                  name="claimant.city"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="1.8 City"
                      name="claimant.city"
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={claimantLocationOptions.cities.length > 0 ? claimantLocationOptions.cities : [{ value: "", label: "Select City" }]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="claimant.district"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="1.9 District"
                      name="claimant.district"
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={claimantLocationOptions.districts.length > 0 ? claimantLocationOptions.districts : [{ value: "", label: "Select District" }]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name="claimant.state"
                  render={({ field, fieldState }) => (
                    <FormField
                      label="1.10 State"
                      name="claimant.state"
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={claimantLocationOptions.states.length > 0 ? claimantLocationOptions.states : [{ value: "", label: "Select State" }]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name="claimant.country"
                render={({ field, fieldState }) => (
                  <FormField
                    label="1.11 Country"
                    name="claimant.country"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={claimantLocationOptions.countries.length > 0 ? claimantLocationOptions.countries : [{ value: "", label: "Select Country" }]}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
            
            {/* Document Upload Section */}
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium text-md mb-4">Document Upload</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FileField
                    label="1.12 Certificate of Incorporation (COI)"
                    name="claimant.coi"
                    onChange={(file) => handleFileChange('claimant.coi', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    existingFile={files['claimant.coi']}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
                </div>
                <div>
                  <FileField
                    label="1.13 PAN Card"
                    name="claimant.panCard"
                    onChange={(file) => handleFileChange('claimant.panCard', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    existingFile={files['claimant.panCard']}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
                </div>
                <div>
                  <FileField
                    label="1.14 GST Registration Certificate"
                    name="claimant.gstCert"
                    onChange={(file) => handleFileChange('claimant.gstCert', file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    existingFile={files['claimant.gstCert']}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
                </div>
              </div>
            </div>
  
            {/* Business Information Section */}
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium text-md mb-4">Business Information</h4>
              <div className="space-y-4">
                <div>
                  <Controller
                    control={control}
                    name="claimant.gst"
                    render={({ field, fieldState }) => (
                      <FormField
                        label="1.15 GST Number"
                        name="claimant.gst"
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={MAX_GST_LENGTH}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="claimant.pan"
                    render={({ field, fieldState }) => (
                      <FormField
                        label="1.16 PAN Number"
                        name="claimant.pan"
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="AAAPL1234C"
                        maxLength={MAX_PAN_LENGTH}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="claimant.cin"
                    render={({ field, fieldState }) => (
                      <FormField
                        label="1.17 CIN"
                        name="claimant.cin"
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="U74140MH2014PTC123456"
                        maxLength={MAX_CIN_LENGTH}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                </div>
              </div>
            </div>
          </div>
        )
  
      case 1: // Additional Claimants
        return (
          <div className="space-y-6" ref={(el) => { stepRefs.current[1] = el; }}>
            <h3 className="text-lg font-medium mb-4">Step 2: Additional Claimants</h3>
          
            {additionalClaimantFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-xl p-6 space-y-6 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold">Additional Claimant {index + 1}</h4>
                  <Button variant="destructive" size="sm" onClick={() => removeAdditionalClaimant(index)}>
                    Remove
                  </Button>
                </div>
  
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.type`}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="2.1 Type"
                      name={`additionalClaimants.${index}.type`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      required
                      options={[
                        { value: "individual", label: "Individual" },
                        { value: "company", label: "Company" },
                        { value: "partnership", label: "Partnership" },
                        { value: "llp", label: "LLP" }
                      ]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
  
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.name`}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="2.2 Name"
                      name={`additionalClaimants.${index}.name`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={MAX_NAME_LENGTH}
                      error={fieldState.error?.message}
                    />
                  )}
                />
  
                {/* Email Field with Verify Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name={`additionalClaimants.${index}.email`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          2.3 Email Address {additionalClaimantEmailVerified[index] ? "✓" : ""} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={field.value || ""}
                            onChange={field.onChange}
                            disabled={additionalClaimantEmailVerified[index]}
                            className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                              additionalClaimantEmailVerified[index] ? "border-green-500 bg-gray-100 cursor-not-allowed" : "hover:border-gray-300"
                            }`}
                          />
                          {!additionalClaimantEmailVerified[index] && field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => sendAdditionalClaimantEmailVerification(index)}
                              disabled={!field.value}
                            >
                              Verify
                            </Button>
                          )}
                          {additionalClaimantEmailVerified[index] && (
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setAdditionalClaimantEmailVerified(prev => {
                                  const newVerified = [...prev];
                                  newVerified[index] = false;
                                  return newVerified;
                                });
                                field.onChange('');
                                toast.info(`Additional Claimant ${index + 1}: Please enter a new email address and verify it`);
                              }}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Change
                            </Button>
                          )}
                        </div>
                        {fieldState.error && (
                          <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                        )}
                        {additionalClaimantEmailVerified[index] && (
                          <div className="text-green-600 text-xs mt-1 flex items-center">
                            <span className="mr-1">✓</span> Email address verified
                          </div>
                        )}
                      </div>
                    )}
                  />
  
                  {/* Phone Field with Country Code + Verify */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      2.4 Mobile Number {additionalClaimantPhoneVerified[index] ? "✓" : ""} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Controller
                        name={`additionalClaimants.${index}.phoneCountryCode`}
                        control={control}
                        render={({ field }) => (
                          <select
                            value={field.value || "+91"}
                            onChange={field.onChange}
                            disabled={additionalClaimantPhoneVerified[index]}
                            className={`px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 ${
                              additionalClaimantPhoneVerified[index] ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+49">+49</option>
                            <option value="+86">+86</option>
                          </select>
                        )}
                      />
                      <Controller
                        name={`additionalClaimants.${index}.phone`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <>
                            <input
                              type="tel"
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
                              disabled={additionalClaimantPhoneVerified[index]}
                              className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                                additionalClaimantPhoneVerified[index] ? "border-green-500 bg-gray-100 cursor-not-allowed" : "hover:border-gray-300"
                              }`}
                            />
                            {!additionalClaimantPhoneVerified[index] && field.value && field.value.length === 10 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => sendAdditionalClaimantPhoneVerification(index)}
                                disabled={!field.value}
                              >
                                Verify
                              </Button>
                            )}
                            {additionalClaimantPhoneVerified[index] && (
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setAdditionalClaimantPhoneVerified(prev => {
                                    const newVerified = [...prev];
                                    newVerified[index] = false;
                                    return newVerified;
                                  });
                                  field.onChange('');
                                  toast.info(`Additional Claimant ${index + 1}: Please enter a new phone number and verify it`);
                                }}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Change
                              </Button>
                            )}
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                            )}
                            {additionalClaimantPhoneVerified[index] && (
                              <div className="text-green-600 text-xs mt-1 flex items-center">
                                <span className="mr-1">✓</span> Phone number verified
                              </div>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                </div>
  
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.pincode`}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="2.5 Pincode"
                      name={`additionalClaimants.${index}.pincode`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={6}
                      placeholder="Enter 6-digit pincode"
                      error={fieldState.error?.message}
                    />
                  )}
                />
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.address1`}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="2.6 Address Line 1"
                        name={`additionalClaimants.${index}.address1`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        maxLength={MAX_ADDRESS_LENGTH}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.address2`}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="2.7 Address Line 2"
                        name={`additionalClaimants.${index}.address2`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        maxLength={MAX_ADDRESS_LENGTH}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.city`}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="2.8 City"
                        name={`additionalClaimants.${index}.city`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        type="select"
                        options={additionalClaimantLocationOptions[index]?.cities.length > 0 ? additionalClaimantLocationOptions[index].cities : [{ value: "", label: "Select City" }]}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.district`}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="2.9 District"
                        name={`additionalClaimants.${index}.district`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        type="select"
                        options={additionalClaimantLocationOptions[index]?.districts.length > 0 ? additionalClaimantLocationOptions[index].districts : [{ value: "", label: "Select District" }]}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.state`}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="2.10 State"
                        name={`additionalClaimants.${index}.state`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        type="select"
                        options={additionalClaimantLocationOptions[index]?.states.length > 0 ? additionalClaimantLocationOptions[index].states : [{ value: "", label: "Select State" }]}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
  
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.country`}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="2.11 Country"
                      name={`additionalClaimants.${index}.country`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={additionalClaimantLocationOptions[index]?.countries.length > 0 ? additionalClaimantLocationOptions[index].countries : [{ value: "", label: "Select Country" }]}
                      error={fieldState.error?.message}
                    />
                  )}
                />
  
                {/* Document Upload Section */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h5 className="text-md font-medium mb-4">Document Upload</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <FileField 
                      label="2.12 Certificate of Incorporation (COI)" 
                      name={`additionalClaimants.${index}.coi`} 
                      onChange={(file) => handleFileChange(`additionalClaimants.${index}.coi`, file)} 
                      existingFile={files[`additionalClaimants.${index}.coi`]} 
                    />
                    <FileField 
                      label="2.13 PAN Card" 
                      name={`additionalClaimants.${index}.panCard`} 
                      onChange={(file) => handleFileChange(`additionalClaimants.${index}.panCard`, file)} 
                      existingFile={files[`additionalClaimants.${index}.panCard`]} 
                    />
                      <FileField 
                        label="2.14 GST Registration Certificate" 
                        name={`additionalClaimants.${index}.gstCert`} 
                        onChange={(file) => handleFileChange(`additionalClaimants.${index}.gstCert`, file)} 
                        existingFile={files[`additionalClaimants.${index}.gstCert`]} 
                      />
                  </div>
                </div>
  
                {/* Business Info Section */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h5 className="text-md font-medium mb-4">Business Information</h5>
                  <div className="space-y-4">
                    <div>
                      <Controller
                        control={control}
                        name={`additionalClaimants.${index}.gst`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="2.15 GST Number"
                            name={`additionalClaimants.${index}.gst`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={MAX_GST_LENGTH}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                    </div>
                    
                    <div>
                      <Controller
                        control={control}
                        name={`additionalClaimants.${index}.pan`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="2.16 PAN Number"
                            name={`additionalClaimants.${index}.pan`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="AAAPL1234C"
                            maxLength={MAX_PAN_LENGTH}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                    </div>
                    
                    <div>
                      <Controller
                        control={control}
                        name={`additionalClaimants.${index}.cin`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="2.17 CIN"
                            name={`additionalClaimants.${index}.cin`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="U74140MH2014PTC123456"
                            maxLength={MAX_CIN_LENGTH}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
            <div className="flex justify-end">
              <Button onClick={addAdditionalClaimant} variant="outline">
                Add Another Claimant
              </Button>
            </div>
          
            <div className="mt-8">
  <h3 className="font-medium text-lg mb-4">Manager Details</h3>
  {managerFields.map((field, index) => (
    <div key={field.id} className="border border-gray-200 rounded-xl p-6 space-y-6 bg-white shadow-sm mb-4">
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
      
      <div className="space-y-4">
        <Controller
          control={control}
          name={`managerDetails.${index}.name`}
          render={({ field, fieldState }) => (
            <FormField
              label="Name"
              name={`managerDetails.${index}.name`}
              value={field.value || ""}
              onChange={field.onChange}
              required
              maxLength={MAX_NAME_LENGTH}
              error={fieldState.error?.message}
            />
          )}
        />
        
        <Controller
          control={control}
          name={`managerDetails.${index}.designation`}
          render={({ field, fieldState }) => (
            <FormField
              label="Designation"
              name={`managerDetails.${index}.designation`}
              value={field.value || ""}
              onChange={field.onChange}
              maxLength={MAX_NAME_LENGTH}
              error={fieldState.error?.message}
            />
          )}
        />
        
        <Controller
          control={control}
          name={`managerDetails.${index}.managerId`}
          render={({ field, fieldState }) => (
            <FormField
              label="Manager ID Number"
              name={`managerDetails.${index}.managerId`}
              value={field.value || ""}
              onChange={field.onChange}
              required
              maxLength={50}
              placeholder="Enter unique manager ID"
              error={fieldState.error?.message}
            />
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={control}
            name={`managerDetails.${index}.email`}
            render={({ field, fieldState }) => (
              <FormField
                label="Email Address"
                name={`managerDetails.${index}.email`}
                value={field.value || ""}
                onChange={field.onChange}
                type="email"
                required
                error={fieldState.error?.message}
              />
            )}
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <Controller
                control={control}
                name={`managerDetails.${index}.phoneCountryCode`}
                render={({ field }) => (
                  <select
                    value={field.value || "+91"}
                    onChange={field.onChange}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm hover:border-gray-300"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+49">+49</option>
                    <option value="+86">+86</option>
                  </select>
                )}
              />
              <Controller
                control={control}
                name={`managerDetails.${index}.phone`}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      type="tel"
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
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 hover:border-gray-300"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter a valid phone number (max 10 digits)</p>
                  </>
                )}
              />
            </div>
          </div>
        </div>
        
        <Controller
          control={control}
          name={`managerDetails.${index}.address1`}
          render={({ field, fieldState }) => (
            <FormField
              label="Address"
              name={`managerDetails.${index}.address1`}
              value={field.value || ""}
              onChange={field.onChange}
              required
              maxLength={MAX_ADDRESS_LENGTH}
              error={fieldState.error?.message}
            />
          )}
        />
        
        <Controller
          control={control}
          name={`managerDetails.${index}.authority`}
          render={({ field, fieldState }) => (
            <FormField
              label="Authority"
              name={`managerDetails.${index}.authority`}
              value={field.value || ""}
              onChange={field.onChange}
              maxLength={MAX_NAME_LENGTH}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
      
      {/* Document Upload Section for Manager */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h5 className="text-md font-medium mb-4">Document Upload</h5>
        <p className="text-sm text-gray-600 mb-3">
          Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FileField
              label="Certificate of Incorporation (COI)"
              name={`managerDetails.${index}.coi`}
              onChange={(file) => handleFileChange(`managerDetails.${index}.coi`, file)}
              accept=".pdf,.jpg,.jpeg,.png"
              existingFile={files[`managerDetails.${index}.coi`]}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
          </div>
          <div>
            <FileField
              label="PAN Card"
              name={`managerDetails.${index}.panCard`}
              onChange={(file) => handleFileChange(`managerDetails.${index}.panCard`, file)}
              accept=".pdf,.jpg,.jpeg,.png"
              existingFile={files[`managerDetails.${index}.panCard`]}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
          </div>
          <div>
            <FileField
              label="GST Registration Certificate"
              name={`managerDetails.${index}.gstCert`}
              onChange={(file) => handleFileChange(`managerDetails.${index}.gstCert`, file)}
              accept=".pdf,.jpg,.jpeg,.png"
              existingFile={files[`managerDetails.${index}.gstCert`]}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
          </div>
        </div>
      </div>

      {/* Business Information Section for Manager */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h5 className="text-md font-medium mb-4">Business Information</h5>
        <div className="space-y-4">
          <div>
            <Controller
              control={control}
              name={`managerDetails.${index}.gst`}
              render={({ field, fieldState }) => (
                <FormField
                  label="GST Number"
                  name={`managerDetails.${index}.gst`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={MAX_GST_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
          </div>
          
          <div>
            <Controller
              control={control}
              name={`managerDetails.${index}.pan`}
              render={({ field, fieldState }) => (
                <FormField
                  label="PAN Number"
                  name={`managerDetails.${index}.pan`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="AAAPL1234C"
                  maxLength={MAX_PAN_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
          </div>
          
          <div>
            <Controller
              control={control}
              name={`managerDetails.${index}.cin`}
              render={({ field, fieldState }) => (
                <FormField
                  label="CIN"
                  name={`managerDetails.${index}.cin`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="U74140MH2014PTC123456"
                  maxLength={MAX_CIN_LENGTH}
                  error={fieldState.error?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
          </div>
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
            <h3 className="font-medium text-lg mb-4">Step 3: Respondent Details</h3>
            <div className="space-y-6">
              {respondentFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-xl p-6 space-y-6 bg-white shadow-sm">
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
                  
                  <div className="space-y-4">
                    <Controller
                      control={control}
                      name={`respondents.${index}.type`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="3.1 Type"
                          name={`respondents.${index}.type`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "individual", label: "Individual" },
                            { value: "company", label: "Company" },
                            { value: "partnership", label: "Partnership" },
                            { value: "llp", label: "LLP" },
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`respondents.${index}.name`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="3.2 Name"
                          name={`respondents.${index}.name`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          maxLength={MAX_NAME_LENGTH}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        control={control}
                        name={`respondents.${index}.email`}
                        render={({ field, fieldState }) => (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              3.3 Email Address {respondentEmailVerified[index] ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={respondentEmailVerified[index]}
                                className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                                  respondentEmailVerified[index] ? 'border-green-500 bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                                }`}
                              />
                              {!respondentEmailVerified[index] && field.value && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendRespondentEmailVerification(index)}
                                  disabled={!field.value}
                                >
                                  Verify
                                </Button>
                              )}
                              {respondentEmailVerified[index] && (
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setRespondentEmailVerified(prev => {
                                      const newVerified = [...prev];
                                      newVerified[index] = false;
                                      return newVerified;
                                    });
                                    field.onChange('');
                                    toast.info(`Respondent ${index + 1}: Please enter a new email address and verify it`);
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Change
                                </Button>
                              )}
                            </div>
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                            )}
                            {respondentEmailVerified[index] && (
                              <div className="text-green-600 text-xs mt-1 flex items-center">
                                <span className="mr-1">✓</span> Email address verified
                              </div>
                            )}
                          </div>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          3.4 Mobile Number {respondentPhoneVerified[index] ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="flex gap-2">
                          <Controller
                            control={control}
                            name={`respondents.${index}.phoneCountryCode`}
                            render={({ field }) => (
                              <select
                                value={field.value || "+91"}
                                onChange={field.onChange}
                                disabled={respondentPhoneVerified[index]}
                                className={`px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm hover:border-gray-300 ${
                                  respondentPhoneVerified[index] ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="+91">+91</option>
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                                <option value="+49">+49</option>
                                <option value="+86">+86</option>
                              </select>
                            )}
                          />
                          <Controller
                            control={control}
                            name={`respondents.${index}.phone`}
                            render={({ field, fieldState }) => (
                              <>
                                <input
                                  type="tel"
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
                                  disabled={respondentPhoneVerified[index]}
                                  className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                                    respondentPhoneVerified[index] ? 'border-green-500 bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                                  }`}
                                />
                                {!respondentPhoneVerified[index] && field.value && field.value.length === 10 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendRespondentPhoneVerification(index)}
                                    disabled={!field.value}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {respondentPhoneVerified[index] && (
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setRespondentPhoneVerified(prev => {
                                        const newVerified = [...prev];
                                        newVerified[index] = false;
                                        return newVerified;
                                      });
                                      field.onChange('');
                                      toast.info(`Respondent ${index + 1}: Please enter a new phone number and verify it`);
                                    }}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    Change
                                  </Button>
                                )}
                                {fieldState.error && (
                                  <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                                )}
                                {respondentPhoneVerified[index] && (
                                  <div className="text-green-600 text-xs mt-1 flex items-center">
                                    <span className="mr-1">✓</span> Phone number verified
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Enter a valid phone number (max 10 digits)</p>
                              </>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Controller
                      control={control}
                      name={`respondents.${index}.pincode`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="3.5 Pincode"
                          name={`respondents.${index}.pincode`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          maxLength={6}
                          placeholder="Enter 6-digit pincode"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        control={control}
                        name={`respondents.${index}.address1`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="3.6 Address Line 1"
                            name={`respondents.${index}.address1`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            required
                            maxLength={MAX_ADDRESS_LENGTH}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      
                      <Controller
                        control={control}
                        name={`respondents.${index}.address2`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="3.7 Address Line 2"
                            name={`respondents.${index}.address2`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            maxLength={MAX_ADDRESS_LENGTH}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        control={control}
                        name={`respondents.${index}.city`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="3.8 City"
                            name={`respondents.${index}.city`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            type="select"
                            options={respondentLocationOptions[index]?.cities.length > 0 ? respondentLocationOptions[index].cities : [{ value: "", label: "Select City" }]}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      
                      <Controller
                        control={control}
                        name={`respondents.${index}.state`}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="3.10 State"
                            name={`respondents.${index}.state`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            type="select"
                            options={respondentLocationOptions[index]?.states.length > 0 ? respondentLocationOptions[index].states : [{ value: "", label: "Select State" }]}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>
                    
                    <Controller
                      control={control}
                      name={`respondents.${index}.district`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="3.9 District"
                          name={`respondents.${index}.district`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          options={respondentLocationOptions[index]?.districts.length > 0 ? respondentLocationOptions[index].districts : [{ value: "", label: "Select District" }]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`respondents.${index}.country`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="3.11 Country"
                          name={`respondents.${index}.country`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          options={respondentLocationOptions[index]?.countries.length > 0 ? respondentLocationOptions[index].countries : [{ value: "", label: "Select Country" }]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                  
                  {/* Document Upload Section for Respondent */}
                  <div className="mt-4 border-t pt-4">
                    <h5 className="font-medium text-sm mb-3">Document Upload</h5>
                    <p className="text-xs text-gray-600 mb-3">
                      Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <FileField
                          label="3.12 Certificate of Incorporation (COI)"
                          name={`respondents.${index}.coi`}
                          onChange={(file) => handleFileChange(`respondents.${index}.coi`, file)}
                          accept=".pdf,.jpg,.jpeg,.png"
                          existingFile={files[`respondents.${index}.coi`]}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
                      </div>
                      <div>
                        <FileField
                          label="3.13 PAN Card"
                          name={`respondents.${index}.panCard`}
                          onChange={(file) => handleFileChange(`respondents.${index}.panCard`, file)}
                          accept=".pdf,.jpg,.jpeg,.png"
                          existingFile={files[`respondents.${index}.panCard`]}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
                      </div>
                      <div>
                        <FileField
                          label="3.14 GST Registration Certificate"
                          name={`respondents.${index}.gstCert`}
                          onChange={(file) => handleFileChange(`respondents.${index}.gstCert`, file)}
                          accept=".pdf,.jpg,.jpeg,.png"
                          existingFile={files[`respondents.${index}.gstCert`]}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
                      </div>
                    </div>
                  </div>
  
                  {/* Business Information Section for Respondent */}
                  <div className="mt-4 border-t pt-4">
                    <h5 className="font-medium text-sm mb-3">Business Information</h5>
                    <div className="space-y-4">
                      <div>
                        <Controller
                          control={control}
                          name={`respondents.${index}.gst`}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="3.15 GST Number"
                              name={`respondents.${index}.gst`}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="22AAAAA0000A1Z5"
                              maxLength={MAX_GST_LENGTH}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                      </div>
                      
                      <div>
                        <Controller
                          control={control}
                          name={`respondents.${index}.pan`}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="3.16 PAN Number"
                              name={`respondents.${index}.pan`}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="AAAPL1234C"
                              maxLength={MAX_PAN_LENGTH}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                      </div>
                      
                      <div>
                        <Controller
                          control={control}
                          name={`respondents.${index}.cin`}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="3.17 CIN"
                              name={`respondents.${index}.cin`}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="U74140MH2014PTC123456"
                              maxLength={MAX_CIN_LENGTH}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                      </div>
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
            <h3 className="font-medium text-lg mb-4">Step 4: Arbitration Agreement Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <Controller
                control={control}
                name="arbitrationAgreement.agreementDate"
                render={({ field, fieldState }) => (
                  <FormField
                    label="4.1 Date of Arbitration Agreement / Agreement containing the arbitration clause*"
                    name="arbitrationAgreement.agreementDate"
                    type="date"
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="arbitrationAgreement.placeOfSigning"
                render={({ field, fieldState }) => (
                  <FormField
                    label="4.2 Place where the Arbitration Agreement / Agreement containing the arbitration clause was signed*"
                    name="arbitrationAgreement.placeOfSigning"
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    maxLength={MAX_ARBITRATION_FIELD_LENGTH}
                    placeholder="Enter the place where the agreement was signed"
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="arbitrationAgreement.arbitrationText"
                render={({ field, fieldState }) => (
                  <FormField
                    label="4.3 Text of Arbitration Agreement/clause*"
                    name="arbitrationAgreement.arbitrationText"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="textarea"
                    required
                    maxLength={2000}
                    rows={5}
                    placeholder="Enter the exact text of the arbitration agreement or clause"
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="arbitrationAgreement.stampDutyPercentage"
                render={({ field, fieldState }) => (
                  <FormField
                    label="4.4 Percentage of the Agreement value / Amount of stamp duty paid on the Arbitration Agreement / Agreement containing the arbitration clause*"
                    name="arbitrationAgreement.stampDutyPercentage"
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    placeholder="Enter percentage or amount"
                    maxLength={50}
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="arbitrationAgreement.numberOfArbitrators"
                render={({ field, fieldState }) => (
                  <FormField
                    label="4.5 Number of Arbitrators as per Agreement*"
                    name="arbitrationAgreement.numberOfArbitrators"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={[
                      { value: "1", label: "1 (Sole Arbitrator)" },
                      { value: "3", label: "3 (Tribunal)" },
                      { value: "5", label: "5" },
                      { value: "other", label: "Other" },
                    ]}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>
        )
  
      case 4: // Nature of Dispute
        return (
          <div className="space-y-6">
            {/* Nature of Dispute Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Step 5: Nature of Dispute</h3>
              <p className="text-sm text-gray-600 mb-4">You can add multiple nature of dispute entries. Each entry represents a separate dispute category.</p>
              
              {natureOfDisputeFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Nature of Dispute {index + 1}</h4>
                    {natureOfDisputeFields.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeNatureOfDispute(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.category`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="5.1 Category"
                          name={`natureOfDispute.${index}.category`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.subCategory`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="5.2 Sub Category"
                          name={`natureOfDispute.${index}.subCategory`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.natureOfDispute`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="5.3 Nature of Dispute"
                          name={`natureOfDispute.${index}.natureOfDispute`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.dateWhenRightToClaimArose`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="5.4 Date when right to claim arose"
                          name={`dateWhenRightToClaimArose_${index}`}
                          type="date"
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          max={new Date().toISOString().split('T')[0]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.standardisedPrayerClauses`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="5.5 Standardised prayer clauses"
                          name={`natureOfDispute.${index}.standardisedPrayerClauses`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}
  
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNatureOfDispute}
                  className="mt-4"
                >
                  Add Another Nature of Dispute
                </Button>
              </div>
            </div>
          </div>
        )
  
      case 5: // Dispute Description
        return (
          <div className="space-y-6">
            {/* Dispute Description Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-4">Step 6: Dispute Description</h3>
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
                  
                  <div className="space-y-4">
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.claimType`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.1 Claim Type"
                          name={`disputeDescriptions.${index}.claimType`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.claimReason`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.2 Claim Reason"
                          name={`disputeDescriptions.${index}.claimReason`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          type="textarea"
                          rows={2}
                          placeholder="Provide the primary reason for this claim"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.lawReliedUpon`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.3 Law relied upon by Claimant to be listed (Acts/Rules/Regulations/Others)"
                          name={`disputeDescriptions.${index}.lawReliedUpon`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          type="textarea"
                          rows={3}
                          placeholder="List specific Acts, Rules, Regulations, or other legal provisions relied upon"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.relevantClauseNumber`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.4 Relevant Clause Number/Page Number"
                          name={`disputeDescriptions.${index}.relevantClauseNumber`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="e.g., Clause 5.2 or Page 7"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.5 Clause Supporting Claim"
                          name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          type="textarea"
                          rows={2}
                          placeholder="Describe how this clause supports your claim"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.clause`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.6 Clause"
                          name={`disputeDescriptions.${index}.clause`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          type="textarea"
                          rows={3}
                          placeholder="Enter the exact text of the relevant clause"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.documentSupportingClaim`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="6.7 Document Supporting Claim"
                          name={`disputeDescriptions.${index}.documentSupportingClaim`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="Name/reference of supporting document"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.reliefSought`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Relief Sought"
                          name={`disputeDescriptions.${index}.reliefSought`}
                          value={field.value || ""}
                          onChange={field.onChange}
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
                          error={fieldState.error?.message}
                        />
                      )}
                    />
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
  
      case 4: // Nature of Dispute
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[4] = el; }}>
            <h3 className="font-medium text-lg mb-4">Nature of Dispute</h3>
            <div className="space-y-4">
              {natureOfDisputeFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Dispute {index + 1}</h4>
                    {natureOfDisputeFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeNatureOfDispute(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.category`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Category"
                          name={`natureOfDispute.${index}.category`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "contract_dispute", label: "Contract Dispute" },
                            { value: "payment_dispute", label: "Payment Dispute" },
                            { value: "delivery_dispute", label: "Delivery Dispute" },
                            { value: "quality_dispute", label: "Quality Dispute" },
                            { value: "service_dispute", label: "Service Dispute" },
                            { value: "other", label: "Other" }
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.subCategory`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Sub Category"
                          name={`natureOfDispute.${index}.subCategory`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "breach_of_contract", label: "Breach of Contract" },
                            { value: "non_payment", label: "Non-payment" },
                            { value: "late_delivery", label: "Late Delivery" },
                            { value: "defective_goods", label: "Defective Goods" },
                            { value: "poor_service", label: "Poor Service" },
                            { value: "other", label: "Other" }
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.natureOfDispute`}
                      render={({ field, fieldState }) => (
                        <TextAreaField
                          label="Nature of Dispute"
                          name={`natureOfDispute.${index}.natureOfDispute`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          rows={3}
                          placeholder="Describe the nature of the dispute"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`natureOfDispute.${index}.dateWhenRightToClaimArose`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Date When Right to Claim Arose"
                          name={`natureOfDispute.${index}.dateWhenRightToClaimArose`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="date"
                          required
                          max={new Date().toISOString().split('T')[0]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <Controller
                        control={control}
                        name={`natureOfDispute.${index}.standardisedPrayerClauses`}
                        render={({ field, fieldState }) => (
                          <TextAreaField
                            label="Standardised Prayer Clauses"
                            name={`natureOfDispute.${index}.standardisedPrayerClauses`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            required
                            rows={4}
                            placeholder="Enter standardised prayer clauses"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={addNatureOfDispute}
                  variant="outline"
                  className="w-full max-w-xs"
                >
                  Add Another Dispute
                </Button>
              </div>
            </div>
          </div>
        )
        
      case 5: // Dispute Descriptions
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[5] = el; }}>
            <h3 className="font-medium text-lg mb-4">Dispute Descriptions</h3>
            <div className="space-y-4">
              {disputeDescriptionFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Dispute Description {index + 1}</h4>
                    {disputeDescriptionFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDisputeDescription(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.claimType`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Claim Type"
                          name={`disputeDescriptions.${index}.claimType`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "monetary", label: "Monetary Claim" },
                            { value: "specific_performance", label: "Specific Performance" },
                            { value: "injunction", label: "Injunction" },
                            { value: "declaratory", label: "Declaratory Relief" },
                            { value: "other", label: "Other" }
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.claimReason`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Claim Reason"
                          name={`disputeDescriptions.${index}.claimReason`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "breach_of_contract", label: "Breach of Contract" },
                            { value: "non_payment", label: "Non-payment" },
                            { value: "defective_goods", label: "Defective Goods" },
                            { value: "late_delivery", label: "Late Delivery" },
                            { value: "poor_service", label: "Poor Service" },
                            { value: "other", label: "Other" }
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <Controller
                        control={control}
                        name={`disputeDescriptions.${index}.lawReliedUpon`}
                        render={({ field, fieldState }) => (
                          <TextAreaField
                            label="Law Relied Upon"
                            name={`disputeDescriptions.${index}.lawReliedUpon`}
                            value={field.value || ""}
                            onChange={field.onChange}
                            required
                            rows={3}
                            placeholder="Describe the law relied upon"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.relevantClauseNumber`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Relevant Clause Number"
                          name={`disputeDescriptions.${index}.relevantClauseNumber`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="Enter relevant clause number"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Clause Supporting Claim"
                          name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="Enter clause supporting claim"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.clause`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Clause"
                          name={`disputeDescriptions.${index}.clause`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="Enter clause"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.documentSupportingClaim`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Document Supporting Claim"
                          name={`disputeDescriptions.${index}.documentSupportingClaim`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          required
                          placeholder="Enter document supporting claim"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    
                    <Controller
                      control={control}
                      name={`disputeDescriptions.${index}.reliefSought`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label="Relief Sought"
                          name={`disputeDescriptions.${index}.reliefSought`}
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="select"
                          required
                          options={[
                            { value: "monetary_compensation", label: "Monetary Compensation" },
                            { value: "specific_performance", label: "Specific Performance" },
                            { value: "injunction", label: "Injunction" },
                            { value: "declaratory_relief", label: "Declaratory Relief" },
                            { value: "other", label: "Other" }
                          ]}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={addDisputeDescription}
                  variant="outline"
                  className="w-full max-w-xs"
                >
                  Add Another Dispute Description
                </Button>
              </div>
            </div>
          </div>
        )
  
      case 6: // Prayers & Reliefs
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[6] = el; }}>
            <PrayersSection 
              control={control}
              name="prayers.prayers"
            />
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
              control={control as any}
              watch={watch}
              setValue={setValue}
              disputeIssues={disputeIssues}
              files={files}
            />
          </div>
        )
  
      case 8: // Payment
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[8] = el; }}>
            <h3 className="font-medium text-lg mb-4">Payment</h3>
            <div className="space-y-4">
              <Controller
                control={control}
                name="payment.paymentHead"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Payment Head"
                    name="payment.paymentHead"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={[
                      { value: "filing_fee", label: "Filing Fee" },
                      { value: "arbitrator_fee", label: "Arbitrator Fee" },
                      { value: "administrative_fee", label: "Administrative Fee" },
                      { value: "emergency_fee", label: "Emergency Arbitration Fee" },
                      { value: "other", label: "Other" },
                    ]}
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="payment.paymentAmount"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Payment Amount (INR)"
                    name="payment.paymentAmount"
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="number"
                    required
                    maxLength={MAX_PAYMENT_AMOUNT_LENGTH}
                    placeholder="Enter amount in INR"
                    error={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name="payment.paymentDetails"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Payment Details"
                    name="payment.paymentDetails"
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    type="textarea"
                    rows={4}
                    maxLength={1000}
                    placeholder="Provide detailed payment information"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>
        )
  
      case 9: // Arguments
        return (
          <div className="space-y-4" ref={(el) => { stepRefs.current[9] = el; }}>
            <ArgumentsSection 
              control={control}
              prayersName="prayers.prayers"
              argumentsName="arguments.argumentsPerPrayer"
            />
          </div>
        )
  
      case 10: // Review & Submit
        return (
          <div ref={(el) => { stepRefs.current[10] = el; }} className="w-full">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Petition</h2>
                <p className="text-gray-600">Please review all details before submitting your arbitration petition</p>
              </div>

              {/* Auto-save Status */}
              {currentDraftId && (
                <div className="mb-6 p-4 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Draft saved - All changes are automatically saved</span>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Step 1: Claimant Details */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                      Claimant Details
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveStep(0)}
                      className="bg-white text-blue-600 hover:bg-blue-50 border-white"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.1 Type</label>
                          <p className="text-gray-900 capitalize">{claimant?.type || 'Not filled'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.2 Name</label>
                          <p className="text-gray-900">{claimant?.name || 'Not filled'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.3 Email</label>
                          <p className="text-gray-900">{claimant?.email || 'Not filled'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.4 Phone</label>
                          <p className="text-gray-900">{claimant?.phoneCountryCode} {claimant?.phone || 'Not filled'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">1.5 Address</label>
                        <p className="text-gray-900">
                          {claimant?.address1 && (
                            <>
                              {claimant.address1}
                              {claimant.address2 && `, ${claimant.address2}`}
                              {claimant.city && `, ${claimant.city}`}
                              {claimant.district && `, ${claimant.district}`}
                              {claimant.state && `, ${claimant.state}`}
                              {claimant.country && `, ${claimant.country}`}
                              {claimant.pincode && ` - ${claimant.pincode}`}
                            </>
                            ) || 'Not filled'}
                        </p>
                      </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.6 GST Number</label>
                          <p className="text-gray-900">{claimant?.gst || 'Not filled'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.7 PAN Number</label>
                          <p className="text-gray-900">{claimant?.pan || 'Not filled'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.8 CIN Number</label>
                          <p className="text-gray-900">{claimant?.cin || 'Not filled'}</p>
                        </div>
                        {/* Show uploaded documents */}
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.9 Certificate of Incorporation</label>
                          <p className="text-gray-900">{files['claimant.coi']?.name || 'Not uploaded'}</p>
                    </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.10 PAN Card</label>
                          <p className="text-gray-900">{files['claimant.panCard']?.name || 'Not uploaded'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">1.11 GST Certificate</label>
                          <p className="text-gray-900">{files['claimant.gstCert']?.name || 'Not uploaded'}</p>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Step 2: Additional Claimants */}
                {additionalClaimants && additionalClaimants.length > 0 && additionalClaimants.some((ac: any) => ac?.name) && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                        Additional Claimants
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(1)}
                        className="bg-white text-green-600 hover:bg-green-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {additionalClaimants && additionalClaimants.length > 0 ? (
                        additionalClaimants.map((ac: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Additional Claimant {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.1 Type</label>
                                <p className="text-gray-900 capitalize">{ac.type || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.2 Name</label>
                                <p className="text-gray-900">{ac.name || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.3 Email</label>
                                <p className="text-gray-900">{ac.email || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.4 Phone</label>
                                <p className="text-gray-900">{ac.phoneCountryCode} {ac.phone || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">2.5 Address</label>
                                <p className="text-gray-900">
                                  {ac.address1 && (
                                    <>
                                      {ac.address1}
                                      {ac.address2 && `, ${ac.address2}`}
                                      {ac.city && `, ${ac.city}`}
                                      {ac.district && `, ${ac.district}`}
                                      {ac.state && `, ${ac.state}`}
                                      {ac.country && `, ${ac.country}`}
                                      {ac.pincode && ` - ${ac.pincode}`}
                                    </>
                                  ) || 'Not filled'}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.6 GST Number</label>
                                <p className="text-gray-900">{ac.gst || 'Not filled'}</p>
                            </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.7 PAN Number</label>
                                <p className="text-gray-900">{ac.pan || 'Not filled'}</p>
                          </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.8 CIN Number</label>
                                <p className="text-gray-900">{ac.cin || 'Not filled'}</p>
                              </div>
                              {/* Show uploaded documents */}
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.9 Certificate of Incorporation</label>
                                <p className="text-gray-900">{files[`additionalClaimants.${index}.coi`]?.name || 'Not uploaded'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.10 PAN Card</label>
                                <p className="text-gray-900">{files[`additionalClaimants.${index}.panCard`]?.name || 'Not uploaded'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">2.11 GST Certificate</label>
                                <p className="text-gray-900">{files[`additionalClaimants.${index}.gstCert`]?.name || 'Not uploaded'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">No Additional Claimants Added</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.1 Type</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.2 Name</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.3 Email</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.4 Phone</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">2.5 Address</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.6 GST Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.7 PAN Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.8 CIN Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.9 Certificate of Incorporation</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.10 PAN Card</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">2.11 GST Certificate</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Manager Details */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-orange-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                      <span className="bg-white text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                        Manager Details
                      </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveStep(2)}
                      className="bg-white text-orange-600 hover:bg-orange-50 border-white"
                    >
                      Edit
                    </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {managerDetails && managerDetails.length > 0 ? (
                        managerDetails.map((manager: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Manager {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.1 Name</label>
                                <p className="text-gray-900">{manager.name || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.2 Designation</label>
                                <p className="text-gray-900">{manager.designation || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.3 Email</label>
                                <p className="text-gray-900">{manager.email || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.4 Phone</label>
                                <p className="text-gray-900">{manager.phoneCountryCode} {manager.phone || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.5 Manager ID</label>
                                <p className="text-gray-900">{manager.managerId || 'Not filled'}</p>
                              </div>
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">3.6 Address</label>
                                <p className="text-gray-900">
                                  {manager.address1 && (
                                    <>
                                      {manager.address1}
                                      {manager.address2 && `, ${manager.address2}`}
                                      {manager.city && `, ${manager.city}`}
                                      {manager.district && `, ${manager.district}`}
                                      {manager.state && `, ${manager.state}`}
                                      {manager.country && `, ${manager.country}`}
                                      {manager.pincode && ` - ${manager.pincode}`}
                                    </>
                                  ) || 'Not filled'}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.7 GST Number</label>
                                <p className="text-gray-900">{manager.gst || 'Not filled'}</p>
                            </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.8 PAN Number</label>
                                <p className="text-gray-900">{manager.pan || 'Not filled'}</p>
                          </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.9 CIN Number</label>
                                <p className="text-gray-900">{manager.cin || 'Not filled'}</p>
                              </div>
                              {/* Show uploaded documents */}
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.10 Certificate of Incorporation</label>
                                <p className="text-gray-900">{files[`managerDetails.${index}.coi`]?.name || 'Not uploaded'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.11 PAN Card</label>
                                <p className="text-gray-900">{files[`managerDetails.${index}.panCard`]?.name || 'Not uploaded'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">3.12 GST Certificate</label>
                                <p className="text-gray-900">{files[`managerDetails.${index}.gstCert`]?.name || 'Not uploaded'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">No Managers Added</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.1 Name</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.2 Designation</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.3 Email</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.4 Phone</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.5 Manager ID</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">3.6 Address</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.7 GST Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.8 PAN Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.9 CIN Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.10 Certificate of Incorporation</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.11 PAN Card</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">3.12 GST Certificate</label>
                              <p className="text-gray-900">Not uploaded</p>
                            </div>
                    </div>
                  </div>
                )}
                    </div>
                  </div>

                {/* Step 4: Respondents */}
                {respondents && respondents.length > 0 && respondents.some((r: any) => r?.name) && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                        Respondents
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(3)}
                        className="bg-white text-red-600 hover:bg-red-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {respondents.map((respondent: any, index: number) => (
                        respondent?.name && (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Respondent {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">4.1 Type</label>
                                <p className="text-gray-900 capitalize">{respondent.type || 'Not specified'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">4.2 Name</label>
                                <p className="text-gray-900">{respondent.name}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">4.3 Email</label>
                                <p className="text-gray-900">{respondent.email || 'Not specified'}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">4.4 Phone</label>
                                <p className="text-gray-900">{respondent.phoneCountryCode} {respondent.phone || 'Not specified'}</p>
                              </div>
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">4.5 Address</label>
                                <p className="text-gray-900">
                                  {respondent.address1 && (
                                    <>
                                      {respondent.address1}
                                      {respondent.address2 && `, ${respondent.address2}`}
                                      {respondent.city && `, ${respondent.city}`}
                                      {respondent.district && `, ${respondent.district}`}
                                      {respondent.state && `, ${respondent.state}`}
                                      {respondent.country && `, ${respondent.country}`}
                                      {respondent.pincode && ` - ${respondent.pincode}`}
                                    </>
                                  ) || 'Not specified'}
                                </p>
                              </div>
                              {respondent?.gst && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.6 GST Number</label>
                                  <p className="text-gray-900">{respondent.gst}</p>
                                </div>
                              )}
                              {respondent?.pan && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.7 PAN Number</label>
                                  <p className="text-gray-900">{respondent.pan}</p>
                                </div>
                              )}
                              {respondent?.cin && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.8 CIN Number</label>
                                  <p className="text-gray-900">{respondent.cin}</p>
                                </div>
                              )}
                              {/* Show uploaded documents */}
                              {files[`respondents.${index}.coi`] && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.9 Certificate of Incorporation</label>
                                  <p className="text-gray-900">{files[`respondents.${index}.coi`]?.name || 'Document uploaded'}</p>
                                </div>
                              )}
                              {files[`respondents.${index}.panCard`] && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.10 PAN Card</label>
                                  <p className="text-gray-900">{files[`respondents.${index}.panCard`]?.name || 'Document uploaded'}</p>
                                </div>
                              )}
                              {files[`respondents.${index}.gstCert`] && (
                                <div className="bg-white p-3 rounded">
                                  <label className="text-sm font-medium text-gray-600">4.11 GST Certificate</label>
                                  <p className="text-gray-900">{files[`respondents.${index}.gstCert`]?.name || 'Document uploaded'}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Arbitration Agreement */}
                {arbitrationAgreement && Object.values(arbitrationAgreement).some(val => val) && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                        Arbitration Agreement
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(4)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 border-white"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">4.1 Agreement Date</label>
                          <p className="text-gray-900">{arbitrationAgreement.agreementDate || 'Not filled'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">4.2 Place of Signing</label>
                          <p className="text-gray-900">{arbitrationAgreement.placeOfSigning || 'Not filled'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">4.3 Number of Arbitrators</label>
                          <p className="text-gray-900">{arbitrationAgreement.numberOfArbitrators || 'Not filled'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">4.4 Arbitration Clause</label>
                            <div className="mt-2 p-3 bg-white rounded border text-sm max-h-32 overflow-y-auto">
                            {arbitrationAgreement.arbitrationText || 'Not filled'}
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Nature of Dispute */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-yellow-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="bg-white text-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                        Nature of Dispute
                      </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveStep(4)}
                      className="bg-white text-yellow-600 hover:bg-yellow-50 border-white"
                    >
                      Edit
                    </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      {natureOfDisputeFields && natureOfDisputeFields.length > 0 ? (
                        natureOfDisputeFields.map((field: any, index: number) => {
                          const dispute = watch(`natureOfDispute.${index}`);
                          return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Dispute {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">5.1 Category</label>
                                <p className="text-gray-900 capitalize">{dispute.category || 'Not filled'}</p>
                          </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">5.2 Sub Category</label>
                                <p className="text-gray-900 capitalize">{dispute.subCategory || 'Not filled'}</p>
                          </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">5.3 Nature of Dispute</label>
                                <p className="text-gray-900">{dispute.natureOfDispute || 'Not filled'}</p>
                          </div>
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">5.4 Date When Right to Claim Arose</label>
                                <p className="text-gray-900">{dispute.dateWhenRightToClaimArose || 'Not filled'}</p>
                            </div>
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">5.5 Standardised Prayer Clauses</label>
                                <p className="text-gray-900">{dispute.standardisedPrayerClauses || 'Not filled'}</p>
                          </div>
                            </div>
                          </div>
                        );
                        })
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">No Disputes Added</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">5.1 Category</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">5.2 Sub Category</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">5.3 Nature of Dispute</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">5.4 Date When Right to Claim Arose</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">5.5 Standardised Prayer Clauses</label>
                              <p className="text-gray-900">Not filled</p>
                      </div>
                    </div>
                  </div>
                )}
                    </div>
                  </div>

                {/* Step 6: Dispute Descriptions */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg">
                    <h3 className="text-lg font-semibold flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="bg-white text-teal-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                        Dispute Descriptions
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep(5)}
                        className="bg-white text-teal-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </button>
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {disputeDescriptions && disputeDescriptions.length > 0 ? (
                        disputeDescriptions.map((dispute: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-3">Dispute Description {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.1 Description</label>
                                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                  {dispute.description || 'Not filled'}
                                </div>
                              </div>
                                <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.2 Law Relied Upon</label>
                                  <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                  {dispute.lawReliedUpon || 'Not filled'}
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.3 Relevant Clause Number</label>
                                <p className="text-gray-900">{dispute.relevantClauseNumber || 'Not filled'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.4 Clause Supporting Claim</label>
                                  <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                  {dispute.clauseSupportingClaim || 'Not filled'}
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">6.5 Clause</label>
                                  <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                  {dispute.clause || 'Not filled'}
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.6 Document Supporting Claim</label>
                                <p className="text-gray-900">{dispute.documentSupportingClaim || 'Not filled'}</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">6.7 Relief Sought</label>
                                <p className="text-gray-900 capitalize">{dispute.reliefSought ? dispute.reliefSought.replace(/_/g, ' ') : 'Not filled'}</p>
                                </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">No Dispute Descriptions Added</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.1 Description</label>
                              <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                Not filled
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.2 Law Relied Upon</label>
                              <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                Not filled
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.3 Relevant Clause Number</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.4 Clause Supporting Claim</label>
                              <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                Not filled
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">6.5 Clause</label>
                              <div className="mt-2 p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                                Not filled
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.6 Document Supporting Claim</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">6.7 Relief Sought</label>
                              <p className="text-gray-900">Not filled</p>
                            </div>
                    </div>
                  </div>
                )}
                    </div>
                  </div>

                {/* Step 7: Prayers & Reliefs */}
                {prayers && prayers.prayers && prayers.prayers.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-semibold flex items-center justify-between">
                        <div className="flex items-center">
                        <span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
                        Prayers & Reliefs
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(6)}
                          className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {prayers.prayers.map((prayer: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">Prayer {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.1 Title</label>
                              <p className="text-gray-900">{prayer.title || 'Not specified'}</p>
                          </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.2 Relief Type</label>
                              <p className="text-gray-900 capitalize">{prayer.reliefType || 'Not specified'}</p>
                      </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.3 Prayer Type</label>
                              <p className="text-gray-900 capitalize">{prayer.prayerType || 'Not specified'}</p>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <label className="text-sm font-medium text-gray-600">7.4 Category</label>
                              <p className="text-gray-900 capitalize">{prayer.category || 'Not specified'}</p>
                            </div>
                            {prayer.amount && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">7.5 Amount</label>
                                <p className="text-gray-900">₹{Number(prayer.amount).toLocaleString()}</p>
                              </div>
                            )}
                            {prayer.currency && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">7.6 Currency</label>
                                <p className="text-gray-900">{prayer.currency}</p>
                              </div>
                            )}
                            {prayer.description && (
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">7.7 Description</label>
                                <p className="text-gray-900">{prayer.description}</p>
                              </div>
                            )}
                            {prayer.legalBasis && (
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">7.8 Legal Basis</label>
                                <p className="text-gray-900">{prayer.legalBasis}</p>
                              </div>
                            )}
                            {prayer.factualBasis && (
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">7.9 Factual Basis</label>
                                <p className="text-gray-900">{prayer.factualBasis}</p>
                              </div>
                            )}
                            {prayer.precedents && (
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">7.10 Precedents</label>
                                <p className="text-gray-900">{prayer.precedents}</p>
                              </div>
                            )}
                            {prayer.additionalDetails && (
                              <div className="bg-white p-3 rounded md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">7.11 Additional Details</label>
                                <p className="text-gray-900">{prayer.additionalDetails}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 8: Documents */}
                {documents && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-semibold flex items-center justify-between">
                        <div className="flex items-center">
                        <span className="bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
                        Documents
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(7)}
                          className="bg-white text-gray-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Scanned Documents */}
                        {documents.scannedDocuments && documents.scannedDocuments.length > 0 && (
                          <div>
                          <h4 className="font-medium text-gray-900 mb-3">Scanned Documents</h4>
                          <div className="space-y-3">
                              {documents.scannedDocuments.map((doc: any, index: number) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h5 className="font-semibold text-gray-900 mb-3">Document {index + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.1 Document Type</label>
                                    <p className="text-gray-900">{doc.documentType || 'Not specified'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.2 Date</label>
                                    <p className="text-gray-900">{doc.date || 'Not specified'}</p>
                                  </div>
                                  {doc.description && (
                                    <div className="bg-white p-3 rounded md:col-span-2">
                                      <label className="text-sm font-medium text-gray-600">8.3 Description</label>
                                      <p className="text-gray-900">{doc.description}</p>
                                    </div>
                                  )}
                                  {doc.linkedIssue && (
                                    <div className="bg-white p-3 rounded">
                                      <label className="text-sm font-medium text-gray-600">8.4 Linked Issue</label>
                                      <p className="text-gray-900">{doc.linkedIssue}</p>
                                    </div>
                                  )}
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.5 Admission Status</label>
                                    <p className="text-gray-900 capitalize">{doc.admissionStatus || 'pending'}</p>
                                  </div>
                                  {doc.file && (
                                    <div className="bg-white p-3 rounded">
                                      <label className="text-sm font-medium text-gray-600">8.6 File</label>
                                      <p className="text-gray-900">{doc.file.name || 'File uploaded'}</p>
                                    </div>
                                  )}
                                </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Affidavits */}
                        {documents.affidavits && documents.affidavits.length > 0 && (
                          <div>
                          <h4 className="font-medium text-gray-900 mb-3">Affidavits</h4>
                          <div className="space-y-3">
                              {documents.affidavits.map((affidavit: any, index: number) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h5 className="font-semibold text-gray-900 mb-3">Affidavit {index + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.7 Affidavit Type</label>
                                    <p className="text-gray-900">{affidavit.affidavitType || 'Not specified'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.8 Date</label>
                                    <p className="text-gray-900">{affidavit.date || 'Not specified'}</p>
                                  </div>
                                  {affidavit.description && (
                                    <div className="bg-white p-3 rounded md:col-span-2">
                                      <label className="text-sm font-medium text-gray-600">8.9 Description</label>
                                      <p className="text-gray-900">{affidavit.description}</p>
                                    </div>
                                  )}
                                  {affidavit.file && (
                                    <div className="bg-white p-3 rounded">
                                      <label className="text-sm font-medium text-gray-600">8.10 File</label>
                                      <p className="text-gray-900">{affidavit.file.name || 'File uploaded'}</p>
                                    </div>
                                  )}
                                </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Electronic Evidence */}
                        {documents.electronicEvidence && documents.electronicEvidence.length > 0 && (
                          <div>
                          <h4 className="font-medium text-gray-900 mb-3">Electronic Evidence</h4>
                            <div className="space-y-3">
                              {documents.electronicEvidence.map((evidence: any, index: number) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h5 className="font-semibold text-gray-900 mb-3">Evidence {index + 1}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.11 Evidence Type</label>
                                    <p className="text-gray-900">{evidence.evidenceType || 'Not specified'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded">
                                    <label className="text-sm font-medium text-gray-600">8.12 Date</label>
                                    <p className="text-gray-900">{evidence.date || 'Not specified'}</p>
                                  </div>
                                  {evidence.description && (
                                    <div className="bg-white p-3 rounded md:col-span-2">
                                      <label className="text-sm font-medium text-gray-600">8.13 Description</label>
                                      <p className="text-gray-900">{evidence.description}</p>
                                    </div>
                                  )}
                                    {evidence.certificateFile && (
                                    <div className="bg-white p-3 rounded">
                                      <label className="text-sm font-medium text-gray-600">8.14 Certificate</label>
                                        <p className="text-gray-900">{evidence.certificateFile.name || 'Certificate uploaded'}</p>
                                      </div>
                                    )}
                                    {evidence.supportingFiles && evidence.supportingFiles.length > 0 && (
                                    <div className="bg-white p-3 rounded">
                                      <label className="text-sm font-medium text-gray-600">8.15 Supporting Files</label>
                                        <p className="text-gray-900">{evidence.supportingFiles.length} file(s) uploaded</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Supporting Documents */}
                      {documents.supportingDocuments && documents.supportingDocuments.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Supporting Documents</h4>
                          <p className="text-gray-600">{documents.supportingDocuments.length} file(s) uploaded</p>
                      </div>
                      )}

                      {/* Evidence Files */}
                      {documents.evidenceFiles && documents.evidenceFiles.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Evidence Files</h4>
                          <p className="text-gray-600">{documents.evidenceFiles.length} file(s) uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 9: Payment */}
                {payment && Object.values(payment).some(val => val) && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-semibold flex items-center justify-between">
                        <div className="flex items-center">
                        <span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                        Payment Details
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(8)}
                          className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.1 Payment Head</label>
                          <p className="text-gray-900">{payment.paymentHead || 'Not specified'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">9.2 Amount (INR)</label>
                          <p className="text-gray-900">{payment.paymentAmount ? `₹${Number(payment.paymentAmount).toLocaleString()}` : 'Not specified'}</p>
                        </div>
                        {payment.paymentDetails && (
                          <div className="bg-gray-50 p-3 rounded md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">9.3 Payment Details</label>
                            <p className="text-gray-900">{payment.paymentDetails}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 10: Arguments */}
                {argumentsData && argumentsData.argumentsPerPrayer && argumentsData.argumentsPerPrayer.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="bg-pink-600 text-white px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-semibold flex items-center justify-between">
                        <div className="flex items-center">
                        <span className="bg-white text-pink-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">10</span>
                        Arguments
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(9)}
                          className="bg-white text-pink-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {argumentsData.argumentsPerPrayer.map((argument: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-3">Argument {index + 1}</h4>
                          <div className="space-y-3">
                            {argument.prayerTitle && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">10.1 Related Prayer</label>
                                <p className="text-gray-900">{argument.prayerTitle}</p>
                            </div>
                            )}
                            {argument.argument && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">10.2 Argument</label>
                                <p className="text-gray-900">{argument.argument}</p>
                          </div>
                            )}
                            {argument.legalBasis && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">10.3 Legal Basis</label>
                                <p className="text-gray-900">{argument.legalBasis}</p>
                      </div>
                            )}
                            {argument.factualBasis && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">10.4 Factual Basis</label>
                                <p className="text-gray-900">{argument.factualBasis}</p>
                              </div>
                            )}
                            {argument.precedents && (
                              <div className="bg-white p-3 rounded">
                                <label className="text-sm font-medium text-gray-600">10.5 Precedents</label>
                                <p className="text-gray-900">{argument.precedents}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Final Submit Actions */}
              <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mt-8">
                <div className="text-center">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveDraft()}
                      disabled={isSubmitting || isSavingDraft}
                      className="sm:w-auto"
                    >
                      {isSavingDraft ? "Saving..." : "Save as Draft"}
                    </Button>
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
        
        // CRITICAL FIX: Preserve files state before form reset
        const currentFiles = { ...files };
        
        reset({...currentValues});
        
        // CRITICAL FIX: Restore files state after form reset
        // The files state should not be lost when form is reset
        // This ensures that existing files remain visible in FileField components
        setFiles(currentFiles);
        (window as any).currentFiles = currentFiles;
        
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

  // Helper functions for duplicate checking dialog
  const handleDuplicateDialogClose = () => {
    setShowDuplicateDialog(false);
    setDuplicateCheckResult(null);
    setPendingSubmissionData(null);
  };

  const handleDuplicateDialogContinue = async () => {
    setShowDuplicateDialog(false);
    
    if (!pendingSubmissionData) {
      toast.error('No pending submission data found');
      return;
    }

    const { data, formDataForSubmission } = pendingSubmissionData;
    
    try {
      // Continue with submission, bypassing duplicate check
      toast.loading('Submitting your petition...');
      
      // Submit the form (same logic as before, but forced)
      if (currentDraftId) {
        // Handle draft submission or case update
        if (initialData && !initialData.isDraft && initialData.status !== 'draft') {
          const response = await arbitrationApi.update(currentDraftId, formDataForSubmission);
          toast.dismiss();
          const caseId = response.caseId || response.caseNumber || response.id || currentDraftId;
          showSubmissionSuccess(caseId);
          
          // Generate and download PDF
          try {
            const currentFormData = watch();
            // Add missing disputeDetails for PDF generation
            const pdfData = {
              ...currentFormData,
              disputeDetails: currentFormData.disputeDetails || {
                disputeType: '',
                disputeAmount: '',
                disputeDescription: '',
                disputeDate: ''
              }
            };
            const pdfBlob = await generateApplicationPDF(pdfData as any, caseId);
            downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            toast.error('PDF generation failed, but your application was submitted successfully.');
          }
        } else {
          const response = await arbitrationApi.submitDraft(currentDraftId);
          toast.dismiss();
          const caseId = response.caseId || response.caseNumber || response.id;
          if (caseId) {
            showSubmissionSuccess(caseId);
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

        }
      } else {
        // Creating a new case
        const response = await arbitrationApi.create(formDataForSubmission, { skipDuplicateCheck: true });
        toast.dismiss();
        const caseId = response.caseId || response.caseNumber || response.id;
        showSubmissionSuccess(caseId);
        
        // Generate and download PDF
        try {
          const currentFormData = watch();
          const pdfBlob = await generateApplicationPDF(currentFormData, caseId);
          downloadPDF(pdfBlob, `arbitration-application-${caseId}.pdf`);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          toast.error('PDF generation failed, but your application was submitted successfully.');
        }
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      // Clean up pending data
      setPendingSubmissionData(null);
      setDuplicateCheckResult(null);
    }
  };

  const handleDuplicateDialogEditExisting = () => {
    setShowDuplicateDialog(false);
    setDuplicateCheckResult(null);
    
    if (duplicateCheckResult && duplicateCheckResult.matchingCases.length > 0) {
      const existingCase = duplicateCheckResult.matchingCases[0];
      
      // Navigate to the existing case for editing
      if (existingCase && existingCase.id) {
        // Navigate to the case edit page
        router.push(`/dashboard/cases/${existingCase.id}/edit`);
      } else {
        toast.error('Could not find the existing case to edit');
      }
    } else {
      toast.error('No existing case found to edit');
    }
  };
  

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <FormStepSidebar
        currentStep={activeStep}
        completedSteps={[]}
        steps={sidebarSteps}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
                    <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {sidebarSteps[activeStep]?.title || steps[activeStep]}
                </h1>
                {currentDraftId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Draft
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                Step {activeStep + 1} of {steps.length}
                      </p>
                    </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {Math.round(((activeStep + 1) / steps.length) * 100)}% Complete
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Auto-saves every 30 seconds
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 rounded-full h-2 transition-all duration-300 ease-in-out"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
                  {/* Load Draft Notification */}
        {(hasSavedDraft() || draftList.length > 0) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Saved Drafts Available</h4>
                <p className="text-sm text-yellow-700">
                  {hasSavedDraft() && draftList.length > 0 
                    ? "You have local and server drafts available." 
                    : hasSavedDraft() 
                      ? "You have a previously saved local draft." 
                      : "You have server drafts available."}
                </p>
              </div>
              <div className="flex space-x-2">
                {hasSavedDraft() && (
                  <button
                    type="button"
                    onClick={loadLocalDraft}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Load Local Draft
                  </button>
                )}
                {draftList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDraftList(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Load Server Draft
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

          <form onSubmit={handleSubmit(handleFormSubmission)}>
      <Card>
              <CardContent className="p-6">
                {/* Step Content */}
            {renderFormContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={activeStep === 0}
                className="px-6 py-2"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
            </Button>
            
              <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={isSavingDraft}
                  className="px-6 py-2 bg-gray-50 hover:bg-gray-100"
                >
                  {isSavingDraft ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save Draft
                    </>
                  )}
              </Button>
              
              {activeStep === steps.length - 1 ? (
              <Button
                  onClick={() => {
                    if (!isSubmitting) {
                      // Get the current form values directly
                      const currentFormValues = watch();
                        // Call internal submission handler
                        handleFormSubmission(currentFormValues as any);
                    }
                  }}
                  disabled={isSubmitting}
                    className="px-8 py-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit Application
                      </>
                    )}
                </Button>
              ) : (
                  <Button onClick={handleNext} className="px-6 py-2">
                  Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
              </Button>
              )}
            </div>
          </div>
          </form>
        </div>
      </div>

      {/* Email OTP Verification Modal */}
      <Dialog open={showEmailOTP} onOpenChange={(open) => {
        // Only allow closing via Cancel button
        if (!open) {
          setShowEmailOTP(false);
          setEmailOTP("");
        }
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          // Completely prevent closing on outside click
          e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle>Verify Email Address</DialogTitle>
            <DialogDescription>
              Please enter the OTP sent to your email address to verify it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter OTP</label>
              <Input
              type="text"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
                className="mt-1"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: You can copy the OTP from your email and paste it here. Click Cancel to close this modal.
              </p>
            </div>
          </div>
          <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailOTP(false);
                  setEmailOTP("");
                }}
              >
                Cancel
              </Button>
            <Button onClick={verifyEmailOTP} disabled={emailOTP.length !== 6}>
                Verify
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone OTP Verification Modal */}
      <Dialog open={showPhoneOTP} onOpenChange={(open) => {
        // Only allow closing via Cancel button
        if (!open) {
          setShowPhoneOTP(false);
          setPhoneOTP("");
        }
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          // Completely prevent closing on outside click
          e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              Please enter the OTP sent to your phone number to verify it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter OTP</label>
              <Input
              type="text"
              value={phoneOTP}
              onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
                className="mt-1"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: You can copy the OTP from your SMS and paste it here. Click Cancel to close this modal.
              </p>
            </div>
          </div>
          <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhoneOTP(false);
                  setPhoneOTP("");
                }}
              >
                Cancel
              </Button>
            <Button onClick={verifyPhoneOTP} disabled={phoneOTP.length !== 6}>
                Verify
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Claimant Email OTP Verification Modals */}
      {showAdditionalEmailOTP.map((show, index) => (
        show && (
          <Dialog key={`email-otp-${index}`} open={true} onOpenChange={(open) => {
            // Only allow closing via Cancel button
            if (!open) {
              closeAdditionalEmailModal(index);
            }
          }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              // Completely prevent closing on outside click
              e.preventDefault();
            }}>
              <DialogHeader>
                <DialogTitle>Verify Email Address</DialogTitle>
                <DialogDescription>
                  Please enter the OTP sent to Additional Claimant {index + 1}'s email address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                type="text"
                value={additionalEmailOTP[index] || ""}
                onChange={(e) => handleAdditionalEmailOTPChange(index, e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                    className="mt-1"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can copy the OTP from the email and paste it here. Click Cancel to close this modal.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => closeAdditionalEmailModal(index)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyAdditionalClaimantEmailOTP(index)}
                  disabled={(additionalEmailOTP[index] || "").length !== 6}
                >
                  Verify
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      ))}

      {/* Additional Claimant Phone OTP Verification Modals */}
      {showAdditionalPhoneOTP.map((show, index) => (
        show && (
          <Dialog key={`phone-otp-${index}`} open={true} onOpenChange={(open) => {
            // Only allow closing via Cancel button
            if (!open) {
              closeAdditionalPhoneModal(index);
            }
          }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              // Completely prevent closing on outside click
              e.preventDefault();
            }}>
              <DialogHeader>
                <DialogTitle>Verify Phone Number</DialogTitle>
                <DialogDescription>
                  Please enter the OTP sent to Additional Claimant {index + 1}'s phone number.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                type="text"
                value={additionalPhoneOTP[index] || ""}
                onChange={(e) => handleAdditionalPhoneOTPChange(index, e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                    className="mt-1"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can copy the OTP from SMS and paste it here. Click Cancel to close this modal.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => closeAdditionalPhoneModal(index)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyAdditionalClaimantPhoneOTP(index)}
                  disabled={(additionalPhoneOTP[index] || "").length !== 6}
                >
                  Verify
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      ))}

      {/* Respondent Email OTP Verification Modals */}
      {showRespondentEmailModal.map((show, index) => (
        show && (
          <Dialog key={`respondent-email-otp-${index}`} open={true} onOpenChange={(open) => {
            // Only allow closing via Cancel button
            if (!open) {
              closeRespondentEmailModal(index);
            }
          }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              // Completely prevent closing on outside click
              e.preventDefault();
            }}>
              <DialogHeader>
                <DialogTitle>Verify Email Address</DialogTitle>
                <DialogDescription>
                  Please enter the OTP sent to Respondent {index + 1}'s email address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    value={respondentEmailOTPInputs[index] || ""}
                    onChange={(e) => handleRespondentEmailOTPChange(index, e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="mt-1"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can copy the OTP from the email and paste it here. Click Cancel to close this modal.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => closeRespondentEmailModal(index)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyRespondentEmailOTP(index)}
                  disabled={(respondentEmailOTPInputs[index] || "").length !== 6}
                >
                  Verify
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      ))}

      {/* Respondent Phone OTP Verification Modals */}
      {showRespondentPhoneModal.map((show, index) => (
        show && (
          <Dialog key={`respondent-phone-otp-${index}`} open={true} onOpenChange={(open) => {
            // Only allow closing via Cancel button
            if (!open) {
              closeRespondentPhoneModal(index);
            }
          }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              // Completely prevent closing on outside click
              e.preventDefault();
            }}>
              <DialogHeader>
                <DialogTitle>Verify Phone Number</DialogTitle>
                <DialogDescription>
                  Please enter the OTP sent to Respondent {index + 1}'s phone number.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    value={respondentPhoneOTPInputs[index] || ""}
                    onChange={(e) => handleRespondentPhoneOTPChange(index, e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="mt-1"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can copy the OTP from SMS and paste it here. Click Cancel to close this modal.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => closeRespondentPhoneModal(index)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => verifyRespondentPhoneOTP(index)}
                  disabled={(respondentPhoneOTPInputs[index] || "").length !== 6}
                >
                  Verify
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      ))}

      {/* Duplicate Check Dialog */}
      {/* Submission Success Modal */}
      {showSubmissionModal && submissionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Application Submitted Successfully!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your application is submitted successfully. Your application number is{' '}
                <span className="font-semibold text-gray-900">{submissionResult.applicationNumber}</span>.
                A PDF copy of your application has been sent to your registered email ID, as well as to all managers and respondents.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleViewDashboard}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View Dashboard
                </button>
                <button
                  onClick={handleGoToMyCases}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Go to My Cases
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDuplicateDialog && duplicateCheckResult && (
        <DuplicateCheckDialog
          isOpen={showDuplicateDialog}
          onClose={handleDuplicateDialogClose}
            onContinue={handleDuplicateDialogContinue}
            onEditExisting={handleDuplicateDialogEditExisting}
          duplicateResult={duplicateCheckResult}
        />
      )}

      {/* Draft List Modal */}
      {showDraftList && (
        <Dialog open={showDraftList} onOpenChange={setShowDraftList}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Draft to Load</DialogTitle>
              <DialogDescription>
                Choose a draft from the server to continue your work.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {draftList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No drafts available</p>
              ) : (
                draftList.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      loadDraft(draft.id);
                      setShowDraftList(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{draft.name || draft.caseNumber}</h4>
                        <p className="text-sm text-gray-600">
                          {draft.caseNumber} • {draft.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last edited: {new Date(draft.lastEditedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        v{draft.version}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDraftList(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Export with dynamic to disable SSR
export default dynamic(() => Promise.resolve(ArbitrationForm), { 
  ssr: false 
});