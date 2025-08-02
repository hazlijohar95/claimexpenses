import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = process.env['REACT_APP_SUPABASE_URL'];
const supabaseAnonKey = process.env['REACT_APP_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  );
}

// Enhanced Supabase client configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
});

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
export const logger = {
  info: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info(`[SUPABASE INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[SUPABASE WARN] ${message}`, data);
    }
  },
  error: (message: string, error?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[SUPABASE ERROR] ${message}`, error);
    }
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  },
};

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