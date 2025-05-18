interface PincodeData {
  state: string;
  district: string;
  city: string;
}

interface PincodeMap {
  [key: string]: PincodeData;
}

// Major cities pincode data
export const pincodeData: PincodeMap = {
  // Mumbai
  "400001": { state: "Maharashtra", district: "Mumbai", city: "Fort" },
  "400002": { state: "Maharashtra", district: "Mumbai", city: "CST" },
  "400003": { state: "Maharashtra", district: "Mumbai", city: "Ballard Estate" },
  "400004": { state: "Maharashtra", district: "Mumbai", city: "Byculla" },
  "400005": { state: "Maharashtra", district: "Mumbai", city: "Girgaon" },
  
  // Delhi
  "110001": { state: "Delhi", district: "New Delhi", city: "Connaught Place" },
  "110002": { state: "Delhi", district: "New Delhi", city: "Darya Ganj" },
  "110003": { state: "Delhi", district: "New Delhi", city: "Paharganj" },
  "110004": { state: "Delhi", district: "New Delhi", city: "Karol Bagh" },
  "110005": { state: "Delhi", district: "New Delhi", city: "Sadar Bazaar" },
  
  // Bangalore
  "560001": { state: "Karnataka", district: "Bangalore Urban", city: "Bangalore GPO" },
  "560002": { state: "Karnataka", district: "Bangalore Urban", city: "Bangalore Fort" },
  "560003": { state: "Karnataka", district: "Bangalore Urban", city: "Vasanth Nagar" },
  "560004": { state: "Karnataka", district: "Bangalore Urban", city: "Kempegowda Road" },
  "560005": { state: "Karnataka", district: "Bangalore Urban", city: "Malleswaram" },
  
  // Chennai
  "600001": { state: "Tamil Nadu", district: "Chennai", city: "Chennai GPO" },
  "600002": { state: "Tamil Nadu", district: "Chennai", city: "Parrys" },
  "600003": { state: "Tamil Nadu", district: "Chennai", city: "Mount Road" },
  "600004": { state: "Tamil Nadu", district: "Chennai", city: "Park Town" },
  "600005": { state: "Tamil Nadu", district: "Chennai", city: "Triplicane" },
  
  // Kolkata
  "700001": { state: "West Bengal", district: "Kolkata", city: "Kolkata GPO" },
  "700002": { state: "West Bengal", district: "Kolkata", city: "BBD Bagh" },
  "700003": { state: "West Bengal", district: "Kolkata", city: "Dalhousie" },
  "700004": { state: "West Bengal", district: "Kolkata", city: "Esplanade" },
  "700005": { state: "West Bengal", district: "Kolkata", city: "Park Street" },
  
  // Hyderabad
  "500001": { state: "Telangana", district: "Hyderabad", city: "Hyderabad GPO" },
  "500002": { state: "Telangana", district: "Hyderabad", city: "Abids" },
  "500003": { state: "Telangana", district: "Hyderabad", city: "Secunderabad" },
  "500004": { state: "Telangana", district: "Hyderabad", city: "Koti" },
  "500005": { state: "Telangana", district: "Hyderabad", city: "Nampally" },
  
  // Ahmedabad
  "380001": { state: "Gujarat", district: "Ahmedabad", city: "Ahmedabad GPO" },
  "380002": { state: "Gujarat", district: "Ahmedabad", city: "Ellis Bridge" },
  "380003": { state: "Gujarat", district: "Ahmedabad", city: "Navrangpura" },
  "380004": { state: "Gujarat", district: "Ahmedabad", city: "Paldi" },
  "380005": { state: "Gujarat", district: "Ahmedabad", city: "Satellite" },
  
  // Pune
  "411001": { state: "Maharashtra", district: "Pune", city: "Pune GPO" },
  "411002": { state: "Maharashtra", district: "Pune", city: "Camp" },
  "411003": { state: "Maharashtra", district: "Pune", city: "Deccan Gymkhana" },
  "411004": { state: "Maharashtra", district: "Pune", city: "Koregaon Park" },
  "411005": { state: "Maharashtra", district: "Pune", city: "Shivajinagar" },
};

// Helper function to lookup pincode data
export function lookupPincode(pincode: string): PincodeData | null {
  return pincodeData[pincode] || null;
}

// Get unique states from the data
export function getStates(): string[] {
  return [...new Set(Object.values(pincodeData).map(data => data.state))].sort();
}

// Get districts for a state
export function getDistricts(state: string): string[] {
  return [...new Set(
    Object.values(pincodeData)
      .filter(data => data.state === state)
      .map(data => data.district)
  )].sort();
}

// Get cities for a district
export function getCities(district: string): string[] {
  return [...new Set(
    Object.values(pincodeData)
      .filter(data => data.district === district)
      .map(data => data.city)
  )].sort();
} 