/**
 * Simplified Logger Utility for PPM Backend
 * Basic logging with structured output for development
 */

// Log context interface
export interface LogContext {
  [key: string]: any;
}

// Simple console logger for development
class SimpleLogger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logLine += ` ${JSON.stringify(context)}`;
    }
    
    return logLine;
  }

  public error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  public debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(this.formatMessage('debug', message, context));
    }
  }
}

// Export singleton instance
export const logger = new SimpleLogger();