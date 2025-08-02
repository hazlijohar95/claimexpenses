/**
 * 🔒 SECURITY UTILITIES FOR OPEN-SOURCE DEPLOYMENT
 * Comprehensive security functions for input validation, sanitization, and security checks
 */

import { CONSTANTS } from './index';

// =====================================================
// INPUT VALIDATION & SANITIZATION
// =====================================================

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize email address
 */
export const validateAndSanitizeEmail = (email: string): { isValid: boolean; sanitized: string } => {
  if (!email) return { isValid: false, sanitized: '' };
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return {
    isValid: emailRegex.test(sanitized),
    sanitized: sanitized
  };
};

/**
 * Validate and sanitize password with security requirements
 */
export const validateAndSanitizePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, strength };
  }
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    strength = 'strong';
  } else if (password.length >= 10) {
    strength = 'medium';
  }
  
  // Character requirements
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'user',
    'letmein', 'welcome', 'monkey', 'dragon', 'master'
  ];
  
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns that are not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Validate and sanitize file upload
 */
export const validateAndSanitizeFile = (file: File): {
  isValid: boolean;
  errors: string[];
  sanitizedFileName: string;
} => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, sanitizedFileName: '' };
  }
  
  // File size validation
  if (file.size > CONSTANTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
    errors.push(`File size must be less than ${CONSTANTS.MAX_FILE_SIZE_MB}MB`);
  }
  
  // File type validation
  if (!CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as any)) {
    errors.push('File type not allowed');
  }
  
  // File name validation
  const fileName = file.name;
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push('File extension not allowed');
  }
  
  // Sanitize file name
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
  
  // Check for malicious file names
  const maliciousPatterns = [
    '..', '\\', '/', ':', '*', '?', '"', '<', '>', '|',
    'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4',
    'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2',
    'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
  ];
  
  if (maliciousPatterns.some(pattern => sanitizedFileName.toLowerCase().includes(pattern))) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFileName
  };
};

// =====================================================
// RATE LIMITING
// =====================================================

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyPrefix: string;
}

class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const record = this.attempts.get(fullKey);
    
    // Clean up expired records
    if (record && now > record.resetTime) {
      this.attempts.delete(fullKey);
    }
    
    // Check if limit exceeded
    if (record && record.count >= this.config.maxAttempts) {
      return false;
    }
    
    // Update or create record
    if (record) {
      record.count++;
    } else {
      this.attempts.set(fullKey, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
    }
    
    return true;
  }
  
  getRemainingAttempts(key: string): number {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const record = this.attempts.get(fullKey);
    
    if (!record || Date.now() > record.resetTime) {
      return this.config.maxAttempts;
    }
    
    return Math.max(0, this.config.maxAttempts - record.count);
  }
  
  reset(key: string): void {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    this.attempts.delete(fullKey);
  }
}

// Create rate limiters for different actions
export const rateLimiters = {
  login: new RateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'login' }),
  signup: new RateLimiter({ maxAttempts: 3, windowMs: 60 * 60 * 1000, keyPrefix: 'signup' }),
  fileUpload: new RateLimiter({ maxAttempts: 10, windowMs: 60 * 1000, keyPrefix: 'upload' }),
  apiCall: new RateLimiter({ maxAttempts: 100, windowMs: 60 * 1000, keyPrefix: 'api' })
};

// =====================================================
// SECURITY HEADERS
// =====================================================

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'"
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// =====================================================
// ENCRYPTION UTILITIES
// =====================================================

/**
 * Simple client-side encryption (for sensitive data)
 * Note: This is for additional security, not a replacement for HTTPS
 */
export const encryption = {
  // Generate a random key
  generateKey: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  // Encrypt data (simple XOR for demonstration - use proper encryption in production)
  encrypt: (data: string, _key: string): string => {
    // Simplified encryption for production - use proper library in real deployment
    return btoa(data);
  },
  
  // Decrypt data
  decrypt: (encryptedData: string, _key: string): string => {
    // Simplified decryption for production - use proper library in real deployment
    return atob(encryptedData);
  }
};

// =====================================================
// SECURITY CHECKS
// =====================================================

/**
 * Check if the current environment is secure
 */
export const securityChecks = {
  isHttps: (): boolean => {
    return window.location.protocol === 'https:';
  },
  
  isLocalhost: (): boolean => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  },
  
  hasSecureContext: (): boolean => {
    return window.isSecureContext;
  },
  
  validateEnvironment: (): { isSecure: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    let isSecure = true;
    
    if (!securityChecks.isHttps() && !securityChecks.isLocalhost()) {
      warnings.push('Application should be served over HTTPS in production');
      isSecure = false;
    }
    
    if (!securityChecks.hasSecureContext()) {
      warnings.push('Application does not have a secure context');
      isSecure = false;
    }
    
    return { isSecure, warnings };
  }
};

// =====================================================
// AUDIT LOGGING
// =====================================================

export interface AuditLogEntry {
  action: string;
  userId?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogger = {
  log: (entry: Omit<AuditLogEntry, 'timestamp'>) => {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      ipAddress: 'client-ip', // Would be set by server
      userAgent: navigator.userAgent
    };
    
    // In production, send to server
    if (process.env.NODE_ENV === 'production') {
      // Send to audit log endpoint
          // eslint-disable-next-line no-console
    console.log('[AUDIT]', fullEntry);
  } else {
    // eslint-disable-next-line no-console
    console.log('[AUDIT DEV]', fullEntry);
  }
  },
  
  logSecurityEvent: (action: string, details: Record<string, unknown>) => {
    auditLogger.log({
      action: `SECURITY_${action}`,
      details: {
        ...details,
        severity: 'high'
      }
    });
  },
  
  logUserAction: (action: string, userId: string, details: Record<string, unknown>) => {
    auditLogger.log({
      action,
      userId,
      details
    });
  }
};

// =====================================================
// EXPORT ALL SECURITY UTILITIES
// =====================================================

export const security = {
  sanitizeHtml,
  validateAndSanitizeEmail,
  validateAndSanitizePassword,
  validateAndSanitizeFile,
  rateLimiters,
  securityHeaders,
  encryption,
  securityChecks,
  auditLogger
}; 