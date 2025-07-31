import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorLogger } from '../errorLogger';

// Mock fetch
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('ErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log error messages', async () => {
      await errorLogger.error('Test error message');
      
      expect(console.group).toHaveBeenCalledWith('🔥 ERROR Log');
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test error message');
    });

    it('should log warning messages', async () => {
      await errorLogger.warn('Test warning message');
      
      expect(console.group).toHaveBeenCalledWith('🔥 WARN Log');
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test warning message');
    });

    it('should log info messages', async () => {
      await errorLogger.info('Test info message');
      
      expect(console.group).toHaveBeenCalledWith('🔥 INFO Log');
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test info message');
    });
  });

  describe('error context', () => {
    it('should include base context in logs', async () => {
      await errorLogger.error('Test error');
      
      expect(console.error).toHaveBeenCalledWith(
        'Context:',
        expect.objectContaining({
          userAgent: expect.any(String),
          url: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should merge custom context with base context', async () => {
      const customContext = {
        userId: 'user123',
        component: 'TestComponent',
      };

      await errorLogger.error('Test error', customContext);
      
      expect(console.error).toHaveBeenCalledWith(
        'Context:',
        expect.objectContaining({
          userAgent: expect.any(String),
          url: expect.any(String),
          timestamp: expect.any(Date),
          userId: 'user123',
          component: 'TestComponent',
        })
      );
    });
  });

  describe('React error logging', () => {
    it('should log React errors with component stack', async () => {
      const error = new Error('React component error');
      const errorInfo = {
        componentStack: '\n    in TestComponent\n    in App',
      };

      await errorLogger.logReactError(error, errorInfo);
      
      expect(console.error).toHaveBeenCalledWith(
        'Context:',
        expect.objectContaining({
          component: 'ErrorBoundary',
          componentStack: '\n    in TestComponent\n    in App',
        })
      );
    });
  });

  describe('error formatting', () => {
    it('should format Error objects correctly', async () => {
      const error = new Error('Test error message');
      error.name = 'TestError';

      await errorLogger.error(error);
      
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test error message');
    });

    it('should format string errors correctly', async () => {
      await errorLogger.error('String error message');
      
      expect(console.error).toHaveBeenCalledWith('Message:', 'String error message');
    });
  });
});