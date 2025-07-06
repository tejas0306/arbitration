"use client"

import React from 'react';
import { Control, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { FileField } from '../arbitration-form';
import { FormField } from '../arbitration-form';
import { TextAreaField } from '../arbitration-form';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormData } from '@/lib/validation/form-schema';

interface AffidavitsFormProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
}

export const AffidavitsForm: React.FC<AffidavitsFormProps> = ({ control, disputeIssues }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents.affidavits",
  });

  const addAffidavit = () => {
    append({
      type: "claimant",
      file: null,
      date: "",
      place: "",
      event: "",
      hasVerificationClause: false,
      deponentName: "",
      linkedIssue: disputeIssues.length > 0 ? disputeIssues[0].value : "issue_default_1"
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold mb-2">Affidavits</h4>
      <p className="text-sm text-gray-600 mb-4">
        Upload affidavits from the Claimant, Respondent, Officers, or Witnesses. Each affidavit must include
        date, place, event details, and a standardized verification clause.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Affidavit {index + 1}</h5>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.type`}
                render={({ field }) => (
                  <FormField
                    label="Affidavit Type"
                    name={field.name}
                    value={field.value || "claimant"}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={[
                      { value: "claimant", label: "Claimant Affidavit" },
                      { value: "respondent", label: "Respondent Affidavit" },
                      { value: "officer", label: "Officer Affidavit" },
                      { value: "witness", label: "Witness Affidavit" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.deponentName`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Deponent Name"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    placeholder="Name of the person making the affidavit"
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.affidavits.${index}.file`}
                render={({ field: { onChange, value } }) => (
                  <div>
                    <FileField
                      label="Affidavit File"
                      name={`affidavit_${index}`}
                      onChange={(file) => {
                        if (!Array.isArray(file)) {
                          onChange(file);
                        }
                      }}
                      required
                      accept=".pdf,.doc,.docx"
                      error={!value ? "Affidavit file is required" : ""}
                    />
                    {value && value.isExisting && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 text-sm">✓ Previously uploaded: {value.name}</span>
                          {value.path && (
                            <button
                              type="button"
                              onClick={() => window.open(`/api/arbitration/files/${value.path.split('/').pop()}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.date`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Date"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="date"
                    required
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.place`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Place"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    placeholder="Location where affidavit was signed"
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.affidavits.${index}.event`}
                render={({ field, fieldState }) => (
                  <TextAreaField
                    label="Event Description"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    rows={2}
                    placeholder="Describe the event(s) being attested to"
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.linkedIssue`}
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

            <div>
              <Controller
                control={control}
                name={`documents.affidavits.${index}.hasVerificationClause`}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 h-full pt-6">
                    <Checkbox 
                      id={`verification-${index}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor={`verification-${index}`}>
                      Includes Standardized Verification Clause
                    </Label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={addAffidavit} 
          variant="outline"
        >
          Add Affidavit
        </Button>
      </div>
    </div>
  );
};

export default AffidavitsForm; 