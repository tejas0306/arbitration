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
  documents: any;
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
  
  // 1. Claimant Details
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
  
  // 2. Additional Claimants
  if (formData.additionalClaimants && formData.additionalClaimants.length > 0) {
    addText('2. ADDITIONAL CLAIMANTS', margin, 14, 'bold');
    yPosition += 5;
    
    formData.additionalClaimants.forEach((claimant, index) => {
      if (claimant?.name) {
        addText(`2.${index + 1} ${claimant.name || 'N/A'}`);
        addText(`     Type: ${claimant.type || 'N/A'}`);
        addText(`     Email: ${claimant.email || 'N/A'}`);
        addText(`     Phone: ${claimant.phoneCountryCode || ''} ${claimant.phone || 'N/A'}`);
        if (claimant.address1) {
          addText(`     Address: ${claimant.address1}`);
          if (claimant.address2) addText(`            ${claimant.address2}`);
          if (claimant.city) addText(`            ${claimant.city}`);
          if (claimant.state) addText(`            ${claimant.state}`);
          if (claimant.country) addText(`            ${claimant.country}`);
          if (claimant.pincode) addText(`            ${claimant.pincode}`);
        }
        if (claimant.gst) addText(`     GST: ${claimant.gst}`);
        if (claimant.pan) addText(`     PAN: ${claimant.pan}`);
        if (claimant.cin) addText(`     CIN: ${claimant.cin}`);
        yPosition += 5;
      }
    });
    yPosition += 5;
  }
  
  // 3. Manager Details
  if (formData.managerDetails && formData.managerDetails.length > 0) {
    addText('3. MANAGER DETAILS', margin, 14, 'bold');
    yPosition += 5;
    
    formData.managerDetails.forEach((manager, index) => {
      if (manager?.name) {
        addText(`3.${index + 1} ${manager.name || 'N/A'}`);
        addText(`     Designation: ${manager.designation || 'N/A'}`);
        addText(`     Email: ${manager.email || 'N/A'}`);
        addText(`     Phone: ${manager.phoneCountryCode || ''} ${manager.phone || 'N/A'}`);
        addText(`     Manager ID: ${manager.managerId || 'N/A'}`);
        if (manager.address1) {
          addText(`     Address: ${manager.address1}`);
          if (manager.address2) addText(`            ${manager.address2}`);
          if (manager.city) addText(`            ${manager.city}`);
          if (manager.state) addText(`            ${manager.state}`);
          if (manager.country) addText(`            ${manager.country}`);
          if (manager.pincode) addText(`            ${manager.pincode}`);
        }
        if (manager.gst) addText(`     GST: ${manager.gst}`);
        if (manager.pan) addText(`     PAN: ${manager.pan}`);
        if (manager.cin) addText(`     CIN: ${manager.cin}`);
        yPosition += 5;
      }
    });
    yPosition += 5;
  }
  
  // 4. Respondent Details
  addText('4. RESPONDENT DETAILS', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.respondents && formData.respondents.length > 0) {
    formData.respondents.forEach((respondent, index) => {
      if (respondent?.name) {
        addText(`4.${index + 1} ${respondent.name || 'N/A'}`);
        addText(`     Type: ${respondent.type || 'N/A'}`);
        addText(`     Email: ${respondent.email || 'N/A'}`);
        addText(`     Phone: ${respondent.phoneCountryCode || ''} ${respondent.phone || 'N/A'}`);
        if (respondent.address1) {
          addText(`     Address: ${respondent.address1}`);
          if (respondent.address2) addText(`            ${respondent.address2}`);
          if (respondent.city) addText(`            ${respondent.city}`);
          if (respondent.state) addText(`            ${respondent.state}`);
          if (respondent.country) addText(`            ${respondent.country}`);
          if (respondent.pincode) addText(`            ${respondent.pincode}`);
        }
        if (respondent.gst) addText(`     GST: ${respondent.gst}`);
        if (respondent.pan) addText(`     PAN: ${respondent.pan}`);
        if (respondent.cin) addText(`     CIN: ${respondent.cin}`);
        yPosition += 5;
      }
    });
  }
  yPosition += 10;
  
  // 5. Arbitration Agreement
  addText('5. ARBITRATION AGREEMENT', margin, 14, 'bold');
  yPosition += 5;
  addText(`Agreement Type: ${formData.arbitrationAgreement?.agreementType || 'N/A'}`);
  if (formData.arbitrationAgreement?.agreementDate) {
    addText(`Agreement Date: ${formData.arbitrationAgreement.agreementDate}`);
  }
  if (formData.arbitrationAgreement?.numberOfArbitrators) {
    addText(`Number of Arbitrators: ${formData.arbitrationAgreement.numberOfArbitrators}`);
  }
  if (formData.arbitrationAgreement?.arbitratorSelection) {
    addText(`Arbitrator Selection: ${formData.arbitrationAgreement.arbitratorSelection}`);
  }
  if (formData.arbitrationAgreement?.venue) {
    addText(`Venue: ${formData.arbitrationAgreement.venue}`);
  }
  if (formData.arbitrationAgreement?.governingLaw) {
    addText(`Governing Law: ${formData.arbitrationAgreement.governingLaw}`);
  }
  if (formData.arbitrationAgreement?.arbitrationText) {
    addText(`Arbitration Clause: ${formData.arbitrationAgreement.arbitrationText}`);
  }
  yPosition += 10;
  
  // 6. Nature of Dispute
  addText('6. NATURE OF DISPUTE', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.natureOfDispute && Array.isArray(formData.natureOfDispute)) {
    formData.natureOfDispute.forEach((dispute, index) => {
      addText(`6.${index + 1} ${dispute.title || 'N/A'}`);
      addText(`     Category: ${dispute.category || 'N/A'}`);
      if (dispute.description) {
        addText(`     Description: ${dispute.description}`);
      }
      yPosition += 3;
    });
  } else if (formData.disputeDetails) {
    addText(`Dispute Type: ${formData.disputeDetails.disputeType || 'N/A'}`);
    addText(`Dispute Amount: ${formData.disputeDetails.disputeAmount || 'N/A'}`);
    if (formData.disputeDetails.disputeDescription) {
      addText(`Description: ${formData.disputeDetails.disputeDescription}`);
    }
  }
  yPosition += 10;
  
  // 7. Prayers and Reliefs
  addText('7. PRAYERS AND RELIEFS', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.prayers && formData.prayers.prayers && Array.isArray(formData.prayers.prayers)) {
    formData.prayers.prayers.forEach((prayer, index) => {
      addText(`7.${index + 1} ${prayer.title || 'N/A'}`);
      addText(`     Relief Type: ${prayer.reliefType || 'N/A'}`);
      if (prayer.amount) {
        addText(`     Amount: ₹${prayer.amount}`);
      }
      if (prayer.description) {
        addText(`     Description: ${prayer.description}`);
      }
      yPosition += 3;
    });
  } else if (typeof formData.prayers === 'string') {
    addText(formData.prayers);
  }
  yPosition += 10;
  
  // 8. Arguments
  if (formData.arguments && formData.arguments.argumentsPerPrayer && formData.arguments.argumentsPerPrayer.length > 0) {
    addText('8. LEGAL ARGUMENTS', margin, 14, 'bold');
    yPosition += 5;
    
    formData.arguments.argumentsPerPrayer.forEach((argument, index) => {
      addText(`8.${index + 1} ${argument.prayerTitle || 'N/A'}`);
      if (argument.argument) {
        addText(`     Argument: ${argument.argument}`);
      }
      if (argument.legalBasis) {
        addText(`     Legal Basis: ${argument.legalBasis}`);
      }
      if (argument.factualBasis) {
        addText(`     Factual Basis: ${argument.factualBasis}`);
      }
      if (argument.precedents) {
        addText(`     Precedents: ${argument.precedents}`);
      }
      yPosition += 3;
    });
    yPosition += 5;
  }
  
  // 9. Documents
  if (formData.documents) {
    addText('9. SUPPORTING DOCUMENTS', margin, 14, 'bold');
    yPosition += 5;
    
    // Scanned Documents
    if (formData.documents.scannedDocuments && formData.documents.scannedDocuments.length > 0) {
      addText('Scanned Documents:', margin, 12, 'bold');
      formData.documents.scannedDocuments.forEach((doc, index) => {
        addText(`     ${index + 1}. ${doc.documentType || 'Document'}`);
        if (doc.date) addText(`        Date: ${doc.date}`);
        if (doc.description) addText(`        Description: ${doc.description}`);
        if (doc.linkedIssue) addText(`        Linked Issue: ${doc.linkedIssue}`);
        addText(`        Admission Status: ${doc.admissionStatus || 'pending'}`);
        yPosition += 2;
      });
    }
    
    // Affidavits
    if (formData.documents.affidavits && formData.documents.affidavits.length > 0) {
      addText('Affidavits:', margin, 12, 'bold');
      formData.documents.affidavits.forEach((affidavit, index) => {
        addText(`     ${index + 1}. ${affidavit.affidavitType || 'Affidavit'}`);
        if (affidavit.date) addText(`        Date: ${affidavit.date}`);
        if (affidavit.description) addText(`        Description: ${affidavit.description}`);
        yPosition += 2;
      });
    }
    
    // Electronic Evidence
    if (formData.documents.electronicEvidence && formData.documents.electronicEvidence.length > 0) {
      addText('Electronic Evidence:', margin, 12, 'bold');
      formData.documents.electronicEvidence.forEach((evidence, index) => {
        addText(`     ${index + 1}. ${evidence.evidenceType || 'Evidence'}`);
        if (evidence.date) addText(`        Date: ${evidence.date}`);
        if (evidence.description) addText(`        Description: ${evidence.description}`);
        if (evidence.certificateFile) addText(`        Certificate: ${evidence.certificateFile.name || 'Uploaded'}`);
        if (evidence.supportingFiles && evidence.supportingFiles.length > 0) {
          addText(`        Supporting Files: ${evidence.supportingFiles.length} file(s)`);
        }
        yPosition += 2;
      });
    }
    
    // Supporting Documents
    if (formData.documents.supportingDocuments && formData.documents.supportingDocuments.length > 0) {
      addText(`Supporting Documents: ${formData.documents.supportingDocuments.length} file(s) uploaded`);
    }
    
    // Evidence Files
    if (formData.documents.evidenceFiles && formData.documents.evidenceFiles.length > 0) {
      addText(`Evidence Files: ${formData.documents.evidenceFiles.length} file(s) uploaded`);
    }
  }
  yPosition += 10;
  
  // 10. Payment Information
  addText('10. PAYMENT INFORMATION', margin, 14, 'bold');
  yPosition += 5;
  
  if (formData.payment) {
    addText(`Payment Head: ${formData.payment.paymentHead || 'N/A'}`);
    addText(`Payment Amount: ₹${formData.payment.paymentAmount || 'N/A'}`);
    if (formData.payment.paymentDetails) {
      addText(`Payment Details: ${formData.payment.paymentDetails}`);
    }
    if (formData.payment.paymentMethod) {
      addText(`Payment Method: ${formData.payment.paymentMethod}`);
    }
    if (formData.payment.transactionId) {
      addText(`Transaction ID: ${formData.payment.transactionId}`);
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