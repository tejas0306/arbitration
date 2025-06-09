"use client"

import React, { useMemo } from 'react';
import { Control } from 'react-hook-form';
import { FormData } from '@/lib/validation/form-schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScannedDocumentsForm from './ScannedDocumentsForm';
import AffidavitsForm from './AffidavitsForm';
import ElectronicEvidenceForm from './ElectronicEvidenceForm';
import LawsReliedUponForm from './LawsReliedUponForm';
import EvidenceIndexForm from './EvidenceIndexForm';

interface DocumentsTabsProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
  watch: any;
}

export const DocumentsTabs: React.FC<DocumentsTabsProps> = ({ control, disputeIssues, watch }) => {
  // Generate dispute issues from the arguments if none provided
  const issues = useMemo(() => {
    // If we have provided issues, use them
    if (disputeIssues && disputeIssues.length > 0) {
      return disputeIssues;
    }
    
    // Try to extract issues from the arguments section
    const argumentsPerIssue = watch('arguments.argumentsPerIssue') || [];
    
    // If we have arguments, generate issues from them
    if (argumentsPerIssue.length > 0) {
      return argumentsPerIssue.map((_, index) => ({
        value: `issue_${index + 1}`,
        label: `Issue ${index + 1}`
      }));
    }
    
    // If no issues or arguments, provide default placeholder issues
    return [
      { value: "issue_default_1", label: "Issue 1 - Breach of Contract" },
      { value: "issue_default_2", label: "Issue 2 - Non-payment of Invoice" },
      { value: "issue_default_3", label: "Issue 3 - Delay in Delivery" }
    ];
  }, [disputeIssues, watch]);

  // Log issues for debugging
  console.log("Available issues for documents:", issues);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg mb-4">Documents & Evidence</h3>
      
      <Tabs defaultValue="scanned" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="scanned">Scanned Documents</TabsTrigger>
          <TabsTrigger value="affidavits">Affidavits</TabsTrigger>
          <TabsTrigger value="electronic">Electronic Evidence</TabsTrigger>
          <TabsTrigger value="laws">Laws Relied Upon</TabsTrigger>
          <TabsTrigger value="index">Evidence Index</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scanned" className="pt-2">
          <ScannedDocumentsForm control={control} disputeIssues={issues} />
        </TabsContent>
        
        <TabsContent value="affidavits" className="pt-2">
          <AffidavitsForm control={control} disputeIssues={issues} />
        </TabsContent>
        
        <TabsContent value="electronic" className="pt-2">
          <ElectronicEvidenceForm control={control} disputeIssues={issues} />
        </TabsContent>
        
        <TabsContent value="laws" className="pt-2">
          <LawsReliedUponForm control={control} disputeIssues={issues} />
        </TabsContent>
        
        <TabsContent value="index" className="pt-2">
          <EvidenceIndexForm control={control} disputeIssues={issues} />
        </TabsContent>
      </Tabs>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-6">
        <h4 className="font-medium text-amber-800 mb-2">Important Information</h4>
        <ul className="space-y-2 text-sm text-amber-700">
          <li>• All uploaded documents should be OCR-readable for best results</li>
          <li>• Affidavits must contain standardized verification clauses as per arbitration rules</li>
          <li>• Electronic evidence requires signed certificates attesting to their authenticity</li>
          <li>• Every document, affidavit, and citation must be linked to a specific issue in your case</li>
          <li>• Documents can be referenced for cross-examination and admission/denial tracking</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsTabs; 