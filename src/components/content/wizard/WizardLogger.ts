
// Logging utility for the prompt wizard components
export const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.DEBUG;

export const createLogger = (namespace: string) => ({
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[${namespace}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[${namespace}] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[${namespace}] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[${namespace}] ${message}`, ...args);
  }
});
