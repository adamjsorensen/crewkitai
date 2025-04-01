
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility functions for working with Supabase Edge Functions
 */

// Check if an edge function is available
export const checkEdgeFunctionStatus = async (functionName: string): Promise<{
  isAvailable: boolean;
  error?: string;
}> => {
  try {
    console.log(`Checking status of edge function: ${functionName}`);
    
    // Make a simple GET request to the edge function instead of OPTIONS
    const { error } = await supabase.functions.invoke(functionName, {
      method: 'GET',
    });
    
    if (error) {
      console.error(`Error checking edge function ${functionName}:`, error);
      return { 
        isAvailable: false, 
        error: `Function unavailable: ${error.message}` 
      };
    }
    
    console.log(`Edge function ${functionName} is available`);
    return { isAvailable: true };
  } catch (err: any) {
    console.error(`Failed to check edge function ${functionName}:`, err);
    return { 
      isAvailable: false, 
      error: `Error checking function: ${err.message}` 
    };
  }
};

// Log detailed information about an error
export const logErrorDetails = (error: any, context: string = ""): void => {
  if (!error) return;
  
  const errorDetails = {
    message: error.message || "Unknown error",
    name: error.name,
    code: error.code,
    status: error.status,
    statusText: error.statusText,
    stack: error.stack,
    context
  };
  
  console.error("Detailed error information:", errorDetails);
  
  // If the error has response data, log that too
  if (error.response) {
    try {
      console.error("Error response data:", error.response);
    } catch (e) {
      console.error("Could not log error response data");
    }
  }
};
