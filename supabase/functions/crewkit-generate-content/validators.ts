
// Profile validation logic
export function validateBusinessProfile(profile: any) {
  if (!profile) {
    return { 
      isValid: false, 
      meaningfulFieldCount: 0,
      details: "No profile data provided" 
    };
  }

  // Count meaningful fields (those with actual content)
  let meaningfulFields = 0;

  // Required fields with higher weight for validation
  const importantFields = [
    'business_name', 
    'company_name',
    'company_description'
  ];

  // Secondary fields that are helpful but not critical
  const secondaryFields = [
    'full_name',
    'business_address',
    'website',
    'crew_size',
    'specialties'
  ];

  // Check important fields
  let hasImportantField = false;
  for (const field of importantFields) {
    if (profile[field] && typeof profile[field] === 'string' && profile[field].trim().length > 2) {
      meaningfulFields += 2;  // Give more weight to important fields
      hasImportantField = true;
    }
  }

  // Check secondary fields
  let secondaryFieldCount = 0;
  for (const field of secondaryFields) {
    if (profile[field]) {
      if (field === 'specialties' && Array.isArray(profile[field]) && profile[field].length > 0) {
        meaningfulFields++;
        secondaryFieldCount++;
      } else if (typeof profile[field] === 'string' && profile[field].trim().length > 0) {
        meaningfulFields++;
        secondaryFieldCount++;
      }
    }
  }

  // Valid if has at least one important field and total meaningful content is sufficient
  const isValid = hasImportantField && meaningfulFields >= 3;

  return {
    isValid,
    meaningfulFieldCount: meaningfulFields,
    details: isValid 
      ? `Profile has sufficient data (${meaningfulFields} meaningful fields)` 
      : `Profile lacks sufficient data (${meaningfulFields} meaningful fields, important field present: ${hasImportantField})`
  };
}
