
/**
 * Utilities for working with MCP tools
 * Supports both Windsurf MCP and Supabase Edge Function
 */
import { supabase } from '@/integrations/supabase/client';

// MCP server configuration
const MCP_CONFIG = {
  // Supabase Edge Function URL constructed from env variables or defaults
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL || 
    `${import.meta.env.VITE_SUPABASE_URL || 'https://cicnpivviiqycyudgxxg.supabase.co'}/functions/v1/graphlit-mcp`,
  
  // Default to using Windsurf in development when available
  useWindsurfWhenAvailable: import.meta.env.DEV
};

/**
 * Safely calls an MCP tool with proper error handling
 * Supports both Windsurf MCP and Supabase Edge Function
 * 
 * @param serverName Name of the MCP server (e.g., 'graphlit-mcp-server')
 * @param toolName Name of the tool to call
 * @param params Parameters to pass to the tool
 * @returns Result from the tool or null if unavailable
 */
export async function safeMcpCall<T>(
  serverName: string,
  toolName: string,
  params?: any
): Promise<T | null> {
  // Try Windsurf MCP in development if available
  if (MCP_CONFIG.useWindsurfWhenAvailable && typeof window !== 'undefined' && window.codeium) {
    try {
      return await window.codeium.callMcpTool(serverName, toolName, params);
    } catch (error) {
      console.warn(`Windsurf MCP tool ${toolName} failed, falling back to Edge Function:`, error);
      // Continue to Supabase Edge Function approach
    }
  }
  
  // If Windsurf is not available or failed, use Supabase Edge Function
  try {
    // Get current session token for authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    // Call the Supabase Edge Function
    const response = await fetch(MCP_CONFIG.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serverName,
        toolName,
        params
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling MCP tool ${serverName}.${toolName}:`, error);
    throw error;
  }
}

/**
 * Checks if a specific MCP server is available
 * Will try both Windsurf and Edge Function depending on configuration
 * 
 * @param serverName Name of the MCP server to check
 * @returns Boolean indicating if the server is available
 */
export async function isMcpServerAvailable(serverName: string): Promise<boolean> {
  // Only supporting graphlit-mcp-server for now
  if (serverName !== 'graphlit-mcp-server') {
    return false;
  }
  
  // First, try Windsurf if in development and available
  if (MCP_CONFIG.useWindsurfWhenAvailable && typeof window !== 'undefined' && window.codeium) {
    try {
      await window.codeium.callMcpTool(serverName, 'mcp0_queryCollections', { limit: 1 });
      return true;
    } catch (error) {
      console.log('Windsurf MCP not available, trying Edge Function...');
      // Fall through to Edge Function check
    }
  }
  
  // Next, try Supabase Edge Function
  try {
    // Get current session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      return false; // Not authenticated
    }
    
    // Call health check endpoint
    const response = await fetch(MCP_CONFIG.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serverName,
        toolName: 'health',
        params: {}
      })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.status === 'healthy';
  } catch (error) {
    console.warn(`MCP server ${serverName} not available via Edge Function:`, error);
    return false;
  }
}
