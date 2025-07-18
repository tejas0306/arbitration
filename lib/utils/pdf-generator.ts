import jsPDF from 'jspdf';

interface FormData {
  claimant: any;
  additionalClaimants?: any[];
  managerDetails?: any[];
  respondents: any[];
  arbitrationAgreement: any;
  disputeDetails: any;
  natureOfDispute: any;
  prayers: any;
  payment: any;
  arguments: any;
}

export const generateApplicationPDF = async (
  formData: FormData,
  applicationNumber: string
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Set up fonts and styles
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  
  // Helper function to add new page if needed
  const checkPageBreak = (additionalSpace = 0) => {
    if (yPosition + additionalSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = 20;
    }
  };
  
  // Helper function to add text with word wrap
  const addText = (text: string, x = margin, size = 12, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    
    const maxWidth = pdf.internal.pageSize.width - 2 * margin;
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      checkPageBreak();
      pdf.text(line, x, yPosition);
      yPosition += lineHeight;
    }
  };
  
  // Header
  addText('ARBITRATION REQUEST APPLICATION', margin, 16, 'bold');
  yPosition += 5;
  addText(`Application Number: ${applicationNumber}`, margin, 14, 'bold');
  addText(`Date: ${new Date().toLocaleDateString()}`, margin, 12);
  yPosition += 10;
  
  // Claimant Details
  addText('1. CLAIMANT DETAILS', margin, 14, 'bold');
  yPosition += 5;
  addText(`1.1 Type: ${formData.claimant?.type || 'N/A'}`);
  addText(`1.2 Name: ${formData.claimant?.name || 'N/A'}`);
  addText(`1.3 Email: ${formData.claimant?.email || 'N/A'}`);
  addText(`1.4 Phone: ${formData.claimant?.phoneCountryCode || ''} ${formData.claimant?.phone || 'N/A'}`);
  addText(`1.5 Address: ${formData.claimant?.address1 || 'N/A'}`);
  if (formData.claimant?.address2) {
    addText(`            ${formData.claimant.address2}`);
  }
  addText(`1.6 City: ${formData.claimant?.city || 'N/A'}`);
  addText(`1.7 State: ${formData.claimant?.state || 'N/A'}`);
  addText(`1.8 Country: ${formData.claimant?.country || 'N/A'}`);
  addText(`1.9 Pincode: ${formData.claimant?.pincode || 'N/A'}`);
  
  // Business Information
  if (formData.claimant?.gst || formData.claimant?.pan || formData.claimant?.cin) {
    yPosition += 5;
    addText('Business Information:', margin, 12, 'bold');
    if (formData.claimant?.gst) addText(`GST: ${formData.claimant.gst}`);
    if (formData.claimant?.pan) addText(`PAN: ${formData.claimant.pan}`);
    if (formData.claimant?.cin) addText(`CIN: ${formData.claimant.cin}`);
  }
  
  yPosition += 10;
  
  // Additional Claimants
  if (formData.additionalClaimants && formData.additionalClaimants.length > 0) {
    addText('2. ADDITIONAL CLAIMANTS', margin, 14, 'bold');
    yPosition += 5;
    
    formData.additionalClaimants.forEach((claimant, index) => {
      addText(`2.${index + 1} ${claimant.name || 'N/A'}`);
      addText(`     Email: ${claimant.email || 'N/A'}`);
      addText(`     Phone: ${claimant.phoneCountryCode || ''} ${claimant.phone || 'N/A'}`);
    });
    yPosition += 10;
  }
  
  // Respondent Details
  addText('3. RESPONDENT DETAILS', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.respondents && formData.respondents.length > 0) {
    formData.respondents.forEach((respondent, index) => {
      addText(`3.${index + 1} ${respondent.name || 'N/A'}`);
      addText(`     Type: ${respondent.type || 'N/A'}`);
      addText(`     Email: ${respondent.email || 'N/A'}`);
      addText(`     Phone: ${respondent.phoneCountryCode || ''} ${respondent.phone || 'N/A'}`);
      if (respondent.address1) {
        addText(`     Address: ${respondent.address1}`);
      }
    });
  }
  yPosition += 10;
  
  // Arbitration Agreement
  addText('4. ARBITRATION AGREEMENT', margin, 14, 'bold');
  yPosition += 5;
  addText(`Agreement Type: ${formData.arbitrationAgreement?.agreementType || 'N/A'}`);
  if (formData.arbitrationAgreement?.agreementDate) {
    addText(`Agreement Date: ${formData.arbitrationAgreement.agreementDate}`);
  }
  if (formData.arbitrationAgreement?.numberOfArbitrators) {
    addText(`Number of Arbitrators: ${formData.arbitrationAgreement.numberOfArbitrators}`);
  }
  yPosition += 10;
  
  // Nature of Dispute
  addText('5. NATURE OF DISPUTE', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.natureOfDispute && Array.isArray(formData.natureOfDispute)) {
    formData.natureOfDispute.forEach((dispute, index) => {
      addText(`5.${index + 1} ${dispute.title || 'N/A'}`);
      if (dispute.description) {
        addText(`     Description: ${dispute.description}`);
      }
    });
  } else if (formData.disputeDetails) {
    addText(`Dispute Type: ${formData.disputeDetails.disputeType || 'N/A'}`);
    addText(`Dispute Amount: ${formData.disputeDetails.disputeAmount || 'N/A'}`);
    if (formData.disputeDetails.disputeDescription) {
      addText(`Description: ${formData.disputeDetails.disputeDescription}`);
    }
  }
  yPosition += 10;
  
  // Prayers and Reliefs
  addText('6. PRAYERS AND RELIEFS', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.prayers) {
    if (typeof formData.prayers === 'string') {
      addText(formData.prayers);
    } else if (formData.prayers.reliefSought) {
      addText(formData.prayers.reliefSought);
    }
  }
  yPosition += 10;
  
  // Payment Information
  addText('7. PAYMENT INFORMATION', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.payment) {
    addText(`Payment Head: ${formData.payment.paymentHead || 'N/A'}`);
    addText(`Payment Amount: ₹${formData.payment.paymentAmount || 'N/A'}`);
    if (formData.payment.paymentDetails) {
      addText(`Payment Details: ${formData.payment.paymentDetails}`);
    }
  }
  yPosition += 10;
  
  // Arguments
  if (formData.arguments) {
    addText('8. ARGUMENTS', margin, 14, 'bold');
    yPosition += 5;
    
    if (typeof formData.arguments === 'string') {
      addText(formData.arguments);
    } else if (formData.arguments.legalArguments) {
      addText(formData.arguments.legalArguments);
    }
  }
  
  // Footer
  checkPageBreak(30);
  yPosition += 20;
  addText('_'.repeat(50), margin);
  addText('Signature of Claimant', margin);
  addText(`Date: ${new Date().toLocaleDateString()}`, margin);
  
  // Convert to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 