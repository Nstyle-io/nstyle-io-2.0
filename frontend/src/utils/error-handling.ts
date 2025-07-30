import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class AppErrorHandler {
  static createError(
    message: string, 
    code?: string, 
    status?: number, 
    details?: unknown
  ): AppError {
    return { message, code, status, details };
  }

  static handleSupabaseError(error: PostgrestError | Error): AppError {
    if ('code' in error && 'message' in error) {
      const postgrestError = error as PostgrestError;
      return {
        message: this.getSupabaseErrorMessage(postgrestError),
        code: postgrestError.code,
        status: parseInt(postgrestError.code) || 500,
        details: postgrestError.details
      };
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      details: error
    };
  }

  static handleNetworkError(error: Error): AppError {
    if (error.message.includes('Failed to fetch')) {
      return {
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
        status: 408
      };
    }

    return {
      message: 'Network error occurred. Please try again.',
      code: 'NETWORK_ERROR',
      status: 500,
      details: error
    };
  }

  static handleValidationError(field: string, message: string): AppError {
    return {
      message: `${field}: ${message}`,
      code: 'VALIDATION_ERROR',
      status: 400,
      details: { field, message }
    };
  }

  private static getSupabaseErrorMessage(error: PostgrestError): string {
    switch (error.code) {
      case '23505':
        return 'This record already exists.';
      case '23503':
        return 'Referenced record does not exist.';
      case '42501':
        return 'You do not have permission to perform this action.';
      case 'PGRST116':
        return 'No matching records found.';
      case 'PGRST301':  
        return 'Multiple records found when only one was expected.';
      default:
        return error.message || 'Database operation failed.';
    }
  }

  static logError(error: AppError, context?: string): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details
      }
    };

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('App Error:', errorLog);
    }

    // In production, you might want to send to error tracking service
    // if (import.meta.env.PROD) {
    //   // Send to Sentry, LogRocket, etc.
    // }
  }
}

export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof Error 
        ? AppErrorHandler.handleSupabaseError(error)
        : AppErrorHandler.createError('Unknown error occurred');
      
      AppErrorHandler.logError(appError, context);
      throw appError;
    }
  };
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed') ||
    error.message.includes('timeout')
  );
}

export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return ['42501', 'PGRST301', 'invalid_credentials'].includes(code);
  }
  return false;
}