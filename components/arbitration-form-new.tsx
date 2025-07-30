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
import { ENTITY_TYPES, COUNTRY_CODES, DISPUTE_CATEGORIES, DISPUTE_SUB_CATEGORIES, PAYMENT_HEADS } from "@/lib/constants/form-options";

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
    icon: null
  },
  {
    id: 1,
    title: "Step 2: Additional Claimants",
    description: "Co-claimants and authorized managers",
    icon: null
  },
  {
    id: 2,
    title: "Step 3: Respondent Details",
    description: "Opposing party information",
    icon: null
  },
  {
    id: 3,
    title: "Step 4: Arbitration Agreement",
    description: "Agreement terms and arbitrator selection",
    icon: null
  },
  {
    id: 4,
    title: "Step 5: Nature of Dispute",
    description: "Category and background details",
    icon: null
  },
  {
    id: 5,
    title: "Step 6: Dispute Description",
    description: "Detailed claims and supporting facts",
    icon: null
  },
  {
    id: 6,
    title: "Step 7: Prayers & Reliefs",
    description: "Specific remedies sought",
    icon: null
  },
  {
    id: 7,
    title: "Step 8: Documents",
    description: "Evidence and supporting files",
    icon: null
  },
  {
    id: 8,
    title: "Step 9: Payment",
    description: "Fee structure and payment details",
    icon: null
  },
  {
    id: 9,
    title: "Step 10: Arguments",
    description: "Legal arguments for each prayer",
    icon: null
  },
  {
    id: 10,
    title: "Step 11: Review & Submit",
    description: "Final review before submission",
    icon: null
  }
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
  type: "", name: "", email: "", phone: "", phoneCountryCode: "+91",
  pincode: "", address1: "", address2: "", city: "", district: "", 
  state: "", country: "", pan: "", gst: "", cin: "",
  coi: null, panCard: null, gstCert: null
};

const initialManagerDetails = {
  type: "", name: "", email: "", phone: "", phoneCountryCode: "+91",
  managerId: "", designation: "", authority: "", pincode: "", address1: "", address2: "",
  city: "", district: "", state: "", country: "", pan: "", gst: "", cin: "",
  coi: null, panCard: null, gstCert: null
};

const initialRespondent = {
  type: "", name: "", email: "", phone: "", phoneCountryCode: "+91",
  pincode: "", address1: "", address2: "", city: "", district: "", 
  state: "", country: "", pan: "", gst: "", cin: "",
  coi: null, panCard: null, gstCert: null
};

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
  prayers: [],
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
  argumentsPerPrayer: [] as any[],
};

// components/FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: "text" | "email" | "tel" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  maxLength?: number;
  max?: string;
  error?: string;
  placeholder?: string;
  options?: Array<{value: string, label: string}>;
}

const FileUploadField: React.FC<{
  label: string;
  fieldName: string;
  files: { [key: string]: File | null };
  onFileChange: (fieldName: string, file: File | null) => void;
  description?: string;
}> = ({ label, fieldName, files, onFileChange, description }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type="file"
      onChange={(e) => onFileChange(fieldName, e.target.files?.[0] || null)}
      accept=".pdf,.jpg,.jpeg,.png"
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
    {files[fieldName] && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
        <span className="text-sm text-green-700">✓ {files[fieldName]?.name}</span>
        <button 
          type="button" 
          onClick={() => onFileChange(fieldName, null)}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          Remove
        </button>
      </div>
    )}
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

const FormField: React.FC<FormFieldProps> = ({
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    // Handle pincode - only allow numeric input and limit to 6 digits
    if (name.includes('pincode') && type === 'text') {
      newValue = newValue.replace(/\D/g, '').slice(0, 6);
    } 
    // Handle phone number - only allow numeric input
    else if (name.includes('phone') && !name.includes('phoneCountryCode') && type === 'text') {
      newValue = newValue.replace(/\D/g, '').slice(0, MAX_PHONE_LENGTH);
    }
    
    // Create a new event with the modified value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    
    onChange(newEvent);
  };
  
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
      ) : type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          rows={4}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 resize-vertical ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />
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
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />
      )}
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

// Phone field component with country code
interface PhoneFieldProps {
  label: string;
  name: string;
  value: string;
  countryCodeName: string;
  countryCodeValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label,
  name,
  value,
  countryCodeName,
  countryCodeValue,
  onChange,
  required = false,
  error,
  placeholder = "Enter phone number"
}) => {
  const id = `field-${name}`;
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          name={countryCodeName}
          value={countryCodeValue}
          onChange={onChange}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm transition duration-200"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.code}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          maxLength={MAX_PHONE_LENGTH}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 placeholder-gray-400 ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
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
    pan: z.string()
      .min(MIN_PAN_LENGTH, "PAN must be 10 characters")
      .max(MAX_PAN_LENGTH, "PAN must be 10 characters")
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be 5 letters + 4 digits + 1 letter (e.g., AAAPL1234C)")
      .optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    coi: z.any().optional(),
    panCard: z.any().optional(),
    gstCert: z.any().optional(),
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
    pan: z.string()
      .min(MIN_PAN_LENGTH, "PAN must be 10 characters")
      .max(MAX_PAN_LENGTH, "PAN must be 10 characters")
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be 5 letters + 4 digits + 1 letter (e.g., AAAPL1234C)")
      .optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    coi: z.any().optional(),
    panCard: z.any().optional(),
    gstCert: z.any().optional(),
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
    managerId: z.string().min(1, "Manager ID Number is required").max(50, "Manager ID must be less than 50 characters"),
    designation: z.string().min(1, "Designation is required").max(100),
    authority: z.string().min(1, "Authority is required").max(200),
    gst: z.string().min(MIN_GST_LENGTH, "GST must be 15 characters").max(MAX_GST_LENGTH, "GST must be 15 characters").optional(),
    pan: z.string()
      .min(MIN_PAN_LENGTH, "PAN must be 10 characters")
      .max(MAX_PAN_LENGTH, "PAN must be 10 characters")
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be 5 letters + 4 digits + 1 letter (e.g., AAAPL1234C)")
      .optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    coi: z.any().optional(),
    panCard: z.any().optional(),
    gstCert: z.any().optional(),
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
    pan: z.string()
      .min(MIN_PAN_LENGTH, "PAN must be 10 characters")
      .max(MAX_PAN_LENGTH, "PAN must be 10 characters")
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be 5 letters + 4 digits + 1 letter (e.g., AAAPL1234C)")
      .optional(),
    cin: z.string().min(MIN_CIN_LENGTH, "CIN must be 21 characters").max(MAX_CIN_LENGTH, "CIN must be 21 characters").optional(),
    coi: z.any().optional(),
    panCard: z.any().optional(),
    gstCert: z.any().optional(),
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

  // Documents/Evidence (can be multiple)
  documentsEvidence: z.array(z.object({
    documentType: z.string().min(1, "Document Type is required"),
    documentId: z.string().optional(),
    relevantClauseNumber: z.string().min(1, "Relevant Clause Number/Page Number is required"),
    supportingClaimNumber: z.string().min(1, "Supporting Claim Number is required"),
    dateOfIssueSign: z.string().min(1, "Date of Issue/Sign of the document is required"),
    attachedDocuments: z.array(z.any()).min(1, "At least one document must be attached"),
  })).optional().default([]),
  
  // Prayers & Reliefs
  prayers: z.object({
    prayers: z.string().min(1, "Prayers & reliefs is required").max(3000),
  }),
  
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

interface ArbitrationFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
  petitionId?: string;
}

