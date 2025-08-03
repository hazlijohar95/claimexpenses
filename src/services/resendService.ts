import { logger } from '../lib/supabase';

// EmailJS configuration for browser-compatible email service (unused in development)
// const EMAILJS_SERVICE_ID = process.env['REACT_APP_EMAILJS_SERVICE_ID'];
// const EMAILJS_TEMPLATE_ID = process.env['REACT_APP_EMAILJS_TEMPLATE_ID'];
// const EMAILJS_PUBLIC_KEY = process.env['REACT_APP_EMAILJS_PUBLIC_KEY'];

export interface MagicLinkEmailData {
  email: string;
  fullName: string;
  role: string;
  department?: string | undefined;
}

export class ResendService {
  /**
   * Send magic link email for authentication (simplified for browser)
   */
  static async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName, role, department } = data;
      
      // For browser compatibility, we'll simulate sending email
      // In production, you would integrate with EmailJS or a similar service
      logger.info('Magic link email would be sent to:', email);
      
      // Create a unique token for the magic link
      const token = btoa(`${email}:${Date.now()}:${Math.random()}`);
      
      // Store the token temporarily (in production, use database)
      localStorage.setItem(`magic_link_${token}`, JSON.stringify({
        email,
        fullName,
        role,
        department,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
      }));

      const magicLink = `${window.location.origin}/auth/verify?token=${encodeURIComponent(token)}`;
      
              // In development, log the magic link
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('🔗 Magic Link (for development):', magicLink);
          // Show alert with magic link for testing
          alert(`Development Mode: Magic link created!\n\nClick OK then navigate to:\n${magicLink}`);
        }

      return { success: true };
    } catch (error) {
      logger.error('Email service error:', error);
      return { success: false, error: 'Failed to send magic link email' };
    }
  }

  /**
   * Send welcome email for new users (simplified for browser)
   */
  static async sendWelcomeEmail(data: MagicLinkEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName } = data;
      
      // For browser compatibility, we'll simulate sending email
      logger.info('Welcome email would be sent to:', email);
      
              if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(`🚀 Welcome email would be sent to ${fullName} (${email})`);
        }

      return { success: true };
    } catch (error) {
      logger.error('Welcome email error:', error);
      return { success: false, error: 'Failed to send welcome email' };
    }
  }

  /**
   * Verify magic link token
   */
  static verifyMagicLinkToken(token: string): { valid: boolean; data?: any; error?: string } {
    try {
      const storedData = localStorage.getItem(`magic_link_${token}`);
      
      if (!storedData) {
        return { valid: false, error: 'Invalid or expired token' };
      }

      const data = JSON.parse(storedData);
      
      // Check if token has expired (15 minutes)
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(`magic_link_${token}`);
        return { valid: false, error: 'Token has expired' };
      }

      // Remove the token after successful verification
      localStorage.removeItem(`magic_link_${token}`);
      
      return { valid: true, data };
    } catch (error) {
      logger.error('Token verification error:', error);
      return { valid: false, error: 'Invalid token format' };
    }
  }
} 