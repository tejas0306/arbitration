// Form utility functions

/**
 * Format a phone number to remove non-digit characters and limit length
 */
export const formatPhoneNumber = (value: string, maxLength: number = 10): string => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  // Limit to the specified length
  return cleaned.slice(0, maxLength);
};

/**
 * Sanitize an address string to remove forbidden characters
 */
export const sanitizeAddress = (value: string, maxLength: number = 200): string => {
  // Remove forbidden characters: $%!~`*^+
  const sanitized = value.replace(/[$%!~`*^+]/g, '');
  // Truncate to maximum length
  return sanitized.slice(0, maxLength);
};

/**
 * Create FormData from the form state for submission
 */
export const createFormData = (formValues: any, files: Record<string, File | null> = {}) => {
  const formData = new FormData();

  // Add the draft ID if editing
  if (formValues.draftId) {
    formData.append('id', formValues.draftId);
  }

  // Add structured data as JSON
  formData.append('data', JSON.stringify(formValues));

  // Add files
  Object.entries(files).forEach(([key, file]) => {
    if (file) {
      formData.append(key, file);
    }
  });

  // Handle array file handling
  if (formValues.documents) {
    const { supportingDocuments, evidenceFiles } = formValues.documents;
    
    if (supportingDocuments?.length > 0) {
      supportingDocuments.forEach((file: File, index: number) => {
        formData.append(`supportingDocuments_${index}`, file);
      });
    }
    
    if (evidenceFiles?.length > 0) {
      evidenceFiles.forEach((file: File, index: number) => {
        formData.append(`evidenceFiles_${index}`, file);
      });
    }
  }

  return formData;
};

/**
 * Prepare form values for display (e.g., in Review step)
 */
export const prepareFormForReview = (formValues: any) => {
  const reviewData: Record<string, any> = {};
  
  // Format claimant address for display
  if (formValues.claimant) {
    const c = formValues.claimant;
    reviewData.claimantAddress = `${c.address1}${c.address2 ? `, ${c.address2}` : ''}, ${c.city}, ${c.district}, ${c.state}, ${c.country} - ${c.pincode}`;
    reviewData.claimantPhone = `${c.phoneCountryCode} ${c.phone}`;
  }
  
  // Count documents
  if (formValues.documents) {
    reviewData.supportingDocumentsCount = formValues.documents.supportingDocuments?.length || 0;
    reviewData.evidenceFilesCount = formValues.documents.evidenceFiles?.length || 0;
  }
  
  return reviewData;
};

/**
 * Validate a PAN number
 */
export const validatePAN = (pan: string): boolean => {
  if (!pan) return false;
  // Convert to uppercase for validation
  const uppercasePAN = pan.toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(uppercasePAN);
};

/**
 * Validate a CIN number
 */
export const validateCIN = (cin: string): boolean => {
  if (!cin) return false;
  // Convert to uppercase for validation
  const uppercaseCIN = cin.toUpperCase();
  const cinRegex = /^[LU][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;
  return cinRegex.test(uppercaseCIN);
};

/**
 * Validate a GST number
 */
export const validateGST = (gst: string): boolean => {
  if (!gst) return false;
  // Convert to uppercase for validation
  const uppercaseGST = gst.toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstRegex.test(uppercaseGST)) {
    return false;
  }
  
  // Additional validation: check if the PAN part is valid
  const panPart = uppercaseGST.substring(2, 12);
  return validatePAN(panPart);
};

/**
 * Truncate a string to a maximum length
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str) return '';
  return str.slice(0, maxLength);
}; 