function ArbitrationFormNew({ onSubmit, initialData, mode = 'create', petitionId }: ArbitrationFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<{[key: string]: File | null}>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [additionalClaimantEmailVerified, setAdditionalClaimantEmailVerified] = useState<boolean[]>([]);
  const [additionalClaimantPhoneVerified, setAdditionalClaimantPhoneVerified] = useState<boolean[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ caseId?: string; applicationNumber?: string } | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Location options state
  const [claimantLocationOptions, setClaimantLocationOptions] = useState<{
    cities: Array<{value: string, label: string}>,
    states: Array<{value: string, label: string}>,
    districts: Array<{value: string, label: string}>,
    countries: Array<{value: string, label: string}>
  }>({
    cities: [], states: [], districts: [], countries: []
  });

  const [respondentLocationOptions, setRespondentLocationOptions] = useState<{
    [index: number]: {
      cities: Array<{value: string, label: string}>,
      states: Array<{value: string, label: string}>,
      districts: Array<{value: string, label: string}>,
      countries: Array<{value: string, label: string}>
    }
  }>({});

  const [additionalClaimantLocationOptions, setAdditionalClaimantLocationOptions] = useState<{
    [index: number]: {
      cities: Array<{value: string, label: string}>,
      states: Array<{value: string, label: string}>,
      districts: Array<{value: string, label: string}>,
      countries: Array<{value: string, label: string}>
    }
  }>({});

  const [managerLocationOptions, setManagerLocationOptions] = useState<{
    [index: number]: {
      cities: Array<{value: string, label: string}>,
      states: Array<{value: string, label: string}>,
      districts: Array<{value: string, label: string}>,
      countries: Array<{value: string, label: string}>
    }
  }>({});

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
      natureOfDispute: [initialNatureOfDispute],
      disputeDescriptions: [initialDisputeDescription],
      documentsEvidence: [initialDocumentEvidence],
      prayers: initialPrayers,
      payment: initialPayment,
      arguments: initialArguments,
      documents: {
        supportingDocuments: [],
        evidenceFiles: [],
        documentTypes: {},
        scannedDocuments: [],
        affidavits: [],
        electronicEvidence: [],
        lawsReliedUpon: [],
        issueDocumentMap: {}
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
    fields: disputeDescriptionFields, 
    append: appendDisputeDescription,
    remove: removeDisputeDescription
  } = useFieldArray({
    control,
    name: "disputeDescriptions",
  });

  const { 
    fields: argumentFields, 
    append: appendArgument,
    remove: removeArgumentField
  } = useFieldArray({
    control,
    name: "arguments.argumentsPerIssue" as any,
  });

  const { 
    fields: natureOfDisputeFields, 
    append: appendNatureOfDispute,
    remove: removeNatureOfDispute
  } = useFieldArray({
    control,
    name: "natureOfDispute",
  });

  const { 
    fields: documentsEvidenceFields, 
    append: appendDocumentsEvidence,
    remove: removeDocumentsEvidence
  } = useFieldArray({
    control,
    name: "documentsEvidence",
  });

  // Pincode lookup function
  const lookupLocationByPincode = async (pincode: string) => {
    if (pincode.length !== 6) return null;
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        return {
          city: postOffice.District,
          district: postOffice.District,
          state: postOffice.State,
          country: 'India'
        };
      }
    } catch (error) {
      console.error('Error looking up pincode:', error);
    }
    return null;
  };

  // Handle pincode change and auto-populate location
  const handlePincodeChange = async (
    pincode: string, 
    type: 'claimant' | 'respondent' | 'additionalClaimant' | 'manager',
    index?: number
  ) => {
    if (pincode.length === 6) {
      const locationData = await lookupLocationByPincode(pincode);
      if (locationData) {
        if (type === 'claimant') {
          setValue('claimant.city', locationData.city);
          setValue('claimant.district', locationData.district);
          setValue('claimant.state', locationData.state);
          setValue('claimant.country', locationData.country);
          
          setClaimantLocationOptions({
            cities: [{ value: locationData.city, label: locationData.city }],
            districts: [{ value: locationData.district, label: locationData.district }],
            states: [{ value: locationData.state, label: locationData.state }],
            countries: [{ value: locationData.country, label: locationData.country }]
          });
        } else if (type === 'respondent' && index !== undefined) {
          setValue(`respondents.${index}.city`, locationData.city);
          setValue(`respondents.${index}.district`, locationData.district);
          setValue(`respondents.${index}.state`, locationData.state);
          setValue(`respondents.${index}.country`, locationData.country);
          
          setRespondentLocationOptions(prev => ({
            ...prev,
            [index]: {
              cities: [{ value: locationData.city, label: locationData.city }],
              districts: [{ value: locationData.district, label: locationData.district }],
              states: [{ value: locationData.state, label: locationData.state }],
              countries: [{ value: locationData.country, label: locationData.country }]
            }
          }));
        } else if (type === 'additionalClaimant' && index !== undefined) {
          setValue(`additionalClaimants.${index}.city`, locationData.city);
          setValue(`additionalClaimants.${index}.district`, locationData.district);
          setValue(`additionalClaimants.${index}.state`, locationData.state);
          setValue(`additionalClaimants.${index}.country`, locationData.country);
          
          setAdditionalClaimantLocationOptions(prev => ({
            ...prev,
            [index]: {
              cities: [{ value: locationData.city, label: locationData.city }],
              districts: [{ value: locationData.district, label: locationData.district }],
              states: [{ value: locationData.state, label: locationData.state }],
              countries: [{ value: locationData.country, label: locationData.country }]
            }
          }));
        } else if (type === 'manager' && index !== undefined) {
          setValue(`managerDetails.${index}.city`, locationData.city);
          setValue(`managerDetails.${index}.district`, locationData.district);
          setValue(`managerDetails.${index}.state`, locationData.state);
          setValue(`managerDetails.${index}.country`, locationData.country);
          
          setManagerLocationOptions(prev => ({
            ...prev,
            [index]: {
              cities: [{ value: locationData.city, label: locationData.city }],
              districts: [{ value: locationData.district, label: locationData.district }],
              states: [{ value: locationData.state, label: locationData.state }],
              countries: [{ value: locationData.country, label: locationData.country }]
            }
          }));
        }
        
        toast.success(`Location auto-populated from pincode ${pincode}`);
      } else {
        toast.error('Could not find location for this pincode');
      }
    }
  };

  // Save draft function
  const saveDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      const formData = watch();
      
      // Save to localStorage as backup (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('arbitration_draft', JSON.stringify(formData));
        localStorage.setItem('arbitration_draft_timestamp', new Date().toISOString());
        localStorage.setItem('arbitration_draft_step', activeStep.toString());
      }
      
      // Create FormData for API submission
      const apiFormData = new FormData();
      
      // Add the main form data as JSON
      const draftData = {
        data: formData,
        verificationStates: {
          emailVerified,
          phoneVerified,
          additionalClaimantEmailVerified,
          additionalClaimantPhoneVerified
        },
        currentStep: activeStep
      };
      
      apiFormData.append('data', JSON.stringify(draftData));
      
      // Add files to FormData
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          apiFormData.append(key, file);
        }
      });

      let response;
      if (currentDraftId) {
        // Update existing draft - use the same endpoint as save
        try {
          response = await arbitrationApi.saveDraft(apiFormData);
          toast.success('Draft updated successfully');
        } catch (error) {
          // Fallback - create new draft if update fails
          response = await arbitrationApi.saveDraft(apiFormData);
          setCurrentDraftId(response.id || response.caseId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('arbitration_draft_id', response.id || response.caseId);
          }
          toast.success('Draft saved successfully');
        }
      } else {
        // Create new draft
        response = await arbitrationApi.saveDraft(apiFormData);
        setCurrentDraftId(response.id || response.caseId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('arbitration_draft_id', response.id || response.caseId);
        }
        toast.success('Draft saved successfully');
      }
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(`Error saving draft: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load local draft function
  const loadLocalDraft = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedDraft = localStorage.getItem('arbitration_draft');
      const draftTimestamp = localStorage.getItem('arbitration_draft_timestamp');
      const savedStep = localStorage.getItem('arbitration_draft_step');
      const draftId = localStorage.getItem('arbitration_draft_id');
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        reset(draftData);
        
        if (savedStep) {
          setActiveStep(parseInt(savedStep));
        }
        
        if (draftId) {
          setCurrentDraftId(draftId);
        }
        
        if (draftTimestamp) {
          const date = new Date(draftTimestamp);
          toast.success(`Draft loaded from ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`);
        } else {
          toast.success('Draft loaded successfully!');
        }
      } else {
        toast.error('No saved draft found');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    }
  };

  // Check if draft exists (client-side only)
  const hasSavedDraft = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('arbitration_draft') !== null;
  };

  // Handle save draft alias
  const handleSaveDraft = saveDraft;

  // Load draft function
  const loadDraft = async (draftId: string) => {
    try {
      const draft = await arbitrationApi.getDraft(draftId);
      
      if (draft && draft.data) {
        // Reset form with draft data
        reset(draft.data);
        
        // Restore files
        if (draft.files) {
          setFiles(draft.files);
        }
        
        // Restore verification states
        if (draft.verificationStates) {
          setEmailVerified(draft.verificationStates.emailVerified || false);
          setPhoneVerified(draft.verificationStates.phoneVerified || false);
          setAdditionalClaimantEmailVerified(draft.verificationStates.additionalClaimantEmailVerified || []);
          setAdditionalClaimantPhoneVerified(draft.verificationStates.additionalClaimantPhoneVerified || []);
        }
        
        // Restore current step
        if (draft.currentStep !== undefined) {
          setActiveStep(draft.currentStep);
        }
        
        setCurrentDraftId(draftId);
        toast.success('Draft loaded successfully');
      }
    } catch (error: any) {
      toast.error(`Error loading draft: ${error.message}`);
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const formData = watch();
      if (isDirty && (formData.claimant?.name || formData.claimant?.email)) {
        saveDraft();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isDirty, watch]);

  // Load draft on component mount if draftId is provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId');
    
    if (draftId) {
      loadDraft(draftId);
    }
  }, []);

  // Step validation functions
  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const currentValues = watch();
    
    switch (stepIndex) {
      case 0: // Claimant Details
        const claimantData = currentValues.claimant;
        
        // Check PAN format if provided
        if (claimantData?.pan && claimantData.pan.trim() !== '') {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
          if (!panRegex.test(claimantData.pan)) {
            toast.error('PAN format is invalid. Please use format: AAAPL1234C (5 letters + 4 digits + 1 letter)');
            return false;
          }
        }
        
        // Check GST format if provided
        if (claimantData?.gst && claimantData.gst.trim() !== '') {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
          if (!gstRegex.test(claimantData.gst)) {
            toast.error('GST format is invalid. Please use format: 22AAAAA0000A1Z5 (15 characters)');
            return false;
          }
        }
        
        // Check CIN format if provided
        if (claimantData?.cin && claimantData.cin.trim() !== '') {
          const cinRegex = /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
          if (!cinRegex.test(claimantData.cin)) {
            toast.error('CIN format is invalid. Please use format: U74140MH2014PTC123456 (21 characters)');
            return false;
          }
        }
        
        const claimantValid = await trigger([
          'claimant.type',
          'claimant.name', 
          'claimant.email',
          'claimant.phone',
          'claimant.pincode',
          'claimant.address1',
          'claimant.city',
          'claimant.district',
          'claimant.state',
          'claimant.country'
        ]);
        if (!claimantValid) {
          toast.error('Please fill all required claimant details before proceeding');
          return false;
        }
        if (!emailVerified) {
          toast.error('Please verify your email before proceeding');
          return false;
        }
        if (!phoneVerified) {
          toast.error('Please verify your phone number before proceeding');
          return false;
        }
        return true;
        
      case 1: // Additional Claimants & Manager
        // AT LEAST 1 additional claimant AND 1 manager is required
        let hasValidAdditionalClaimant = false;
        let hasValidManager = false;
        let missingFields: string[] = [];
        
        // Check additional claimants - AT LEAST 1 is required
        if (currentValues.additionalClaimants && currentValues.additionalClaimants.length > 0) {
          for (let i = 0; i < currentValues.additionalClaimants.length; i++) {
            const claimant = currentValues.additionalClaimants[i];
            
            // Check if this claimant has essential data
            if (claimant.name && claimant.email && claimant.phone && claimant.type) {
              // Check email verification
              if (!additionalClaimantEmailVerified[i]) {
                missingFields.push(`Additional Claimant ${i + 1}: Email verification`);
              }
              
              // Check phone verification  
              if (!additionalClaimantPhoneVerified[i]) {
                missingFields.push(`Additional Claimant ${i + 1}: Phone verification`);
              }
              
              // Check PAN format if provided
              if (claimant.pan && claimant.pan.trim() !== '') {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
                if (!panRegex.test(claimant.pan)) {
                  missingFields.push(`Additional Claimant ${i + 1}: Valid PAN format (AAAPL1234C)`);
                }
              }
              
              // Check GST format if provided
              if (claimant.gst && claimant.gst.trim() !== '') {
                const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
                if (!gstRegex.test(claimant.gst)) {
                  missingFields.push(`Additional Claimant ${i + 1}: Valid GST format (22AAAAA0000A1Z5)`);
                }
              }
              
              // Check CIN format if provided
              if (claimant.cin && claimant.cin.trim() !== '') {
                const cinRegex = /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
                if (!cinRegex.test(claimant.cin)) {
                  missingFields.push(`Additional Claimant ${i + 1}: Valid CIN format (U74140MH2014PTC123456)`);
                }
              }
              
              // Validate all required fields
              const requiredFields = [
                'type', 'name', 'email', 'phone', 'pincode', 'address1', 'city', 'district', 'state', 'country'
              ];
              
              for (const field of requiredFields) {
                if (!claimant[field] || claimant[field].trim() === '') {
                  missingFields.push(`Additional Claimant ${i + 1}: ${field.charAt(0).toUpperCase() + field.slice(1)}`);
                }
              }
              
              // If all validations pass, we have a valid claimant
              if (additionalClaimantEmailVerified[i] && additionalClaimantPhoneVerified[i] && 
                  requiredFields.every(field => claimant[field] && claimant[field].trim() !== '')) {
                hasValidAdditionalClaimant = true;
              }
            } else if (claimant.name || claimant.email || claimant.phone || claimant.type || claimant.pincode || claimant.address1) {
              // Partially filled - require completion
              missingFields.push(`Additional Claimant ${i + 1}: Complete all required fields or clear to skip`);
            }
          }
        }
        
        // Check managers - AT LEAST 1 is required
        if (currentValues.managerDetails && currentValues.managerDetails.length > 0) {
          for (let i = 0; i < currentValues.managerDetails.length; i++) {
            const manager = currentValues.managerDetails[i];
            
            // Check if this manager has essential data
            if (manager.name && manager.email && manager.phone && manager.type && manager.managerId && manager.designation && manager.authority) {
              // Check PAN format if provided
              if (manager.pan && manager.pan.trim() !== '') {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
                if (!panRegex.test(manager.pan)) {
                  missingFields.push(`Manager ${i + 1}: Valid PAN format (AAAPL1234C)`);
                }
              }
              
              // Check GST format if provided
              if (manager.gst && manager.gst.trim() !== '') {
                const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
                if (!gstRegex.test(manager.gst)) {
                  missingFields.push(`Manager ${i + 1}: Valid GST format (22AAAAA0000A1Z5)`);
                }
              }
              
              // Check CIN format if provided
              if (manager.cin && manager.cin.trim() !== '') {
                const cinRegex = /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
                if (!cinRegex.test(manager.cin)) {
                  missingFields.push(`Manager ${i + 1}: Valid CIN format (U74140MH2014PTC123456)`);
                }
              }
              
              // Validate all required fields
              const requiredFields = [
                'type', 'name', 'email', 'phone', 'managerId', 'designation', 'authority', 'pincode', 'address1', 'city', 'district', 'state', 'country'
              ];
              
              for (const field of requiredFields) {
                if (!manager[field] || manager[field].trim() === '') {
                  missingFields.push(`Manager ${i + 1}: ${field.charAt(0).toUpperCase() + field.slice(1)}`);
                }
              }
              
              // If all validations pass, we have a valid manager
              if (requiredFields.every(field => manager[field] && manager[field].trim() !== '')) {
                hasValidManager = true;
              }
            } else if (manager.name || manager.email || manager.phone || manager.type || manager.managerId || manager.designation || manager.authority || manager.address1) {
              // Partially filled - require completion
              missingFields.push(`Manager ${i + 1}: Complete all required fields or clear to skip`);
            }
          }
        }
        
        // Check requirements
        if (!hasValidAdditionalClaimant) {
          missingFields.push('At least 1 complete Additional Claimant with verified email and phone');
        }
        
        if (!hasValidManager) {
          missingFields.push('At least 1 complete Manager');
        }
        
        // Check required document uploads for additional claimants and managers
        if (hasValidAdditionalClaimant) {
          for (let i = 0; i < currentValues.additionalClaimants.length; i++) {
            const claimant = currentValues.additionalClaimants[i];
            if (claimant.name && claimant.email && claimant.phone) {
              if (claimant.pan && !files[`additionalClaimants.${i}.panCard`]) {
                missingFields.push(`Additional Claimant ${i + 1}: PAN Card document`);
              }
              if (claimant.gst && !files[`additionalClaimants.${i}.gstCert`]) {
                missingFields.push(`Additional Claimant ${i + 1}: GST Certificate document`);
              }
              if (claimant.cin && !files[`additionalClaimants.${i}.coi`]) {
                missingFields.push(`Additional Claimant ${i + 1}: Certificate of Incorporation document`);
              }
            }
          }
        }
        
        if (hasValidManager) {
          for (let i = 0; i < currentValues.managerDetails.length; i++) {
            const manager = currentValues.managerDetails[i];
            if (manager.name && manager.email && manager.phone) {
              if (manager.pan && !files[`managerDetails.${i}.panCard`]) {
                missingFields.push(`Manager ${i + 1}: PAN Card document`);
              }
              if (manager.gst && !files[`managerDetails.${i}.gstCert`]) {
                missingFields.push(`Manager ${i + 1}: GST Certificate document`);
              }
              if (manager.cin && !files[`managerDetails.${i}.coi`]) {
                missingFields.push(`Manager ${i + 1}: Certificate of Incorporation document`);
              }
            }
          }
        }
        
        if (missingFields.length > 0) {
          toast.error(`Missing required fields: ${missingFields.join(', ')}`);
          return false;
        }
        
        return true;
        
      case 2: // Respondent Details
        if (!currentValues.respondents || currentValues.respondents.length === 0) {
          toast.error('At least one respondent is required');
          return false;
        }
        
        let hasValidRespondent = false;
        for (let i = 0; i < currentValues.respondents.length; i++) {
          const respondent = currentValues.respondents[i];
          // Check if ANY field has been filled
          if (respondent.name || respondent.email || respondent.phone || respondent.type || respondent.pincode || respondent.address1 || respondent.city || respondent.state || respondent.district || respondent.country) {
            // Check PAN format if provided
            if (respondent.pan && respondent.pan.trim() !== '') {
              const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
              if (!panRegex.test(respondent.pan)) {
                toast.error(`Respondent ${i + 1}: PAN format is invalid. Please use format: AAAPL1234C`);
                return false;
              }
            }
            
            // Check GST format if provided
            if (respondent.gst && respondent.gst.trim() !== '') {
              const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
              if (!gstRegex.test(respondent.gst)) {
                toast.error(`Respondent ${i + 1}: GST format is invalid. Please use format: 22AAAAA0000A1Z5`);
                return false;
              }
            }
            
            // Check CIN format if provided
            if (respondent.cin && respondent.cin.trim() !== '') {
              const cinRegex = /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
              if (!cinRegex.test(respondent.cin)) {
                toast.error(`Respondent ${i + 1}: CIN format is invalid. Please use format: U74140MH2014PTC123456`);
                return false;
              }
            }
            
            // If any field is filled, ALL required fields must be filled
            const valid = await trigger([
              `respondents.${i}.type`,
              `respondents.${i}.name`,
              `respondents.${i}.email`,
              `respondents.${i}.phone`,
              `respondents.${i}.pincode`,
              `respondents.${i}.address1`,
              `respondents.${i}.city`,
              `respondents.${i}.district`,
              `respondents.${i}.state`,
              `respondents.${i}.country`
            ]);
            if (!valid) {
              toast.error(`Please complete all required fields for Respondent ${i + 1}`);
              return false;
            }
            hasValidRespondent = true;
          }
        }
        
        if (!hasValidRespondent) {
          toast.error('At least one complete respondent is required');
          return false;
        }
        return true;
        
      case 3: // Arbitration Agreement
        const arbitrationValid = await trigger([
          'arbitrationAgreement.agreementDate',
          'arbitrationAgreement.placeOfSigning',
          'arbitrationAgreement.arbitrationText',
          'arbitrationAgreement.stampDutyPercentage',
          'arbitrationAgreement.numberOfArbitrators'
        ]);
        if (!arbitrationValid) {
          toast.error('Please fill all required arbitration agreement details');
          return false;
        }
        return true;
        
      case 4: // Nature of Dispute
        console.log('🔧 Validating Nature of Dispute:', currentValues.natureOfDispute);
        if (!currentValues.natureOfDispute || currentValues.natureOfDispute.length === 0) {
          toast.error('At least one nature of dispute is required');
          return false;
        }
        for (let i = 0; i < currentValues.natureOfDispute.length; i++) {
          const dispute = currentValues.natureOfDispute[i];
          console.log(`🔧 Checking dispute ${i + 1}:`, dispute);
          
          // Check individual fields
          if (!dispute.category || dispute.category.trim() === '') {
            toast.error(`Nature of Dispute ${i + 1}: Category is required`);
            return false;
          }
          if (!dispute.subCategory || dispute.subCategory.trim() === '') {
            toast.error(`Nature of Dispute ${i + 1}: Sub Category is required`);
            return false;
          }
          if (!dispute.natureOfDispute || dispute.natureOfDispute.trim() === '') {
            toast.error(`Nature of Dispute ${i + 1}: Nature of Dispute description is required`);
            return false;
          }
          if (!dispute.dateWhenRightToClaimArose || dispute.dateWhenRightToClaimArose.trim() === '') {
            toast.error(`Nature of Dispute ${i + 1}: Date when right to claim arose is required`);
            return false;
          }
          if (!dispute.standardisedPrayerClauses || dispute.standardisedPrayerClauses.trim() === '') {
            toast.error(`Nature of Dispute ${i + 1}: Standardised Prayer Clauses is required`);
            return false;
          }
          
          const valid = await trigger([
            `natureOfDispute.${i}.category`,
            `natureOfDispute.${i}.subCategory`,
            `natureOfDispute.${i}.natureOfDispute`,
            `natureOfDispute.${i}.dateWhenRightToClaimArose`,
            `natureOfDispute.${i}.standardisedPrayerClauses`
          ]);
          console.log(`🔧 Trigger validation result for dispute ${i + 1}:`, valid);
          if (!valid) {
            toast.error(`Please complete all fields for Nature of Dispute ${i + 1}`);
            return false;
          }
        }
        console.log('🔧 Nature of Dispute validation passed');
        return true;
        
      case 5: // Dispute Description
        if (!currentValues.disputeDescriptions || currentValues.disputeDescriptions.length === 0) {
          toast.error('At least one dispute description is required');
          return false;
        }
        for (let i = 0; i < currentValues.disputeDescriptions.length; i++) {
          const valid = await trigger([
            `disputeDescriptions.${i}.claimType`,
            `disputeDescriptions.${i}.claimReason`,
            `disputeDescriptions.${i}.lawReliedUpon`,
            `disputeDescriptions.${i}.relevantClauseNumber`,
            `disputeDescriptions.${i}.clauseSupportingClaim`,
            `disputeDescriptions.${i}.clause`,
            `disputeDescriptions.${i}.documentSupportingClaim`,
            `disputeDescriptions.${i}.reliefSought`
          ]);
          if (!valid) {
            toast.error(`Please complete Dispute Description ${i + 1}`);
            return false;
          }
        }
        return true;
        
      case 6: // Prayers & Reliefs
        if (!currentValues.prayers || !currentValues.prayers.prayers || currentValues.prayers.prayers.length === 0) {
          toast.error('At least one prayer is required');
          return false;
        }
        return true;
        
      case 7: // Documents
        // Check if there are any uploaded document files
        const documentFileKeys = Object.keys(files).filter(key => 
          key.includes('documents.') || key.includes('evidence.') || key.includes('scanned') || key.includes('affidavit')
        );
        
        if (documentFileKeys.length === 0) {
          toast.error('At least one document must be uploaded in the Documents section');
          return false;
        }
        
        console.log('🔧 Documents validation passed. Uploaded files:', documentFileKeys);
        return true;
        
      case 8: // Payment
        const paymentValid = await trigger([
          'payment.paymentHead',
          'payment.paymentAmount',
          'payment.paymentDetails'
        ]);
        if (!paymentValid) {
          toast.error('Please fill all required payment details');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (activeStep < steps.length - 1) {
      console.log('🔧 nextStep: Validating step', activeStep);
      const isValid = await validateStep(activeStep);
      console.log('🔧 nextStep: Validation result', isValid);
      
      if (isValid) {
        setActiveStep(activeStep + 1);
        console.log('🔧 nextStep: Moving to step', activeStep + 1);
      } else {
        console.log('🔧 nextStep: Validation failed, staying on current step');
      }
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // File upload handler with persistence
  const handleFileChange = (fieldName: string, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
    
    // Store file metadata only in localStorage (avoid quota issues)
    if (typeof window !== 'undefined') {
      if (file) {
        // Only store metadata, not the actual file data
        const fileMetadata = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        };
        try {
          localStorage.setItem(`form_file_${fieldName}`, JSON.stringify(fileMetadata));
        } catch (error) {
          console.warn('LocalStorage quota exceeded, skipping file metadata storage');
        }
      } else {
        localStorage.removeItem(`form_file_${fieldName}`);
      }
    }
  };

  // Note: File persistence removed to avoid localStorage quota issues
  // Files will need to be re-uploaded in each session
  useEffect(() => {
    // Clear any old file data from localStorage to free up space
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('form_file_') && localStorage.getItem(key)?.includes('data:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }, []);

  // Email verification
  const sendEmailVerification = async (email: string, type: 'claimant' | 'additional' | 'manager' | 'respondent', index?: number) => {
    try {
      // TODO: Implement actual email verification API call
      toast.success("Verification email sent!");
      
      // For demo purposes, auto-verify after 2 seconds
      setTimeout(() => {
        if (type === 'claimant') {
          setEmailVerified(true);
        } else if (type === 'additional' && index !== undefined) {
          setAdditionalClaimantEmailVerified(prev => {
            const newVerified = [...prev];
            newVerified[index] = true;
            return newVerified;
          });
        }
        toast.success("Email verified!");
      }, 2000);
    } catch (error) {
      toast.error("Failed to send verification email");
    }
  };

  // Phone verification
  const sendPhoneVerification = async (phone: string, type: 'claimant' | 'additional' | 'manager' | 'respondent', index?: number) => {
    try {
      // TODO: Implement actual phone verification API call
      toast.success("Verification SMS sent!");
      
      // For demo purposes, auto-verify after 2 seconds
      setTimeout(() => {
        if (type === 'claimant') {
          setPhoneVerified(true);
        } else if (type === 'additional' && index !== undefined) {
          setAdditionalClaimantPhoneVerified(prev => {
            const newVerified = [...prev];
            newVerified[index] = true;
            return newVerified;
          });
        }
        toast.success("Phone verified!");
      }, 2000);
    } catch (error) {
      toast.error("Failed to send verification SMS");
    }
  };

  // Form submission
  const handleFormSubmission = async (data: FormData) => {
    console.log('🔧 Form submission started');
    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add form data
      formData.append('data', JSON.stringify(data));
      
      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      console.log('🔧 Submitting data:', data);
      console.log('🔧 Submitting files:', Object.keys(files).filter(k => files[k]));
      
      // Submit to actual API
      const response = await arbitrationApi.create(formData);
      
      // Generate application number from response or create one
      const applicationNumber = response.caseId || response.applicationNumber || `ARB${Date.now()}`;
      
      // Show success modal
      setSubmissionResult({ applicationNumber });
      setShowSubmissionModal(true);
      
      // Generate and download PDF
      try {
        const pdfBlob = await generateApplicationPDF(data, applicationNumber);
        downloadPDF(pdfBlob, `arbitration-application-${applicationNumber}.pdf`);
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        toast.error('PDF generation failed, but your application was submitted successfully.');
      }
      
      toast.success("Application submitted successfully!");
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal actions
  const handleViewDashboard = () => {
    setShowSubmissionModal(false);
    router.push('/dashboard');
  };

  const handleGoToMyCases = () => {
    setShowSubmissionModal(false);
    router.push('/dashboard/my-cases');
  };

  // Step content renderer
  // Step renderers with actual form fields
  const renderClaimantDetails = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium mb-4">Step 1: Claimant Details</h3>
        
        {/* Basic Information */}
        <div className="space-y-4">
          <Controller
            control={control}
            name="claimant.type"
            render={({ field }) => (
              <FormField
                label="1.1 Type"
                name="claimant.type"
                value={field.value || ""}
                onChange={field.onChange}
                type="select"
                required
                options={ENTITY_TYPES}
                error={formErrors.claimant?.type?.message}
              />
            )}
          />
          
          <Controller
            control={control}
            name="claimant.name"
            render={({ field }) => (
              <FormField
                label="1.2 Name"
                name="claimant.name"
                value={field.value || ""}
                onChange={field.onChange}
                required
                maxLength={MAX_NAME_LENGTH}
                error={formErrors.claimant?.name?.message}
              />
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="claimant.email"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1.3 Email Address {emailVerified ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={field.value || ""}
                      onChange={field.onChange}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                        emailVerified ? 'border-green-500' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant={emailVerified ? "default" : "outline"}
                      size="sm"
                      onClick={() => sendEmailVerification(field.value, 'claimant')}
                      disabled={emailVerified || !field.value}
                      className={emailVerified ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {emailVerified ? "✓ Verified" : "Verify"}
                    </Button>
                  </div>
                  {formErrors.claimant?.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.claimant.email.message}</p>
                  )}
                </div>
              )}
            />
            
            <Controller
              control={control}
              name="claimant.phone"
              render={({ field: phoneField }) => (
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
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                        >
                          {COUNTRY_CODES.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={phoneField.value || ""}
                          onChange={phoneField.onChange}
                          maxLength={MAX_PHONE_LENGTH}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm ${
                            phoneVerified ? 'border-green-500' : ''
                          }`}
                        />
                        <Button
                          type="button"
                          variant={phoneVerified ? "default" : "outline"}
                          size="sm"
                          onClick={() => sendPhoneVerification(phoneField.value, 'claimant')}
                          disabled={phoneVerified || !phoneField.value}
                          className={phoneVerified ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {phoneVerified ? "✓ Verified" : "Verify"}
                        </Button>
                      </div>
                      {formErrors.claimant?.phone && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.claimant.phone.message}</p>
                      )}
                    </div>
                  )}
                />
              )}
            />
          </div>
          
          <Controller
            control={control}
            name="claimant.pincode"
            render={({ field }) => (
              <FormField
                label="1.5 Pincode"
                name="claimant.pincode"
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value.length === 6) {
                    handlePincodeChange(e.target.value, 'claimant');
                  }
                }}
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                error={formErrors.claimant?.pincode?.message}
              />
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="claimant.address1"
              render={({ field }) => (
                <FormField
                  label="1.6 Address Line 1"
                  name="claimant.address1"
                  value={field.value || ""}
                  onChange={field.onChange}
                  maxLength={MAX_ADDRESS_LENGTH}
                  error={formErrors.claimant?.address1?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name="claimant.address2"
              render={({ field }) => (
                <FormField
                  label="1.7 Address Line 2"
                  name="claimant.address2"
                  value={field.value || ""}
                  onChange={field.onChange}
                  maxLength={MAX_ADDRESS_LENGTH}
                  error={formErrors.claimant?.address2?.message}
                />
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="claimant.city"
              render={({ field }) => (
                <FormField
                  label="1.8 City"
                  name="claimant.city"
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="select"
                  options={claimantLocationOptions.cities.length > 0 ? claimantLocationOptions.cities : [{ value: "", label: "Select City" }]}
                  error={formErrors.claimant?.city?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name="claimant.state"
              render={({ field }) => (
                <FormField
                  label="1.10 State"
                  name="claimant.state"
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="select"
                  options={claimantLocationOptions.states.length > 0 ? claimantLocationOptions.states : [{ value: "", label: "Select State" }]}
                  error={formErrors.claimant?.state?.message}
                />
              )}
            />
          </div>
          
          <Controller
            control={control}
            name="claimant.district"
            render={({ field }) => (
              <FormField
                label="1.9 District"
                name="claimant.district"
                value={field.value || ""}
                onChange={field.onChange}
                type="select"
                options={claimantLocationOptions.districts.length > 0 ? claimantLocationOptions.districts : [{ value: "", label: "Select District" }]}
                error={formErrors.claimant?.district?.message}
              />
            )}
          />
          
          <Controller
            control={control}
            name="claimant.country"
            render={({ field }) => (
              <FormField
                label="1.11 Country"
                name="claimant.country"
                value={field.value || ""}
                onChange={field.onChange}
                type="select"
                options={claimantLocationOptions.countries.length > 0 ? claimantLocationOptions.countries : [{ value: "", label: "Select Country" }]}
                error={formErrors.claimant?.country?.message}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1.12 Certificate of Incorporation (COI)
              </label>
                                  <input
                      type="file"
                      onChange={(e) => handleFileChange('claimant.coi', e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {files['claimant.coi'] && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                        <span className="text-sm text-green-700">✓ {files['claimant.coi'].name}</span>
                        <button 
                          type="button" 
                          onClick={() => handleFileChange('claimant.coi', null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1.13 PAN Card
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange('claimant.panCard', e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1.14 GST Registration Certificate
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange('claimant.gstCert', e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
            </div>
          </div>
        </div>

        {/* Business Information Section */}
        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium text-md mb-4">Business Information</h4>
          <div className="space-y-4">
            <Controller
              control={control}
              name="claimant.gst"
              render={({ field }) => (
                <FormField
                  label="1.15 GST Number"
                  name="claimant.gst"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={MAX_GST_LENGTH}
                  error={formErrors.claimant?.gst?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
            
            <Controller
              control={control}
              name="claimant.pan"
              render={({ field }) => (
                <FormField
                  label="1.16 PAN Number"
                  name="claimant.pan"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="AAAPL1234C"
                  maxLength={MAX_PAN_LENGTH}
                  error={formErrors.claimant?.pan?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
            
            <Controller
              control={control}
              name="claimant.cin"
              render={({ field }) => (
                <FormField
                  label="1.17 CIN"
                  name="claimant.cin"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="U74140MH2014PTC123456"
                  maxLength={MAX_CIN_LENGTH}
                  error={formErrors.claimant?.cin?.message}
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAdditionalClaimantsAndManager = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 2: Additional Claimants</h3>
      
      {/* Additional Claimants Section */}
      <div className="space-y-6">
        {additionalClaimantFields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Additional Claimant {index + 1}</h4>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeAdditionalClaimantField(index)}
              >
                Remove
              </Button>
            </div>
            
            <div className="space-y-4">
              <Controller
                control={control}
                name={`additionalClaimants.${index}.type`}
                render={({ field }) => (
                  <FormField
                    label="2.1 Type"
                    name={`additionalClaimants.${index}.type`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={ENTITY_TYPES}
                    error={formErrors.additionalClaimants?.[index]?.type?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name={`additionalClaimants.${index}.name`}
                render={({ field }) => (
                  <FormField
                    label="2.2 Name"
                    name={`additionalClaimants.${index}.name`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    maxLength={MAX_NAME_LENGTH}
                    error={formErrors.additionalClaimants?.[index]?.name?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.email`}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        2.3 Email Address {additionalClaimantEmailVerified[index] ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={field.value || ""}
                          onChange={field.onChange}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition duration-200 ${
                            additionalClaimantEmailVerified[index] ? 'border-green-500' : ''
                          }`}
                        />
                        <Button
                          type="button"
                          variant={additionalClaimantEmailVerified[index] ? "default" : "outline"}
                          size="sm"
                          onClick={() => sendEmailVerification(field.value, 'additional', index)}
                          disabled={additionalClaimantEmailVerified[index] || !field.value}
                          className={additionalClaimantEmailVerified[index] ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {additionalClaimantEmailVerified[index] ? "✓ Verified" : "Verify"}
                        </Button>
                      </div>
                      {formErrors.additionalClaimants?.[index]?.email && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.additionalClaimants[index].email.message}</p>
                      )}
                    </div>
                  )}
                />
                
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.phone`}
                  render={({ field: phoneField }) => (
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.phoneCountryCode`}
                      render={({ field: countryCodeField }) => (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            2.4 Phone Number {additionalClaimantPhoneVerified[index] ? "✓" : ""} <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCodeField.value || "+91"}
                              onChange={countryCodeField.onChange}
                              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            >
                              {COUNTRY_CODES.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={phoneField.value || ""}
                              onChange={phoneField.onChange}
                              maxLength={MAX_PHONE_LENGTH}
                              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm ${
                                additionalClaimantPhoneVerified[index] ? 'border-green-500' : ''
                              }`}
                            />
                            <Button
                              type="button"
                              variant={additionalClaimantPhoneVerified[index] ? "default" : "outline"}
                              size="sm"
                              onClick={() => sendPhoneVerification(phoneField.value, 'additional', index)}
                              disabled={additionalClaimantPhoneVerified[index] || !phoneField.value}
                              className={additionalClaimantPhoneVerified[index] ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {additionalClaimantPhoneVerified[index] ? "✓ Verified" : "Verify"}
                            </Button>
                          </div>
                          {formErrors.additionalClaimants?.[index]?.phone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.additionalClaimants[index].phone.message}</p>
                          )}
                        </div>
                      )}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`additionalClaimants.${index}.pincode`}
                render={({ field }) => (
                  <FormField
                    label="2.5 Pincode"
                    name={`additionalClaimants.${index}.pincode`}
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value.length === 6) {
                        handlePincodeChange(e.target.value, 'additionalClaimant', index);
                      }
                    }}
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    error={formErrors.additionalClaimants?.[index]?.pincode?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.address1`}
                  render={({ field }) => (
                    <FormField
                      label="2.6 Address Line 1"
                      name={`additionalClaimants.${index}.address1`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.additionalClaimants?.[index]?.address1?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.address2`}
                  render={({ field }) => (
                    <FormField
                      label="2.7 Address Line 2"
                      name={`additionalClaimants.${index}.address2`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.additionalClaimants?.[index]?.address2?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.city`}
                  render={({ field }) => (
                    <FormField
                      label="2.8 City"
                      name={`additionalClaimants.${index}.city`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={additionalClaimantLocationOptions[index]?.cities || [{ value: "", label: "Select City" }]}
                      error={formErrors.additionalClaimants?.[index]?.city?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.district`}
                  render={({ field }) => (
                    <FormField
                      label="2.9 District"
                      name={`additionalClaimants.${index}.district`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={additionalClaimantLocationOptions[index]?.districts || [{ value: "", label: "Select District" }]}
                      error={formErrors.additionalClaimants?.[index]?.district?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`additionalClaimants.${index}.state`}
                  render={({ field }) => (
                    <FormField
                      label="2.10 State"
                      name={`additionalClaimants.${index}.state`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={additionalClaimantLocationOptions[index]?.states || [{ value: "", label: "Select State" }]}
                      error={formErrors.additionalClaimants?.[index]?.state?.message}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`additionalClaimants.${index}.country`}
                render={({ field }) => (
                  <FormField
                    label="2.11 Country"
                    name={`additionalClaimants.${index}.country`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={additionalClaimantLocationOptions[index]?.countries || [{ value: "", label: "Select Country" }]}
                    error={formErrors.additionalClaimants?.[index]?.country?.message}
                  />
                )}
              />
              
              {/* Document Upload Section for Additional Claimant */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Document Upload</h5>
                <p className="text-xs text-gray-600 mb-3">
                  Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2.12 Certificate of Incorporation (COI)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`additionalClaimants.${index}.coi`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2.13 PAN Card
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`additionalClaimants.${index}.panCard`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2.14 GST Registration Certificate
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`additionalClaimants.${index}.gstCert`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Business Information</h5>
                <div className="space-y-4">
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.gst`}
                    render={({ field }) => (
                      <FormField
                        label="2.15 GST Number"
                        name={`additionalClaimants.${index}.gst`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={MAX_GST_LENGTH}
                        error={formErrors.additionalClaimants?.[index]?.gst?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                  
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.pan`}
                    render={({ field }) => (
                      <FormField
                        label="2.16 PAN Number"
                        name={`additionalClaimants.${index}.pan`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="AAAPL1234C"
                        maxLength={MAX_PAN_LENGTH}
                        error={formErrors.additionalClaimants?.[index]?.pan?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                  
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.cin`}
                    render={({ field }) => (
                      <FormField
                        label="2.17 CIN"
                        name={`additionalClaimants.${index}.cin`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="U74140MH2014PTC123456"
                        maxLength={MAX_CIN_LENGTH}
                        error={formErrors.additionalClaimants?.[index]?.cin?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAdditionalClaimant(initialAdditionalClaimant)}
          >
            Add Additional Claimant
          </Button>
        </div>
      </div>
      
      {/* Manager Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Manager Details (Optional)</h3>
        <div className="space-y-6">
          {managerFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Manager {index + 1}</h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeManagerField(index)}
                >
                  Remove
                </Button>
              </div>
              
              <Controller
                control={control}
                name={`managerDetails.${index}.type`}
                render={({ field }) => (
                  <FormField
                    label="Manager Type"
                    name={`managerDetails.${index}.type`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={ENTITY_TYPES}
                    error={formErrors.managerDetails?.[index]?.type?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`managerDetails.${index}.name`}
                  render={({ field }) => (
                    <FormField
                      label="Manager Name"
                      name={`managerDetails.${index}.name`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={MAX_NAME_LENGTH}
                      error={formErrors.managerDetails?.[index]?.name?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`managerDetails.${index}.managerId`}
                  render={({ field }) => (
                    <FormField
                      label="Manager ID Number"
                      name={`managerDetails.${index}.managerId`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={50}
                      error={formErrors.managerDetails?.[index]?.managerId?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`managerDetails.${index}.designation`}
                  render={({ field }) => (
                    <FormField
                      label="Designation"
                      name={`managerDetails.${index}.designation`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={100}
                      error={formErrors.managerDetails?.[index]?.designation?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`managerDetails.${index}.authority`}
                  render={({ field }) => (
                    <FormField
                      label="Authority"
                      name={`managerDetails.${index}.authority`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={200}
                      error={formErrors.managerDetails?.[index]?.authority?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`managerDetails.${index}.email`}
                  render={({ field }) => (
                    <FormField
                      label="Email Address"
                      name={`managerDetails.${index}.email`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="email"
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                      error={formErrors.managerDetails?.[index]?.email?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`managerDetails.${index}.phone`}
                  render={({ field: phoneField }) => (
                    <Controller
                      control={control}
                      name={`managerDetails.${index}.phoneCountryCode`}
                      render={({ field: countryCodeField }) => (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCodeField.value || "+91"}
                              onChange={countryCodeField.onChange}
                              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            >
                              {COUNTRY_CODES.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={phoneField.value || ""}
                              onChange={phoneField.onChange}
                              maxLength={MAX_PHONE_LENGTH}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                            />
                          </div>
                          {formErrors.managerDetails?.[index]?.phone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.managerDetails[index].phone.message}</p>
                          )}
                        </div>
                      )}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`managerDetails.${index}.pincode`}
                render={({ field }) => (
                  <FormField
                    label="Pincode"
                    name={`managerDetails.${index}.pincode`}
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value.length === 6) {
                        handlePincodeChange(e.target.value, 'manager', index);
                      }
                    }}
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    error={formErrors.managerDetails?.[index]?.pincode?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`managerDetails.${index}.address1`}
                  render={({ field }) => (
                    <FormField
                      label="Address Line 1"
                      name={`managerDetails.${index}.address1`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.managerDetails?.[index]?.address1?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`managerDetails.${index}.address2`}
                  render={({ field }) => (
                    <FormField
                      label="Address Line 2"
                      name={`managerDetails.${index}.address2`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.managerDetails?.[index]?.address2?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`managerDetails.${index}.city`}
                  render={({ field }) => (
                    <FormField
                      label="City"
                      name={`managerDetails.${index}.city`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={managerLocationOptions[index]?.cities || [{ value: "", label: "Select City" }]}
                      error={formErrors.managerDetails?.[index]?.city?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`managerDetails.${index}.state`}
                  render={({ field }) => (
                    <FormField
                      label="State"
                      name={`managerDetails.${index}.state`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={managerLocationOptions[index]?.states || [{ value: "", label: "Select State" }]}
                      error={formErrors.managerDetails?.[index]?.state?.message}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`managerDetails.${index}.district`}
                render={({ field }) => (
                  <FormField
                    label="District"
                    name={`managerDetails.${index}.district`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={managerLocationOptions[index]?.districts || [{ value: "", label: "Select District" }]}
                    error={formErrors.managerDetails?.[index]?.district?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name={`managerDetails.${index}.country`}
                render={({ field }) => (
                  <FormField
                    label="Country"
                    name={`managerDetails.${index}.country`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={managerLocationOptions[index]?.countries || [{ value: "", label: "Select Country" }]}
                    error={formErrors.managerDetails?.[index]?.country?.message}
                  />
                )}
              />
              
              {/* Document Upload Section for Manager */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Document Upload</h5>
                <p className="text-xs text-gray-600 mb-3">
                  Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate of Incorporation (COI)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`managerDetails.${index}.coi`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Card
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`managerDetails.${index}.panCard`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Registration Certificate
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`managerDetails.${index}.gstCert`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
                  </div>
                </div>
              </div>
              
              {/* Business Information Section */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Business Information</h5>
                <div className="space-y-4">
                  <Controller
                    control={control}
                    name={`managerDetails.${index}.gst`}
                    render={({ field }) => (
                      <FormField
                        label="GST Number"
                        name={`managerDetails.${index}.gst`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={MAX_GST_LENGTH}
                        error={formErrors.managerDetails?.[index]?.gst?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                  
                  <Controller
                    control={control}
                    name={`managerDetails.${index}.pan`}
                    render={({ field }) => (
                      <FormField
                        label="PAN Number"
                        name={`managerDetails.${index}.pan`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="AAAPL1234C"
                        maxLength={MAX_PAN_LENGTH}
                        error={formErrors.managerDetails?.[index]?.pan?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                  
                  <Controller
                    control={control}
                    name={`managerDetails.${index}.cin`}
                    render={({ field }) => (
                      <FormField
                        label="CIN"
                        name={`managerDetails.${index}.cin`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="U74140MH2014PTC123456"
                        maxLength={MAX_CIN_LENGTH}
                        error={formErrors.managerDetails?.[index]?.cin?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => appendManager(initialManagerDetails)}
            >
              Add Manager
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRespondentDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 3: Respondent Details</h3>
      
      <div className="space-y-6">
        {respondentFields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Respondent {index + 1}</h4>
              {respondentFields.length > 1 && (
                <Button
                  type="button"
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
                render={({ field }) => (
                  <FormField
                    label="3.1 Type"
                    name={`respondents.${index}.type`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={ENTITY_TYPES}
                    error={formErrors.respondents?.[index]?.type?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name={`respondents.${index}.name`}
                render={({ field }) => (
                  <FormField
                    label="3.2 Name"
                    name={`respondents.${index}.name`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    maxLength={MAX_NAME_LENGTH}
                    error={formErrors.respondents?.[index]?.name?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`respondents.${index}.email`}
                  render={({ field }) => (
                    <FormField
                      label="3.3 Email Address"
                      name={`respondents.${index}.email`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="email"
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                      error={formErrors.respondents?.[index]?.email?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`respondents.${index}.phone`}
                  render={({ field: phoneField }) => (
                    <Controller
                      control={control}
                      name={`respondents.${index}.phoneCountryCode`}
                      render={({ field: countryCodeField }) => (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            3.4 Phone Number <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCodeField.value || "+91"}
                              onChange={countryCodeField.onChange}
                              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                            >
                              {COUNTRY_CODES.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={phoneField.value || ""}
                              onChange={phoneField.onChange}
                              maxLength={MAX_PHONE_LENGTH}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                            />
                          </div>
                          {formErrors.respondents?.[index]?.phone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.respondents[index].phone.message}</p>
                          )}
                        </div>
                      )}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`respondents.${index}.pincode`}
                render={({ field }) => (
                  <FormField
                    label="3.5 Pincode"
                    name={`respondents.${index}.pincode`}
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value.length === 6) {
                        handlePincodeChange(e.target.value, 'respondent', index);
                      }
                    }}
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    error={formErrors.respondents?.[index]?.pincode?.message}
                  />
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`respondents.${index}.address1`}
                  render={({ field }) => (
                    <FormField
                      label="3.6 Address Line 1"
                      name={`respondents.${index}.address1`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      required
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.respondents?.[index]?.address1?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`respondents.${index}.address2`}
                  render={({ field }) => (
                    <FormField
                      label="3.7 Address Line 2"
                      name={`respondents.${index}.address2`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      error={formErrors.respondents?.[index]?.address2?.message}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name={`respondents.${index}.city`}
                  render={({ field }) => (
                    <FormField
                      label="3.8 City"
                      name={`respondents.${index}.city`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={respondentLocationOptions[index]?.cities || [{ value: "", label: "Select City" }]}
                      error={formErrors.respondents?.[index]?.city?.message}
                    />
                  )}
                />
                
                <Controller
                  control={control}
                  name={`respondents.${index}.state`}
                  render={({ field }) => (
                    <FormField
                      label="3.10 State"
                      name={`respondents.${index}.state`}
                      value={field.value || ""}
                      onChange={field.onChange}
                      type="select"
                      options={respondentLocationOptions[index]?.states || [{ value: "", label: "Select State" }]}
                      error={formErrors.respondents?.[index]?.state?.message}
                    />
                  )}
                />
              </div>
              
              <Controller
                control={control}
                name={`respondents.${index}.district`}
                render={({ field }) => (
                  <FormField
                    label="3.9 District"
                    name={`respondents.${index}.district`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={respondentLocationOptions[index]?.districts || [{ value: "", label: "Select District" }]}
                    error={formErrors.respondents?.[index]?.district?.message}
                  />
                )}
              />
              
              <Controller
                control={control}
                name={`respondents.${index}.country`}
                render={({ field }) => (
                  <FormField
                    label="3.11 Country"
                    name={`respondents.${index}.country`}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    options={respondentLocationOptions[index]?.countries || [{ value: "", label: "Select Country" }]}
                    error={formErrors.respondents?.[index]?.country?.message}
                  />
                )}
              />
              
              {/* Document Upload Section for Respondent */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Document Upload</h5>
                <p className="text-xs text-gray-600 mb-3">
                  Upload documents for identification and verification. Documents will be auto-populated using OCR technology.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3.12 Certificate of Incorporation (COI)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`respondents.${index}.coi`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates CIN field via OCR</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3.13 PAN Card
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`respondents.${index}.panCard`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates PAN field via OCR</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3.14 GST Registration Certificate
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(`respondents.${index}.gstCert`, e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-populates GST field via OCR</p>
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="mt-4 border-t pt-4">
                <h5 className="font-medium text-sm mb-3">Business Information</h5>
                <div className="space-y-4">
                  <Controller
                    control={control}
                    name={`respondents.${index}.gst`}
                    render={({ field }) => (
                      <FormField
                        label="3.15 GST Number"
                        name={`respondents.${index}.gst`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={MAX_GST_LENGTH}
                        error={formErrors.respondents?.[index]?.gst?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                  
                  <Controller
                    control={control}
                    name={`respondents.${index}.pan`}
                    render={({ field }) => (
                      <FormField
                        label="3.16 PAN Number"
                        name={`respondents.${index}.pan`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="AAAPL1234C"
                        maxLength={MAX_PAN_LENGTH}
                        error={formErrors.respondents?.[index]?.pan?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: AAAPL1234C (5 letters + 4 digits + 1 letter)</p>
                  
                  <Controller
                    control={control}
                    name={`respondents.${index}.cin`}
                    render={({ field }) => (
                      <FormField
                        label="3.17 CIN"
                        name={`respondents.${index}.cin`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="U74140MH2014PTC123456"
                        maxLength={MAX_CIN_LENGTH}
                        error={formErrors.respondents?.[index]?.cin?.message}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: U74140MH2014PTC123456 (21 characters)</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => appendRespondent(initialRespondent)}
          >
            Add Respondent
          </Button>
        </div>
      </div>
    </div>
  );

  const renderArbitrationAgreement = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 4: Arbitration Agreement</h3>
      
      <div className="space-y-4">
        <Controller
          control={control}
          name="arbitrationAgreement.agreementDate"
          render={({ field }) => (
            <FormField
              label="4.1 Agreement Date"
              name="arbitrationAgreement.agreementDate"
              value={field.value || ""}
              onChange={field.onChange}
              type="date"
              required
              error={formErrors.arbitrationAgreement?.agreementDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="arbitrationAgreement.placeOfSigning"
          render={({ field }) => (
            <FormField
              label="4.2 Place of Signing"
              name="arbitrationAgreement.placeOfSigning"
              value={field.value || ""}
              onChange={field.onChange}
              required
              error={formErrors.arbitrationAgreement?.placeOfSigning?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="arbitrationAgreement.arbitrationText"
          render={({ field }) => (
            <FormField
              label="4.3 Text of Arbitration Agreement/clause"
              name="arbitrationAgreement.arbitrationText"
              value={field.value || ""}
              onChange={field.onChange}
              type="textarea"
              required
              error={formErrors.arbitrationAgreement?.arbitrationText?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="arbitrationAgreement.stampDutyPercentage"
          render={({ field }) => (
            <FormField
              label="4.4 Percentage of the Agreement value / Amount of stamp duty paid on the Arbitration Agreement / Agreement containing the arbitration clause"
              name="arbitrationAgreement.stampDutyPercentage"
              value={field.value || ""}
              onChange={field.onChange}
              required
              placeholder="Enter percentage or amount"
              error={formErrors.arbitrationAgreement?.stampDutyPercentage?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="arbitrationAgreement.numberOfArbitrators"
          render={({ field }) => (
            <FormField
              label="4.5 Number of Arbitrators as per Agreement"
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
              error={formErrors.arbitrationAgreement?.numberOfArbitrators?.message}
            />
          )}
        />
      </div>
    </div>
  );

  const renderNatureOfDispute = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 5: Nature of Dispute</h3>
      <p className="text-sm text-gray-600 mb-4">You can add multiple nature of dispute entries. Each entry represents a separate dispute category.</p>
      
      {natureOfDisputeFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Nature of Dispute {index + 1}</h4>
            {natureOfDisputeFields.length > 1 && (
              <Button
                type="button"
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
              render={({ field }) => (
                <FormField
                  label="5.1 Category"
                  name={`natureOfDispute.${index}.category`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="select"
                  required
                  options={DISPUTE_CATEGORIES}
                  error={formErrors.natureOfDispute?.[index]?.category?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`natureOfDispute.${index}.subCategory`}
              render={({ field }) => (
                <FormField
                  label="5.2 Sub Category"
                  name={`natureOfDispute.${index}.subCategory`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  required
                  placeholder="Enter sub category"
                  error={formErrors.natureOfDispute?.[index]?.subCategory?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`natureOfDispute.${index}.natureOfDispute`}
              render={({ field }) => (
                <FormField
                  label="5.3 Nature of Dispute"
                  name={`natureOfDispute.${index}.natureOfDispute`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  placeholder="Describe the nature of the dispute"
                  error={formErrors.natureOfDispute?.[index]?.natureOfDispute?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`natureOfDispute.${index}.dateWhenRightToClaimArose`}
              render={({ field }) => (
                <FormField
                  label="5.4 Date when right to claim arose"
                  name={`natureOfDispute.${index}.dateWhenRightToClaimArose`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  error={formErrors.natureOfDispute?.[index]?.dateWhenRightToClaimArose?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`natureOfDispute.${index}.standardisedPrayerClauses`}
              render={({ field }) => (
                <FormField
                  label="5.5 Standardised Prayer Clauses"
                  name={`natureOfDispute.${index}.standardisedPrayerClauses`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  placeholder="Enter standardised prayer clauses"
                  error={formErrors.natureOfDispute?.[index]?.standardisedPrayerClauses?.message}
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
          onClick={() => appendNatureOfDispute({ category: "", subCategory: "", natureOfDispute: "", dateWhenRightToClaimArose: "", standardisedPrayerClauses: "" })}
        >
          Add Another Nature of Dispute
        </Button>
      </div>
    </div>
  );

  const renderDisputeDescription = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 6: Dispute Description</h3>
      <p className="text-sm text-gray-600 mb-4">You can add multiple dispute descriptions. Each entry represents a separate claim or issue.</p>
      
      {disputeDescriptionFields.map((field, index) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Dispute Description {index + 1}</h4>
            {disputeDescriptionFields.length > 1 && (
              <Button
                type="button"
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
              render={({ field }) => (
                <FormField
                  label="6.1 Claim Type"
                  name={`disputeDescriptions.${index}.claimType`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="select"
                  required
                  options={[
                    { value: "monetary", label: "Monetary" },
                    { value: "specific_performance", label: "Specific Performance" },
                    { value: "declaratory", label: "Declaratory Relief" },
                    { value: "injunctive", label: "Injunctive Relief" },
                    { value: "combination", label: "Combination of Above" },
                    { value: "other", label: "Other" },
                  ]}
                  error={formErrors.disputeDescriptions?.[index]?.claimType?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.claimReason`}
              render={({ field }) => (
                <FormField
                  label="6.2 Claim Reason"
                  name={`disputeDescriptions.${index}.claimReason`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  rows={2}
                  placeholder="Provide the primary reason for this claim"
                  error={formErrors.disputeDescriptions?.[index]?.claimReason?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.lawReliedUpon`}
              render={({ field }) => (
                <FormField
                  label="6.3 Law relied upon by Claimant to be listed (Acts/Rules/Regulations/Others)"
                  name={`disputeDescriptions.${index}.lawReliedUpon`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  rows={3}
                  placeholder="List specific Acts, Rules, Regulations, or other legal provisions relied upon"
                  error={formErrors.disputeDescriptions?.[index]?.lawReliedUpon?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.relevantClauseNumber`}
              render={({ field }) => (
                <FormField
                  label="6.4 Relevant Clause Number/Page Number"
                  name={`disputeDescriptions.${index}.relevantClauseNumber`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  required
                  placeholder="e.g., Clause 5.2 or Page 7"
                  error={formErrors.disputeDescriptions?.[index]?.relevantClauseNumber?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.clauseSupportingClaim`}
              render={({ field }) => (
                <FormField
                  label="6.5 Clause Supporting Claim"
                  name={`disputeDescriptions.${index}.clauseSupportingClaim`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  rows={2}
                  placeholder="Describe how this clause supports your claim"
                  error={formErrors.disputeDescriptions?.[index]?.clauseSupportingClaim?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.clause`}
              render={({ field }) => (
                <FormField
                  label="6.6 Clause"
                  name={`disputeDescriptions.${index}.clause`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="textarea"
                  required
                  rows={3}
                  placeholder="Enter the exact text of the relevant clause"
                  error={formErrors.disputeDescriptions?.[index]?.clause?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.documentSupportingClaim`}
              render={({ field }) => (
                <FormField
                  label="6.7 Document Supporting Claim"
                  name={`disputeDescriptions.${index}.documentSupportingClaim`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  required
                  placeholder="Name/reference of supporting document"
                  error={formErrors.disputeDescriptions?.[index]?.documentSupportingClaim?.message}
                />
              )}
            />
            
            <Controller
              control={control}
              name={`disputeDescriptions.${index}.reliefSought`}
              render={({ field }) => (
                <FormField
                  label="6.8 Relief Sought"
                  name={`disputeDescriptions.${index}.reliefSought`}
                  value={field.value || ""}
                  onChange={field.onChange}
                  type="select"
                  required
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
                  error={formErrors.disputeDescriptions?.[index]?.reliefSought?.message}
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
          onClick={() => appendDisputeDescription(initialDisputeDescription)}
        >
          Add Another Dispute Description
        </Button>
      </div>
    </div>
  );

  const renderPrayersAndReliefs = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 7: Prayers & Reliefs</h3>
      <PrayersSection 
        control={control}
        name="prayers.prayers"
      />
    </div>
  );

  const renderDocuments = () => {
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
      <div className="space-y-6">
        <h3 className="text-lg font-medium mb-4">Step 8: Documents</h3>
        <DocumentsTabs 
          control={control as any}
          watch={watch}
          setValue={setValue}
          disputeIssues={disputeIssues}
          files={files}
          onFileChange={handleFileChange}
        />
      </div>
    );
  };

  const renderPayment = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 9: Payment</h3>
      
      <div className="space-y-4">
        <Controller
          control={control}
          name="payment.paymentHead"
          render={({ field }) => (
            <FormField
              label="Payment Head"
              name="payment.paymentHead"
              value={field.value || ""}
              onChange={field.onChange}
              type="select"
              required
              options={PAYMENT_HEADS}
              error={formErrors.payment?.paymentHead?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="payment.paymentAmount"
          render={({ field }) => (
            <FormField
              label="Payment Amount (INR)"
              name="payment.paymentAmount"
              value={field.value || ""}
              onChange={field.onChange}
              type="number"
              required
              placeholder="Enter amount in INR"
              error={formErrors.payment?.paymentAmount?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="payment.paymentDetails"
          render={({ field }) => (
            <FormField
              label="Payment Details"
              name="payment.paymentDetails"
              value={field.value || ""}
              onChange={field.onChange}
              type="textarea"
              required
              placeholder="Provide detailed payment information"
              error={formErrors.payment?.paymentDetails?.message}
            />
          )}
        />
      </div>
    </div>
  );

  const renderArguments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Step 10: Arguments</h3>
      <ArgumentsSection 
        control={control}
        prayersName="prayers.prayers"
        argumentsName="arguments.argumentsPerPrayer"
      />
    </div>
  );

  const renderReviewAndSubmit = () => {
    const formValues = watch();
    const { claimant, additionalClaimants, managerDetails, respondents, arbitrationAgreement, natureOfDispute, disputeDescriptions, prayers, payment, arguments: argumentsData } = formValues;

    return (
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
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Claimant Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900 capitalize">{claimant?.type || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{claimant?.name || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{claimant?.email || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{claimant?.phoneCountryCode} {claimant?.phone || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
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
                    ) || 'Not specified'}
                  </p>
                </div>
                {claimant?.gst && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm font-medium text-gray-600">GST Number</label>
                    <p className="text-gray-900">{claimant.gst}</p>
                  </div>
                )}
                {claimant?.pan && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm font-medium text-gray-600">PAN Number</label>
                    <p className="text-gray-900">{claimant.pan}</p>
                  </div>
                )}
                {claimant?.cin && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm font-medium text-gray-600">CIN Number</label>
                    <p className="text-gray-900">{claimant.cin}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Additional Claimants */}
          {additionalClaimants && additionalClaimants.length > 0 && additionalClaimants.some((ac: any) => ac?.name) && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="bg-white text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Additional Claimants
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {additionalClaimants.map((ac: any, index: number) => (
                  ac?.name && (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">Additional Claimant {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Type</label>
                          <p className="text-gray-900 capitalize">{ac.type || 'Not specified'}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-gray-900">{ac.name}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-gray-900">{ac.email || 'Not specified'}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-gray-900">{ac.phoneCountryCode} {ac.phone || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Respondents */}
          {respondents && respondents.length > 0 && respondents.some((r: any) => r?.name) && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Respondents
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {respondents.map((respondent: any, index: number) => (
                  respondent?.name && (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">Respondent {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Type</label>
                          <p className="text-gray-900 capitalize">{respondent.type || 'Not specified'}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-gray-900">{respondent.name}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-gray-900">{respondent.email || 'Not specified'}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-gray-900">{respondent.phoneCountryCode} {respondent.phone || 'Not specified'}</p>
                        </div>
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
              <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="bg-white text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Arbitration Agreement
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arbitrationAgreement.agreementDate && (
                    <div className="bg-gray-50 p-3 rounded">
                      <label className="text-sm font-medium text-gray-600">Agreement Date</label>
                      <p className="text-gray-900">{arbitrationAgreement.agreementDate}</p>
                    </div>
                  )}
                  {arbitrationAgreement.placeOfSigning && (
                    <div className="bg-gray-50 p-3 rounded">
                      <label className="text-sm font-medium text-gray-600">Place of Signing</label>
                      <p className="text-gray-900">{arbitrationAgreement.placeOfSigning}</p>
                    </div>
                  )}
                  {arbitrationAgreement.numberOfArbitrators && (
                    <div className="bg-gray-50 p-3 rounded">
                      <label className="text-sm font-medium text-gray-600">Number of Arbitrators</label>
                      <p className="text-gray-900">{arbitrationAgreement.numberOfArbitrators}</p>
                    </div>
                  )}
                  {arbitrationAgreement.arbitrationText && (
                    <div className="bg-gray-50 p-3 rounded md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Arbitration Clause</label>
                      <div className="mt-2 p-3 bg-white rounded border text-sm max-h-32 overflow-y-auto">
                        {arbitrationAgreement.arbitrationText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {payment && Object.values(payment).some(val => val) && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                  Payment Details
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm font-medium text-gray-600">Payment Head</label>
                    <p className="text-gray-900">{payment.paymentHead || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm font-medium text-gray-600">Amount (INR)</label>
                    <p className="text-gray-900">{payment.paymentAmount ? `₹${Number(payment.paymentAmount).toLocaleString()}` : 'Not specified'}</p>
                  </div>
                  {payment.paymentDetails && (
                    <div className="bg-gray-50 p-3 rounded md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Payment Details</label>
                      <p className="text-gray-900">{payment.paymentDetails}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Final Submit Actions */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mt-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ready to Submit?</h3>
            <p className="text-gray-600 mb-6">
              Please review all the information above. Once submitted, you will receive a confirmation email 
              and your case will be processed by our arbitration team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveDraft()}
                disabled={isSubmitting || isSavingDraft}
                className="sm:w-auto"
              >
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isSavingDraft}
                className="sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
                  {steps[activeStep]}
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
              {currentDraftId && (
                <div className="text-xs text-gray-400 mt-1">
                  Auto-saves every 30 seconds
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Load Draft Notification */}
          {hasSavedDraft() && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Saved Draft Available</h4>
                  <p className="text-sm text-yellow-700">You have a previously saved draft. Would you like to continue from where you left off?</p>
                </div>
                <button
                  type="button"
                  onClick={loadLocalDraft}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  Load Draft
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(handleFormSubmission)}>
            <Card>
              <CardContent className="p-6">
                {/* Step Content */}
                {(() => {
                  switch (activeStep) {
                    case 0:
                      return renderClaimantDetails();
                    case 1:
                      return renderAdditionalClaimantsAndManager();
                    case 2:
                      return renderRespondentDetails();
                    case 3:
                      return renderArbitrationAgreement();
                    case 4:
                      return renderNatureOfDispute();
                    case 5:
                      return renderDisputeDescription();
                    case 6:
                      return renderPrayersAndReliefs();
                    case 7:
                      return renderDocuments();
                    case 8:
                      return renderPayment();
                    case 9:
                      return renderArguments();
                    case 10:
                      return renderReviewAndSubmit();
                    default:
                      return renderClaimantDetails();
                  }
                })()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={activeStep === 0}
              >
                Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isSavingDraft}
                  className="flex items-center gap-2"
                >
                  {isSavingDraft ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save Draft
                    </>
                  )}
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Submission Success Modal */}
      {showSubmissionModal && submissionResult && (
        <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Application Submitted Successfully!</DialogTitle>
              <DialogDescription>
                Your application has been submitted successfully. Your application number is{' '}
                <span className="font-semibold">{submissionResult.applicationNumber}</span>.
                A PDF copy has been sent to your registered email address.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleViewDashboard}>
                View Dashboard
              </Button>
              <Button onClick={handleGoToMyCases} variant="outline">
                Go to My Cases
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ArbitrationFormNew; 