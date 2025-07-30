"use client";

import React from 'react';
import { Control, Controller, UseFieldArrayReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface FileState {
  [key: string]: File | null;
}

interface VerificationState {
  emailVerified: boolean;
  phoneVerified: boolean;
  additionalClaimantEmailVerified: boolean[];
  additionalClaimantPhoneVerified: boolean[];
  managerEmailVerified: boolean;
  managerPhoneVerified: boolean;
  respondentEmailVerified: boolean;
  respondentPhoneVerified: boolean;
}

interface StepProps {
  control: Control<any>;
  errors: any;
  files: FileState;
  verification: VerificationState;
  onFileUpload: (fieldName: string, file: File | null) => void;
  onSendEmailVerification: (email: string, type: string, index?: number) => void;
  onSendPhoneVerification: (phone: string, type: string, index?: number) => void;
  additionalClaimantFields?: any[];
  addAdditionalClaimant?: () => void;
  removeAdditionalClaimant?: (index: number) => void;
  documentFields?: any[];
  addDocument?: () => void;
  removeDocument?: (index: number) => void;
  watch: any;
}

// **File Upload Component**
const FileUpload = ({ fieldName, label, files, onFileUpload, accept = ".pdf,.jpg,.jpeg,.png" }: {
  fieldName: string;
  label: string;
  files: FileState;
  onFileUpload: (fieldName: string, file: File | null) => void;
  accept?: string;
}) => {
  const file = files[fieldName];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileUpload(fieldName, selectedFile);
  };

  const removeFile = () => {
    onFileUpload(fieldName, null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      {file ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="flex-1 text-sm text-green-700">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <Label htmlFor={fieldName} className="cursor-pointer">
            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
            <Input
              id={fieldName}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          </Label>
        </div>
      )}
    </div>
  );
};

// **Email/Phone Verification Component**
const VerificationField = ({ 
  type, 
  label, 
  control, 
  fieldName, 
  isVerified, 
  onSendVerification,
  errors 
}: {
  type: 'email' | 'phone';
  label: string;
  control: Control<any>;
  fieldName: string;
  isVerified: boolean;
  onSendVerification: (value: string) => void;
  errors: any;
}) => {
  const [value, setValue] = React.useState('');

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Controller
          control={control}
          name={fieldName}
          render={({ field }) => (
            <Input
              {...field}
              type={type}
              className={`flex-1 ${isVerified ? 'border-green-500' : ''}`}
              onChange={(e) => {
                field.onChange(e);
                setValue(e.target.value);
              }}
            />
          )}
        />
        <Button
          type="button"
          variant={isVerified ? "default" : "outline"}
          size="sm"
          onClick={() => onSendVerification(value)}
          disabled={isVerified || !value}
          className={isVerified ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isVerified ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </>
          ) : (
            'Verify'
          )}
        </Button>
      </div>
      {errors && <p className="text-sm text-red-600">{errors.message}</p>}
    </div>
  );
};

