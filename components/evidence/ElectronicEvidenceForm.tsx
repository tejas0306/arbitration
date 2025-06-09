"use client"

import React from 'react';
import { Control, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { FileField } from '../arbitration-form';
import { FormField } from '../arbitration-form';
import { TextAreaField } from '../arbitration-form';
import { FormData } from '@/lib/validation/form-schema';

interface ElectronicEvidenceFormProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
}

export const ElectronicEvidenceForm: React.FC<ElectronicEvidenceFormProps> = ({ control, disputeIssues }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents.electronicEvidence",
  });

  const addElectronicEvidence = () => {
    append({
      certificateFile: null,
      supportingFiles: [],
      description: "",
      linkedIssue: disputeIssues.length > 0 ? disputeIssues[0].value : "issue_default_1",
      tabulatedList: ""
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold mb-2">Electronic Evidence</h4>
      <p className="text-sm text-gray-600 mb-4">
        Upload electronic evidence with a signed certificate. Each submission must include a tabulated list of digital records 
        and be linked to a specific issue in the case.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Electronic Evidence {index + 1}</h5>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.electronicEvidence.${index}.certificateFile`}
                render={({ field: { onChange, value } }) => (
                  <FileField
                    label="Certificate File"
                    name={`certificate_${index}`}
                    onChange={(file) => {
                      if (!Array.isArray(file)) {
                        onChange(file);
                      }
                    }}
                    required
                    accept=".pdf,.doc,.docx"
                    error={!value ? "Certificate file is required" : ""}
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload the signed certificate authenticating this electronic evidence
              </p>
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.electronicEvidence.${index}.supportingFiles`}
                render={({ field: { onChange, value } }) => (
                  <FileField
                    label="Supporting Files"
                    name={`supporting_files_${index}`}
                    onChange={(files) => {
                      if (Array.isArray(files)) {
                        onChange(files);
                      }
                    }}
                    multiple={true}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.mp4,.wav,.avi"
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload the actual electronic evidence files (images, audio, video, etc.)
              </p>
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.electronicEvidence.${index}.description`}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    label="Description"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    rows={2}
                    placeholder="Provide a brief description of this electronic evidence"
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.electronicEvidence.${index}.linkedIssue`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Linked Issue"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="select"
                    required
                    error={fieldState.error?.message}
                    options={disputeIssues}
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.electronicEvidence.${index}.tabulatedList`}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    label="Tabulated List of Digital Records"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    rows={4}
                    placeholder="Provide a tabulated list of all digital records included in this evidence"
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: File Name | Type | Date Created | Description | Relevance to Issue
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={addElectronicEvidence} 
          variant="outline"
        >
          Add Electronic Evidence
        </Button>
      </div>
    </div>
  );
};

export default ElectronicEvidenceForm; 