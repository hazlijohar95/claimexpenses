import { VALIDATION, ERROR_MESSAGES, ROLES } from './constants';
import type { AuthUser, UserRole } from '../types';

// Input validation utilities
export const validateEmail = (email: string): boolean => {
  if (!email || email.length > VALIDATION.email.maxLength) {
    return false;
  }
  return VALIDATION.email.pattern.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push(ERROR_MESSAGES.validation.required);
    return { isValid: false, errors };
  }
  
  if (password.length < VALIDATION.password.minLength) {
    errors.push(ERROR_MESSAGES.validation.passwordTooShort);
  }
  
  if (password.length > VALIDATION.password.maxLength) {
    errors.push(ERROR_MESSAGES.validation.passwordTooLong);
  }
  
  if (VALIDATION.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(ERROR_MESSAGES.validation.passwordMissingUppercase);
  }
  
  if (VALIDATION.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(ERROR_MESSAGES.validation.passwordMissingLowercase);
  }
  
  if (VALIDATION.password.requireNumbers && !/\d/.test(password)) {
    errors.push(ERROR_MESSAGES.validation.passwordMissingNumbers);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateFullName = (fullName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!fullName || !fullName.trim()) {
    errors.push(ERROR_MESSAGES.validation.required);
    return { isValid: false, errors };
  }
  
  const trimmedName = fullName.trim();
  
  if (trimmedName.length < VALIDATION.fullName.minLength) {
    errors.push(ERROR_MESSAGES.validation.fullNameTooShort);
  }
  
  if (trimmedName.length > VALIDATION.fullName.maxLength) {
    errors.push(ERROR_MESSAGES.validation.fullNameTooLong);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Permission checking
export const hasPermission = (
  user: AuthUser | null,
  requiredPermission: string,
): boolean => {
  if (!user) return false;
  
  const userRole = ROLES[user.role];
  if (!userRole) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  return userRole.permissions.includes('all') || userRole.permissions.includes(requiredPermission);
};

export const hasRoleLevel = (
  user: AuthUser | null,
  requiredRole: UserRole,
): boolean => {
  if (!user) return false;
  
  const userRoleLevel = ROLES[user.role]?.level || 0;
  const requiredRoleLevel = ROLES[requiredRole]?.level || 0;
  
  return userRoleLevel >= requiredRoleLevel;
};

// Content Security Policy helpers
export const isSecureUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || 
           (parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'localhost');
  } catch {
    return false;
  }
};

// Rate limiting utilities (for client-side rate limiting)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing attempts for this key
    const keyAttempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the window
    const recentAttempts = keyAttempts.filter(timestamp => timestamp > windowStart);
    
    // Check if we're under the limit
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  clear(key: string): void {
    this.attempts.delete(key);
  }
  
  clearAll(): void {
    this.attempts.clear();
  }
}

export const rateLimiter = new RateLimiter();

// CSRF protection utilities
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure storage utilities
export const secureStorage = {
  set: (key: string, value: unknown): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn('Failed to store data securely:', error);
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to retrieve stored data:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove stored data:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }
  },
};

// File validation utilities
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const validateFileName = (fileName: string): boolean => {
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com)$/i,
    /^\./,
    /\.\./,
    /[<>:"|?*]/,
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(fileName));
};

// Log sensitive actions
export const auditLog = (action: string, userId?: string, details?: Record<string, unknown>): void => {
  // In development, just log to console
  if (import.meta.env.DEV) {
    console.log('Audit Log:', {
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // In production, send to audit log endpoint
  if (import.meta.env.PROD) {
    // Send to server
    fetch('/api/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        userId,
        details,
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to send audit log:', error);
    });
  }
};

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required environment variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  // Validate URL format
  if (import.meta.env.VITE_SUPABASE_URL && !isSecureUrl(import.meta.env.VITE_SUPABASE_URL)) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};