// **STEP 1: Claimant Details**
export const ClaimantDetailsStep = ({ control, errors, files, verification, onFileUpload, onSendEmailVerification, onSendPhoneVerification, watch }: StepProps) => {
  const claimantData = watch('claimantDetails');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <Label>1. Type*</Label>
          <Controller
            control={control}
            name="claimantDetails.type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="llp">LLP</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors?.claimantDetails?.type && <p className="text-sm text-red-600">{errors.claimantDetails.type.message}</p>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>2. Name*</Label>
          <Controller
            control={control}
            name="claimantDetails.name"
            render={({ field }) => <Input {...field} />}
          />
          {errors?.claimantDetails?.name && <p className="text-sm text-red-600">{errors.claimantDetails.name.message}</p>}
        </div>
      </div>

      {/* Email with Verification */}
      <VerificationField
        type="email"
        label="3. Email Address*"
        control={control}
        fieldName="claimantDetails.email"
        isVerified={verification.emailVerified}
        onSendVerification={(email) => onSendEmailVerification(email, 'claimant')}
        errors={errors?.claimantDetails?.email}
      />

      {/* Phone with Verification */}
      <VerificationField
        type="phone"
        label="4. Phone Number*"
        control={control}
        fieldName="claimantDetails.phone"
        isVerified={verification.phoneVerified}
        onSendVerification={(phone) => onSendPhoneVerification(phone, 'claimant')}
        errors={errors?.claimantDetails?.phone}
      />

      {/* Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>5. Pincode*</Label>
          <Controller
            control={control}
            name="claimantDetails.pincode"
            render={({ field }) => <Input {...field} maxLength={6} />}
          />
          {errors?.claimantDetails?.pincode && <p className="text-sm text-red-600">{errors.claimantDetails.pincode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>6. City*</Label>
          <Controller
            control={control}
            name="claimantDetails.city"
            render={({ field }) => <Input {...field} />}
          />
          {errors?.claimantDetails?.city && <p className="text-sm text-red-600">{errors.claimantDetails.city.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>7. Address Line 1*</Label>
        <Controller
          control={control}
          name="claimantDetails.address1"
          render={({ field }) => <Input {...field} />}
        />
        {errors?.claimantDetails?.address1 && <p className="text-sm text-red-600">{errors.claimantDetails.address1.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>8. Address Line 2</Label>
        <Controller
          control={control}
          name="claimantDetails.address2"
          render={({ field }) => <Input {...field} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>9. District*</Label>
          <Controller
            control={control}
            name="claimantDetails.district"
            render={({ field }) => <Input {...field} />}
          />
          {errors?.claimantDetails?.district && <p className="text-sm text-red-600">{errors.claimantDetails.district.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>10. State*</Label>
          <Controller
            control={control}
            name="claimantDetails.state"
            render={({ field }) => <Input {...field} />}
          />
          {errors?.claimantDetails?.state && <p className="text-sm text-red-600">{errors.claimantDetails.state.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>11. Country*</Label>
          <Controller
            control={control}
            name="claimantDetails.country"
            render={({ field }) => <Input {...field} />}
          />
          {errors?.claimantDetails?.country && <p className="text-sm text-red-600">{errors.claimantDetails.country.message}</p>}
        </div>
      </div>

      {/* Identification Numbers */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Identification Numbers (At least one required)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>12. PAN Number</Label>
            <Controller
              control={control}
              name="claimantDetails.pan"
              render={({ field }) => <Input {...field} placeholder="ABCDE1234F" />}
            />
            {errors?.claimantDetails?.pan && <p className="text-sm text-red-600">{errors.claimantDetails.pan.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>13. GST Number</Label>
            <Controller
              control={control}
              name="claimantDetails.gst"
              render={({ field }) => <Input {...field} placeholder="22ABCDE1234F1Z5" />}
            />
            {errors?.claimantDetails?.gst && <p className="text-sm text-red-600">{errors.claimantDetails.gst.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>14. CIN Number</Label>
            <Controller
              control={control}
              name="claimantDetails.cin"
              render={({ field }) => <Input {...field} placeholder="U12345DL2023PTC123456" />}
            />
            {errors?.claimantDetails?.cin && <p className="text-sm text-red-600">{errors.claimantDetails.cin.message}</p>}
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Document Uploads</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {claimantData?.pan && (
            <FileUpload
              fieldName="claimant.panCard"
              label="PAN Card*"
              files={files}
              onFileUpload={onFileUpload}
            />
          )}
          {claimantData?.gst && (
            <FileUpload
              fieldName="claimant.gstCert"
              label="GST Certificate*"
              files={files}
              onFileUpload={onFileUpload}
            />
          )}
          {claimantData?.cin && (
            <FileUpload
              fieldName="claimant.coi"
              label="Certificate of Incorporation*"
              files={files}
              onFileUpload={onFileUpload}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// **STEP 2: Additional Claimants**
export const AdditionalClaimantsStep = ({ 
  control, 
  errors, 
  verification, 
  onSendEmailVerification, 
  onSendPhoneVerification, 
  additionalClaimantFields = [], 
  addAdditionalClaimant, 
  removeAdditionalClaimant 
}: StepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Additional Claimants</h3>
        <Button type="button" onClick={addAdditionalClaimant} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Claimant
        </Button>
      </div>

      {additionalClaimantFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No additional claimants added.</p>
          <p className="text-sm">Click "Add Claimant" to add additional claimants to this case.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {additionalClaimantFields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Additional Claimant {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalClaimant?.(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label>Name*</Label>
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.name`}
                    render={({ field }) => <Input {...field} />}
                  />
                  {errors?.additionalClaimants?.[index]?.name && (
                    <p className="text-sm text-red-600">{errors.additionalClaimants[index].name.message}</p>
                  )}
                </div>

                {/* Email with Verification */}
                <VerificationField
                  type="email"
                  label="Email Address*"
                  control={control}
                  fieldName={`additionalClaimants.${index}.email`}
                  isVerified={verification.additionalClaimantEmailVerified[index] || false}
                  onSendVerification={(email) => onSendEmailVerification(email, 'additional', index)}
                  errors={errors?.additionalClaimants?.[index]?.email}
                />

                {/* Phone with Verification */}
                <VerificationField
                  type="phone"
                  label="Phone Number*"
                  control={control}
                  fieldName={`additionalClaimants.${index}.phone`}
                  isVerified={verification.additionalClaimantPhoneVerified[index] || false}
                  onSendVerification={(phone) => onSendPhoneVerification(phone, 'additional', index)}
                  errors={errors?.additionalClaimants?.[index]?.phone}
                />

                {/* Address fields similar to claimant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pincode*</Label>
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.pincode`}
                      render={({ field }) => <Input {...field} maxLength={6} />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City*</Label>
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.city`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address Line 1*</Label>
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.address1`}
                    render={({ field }) => <Input {...field} />}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Controller
                    control={control}
                    name={`additionalClaimants.${index}.address2`}
                    render={({ field }) => <Input {...field} />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>District*</Label>
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.district`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State*</Label>
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.state`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country*</Label>
                    <Controller
                      control={control}
                      name={`additionalClaimants.${index}.country`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// **STEP 3: Manager Details**
export const ManagerDetailsStep = ({ control, errors, verification, onSendEmailVerification, onSendPhoneVerification, watch }: StepProps) => {
  const manager = watch('manager');
  const hasManagerData = manager && (manager.name || manager.email || manager.phone);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Manager Details</h3>
        <p className="text-gray-600">Optional: Add manager information if applicable</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Name */}
          <div className="space-y-2">
            <Label>Manager Name</Label>
            <Controller
              control={control}
              name="manager.name"
              render={({ field }) => <Input {...field} />}
            />
            {errors?.manager?.name && <p className="text-sm text-red-600">{errors.manager.name.message}</p>}
          </div>

          {/* Email with Verification */}
          {hasManagerData && (
            <VerificationField
              type="email"
              label="Manager Email*"
              control={control}
              fieldName="manager.email"
              isVerified={verification.managerEmailVerified}
              onSendVerification={(email) => onSendEmailVerification(email, 'manager')}
              errors={errors?.manager?.email}
            />
          )}

          {/* Phone with Verification */}
          {hasManagerData && (
            <VerificationField
              type="phone"
              label="Manager Phone*"
              control={control}
              fieldName="manager.phone"
              isVerified={verification.managerPhoneVerified}
              onSendVerification={(phone) => onSendPhoneVerification(phone, 'manager')}
              errors={errors?.manager?.phone}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// **STEP 4: Respondent Details**
export const RespondentDetailsStep = ({ control, errors, verification, onSendEmailVerification, onSendPhoneVerification }: StepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Respondent Details</h3>
        <p className="text-gray-600">Information about the respondent party</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type*</Label>
              <Controller
                control={control}
                name="respondentDetails.type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.respondentDetails?.type && <p className="text-sm text-red-600">{errors.respondentDetails.type.message}</p>}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Name*</Label>
              <Controller
                control={control}
                name="respondentDetails.name"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.respondentDetails?.name && <p className="text-sm text-red-600">{errors.respondentDetails.name.message}</p>}
            </div>
          </div>

          {/* Email with Verification */}
          <VerificationField
            type="email"
            label="Email Address*"
            control={control}
            fieldName="respondentDetails.email"
            isVerified={verification.respondentEmailVerified}
            onSendVerification={(email) => onSendEmailVerification(email, 'respondent')}
            errors={errors?.respondentDetails?.email}
          />

          {/* Phone with Verification */}
          <VerificationField
            type="phone"
            label="Phone Number*"
            control={control}
            fieldName="respondentDetails.phone"
            isVerified={verification.respondentPhoneVerified}
            onSendVerification={(phone) => onSendPhoneVerification(phone, 'respondent')}
            errors={errors?.respondentDetails?.phone}
          />

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pincode*</Label>
              <Controller
                control={control}
                name="respondentDetails.pincode"
                render={({ field }) => <Input {...field} maxLength={6} />}
              />
              {errors?.respondentDetails?.pincode && <p className="text-sm text-red-600">{errors.respondentDetails.pincode.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>City*</Label>
              <Controller
                control={control}
                name="respondentDetails.city"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.respondentDetails?.city && <p className="text-sm text-red-600">{errors.respondentDetails.city.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address Line 1*</Label>
            <Controller
              control={control}
              name="respondentDetails.address1"
              render={({ field }) => <Input {...field} />}
            />
            {errors?.respondentDetails?.address1 && <p className="text-sm text-red-600">{errors.respondentDetails.address1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Controller
              control={control}
              name="respondentDetails.address2"
              render={({ field }) => <Input {...field} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>District*</Label>
              <Controller
                control={control}
                name="respondentDetails.district"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.respondentDetails?.district && <p className="text-sm text-red-600">{errors.respondentDetails.district.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>State*</Label>
              <Controller
                control={control}
                name="respondentDetails.state"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.respondentDetails?.state && <p className="text-sm text-red-600">{errors.respondentDetails.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Country*</Label>
              <Controller
                control={control}
                name="respondentDetails.country"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.respondentDetails?.country && <p className="text-sm text-red-600">{errors.respondentDetails.country.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// **STEP 5: Arbitration Agreement**
export const ArbitrationAgreementStep = ({ control, errors }: StepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Arbitration Agreement Details</h3>
        <p className="text-gray-600">Information about the arbitration agreement</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agreement Date*</Label>
              <Controller
                control={control}
                name="arbitrationAgreement.agreementDate"
                render={({ field }) => <Input {...field} type="date" />}
              />
              {errors?.arbitrationAgreement?.agreementDate && <p className="text-sm text-red-600">{errors.arbitrationAgreement.agreementDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Place of Signing*</Label>
              <Controller
                control={control}
                name="arbitrationAgreement.placeOfSigning"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.arbitrationAgreement?.placeOfSigning && <p className="text-sm text-red-600">{errors.arbitrationAgreement.placeOfSigning.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arbitration Agreement Text*</Label>
            <Controller
              control={control}
              name="arbitrationAgreement.arbitrationText"
              render={({ field }) => <Textarea {...field} rows={4} />}
            />
            {errors?.arbitrationAgreement?.arbitrationText && <p className="text-sm text-red-600">{errors.arbitrationAgreement.arbitrationText.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stamp Duty Percentage*</Label>
              <Controller
                control={control}
                name="arbitrationAgreement.stampDutyPercentage"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.arbitrationAgreement?.stampDutyPercentage && <p className="text-sm text-red-600">{errors.arbitrationAgreement.stampDutyPercentage.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Number of Arbitrators*</Label>
              <Controller
                control={control}
                name="arbitrationAgreement.numberOfArbitrators"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.arbitrationAgreement?.numberOfArbitrators && <p className="text-sm text-red-600">{errors.arbitrationAgreement.numberOfArbitrators.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// **STEP 6: Dispute Details**
export const DisputeDetailsStep = ({ control, errors }: StepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Dispute Details</h3>
        <p className="text-gray-600">Details about the nature of the dispute</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category*</Label>
              <Controller
                control={control}
                name="dispute.category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="intellectual_property">Intellectual Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.dispute?.category && <p className="text-sm text-red-600">{errors.dispute.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Sub-Category*</Label>
              <Controller
                control={control}
                name="dispute.subCategory"
                render={({ field }) => <Input {...field} />}
              />
              {errors?.dispute?.subCategory && <p className="text-sm text-red-600">{errors.dispute.subCategory.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nature of Dispute*</Label>
            <Controller
              control={control}
              name="dispute.nature"
              render={({ field }) => <Textarea {...field} rows={3} />}
            />
            {errors?.dispute?.nature && <p className="text-sm text-red-600">{errors.dispute.nature.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date when Right to Claim Arose*</Label>
            <Controller
              control={control}
              name="dispute.claimDate"
              render={({ field }) => <Input {...field} type="date" />}
            />
            {errors?.dispute?.claimDate && <p className="text-sm text-red-600">{errors.dispute.claimDate.message}</p>}
          </div>

          {/* Optional fields */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Additional Details (Optional)</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prayer Clauses</Label>
                <Controller
                  control={control}
                  name="dispute.prayerClauses"
                  render={({ field }) => <Textarea {...field} rows={2} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Claim Type</Label>
                  <Controller
                    control={control}
                    name="dispute.claimType"
                    render={({ field }) => <Input {...field} />}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Claim Reason</Label>
                  <Controller
                    control={control}
                    name="dispute.claimReason"
                    render={({ field }) => <Input {...field} />}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Law Relied Upon</Label>
                <Controller
                  control={control}
                  name="dispute.lawRelied"
                  render={({ field }) => <Textarea {...field} rows={2} />}
                />
              </div>

              <div className="space-y-2">
                <Label>Relief Sought</Label>
                <Controller
                  control={control}
                  name="dispute.reliefSought"
                  render={({ field }) => <Textarea {...field} rows={3} />}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// **STEP 7: Documents**
export const DocumentsStep = ({ control, errors, files, onFileUpload, documentFields = [], addDocument, removeDocument }: StepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Supporting Documents</h3>
          <p className="text-gray-600">Upload documents supporting your case</p>
        </div>
        <Button type="button" onClick={addDocument} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {documentFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No documents added.</p>
          <p className="text-sm">Click "Add Document" to upload supporting documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documentFields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Document {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument?.(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type*</Label>
                    <Controller
                      control={control}
                      name={`documents.${index}.type`}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agreement">Agreement</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="correspondence">Correspondence</SelectItem>
                            <SelectItem value="receipt">Receipt</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Issue</Label>
                    <Controller
                      control={control}
                      name={`documents.${index}.dateOfIssue`}
                      render={({ field }) => <Input {...field} type="date" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Relevant Clause Number</Label>
                    <Controller
                      control={control}
                      name={`documents.${index}.relevantClauseNumber`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Supporting Claim Number</Label>
                    <Controller
                      control={control}
                      name={`documents.${index}.supportingClaimNumber`}
                      render={({ field }) => <Input {...field} />}
                    />
                  </div>
                </div>

                <FileUpload
                  fieldName={`document.${index}`}
                  label="Upload Document*"
                  files={files}
                  onFileUpload={onFileUpload}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// **STEP 8: Review & Submit**
export const ReviewStep = ({ watch }: StepProps) => {
  const formData = watch();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Review Your Application</h3>
        <p className="text-gray-600">Please review all information before submitting</p>
      </div>

      <div className="space-y-6">
        {/* Claimant Details */}
        <Card>
          <CardHeader>
            <CardTitle>Claimant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Type:</span> {formData.claimantDetails?.type}</div>
              <div><span className="font-medium">Name:</span> {formData.claimantDetails?.name}</div>
              <div><span className="font-medium">Email:</span> {formData.claimantDetails?.email}</div>
              <div><span className="font-medium">Phone:</span> {formData.claimantDetails?.phone}</div>
              <div><span className="font-medium">Address:</span> {formData.claimantDetails?.address1}</div>
              <div><span className="font-medium">City:</span> {formData.claimantDetails?.city}</div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Claimants */}
        {formData.additionalClaimants && formData.additionalClaimants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Claimants ({formData.additionalClaimants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.additionalClaimants.map((claimant: any, index: number) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <h4 className="font-medium mb-2">Claimant {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {claimant.name}</div>
                    <div><span className="font-medium">Email:</span> {claimant.email}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Manager */}
        {formData.manager && formData.manager.name && (
          <Card>
            <CardHeader>
              <CardTitle>Manager Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Name:</span> {formData.manager.name}</div>
                <div><span className="font-medium">Email:</span> {formData.manager.email}</div>
                <div><span className="font-medium">Phone:</span> {formData.manager.phone}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Respondent */}
        <Card>
          <CardHeader>
            <CardTitle>Respondent Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Type:</span> {formData.respondentDetails?.type}</div>
              <div><span className="font-medium">Name:</span> {formData.respondentDetails?.name}</div>
              <div><span className="font-medium">Email:</span> {formData.respondentDetails?.email}</div>
              <div><span className="font-medium">Phone:</span> {formData.respondentDetails?.phone}</div>
            </div>
          </CardContent>
        </Card>

        {/* Dispute */}
        <Card>
          <CardHeader>
            <CardTitle>Dispute Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Category:</span> {formData.dispute?.category}</div>
              <div><span className="font-medium">Nature:</span> {formData.dispute?.nature}</div>
              <div><span className="font-medium">Claim Date:</span> {formData.dispute?.claimDate}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 