interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private getBaseContext(): ErrorContext {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
    };
  }

  private formatError(error: Error | string, context?: ErrorContext): Record<string, unknown> {
    const baseContext = this.getBaseContext();
    
    return {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'CustomError',
      context: { ...baseContext, ...context },
    };
  }

  private logToConsole(level: string, formattedError: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.group(`🔥 ${level.toUpperCase()} Log`);
      console.error('Message:', formattedError.message);
      console.error('Context:', formattedError.context);
      if (formattedError.stack) {
        console.error('Stack:', formattedError.stack);
      }
      console.groupEnd();
    }
  }

  private async logToRemote(level: string, formattedError: Record<string, unknown>): Promise<void> {
    if (!this.isProduction) return;

    try {
      // In production, you would send this to your logging service
      // Example endpoints: Sentry, LogRocket, DataDog, etc.
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          ...formattedError,
        }),
      });
    } catch (logError) {
      // Silently fail - don't create infinite loops
      console.warn('Failed to log error remotely:', logError);
    }
  }

  private async logToSupabase(level: string, formattedError: Record<string, unknown>): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('error_logs').insert({
        level,
        message: formattedError.message as string,
        stack: formattedError.stack as string,
        context: formattedError.context,
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn('Failed to log to Supabase:', logError);
    }
  }

  async log(
    level: keyof LogLevel,
    error: Error | string,
    context?: ErrorContext
  ): Promise<void> {
    const formattedError = this.formatError(error, context);
    
    // Always log to console in development
    this.logToConsole(level, formattedError);
    
    // Log to remote services based on level
    if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN) {
      await Promise.allSettled([
        this.logToRemote(level, formattedError),
        this.logToSupabase(level, formattedError),
      ]);
    }
  }

  async error(error: Error | string, context?: ErrorContext): Promise<void> {
    await this.log(LOG_LEVELS.ERROR, error, context);
  }

  async warn(message: string, context?: ErrorContext): Promise<void> {
    await this.log(LOG_LEVELS.WARN, message, context);
  }

  async info(message: string, context?: ErrorContext): Promise<void> {
    await this.log(LOG_LEVELS.INFO, message, context);
  }

  async debug(message: string, context?: ErrorContext): Promise<void> {
    if (this.isDevelopment) {
      await this.log(LOG_LEVELS.DEBUG, message, context);
    }
  }

  // React Error Boundary specific logging
  async logReactError(error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext): Promise<void> {
    const enhancedContext = {
      ...context,
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    };

    await this.error(error, enhancedContext);
  }

  // Async/Promise rejection logging
  setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          component: 'GlobalHandler',
          action: 'unhandledrejection',
          metadata: { reason: event.reason },
        }
      );
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      this.error(
        event.error || new Error(event.message),
        {
          component: 'GlobalHandler',
          action: 'javascript_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        }
      );
    });
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Initialize global error handlers
errorLogger.setupGlobalErrorHandlers();

// Export types for use in components
export type { ErrorContext };
export { LOG_LEVELS };