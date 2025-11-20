/**
 * Structured logging utility for consistent error tracking and debugging
 * Production-ready with severity levels and context tracking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  requestId?: string;
  page?: string;
  action?: string;
  [key: string]: string | number | boolean | undefined;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDev ? error.stack : undefined,
      } : undefined,
    };
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: LogContext, error?: Error) {
    console.warn(`[WARN] ${message}`, this.formatLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error) {
    console.error(`[ERROR] ${message}`, this.formatLog('error', message, context, error));
  }

  fatal(message: string, context?: LogContext, error?: Error) {
    console.error(`[FATAL] ${message}`, this.formatLog('fatal', message, context, error));
  }
}

export const logger = new Logger();
