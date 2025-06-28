// Form option constants

export const ENTITY_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
];

export const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "United States" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+66", country: "Thailand" },
  { code: "+84", country: "Vietnam" },
  { code: "+62", country: "Indonesia" },
];

export const AGREEMENT_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "agreement", label: "Agreement" },
  { value: "other", label: "Other" },
];

export const RESOLUTION_MODES = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
];

export const ARBITRATOR_SELECTIONS = [
  { value: "sole", label: "Sole Arbitrator" },
  { value: "panel", label: "Panel of Arbitrators" },
  { value: "institution", label: "Institutional Appointment" },
  { value: "court", label: "Court Appointment" },
];

export const DISPUTE_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "construction", label: "Construction" },
  { value: "employment", label: "Employment" },
  { value: "intellectual_property", label: "Intellectual Property" },
  { value: "other", label: "Other" },
];

export const SERVICE_TYPES = [
  { value: "fast_track", label: "Fast Track" },
  { value: "regular", label: "Regular" },
  { value: "emergency", label: "Emergency" },
  { value: "institutional", label: "Institutional" },
];

export const DISPUTE_CATEGORIES = [
  { value: "contractual", label: "Contractual" },
  { value: "corporate", label: "Corporate" },
  { value: "real_estate", label: "Real Estate" },
  { value: "banking", label: "Banking & Finance" },
  { value: "international", label: "International" },
  { value: "employment", label: "Employment" },
  { value: "other", label: "Other" },
];

export const DISPUTE_SUB_CATEGORIES = [
  { value: "breach", label: "Breach of Contract" },
  { value: "payment", label: "Payment Dispute" },
  { value: "quality", label: "Quality/Performance Issue" },
  { value: "delivery", label: "Delivery Delay" },
  { value: "warranty", label: "Warranty Claim" },
  { value: "termination", label: "Contract Termination" },
  { value: "other", label: "Other" },
];

export const DISPUTE_NATURES = [
  { value: "civil", label: "Civil" },
  { value: "commercial", label: "Commercial" },
  { value: "constitutional", label: "Constitutional" },
  { value: "family", label: "Family" },
  { value: "property", label: "Property" },
  { value: "other", label: "Other" },
];

export const RELIEF_SOUGHT_OPTIONS = [
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
];

export const PAYMENT_HEADS = [
  { value: "filing_fee", label: "Filing Fee" },
  { value: "arbitrator_fee", label: "Arbitrator Fee" },
  { value: "administrative_fee", label: "Administrative Fee" },
  { value: "emergency_fee", label: "Emergency Arbitration Fee" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_TYPES = {
  SUPPORTING: [
    { value: "contract", label: "Contract" },
    { value: "invoice", label: "Invoice" },
    { value: "correspondence", label: "Correspondence" },
    { value: "legal_notice", label: "Legal Notice" },
    { value: "expert_report", label: "Expert Report" },
    { value: "witness_statement", label: "Witness Statement" },
    { value: "other", label: "Other" },
  ],
  EVIDENCE: [
    { value: "photo", label: "Photographs" },
    { value: "video", label: "Video Evidence" },
    { value: "audio", label: "Audio Recording" },
    { value: "report", label: "Technical Report" },
    { value: "test_results", label: "Test Results" },
    { value: "other", label: "Other" },
  ],
};

export const FORM_STEPS = [
  "Claimant Details",
  "Additional Claimants & Manager",
  "Respondent Details",
  "Arbitration Agreement",
  "Dispute Details",
  "Prayers & Reliefs",
  "Documents",
  "Payment",
  "Arguments",
  "Review & Submit",
]; 