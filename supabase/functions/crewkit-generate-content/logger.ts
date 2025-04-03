
// Define log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Set current log level (can be adjusted based on environment)
const CURRENT_LOG_LEVEL = Deno.env.get("LOG_LEVEL") === "debug" 
  ? LogLevel.DEBUG 
  : LogLevel.INFO;

// Simple logger that prefixes messages with their level
export function logDebug(message: string, data?: any) {
  if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
}

export function logInfo(message: string, data?: any) {
  if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
    console.log(`[INFO] ${message}`, data || "");
  }
}

export function logWarn(message: string, data?: any) {
  if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
    console.warn(`[WARN] ${message}`, data || "");
  }
}

export function logError(message: string, data?: any) {
  if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
    console.error(`[ERROR] ${message}`, data || "");
  }
}
