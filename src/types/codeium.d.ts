/**
 * Type declarations for Codeium MCP tools
 */

interface CodeiumMcpTools {
  callMcpTool: (serverName: string, toolName: string, params?: any) => Promise<any>;
}

interface Window {
  codeium?: CodeiumMcpTools;
}
