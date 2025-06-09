"use client"

import React, { useMemo } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { FormData } from '@/lib/validation/form-schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EvidenceIndexFormProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
}

export const EvidenceIndexForm: React.FC<EvidenceIndexFormProps> = ({ control, disputeIssues }) => {
  // Watch all the evidence collections
  const scannedDocuments = useWatch({
    control,
    name: "documents.scannedDocuments",
    defaultValue: []
  });
  
  const affidavits = useWatch({
    control,
    name: "documents.affidavits",
    defaultValue: []
  });
  
  const electronicEvidence = useWatch({
    control,
    name: "documents.electronicEvidence",
    defaultValue: []
  });
  
  const lawsReliedUpon = useWatch({
    control,
    name: "documents.lawsReliedUpon",
    defaultValue: []
  });

  // Get issue label from value
  const getIssueLabel = (issueValue: string) => {
    const issue = disputeIssues.find(i => i.value === issueValue);
    return issue ? issue.label : issueValue;
  };

  // Create a map of all evidence indexed by issue
  const evidenceByIssue = useMemo(() => {
    const issueMap: Record<string, Array<{
      type: string;
      description: string;
      category?: string;
      fileType?: string;
    }>> = {};

    // Initialize with all available issues
    disputeIssues.forEach(issue => {
      issueMap[issue.value] = [];
    });

    // Add scanned documents
    scannedDocuments.forEach((doc: any) => {
      if (doc.linkedIssue && doc.file) {
        if (!issueMap[doc.linkedIssue]) {
          issueMap[doc.linkedIssue] = [];
        }
        issueMap[doc.linkedIssue].push({
          type: 'Document',
          description: doc.description,
          fileType: doc.file?.name ? doc.file.name.split('.').pop() : 'Unknown'
        });
      }
    });

    // Add affidavits
    affidavits.forEach((aff: any) => {
      if (aff.linkedIssue && aff.file) {
        if (!issueMap[aff.linkedIssue]) {
          issueMap[aff.linkedIssue] = [];
        }
        issueMap[aff.linkedIssue].push({
          type: 'Affidavit',
          description: `${aff.deponentName} (${aff.type})`,
          category: aff.type
        });
      }
    });

    // Add electronic evidence
    electronicEvidence.forEach((ev: any) => {
      if (ev.linkedIssue && ev.certificateFile) {
        if (!issueMap[ev.linkedIssue]) {
          issueMap[ev.linkedIssue] = [];
        }
        issueMap[ev.linkedIssue].push({
          type: 'Electronic Evidence',
          description: ev.description,
          category: `${ev.supportingFiles?.length || 0} supporting file(s)`
        });
      }
    });

    // Add laws relied upon
    lawsReliedUpon.forEach((law: any) => {
      if (law.linkedIssue) {
        if (!issueMap[law.linkedIssue]) {
          issueMap[law.linkedIssue] = [];
        }
        issueMap[law.linkedIssue].push({
          type: 'Legal Reference',
          description: law.reference,
          category: law.category
        });
      }
    });

    return issueMap;
  }, [scannedDocuments, affidavits, electronicEvidence, lawsReliedUpon, disputeIssues]);

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold mb-2">Evidence Index</h4>
      <p className="text-sm text-gray-600 mb-4">
        This table shows all evidence and references indexed by issue. Each piece of evidence
        is linked to a specific issue in your case.
      </p>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Issue</TableHead>
              <TableHead className="w-1/6">Type</TableHead>
              <TableHead className="w-2/5">Description</TableHead>
              <TableHead className="w-1/6">Category/Format</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(evidenceByIssue).map(([issueId, items]) => (
              items.length > 0 ? (
                items.map((item, itemIndex) => (
                  <TableRow key={`${issueId}-${itemIndex}`}>
                    {itemIndex === 0 ? (
                      <TableCell rowSpan={items.length} className="align-top border-r border-gray-200 font-medium">
                        {getIssueLabel(issueId)}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <Badge variant={
                        item.type === 'Document' ? 'default' :
                        item.type === 'Affidavit' ? 'secondary' :
                        item.type === 'Electronic Evidence' ? 'destructive' :
                        'outline'
                      }>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.category || item.fileType || '-'}</TableCell>
                  </TableRow>
                ))
              ) : null
            ))}
            {Object.values(evidenceByIssue).flat().length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  No evidence has been linked to any issues yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mt-6">
        <h5 className="font-medium text-blue-800 mb-2">Why document indexing matters</h5>
        <p className="text-sm text-blue-700">
          Properly indexed evidence strengthens your case by creating clear connections between
          your documents, affidavits, electronic evidence, and the legal points you're making.
          The arbitral tribunal will use this structured approach to evaluate your claims more efficiently.
        </p>
      </div>
    </div>
  );
};

export default EvidenceIndexForm; 