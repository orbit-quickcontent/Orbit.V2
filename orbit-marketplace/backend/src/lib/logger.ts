/**
 * Backend | Lightweight Structured Logger
 *
 * Zero-dependency structured logger providing JSON log format in production
 * and human-readable console output in development.
 *
 * Category: Shared Backend - Utilities
 */

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: string, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    }
    const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message: string, meta?: LogMeta): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: LogMeta): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: LogMeta): void {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: LogMeta): void {
    if (process.env.LOG_LEVEL === 'debug' || !this.isProduction) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
