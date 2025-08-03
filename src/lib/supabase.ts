import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Don't throw error during module initialization - let the app handle it gracefully
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder') || supabaseAnonKey === 'your_supabase_anon_key_here') {
  // eslint-disable-next-line no-console
  console.info('🔧 Development Mode: Using demo data (no real Supabase connection). This is expected in development.');
}

// Enhanced Supabase client configuration
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'claim-expenses-auth',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'claim-expenses-web',
      },
    },
  }
);

// Custom error class for Supabase operations
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Enhanced error handling utility
export const handleSupabaseError = (
  error: unknown,
  operation: string,
): never => {
  if (error instanceof Error) {
    // Check if it's a Supabase error
    if ('code' in error && 'message' in error) {
      throw new SupabaseError(
        `${operation} failed: ${error.message}`,
        (error as any).code,
        { originalError: error },
        (error as any).statusCode,
      );
    }
    
    throw new SupabaseError(
      `${operation} failed: ${error.message}`,
      'SUPABASE_ERROR',
      { originalError: error },
    );
  }
  
  throw new SupabaseError(
    `${operation} failed: Unknown error`,
    'UNKNOWN_ERROR',
    { originalError: error },
  );
};

// Enhanced logger utility for development and production
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
  context?: string;
  component?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private createLogEntry(level: LogEntry['level'], message: string, data?: unknown, context?: string): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: context || 'SUPABASE',
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    return entry;
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛'
    }[entry.level];

    return `${emoji} [${entry.context}] ${entry.message}`;
  }

  info(message: string, data?: unknown, context?: string): void {
    const entry = this.createLogEntry('info', message, data, context);
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(this.formatConsoleMessage(entry), data);
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    const entry = this.createLogEntry('warn', message, data, context);
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(this.formatConsoleMessage(entry), data);
    }
  }

  error(message: string, error?: unknown, context?: string): void {
    const entry = this.createLogEntry('error', message, error, context);
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(this.formatConsoleMessage(entry), error);
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Import error handler to report
      import('../utils/errorHandler').then(({ globalErrorHandler }) => {
        globalErrorHandler.handleError({
          message: entry.message,
          stack: error instanceof Error ? error.stack : undefined,
          context: {
            component: entry.context || 'unknown',
            action: 'logger_error',
            additionalData: { data: entry.data },
          },
          severity: 'medium',
          type: 'unknown',
        });
      });
    }
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (import.meta.env.DEV) {
      const entry = this.createLogEntry('debug', message, data, context);
      // eslint-disable-next-line no-console
      console.debug(this.formatConsoleMessage(entry), data);
    }
  }

  // Get recent logs for debugging
  getLogs(filter?: Partial<Pick<LogEntry, 'level' | 'context'>>): LogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.context && log.context !== filter.context) return false;
      return true;
    });
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Get log statistics
  getStats() {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byContext = this.logs.reduce((acc, log) => {
      const context = log.context || 'unknown';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.logs.length,
      byLevel,
      byContext,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }
}

export const logger = new Logger();

// Enhanced health check function with retry logic
export const checkSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        logger.error(`Supabase connection check failed (attempt ${attempt})`, error);
        if (attempt === retries) return false;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      logger.info('Supabase connection successful');
      return true;
    } catch (error) {
      logger.error(`Supabase connection check failed (attempt ${attempt})`, error);
      if (attempt === retries) return false;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
};

// Utility to get current user with proper error handling
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Failed to get current user', error);
      return null;
    }
    
    return user;
  } catch (error) {
    logger.error('Unexpected error getting current user', error);
    return null;
  }
};

// Utility to check if user has specific role
export const hasRole = async (requiredRole: 'employee' | 'manager' | 'admin'): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      logger.error('Failed to get user profile for role check', error);
      return false;
    }
    
    const roleHierarchy = {
      employee: 1,
      manager: 2,
      admin: 3,
    } as const;
    
    return roleHierarchy[profile.role as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
  } catch (error) {
    logger.error('Error checking user role', error);
    return false;
  }
};

// Realtime subscription helper
export const createRealtimeSubscription = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void,
  filter?: string
) => {
  const subscription = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        ...(filter && { filter }),
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

// Storage utilities
export const storage = {
  uploadFile: async (
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
    
    if (error) {
      logger.error('File upload failed', error);
      throw new SupabaseError('File upload failed', 'UPLOAD_ERROR', { error });
    }
    
    return data;
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
  
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      logger.error('File deletion failed', error);
      throw new SupabaseError('File deletion failed', 'DELETE_ERROR', { error });
    }
  },
}; 