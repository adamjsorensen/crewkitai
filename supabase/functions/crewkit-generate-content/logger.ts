
// Logging levels for different severity
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Set current log level
export const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

// Logging function with severity levels
export const logEvent = async (level: number, message: string, data: any = {}) => {
  if (level >= CURRENT_LOG_LEVEL) {
    const prefix = level === LOG_LEVELS.ERROR ? "❌ ERROR" :
                  level === LOG_LEVELS.WARN ? "⚠️ WARNING" :
                  level === LOG_LEVELS.INFO ? "ℹ️ INFO" : "🔍 DEBUG";
    
    console.log(`[${prefix}][crewkit-generate-content] ${message}`, data);
  }
};

// Log debug information
export const logDebug = (message: string, data: any = {}) => logEvent(LOG_LEVELS.DEBUG, message, data);

// Log information
export const logInfo = (message: string, data: any = {}) => logEvent(LOG_LEVELS.INFO, message, data);

// Log warnings
export const logWarn = (message: string, data: any = {}) => logEvent(LOG_LEVELS.WARN, message, data);

// Log errors
export const logError = (message: string, data: any = {}) => logEvent(LOG_LEVELS.ERROR, message, data);
