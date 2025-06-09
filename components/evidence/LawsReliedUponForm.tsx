"use client"

import React from 'react';
import { Control, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { FormField } from '../arbitration-form';
import { TextAreaField } from '../arbitration-form';
import { FormData } from '@/lib/validation/form-schema';

interface LawsReliedUponFormProps {
  control: Control<FormData>;
  disputeIssues: Array<{ value: string, label: string }>;
}

export const LawsReliedUponForm: React.FC<LawsReliedUponFormProps> = ({ control, disputeIssues }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents.lawsReliedUpon",
  });

  const addLawReference = () => {
    append({
      category: "act",
      reference: "",
      citation: "",
      paragraphNumbers: "",
      linkedIssue: disputeIssues.length > 0 ? disputeIssues[0].value : "issue_default_1"
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold mb-2">Laws Relied Upon</h4>
      <p className="text-sm text-gray-600 mb-4">
        Specify all laws, acts, rules, regulations, and case citations relied upon in your arguments.
        Each reference must be linked to a specific issue in the case.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Legal Reference {index + 1}</h5>
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
                name={`documents.lawsReliedUpon.${index}.category`}
                render={({ field }) => (
                  <FormField
                    label="Category"
                    name={field.name}
                    value={field.value || "act"}
                    onChange={field.onChange}
                    type="select"
                    required
                    options={[
                      { value: "act", label: "Act" },
                      { value: "rule", label: "Rule" },
                      { value: "regulation", label: "Regulation" },
                      { value: "case", label: "Case Law" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.lawsReliedUpon.${index}.reference`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Reference"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    placeholder="e.g., Arbitration and Conciliation Act, 1996"
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <Controller
                control={control}
                name={`documents.lawsReliedUpon.${index}.citation`}
                render={({ field, fieldState }) => (
                  <FormField
                    label="Citation"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    required
                    error={fieldState.error?.message}
                    placeholder="e.g., 2019 SCC Online SC 1478"
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                For cases, provide the full citation; for acts, provide the section numbers
              </p>
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.lawsReliedUpon.${index}.paragraphNumbers`}
                render={({ field }) => (
                  <FormField
                    label="Paragraph/Section Numbers"
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="e.g., Section 7-9, Paragraph 12-15"
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name={`documents.lawsReliedUpon.${index}.linkedIssue`}
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
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={addLawReference} 
          variant="outline"
        >
          Add Legal Reference
        </Button>
      </div>
    </div>
  );
};

export default LawsReliedUponForm; 