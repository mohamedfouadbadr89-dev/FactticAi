/**
 * Base Logging System
 * 
 * Implements standard logging with levels.
 * Integration with audit_logs will be handled in DB layer.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * IMPORTANT:
 * exactOptionalPropertyTypes = true
 * لذلك لازم optional fields تقبل undefined صراحةً.
 */
export interface LogContext {
  request_id?: string | undefined;
  org_id?: string | undefined;
  agent_id?: string | undefined;
  agent_version?: string | undefined;
  status?: number | undefined;
  [key: string]: any;
}

export const logger = {
  log: (level: LogLevel, message: string, meta?: LogContext) => {
    const timestamp = new Date().toISOString();

    // Tag 4xx vs 5xx for errors
    let errorCategory: string | undefined = undefined;

    if (level === 'ERROR' && meta?.status !== undefined) {
      errorCategory =
        meta.status >= 500
          ? 'SERVER_ERROR_5XX'
          : 'CLIENT_ERROR_4XX';
    }

    const logEntry = {
      timestamp,
      level,
      message,
      ...(errorCategory !== undefined && { errorCategory }),
      ...(meta !== undefined && { meta }),
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }

    // Level 1 logic only.
    // Audit logs integration handled in DB layer.
  },

  info: (message: string, meta?: LogContext) =>
    logger.log('INFO', message, meta),

  warn: (message: string, meta?: LogContext) =>
    logger.log('WARN', message, meta),

  error: (message: string, meta?: LogContext) =>
    logger.log('ERROR', message, meta),

  debug: (message: string, meta?: LogContext) =>
    logger.log('DEBUG', message, meta),
};