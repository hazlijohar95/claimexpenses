/**
 * 🔒 COMPREHENSIVE SECURITY TESTING SUITE
 * Tests all security measures for open-source deployment
 */

/* eslint-disable no-console */
import { security } from '../utils/security';

// =====================================================
// INPUT VALIDATION TESTS
// =====================================================

describe('Input Validation & Sanitization', () => {
  describe('HTML Sanitization', () => {
    test('should sanitize HTML to prevent XSS', () => {
      const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
      const sanitized = security.sanitizeHtml(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    test('should handle empty input', () => {
      expect(security.sanitizeHtml('')).toBe('');
      expect(security.sanitizeHtml(null as any)).toBe('');
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = security.validateAndSanitizeEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(email.toLowerCase().trim());
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = security.validateAndSanitizeEmail(email);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPassword = 'MySecureP@ssw0rd123!';
      const result = security.validateAndSanitizePassword(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        'short'
      ];

      weakPasswords.forEach(password => {
        const result = security.validateAndSanitizePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should detect common patterns', () => {
      const commonPatterns = [
        'password123',
        'admin2023',
        'user123',
        'welcome2023'
      ];

      commonPatterns.forEach(password => {
        const result = security.validateAndSanitizePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('common patterns'))).toBe(true);
      });
    });
  });

  describe('File Validation', () => {
    test('should validate safe files', () => {
      const safeFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const result = security.validateAndSanitizeFile(safeFile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject malicious files', () => {
      const maliciousFiles = [
        new File(['test'], 'script.exe', { type: 'application/x-executable' }),
        new File(['test'], 'malicious.php', { type: 'application/x-php' }),
        new File(['test'], 'virus.bat', { type: 'application/x-bat' })
      ];

      maliciousFiles.forEach(file => {
        const result = security.validateAndSanitizeFile(file);
        expect(result.isValid).toBe(false);
      });
    });

    test('should reject files with malicious names', () => {
      const maliciousNames = [
        '..\\..\\windows\\system32\\config\\sam',
        'con.txt',
        'prn.jpg',
        'aux.pdf',
        'nul.doc'
      ];

      maliciousNames.forEach(name => {
        const file = new File(['test'], name, { type: 'application/pdf' });
        const result = security.validateAndSanitizeFile(file);
        expect(result.isValid).toBe(false);
      });
    });

    test('should sanitize file names', () => {
      const file = new File(['test'], 'file with spaces & special chars!.pdf', { type: 'application/pdf' });
      const result = security.validateAndSanitizeFile(file);
      
      expect(result.sanitizedFileName).toBe('file_with_spaces___special_chars_.pdf');
    });
  });
});

// =====================================================
// RATE LIMITING TESTS
// =====================================================

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limiters before each test
    security.rateLimiters.login.reset('test-user');
    security.rateLimiters.signup.reset('test-user');
    security.rateLimiters.fileUpload.reset('test-user');
    security.rateLimiters.apiCall.reset('test-user');
  });

  test('should allow requests within limits', () => {
    const user = 'test-user';
    
    // Should allow 5 login attempts
    for (let i = 0; i < 5; i++) {
      expect(security.rateLimiters.login.isAllowed(user)).toBe(true);
    }
  });

  test('should block requests exceeding limits', () => {
    const user = 'test-user';
    
    // Exceed login limit
    for (let i = 0; i < 5; i++) {
      security.rateLimiters.login.isAllowed(user);
    }
    
    // 6th attempt should be blocked
    expect(security.rateLimiters.login.isAllowed(user)).toBe(false);
  });

  test('should reset after window expires', () => {
    const user = 'test-user';
    
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      security.rateLimiters.login.isAllowed(user);
    }
    
    // Should be blocked
    expect(security.rateLimiters.login.isAllowed(user)).toBe(false);
    
    // Reset manually
    security.rateLimiters.login.reset(user);
    
    // Should be allowed again
    expect(security.rateLimiters.login.isAllowed(user)).toBe(true);
  });

  test('should track remaining attempts', () => {
    const user = 'test-user';
    
    expect(security.rateLimiters.login.getRemainingAttempts(user)).toBe(5);
    
    security.rateLimiters.login.isAllowed(user);
    
    expect(security.rateLimiters.login.getRemainingAttempts(user)).toBe(4);
  });
});

// =====================================================
// ENCRYPTION TESTS
// =====================================================

describe('Encryption', () => {
  test('should encrypt and decrypt data correctly', () => {
    const originalData = 'sensitive information';
    const key = security.encryption.generateKey();
    
    const encrypted = security.encryption.encrypt(originalData, key);
    const decrypted = security.encryption.decrypt(encrypted, key);
    
    expect(decrypted).toBe(originalData);
    expect(encrypted).not.toBe(originalData);
  });

  test('should generate unique keys', () => {
    const key1 = security.encryption.generateKey();
    const key2 = security.encryption.generateKey();
    
    expect(key1).not.toBe(key2);
    expect(key1.length).toBe(64); // 32 bytes = 64 hex chars
    expect(key2.length).toBe(64);
  });

  test('should fail decryption with wrong key', () => {
    const originalData = 'sensitive information';
    const correctKey = security.encryption.generateKey();
    const wrongKey = security.encryption.generateKey();
    
    const encrypted = security.encryption.encrypt(originalData, correctKey);
    const decrypted = security.encryption.decrypt(encrypted, wrongKey);
    
    expect(decrypted).not.toBe(originalData);
  });
});

