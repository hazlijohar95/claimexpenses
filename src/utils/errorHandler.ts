// Global error handling utilities
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string | undefined;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'javascript' | 'network' | 'api' | 'auth' | 'validation' | 'unknown';
}

class GlobalErrorHandler {
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupGlobalHandlers();
    this.setupNetworkHandlers();
  }

  private setupGlobalHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          component: 'Global',
          action: 'unhandled_error',
          url: event.filename,
          additionalData: {
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        severity: 'high',
        type: 'javascript',
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        context: {
          component: 'Global',
          action: 'unhandled_promise_rejection',
          additionalData: {
            reason: event.reason,
          },
        },
        severity: 'high',
        type: 'javascript',
      });
      
      // Prevent the default browser error handling
      event.preventDefault();
    });
  }

  private setupNetworkHandlers() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
      this.handleError({
        message: 'Network connection restored',
        context: {
          component: 'Network',
          action: 'connection_restored',
        },
        severity: 'low',
        type: 'network',
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleError({
        message: 'Network connection lost',
        context: {
          component: 'Network',
          action: 'connection_lost',
        },
        severity: 'medium',
        type: 'network',
      });
    });
  }

  public handleError(errorData: Omit<ErrorReport, 'id'>) {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      ...errorData,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...errorData.context,
      },
    };

    // Log to console in development
    if (process.env['NODE_ENV'] === 'development') {
      this.logErrorToConsole(errorReport);
    }

    // Add to queue for reporting
    this.errorQueue.push(errorReport);

    // Try to flush immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }

    return errorReport.id;
  }

  private logErrorToConsole(errorReport: ErrorReport) {
    const severity = errorReport.severity;
    const emoji = {
      low: '💡',
      medium: '⚠️',
      high: '🚨',
      critical: '💥'
    }[severity];

    const style = {
      low: 'color: #3B82F6',
      medium: 'color: #F59E0B',
      high: 'color: #EF4444',
      critical: 'color: #DC2626; font-weight: bold'
    }[severity];

    console.group(`%c${emoji} ${severity.toUpperCase()} ERROR [${errorReport.type}]`, style);
    console.error('Message:', errorReport.message);
    console.error('ID:', errorReport.id);
    console.error('Context:', errorReport.context);
    if (errorReport.stack) {
      console.error('Stack:', errorReport.stack);
    }
    console.groupEnd();
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In development, just log the errors
      if (process.env['NODE_ENV'] === 'development') {
        console.log('📊 Error Queue (would be sent to error service):', errors);
        return;
      }

      // In production, send to error reporting service
      // Example integrations:
      
      // 1. Send to your own API
      // await fetch('/api/errors/batch', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors }),
      // });

      // 2. Send to Sentry
      // errors.forEach(error => {
      //   Sentry.captureException(new Error(error.message), {
      //     tags: { type: error.type, severity: error.severity },
      //     contexts: { error_context: error.context },
      //   });
      // });

      // 3. Send to LogRocket
      // errors.forEach(error => {
      //   LogRocket.captureException(new Error(error.message));
      // });

      console.log('✅ Error queue flushed successfully');
    } catch (error) {
      console.error('❌ Failed to flush error queue:', error);
      // Re-add errors to queue if failed to send
      this.errorQueue.unshift(...errors);
    }
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2);
    return `err_${timestamp}_${random}`;
  }

  // Public methods for manual error reporting
  public reportError(error: Error, context?: Partial<ErrorContext>) {
    return this.handleError({
      message: error.message,
      stack: error.stack,
      context: context || {},
      severity: 'medium',
      type: 'javascript',
    });
  }

  public reportApiError(error: unknown, endpoint: string, method: string) {
    const message = error instanceof Error ? error.message : 'API request failed';
    return this.handleError({
      message,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        component: 'API',
        action: 'api_request_failed',
        additionalData: { endpoint, method, error },
      },
      severity: 'medium',
      type: 'api',
    });
  }

  public reportAuthError(error: unknown, action: string) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return this.handleError({
      message,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        component: 'Auth',
        action,
      },
      severity: 'high',
      type: 'auth',
    });
  }

  public reportValidationError(field: string, value: unknown, rule: string) {
    return this.handleError({
      message: `Validation failed for field: ${field}`,
      context: {
        component: 'Validation',
        action: 'validation_failed',
        additionalData: { field, value, rule },
      },
      severity: 'low',
      type: 'validation',
    });
  }

  // Get error statistics
  public getErrorStats() {
    const total = this.errorQueue.length;
    const bySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byType = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, bySeverity, byType };
  }
}

// Create global instance
export const globalErrorHandler = new GlobalErrorHandler();

// Utility functions for easy error reporting
export const reportError = (error: Error, context?: Partial<ErrorContext>) => 
  globalErrorHandler.reportError(error, context);

export const reportApiError = (error: unknown, endpoint: string, method: string) => 
  globalErrorHandler.reportApiError(error, endpoint, method);

export const reportAuthError = (error: unknown, action: string) => 
  globalErrorHandler.reportAuthError(error, action);

export const reportValidationError = (field: string, value: unknown, rule: string) => 
  globalErrorHandler.reportValidationError(field, value, rule);

// React hook for error reporting
export const useErrorReporting = () => {
  return {
    reportError,
    reportApiError,
    reportAuthError,
    reportValidationError,
    getErrorStats: () => globalErrorHandler.getErrorStats(),
  };
};

export default globalErrorHandler;