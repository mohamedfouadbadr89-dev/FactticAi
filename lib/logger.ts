/**
 * Base Logging System
 * 
 * Implements standard logging with levels.
 * Integration with audit_logs will be handled in DB layer.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export const logger = {
  log: (level: LogLevel, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    // Standard output for now
    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }

    // Level 1 logic: Simple logging. 
    // Audit logs integration happens at the API/DB layer.
  },
  info: (message: string, meta?: any) => logger.log('INFO', message, meta),
  warn: (message: string, meta?: any) => logger.log('WARN', message, meta),
  error: (message: string, meta?: any) => logger.log('ERROR', message, meta),
  debug: (message: string, meta?: any) => logger.log('DEBUG', message, meta),
};
