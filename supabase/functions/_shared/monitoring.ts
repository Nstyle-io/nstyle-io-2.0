// Shared monitoring and observability utilities for Edge Functions

interface LogContext {
  functionName: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  context?: Record<string, any>;
}

export class FunctionMonitor {
  private functionName: string;
  private startTime: number;
  private context: LogContext;
  
  constructor(functionName: string, context: Partial<LogContext> = {}) {
    this.functionName = functionName;
    this.startTime = Date.now();
    this.context = {
      functionName,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...context
    };
  }
  
  /**
   * Log structured information
   */
  info(message: string, data?: Record<string, any>): void {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...this.context,
      ...data
    }));
  }
  
  /**
   * Log warning
   */
  warn(message: string, data?: Record<string, any>): void {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...this.context,
      ...data
    }));
  }
  
  /**
   * Log error with stack trace
   */
  error(message: string, error?: Error, data?: Record<string, any>): void {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...this.context,
      ...data
    }));
  }
  
  /**
   * Track performance metric
   */
  metric(name: string, duration?: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration: duration ?? (Date.now() - this.startTime),
      timestamp: Date.now(),
      context: { ...this.context, ...context }
    };
    
    console.log(JSON.stringify({
      level: 'metric',
      ...metric
    }));
    
    // Alert on slow operations
    if (metric.duration > 5000) {
      this.warn(`Slow operation detected: ${name}`, { duration: metric.duration });
    }
  }
  
  /**
   * Track database query performance
   */
  trackQuery(query: string, duration: number, rowCount?: number): void {
    this.metric('database_query', duration, {
      query: query.substring(0, 100), // Truncate long queries
      rowCount
    });
    
    // Alert on slow queries
    if (duration > 1000) {
      this.warn('Slow database query', {
        query: query.substring(0, 200),
        duration,
        rowCount
      });
    }
  }
  
  /**
   * Track API response
   */
  trackResponse(status: number, responseSize?: number): void {
    const duration = Date.now() - this.startTime;
    
    this.metric('api_response', duration, {
      status,
      responseSize,
      success: status >= 200 && status < 400
    });
    
    // Log based on status
    if (status >= 500) {
      this.error('Server error response', undefined, { status });
    } else if (status >= 400) {
      this.warn('Client error response', { status });
    } else {
      this.info('Successful response', { status, duration });
    }
  }
  
  /**
   * Set user context for request tracking
   */
  setUser(userId: string, email?: string): void {
    this.context.userId = userId;
    this.context.userEmail = email;
  }
  
  /**
   * Add additional context
   */
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }
}

/**
 * Database query monitoring wrapper
 */
export async function monitorQuery<T>(
  monitor: FunctionMonitor,
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    monitor.trackQuery(queryName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    monitor.error(`Query failed: ${queryName}`, error as Error, { duration });
    throw error;
  }
}

/**
 * Health check utilities
 */
export const healthCheck = {
  /**
   * Basic function health status
   */
  getStatus: () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
    memory: typeof Deno !== 'undefined' ? Deno.memoryUsage() : undefined
  }),
  
  /**
   * Database connectivity check
   */
  checkDatabase: async (supabase: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      return {
        database: error ? 'unhealthy' : 'healthy',
        error: error?.message
      };
    } catch (error) {
      return {
        database: 'unhealthy',
        error: (error as Error).message
      };
    }
  }
};

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
  
  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const windowStart = Date.now() - this.windowMs;
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  private cleanup(): void {
    const windowStart = Date.now() - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}