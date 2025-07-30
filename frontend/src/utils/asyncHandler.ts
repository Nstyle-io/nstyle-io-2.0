import { toast } from '@/hooks/use-toast';

export type AsyncResult<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
};

export class AsyncHandler {
  /**
   * Safely handles async operations with error catching and loading states
   */
  static async handle<T>(
    asyncFn: () => Promise<T>,
    options: {
      onError?: (error: Error) => void;
      showToast?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<AsyncResult<T>> {
    const { onError, showToast = true, errorMessage = 'An error occurred' } = options;

    try {
      const data = await asyncFn();
      return {
        data,
        error: null,
        loading: false,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Handle custom error callback
      onError?.(errorObj);

      // Show toast notification if enabled
      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('AsyncHandler caught error:', errorObj);
      }

      return {
        data: null,
        error: errorObj,
        loading: false,
      };
    }
  }

  /**
   * Creates a retry mechanism for failed async operations
   */
  static async withRetry<T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError!;
  }

  /**
   * Creates a timeout wrapper for async operations
   */
  static async withTimeout<T>(
    asyncFn: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    return Promise.race([asyncFn(), timeoutPromise]);
  }

  /**
   * Debounces an async function to prevent excessive calls
   */
  static debounce<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;
    let lastResolve: ((value: ReturnType<T>) => void) | null = null;
    let lastReject: ((reason: unknown) => void) | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Cancel previous timeout and reject previous promise
        if (timeoutId) {
          clearTimeout(timeoutId);
          if (lastReject) {
            lastReject(new Error('Debounced call cancelled'));
          }
        }

        lastResolve = resolve;
        lastReject = reject;

        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }
}

/**
 * Hook for handling async operations with loading and error states
 */
export const useAsyncOperation = <T>() => {
  const [state, setState] = React.useState<AsyncResult<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = React.useCallback(async (
    asyncFn: () => Promise<T>,
    options?: Parameters<typeof AsyncHandler.handle>[1]
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const result = await AsyncHandler.handle(asyncFn, options);
    setState(result);
    
    return result;
  }, []);

  const reset = React.useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Import React for the hook
import React from 'react';