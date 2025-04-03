
import { logWarn, logInfo, logDebug } from "./logger.ts";

// Enhanced validation for business profile data
export const validateBusinessProfile = (profile: any) => {
  if (!profile) {
    logWarn("Profile is null or undefined");
    return { isValid: false, details: { reason: "Profile is null or undefined" } };
  }
  
  // Log the entire profile for debugging
  logDebug("Validating business profile", { 
    profileDataKeys: Object.keys(profile)
  });
  
  // Required fields for meaningful business context
  const requiredFields = [
    { key: 'business_name', fallback: 'company_name', required: true },
    { key: 'company_description', required: false },
    { key: 'crew_size', required: false },
    { key: 'specialties', required: false, isArray: true }
  ];
  
  // Count the number of meaningful fields
  let meaningfulFieldCount = 0;
  const validationDetails: Record<string, any> = {};
  
  // Check each required field
  for (const field of requiredFields) {
    const fieldValue = profile[field.key];
    let fallbackValue = null;
    
    if (field.fallback && !fieldValue) {
      fallbackValue = profile[field.fallback];
    }
    
    const value = fieldValue || fallbackValue;
    const isValid = field.isArray ? (Array.isArray(value) && value.length > 0) : !!value;
    
    validationDetails[field.key] = {
      present: isValid,
      value: field.isArray ? (value ? `Array with ${value?.length || 0} items` : 'empty/missing') 
                         : (value || 'missing')
    };
    
    if (isValid) {
      meaningfulFieldCount++;
    } else if (field.required) {
      logWarn(`Required field ${field.key} is missing or invalid`, { value });
    }
  }
  
  // Additional check for any presence of workload field
  if (profile.workload) {
    meaningfulFieldCount++;
    validationDetails.workload = { present: true, value: profile.workload };
  } else {
    validationDetails.workload = { present: false, value: 'missing' };
  }
  
  // Additional check for website
  if (profile.website) {
    meaningfulFieldCount++;
    validationDetails.website = { present: true, value: profile.website };
  } else {
    validationDetails.website = { present: false, value: 'missing' };
  }
  
  // Additional check for business_address
  if (profile.business_address) {
    meaningfulFieldCount++;
    validationDetails.business_address = { present: true, value: profile.business_address };
  } else {
    validationDetails.business_address = { present: false, value: 'missing' };
  }
  
  const isValid = meaningfulFieldCount >= 2;
  
  logInfo(`Business profile validation result: ${isValid ? 'VALID' : 'INVALID'}`, { 
    meaningfulFieldCount,
    validationDetails,
    profileId: profile.id
  });
  
  return { 
    isValid, 
    details: validationDetails,
    meaningfulFieldCount
  };
};
