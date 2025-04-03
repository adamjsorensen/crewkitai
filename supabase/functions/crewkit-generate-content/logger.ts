
// Simple logging utility with timestamp and level support

export function logDebug(message: string, data?: any): void {
  console.log(`[DEBUG] ${message}`, data || '');
}

export function logInfo(message: string, data?: any): void {
  console.log(`[INFO] ${message}`, data || '');
}

export function logWarning(message: string, data?: any): void {
  console.warn(`[WARN] ${message}`, data || '');
}

export function logError(message: string, data?: any): void {
  console.error(`[ERROR] ${message}`, data || '');
}