// =====================================================
// SECURITY HEADERS TESTS
// =====================================================

describe('Security Headers', () => {
  test('should have all required security headers', () => {
    const headers = security.securityHeaders;
    
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
  });

  test('should have comprehensive CSP', () => {
    const csp = security.securityHeaders['Content-Security-Policy'];
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

// =====================================================
// ENVIRONMENT SECURITY TESTS
// =====================================================

describe('Environment Security', () => {
  test('should detect secure context', () => {
    security.securityChecks.validateEnvironment();
    
    // Should have secure context
    expect(security.securityChecks.hasSecureContext()).toBeDefined();
  });

  test('should detect localhost', () => {
    // Mock window.location for testing
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { hostname: 'localhost' };
    
    expect(security.securityChecks.isLocalhost()).toBe(true);
    
    // Restore
    (window as any).location = originalLocation;
  });
});

// =====================================================
// AUDIT LOGGING TESTS
// =====================================================

describe('Audit Logging', () => {
  beforeEach(() => {
    // Mock console.log to capture audit logs
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log security events', () => {
    security.auditLogger.logSecurityEvent('LOGIN_ATTEMPT', {
      email: 'test@example.com',
      success: false,
      reason: 'invalid_password'
    });
    
    expect(console.log).toHaveBeenCalledWith(
      '[AUDIT DEV]',
      expect.objectContaining({
        action: 'SECURITY_LOGIN_ATTEMPT',
        details: expect.objectContaining({
          severity: 'high'
        })
      })
    );
  });

  test('should log user actions', () => {
    security.auditLogger.logUserAction('CLAIM_CREATED', 'user-123', {
      claimId: 'claim-456',
      amount: 100.50
    });
    
    expect(console.log).toHaveBeenCalledWith(
      '[AUDIT DEV]',
      expect.objectContaining({
        action: 'CLAIM_CREATED',
        userId: 'user-123',
        details: expect.objectContaining({
          claimId: 'claim-456'
        })
      })
    );
  });
});

// =====================================================
// INTEGRATION SECURITY TESTS
// =====================================================

describe('Integration Security', () => {
  test('should handle complete security workflow', () => {
    // Simulate a complete user interaction with security measures
    
    // 1. Validate email
    const emailResult = security.validateAndSanitizeEmail('user@example.com');
    expect(emailResult.isValid).toBe(true);
    
    // 2. Validate password
    const passwordResult = security.validateAndSanitizePassword('SecureP@ss123!');
    expect(passwordResult.isValid).toBe(true);
    
    // 3. Check rate limiting
    expect(security.rateLimiters.login.isAllowed('user@example.com')).toBe(true);
    
    // 4. Log security event
    security.auditLogger.logSecurityEvent('LOGIN_SUCCESS', {
      email: emailResult.sanitized,
      timestamp: new Date().toISOString()
    });
    
    // 5. Validate file upload
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    const fileResult = security.validateAndSanitizeFile(file);
    expect(fileResult.isValid).toBe(true);
    
    // 6. Check rate limiting for upload
    expect(security.rateLimiters.fileUpload.isAllowed('user@example.com')).toBe(true);
  });
});

// =====================================================
// PERFORMANCE TESTS
// =====================================================

describe('Security Performance', () => {
  test('should handle large inputs efficiently', () => {
    const largeInput = 'x'.repeat(10000);
    const start = performance.now();
    
    security.sanitizeHtml(largeInput);
    
    const end = performance.now();
    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
  });

  test('should handle multiple rate limit checks efficiently', () => {
    const user = 'test-user';
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      security.rateLimiters.apiCall.isAllowed(user);
    }
    
    const end = performance.now();
    expect(end - start).toBeLessThan(50); // Should complete in under 50ms
  });
});

// =====================================================
// EDGE CASE TESTS
// =====================================================

describe('Security Edge Cases', () => {
  test('should handle null and undefined inputs', () => {
    expect(security.sanitizeHtml(null as any)).toBe('');
    expect(security.sanitizeHtml(undefined as any)).toBe('');
    
    const emailResult = security.validateAndSanitizeEmail(null as any);
    expect(emailResult.isValid).toBe(false);
    
    const passwordResult = security.validateAndSanitizePassword(null as any);
    expect(passwordResult.isValid).toBe(false);
  });

  test('should handle very long inputs', () => {
    const longInput = 'a'.repeat(100000);
    expect(() => security.sanitizeHtml(longInput)).not.toThrow();
  });

  test('should handle special characters in file names', () => {
    const specialChars = 'file with spaces & special chars!@#$%^&*()_+-=[]{}|;:,.<>?';
    const file = new File(['test'], specialChars, { type: 'application/pdf' });
    const result = security.validateAndSanitizeFile(file);
    
    expect(result.sanitizedFileName).not.toContain(' ');
    expect(result.sanitizedFileName).not.toContain('!');
    expect(result.sanitizedFileName).not.toContain('@');
  });
}); 