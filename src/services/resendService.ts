import { Resend } from 'resend';
import { logger } from '../lib/supabase';

// Initialize Resend with your API key
const resend = new Resend(process.env['REACT_APP_RESEND_API_KEY']);

export interface MagicLinkEmailData {
  email: string;
  fullName: string;
  role: string;
  department?: string | undefined;
}

export class ResendService {
  /**
   * Send magic link email for authentication
   */
  static async sendMagicLinkEmail(data: MagicLinkEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName, role, department } = data;
      
      // Create a unique token for the magic link
      const token = btoa(`${email}:${Date.now()}:${Math.random()}`);
      
      // Store the token temporarily (in production, use Redis or database)
      localStorage.setItem(`magic_link_${token}`, JSON.stringify({
        email,
        fullName,
        role,
        department,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
      }));

      const magicLink = `${window.location.origin}/auth/verify?token=${encodeURIComponent(token)}`;

      const { error } = await resend.emails.send({
        from: 'Cynclaim <noreply@yourdomain.com>',
        to: [email],
        subject: 'Sign in to Cynclaim',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sign in to Cynclaim</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9fafb;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .logo {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo h1 {
                  color: #1f2937;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .logo p {
                  color: #6b7280;
                  margin: 5px 0 0 0;
                  font-size: 14px;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 32px;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  transition: transform 0.2s;
                }
                .button:hover {
                  transform: translateY(-2px);
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
                .warning {
                  background: #fef3c7;
                  border: 1px solid #f59e0b;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 20px 0;
                  color: #92400e;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <h1>✨ Cynclaim</h1>
                  <p>by Cynco</p>
                </div>
                
                <h2>Welcome to Cynclaim!</h2>
                
                <p>Hi ${fullName},</p>
                
                <p>You're just one click away from accessing your expense claim dashboard. Click the button below to sign in securely:</p>
                
                <div style="text-align: center;">
                  <a href="${magicLink}" class="button">
                    Sign in to Cynclaim
                  </a>
                </div>
                
                <div class="warning">
                  <strong>Security Notice:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this email, please ignore it.
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
                  ${magicLink}
                </p>
                
                <div class="footer">
                  <p>This email was sent to ${email}</p>
                  <p>© 2024 Cynclaim by Cynco. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Resend email error:', error);
        return { success: false, error: 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Resend service error:', error);
      return { success: false, error: 'Failed to send magic link email' };
    }
  }

  /**
   * Send welcome email for new users
   */
  static async sendWelcomeEmail(data: MagicLinkEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, fullName, role, department } = data;
      
      const { error } = await resend.emails.send({
        from: 'Cynclaim <noreply@yourdomain.com>',
        to: [email],
        subject: 'Welcome to Cynclaim!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Cynclaim</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9fafb;
                }
                .container {
                  background: white;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .logo {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo h1 {
                  color: #1f2937;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .logo p {
                  color: #6b7280;
                  margin: 5px 0 0 0;
                  font-size: 14px;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 32px;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  transition: transform 0.2s;
                }
                .button:hover {
                  transform: translateY(-2px);
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                }
                .info-box {
                  background: #f0f9ff;
                  border: 1px solid #0ea5e9;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <h1>✨ Cynclaim</h1>
                  <p>by Cynco</p>
                </div>
                
                <h2>Welcome to Cynclaim, ${fullName}! 🎉</h2>
                
                <p>Your account has been successfully created and you're now ready to start managing your expense claims efficiently.</p>
                
                <div class="info-box">
                  <strong>Your Account Details:</strong><br>
                  • Email: ${email}<br>
                  • Role: ${role.charAt(0).toUpperCase() + role.slice(1)}<br>
                  ${department ? `• Department: ${department}<br>` : ''}
                </div>
                
                <p>Here's what you can do with Cynclaim:</p>
                <ul>
                  <li>📝 Submit expense claims with receipts</li>
                  <li>📊 Track your claim status and history</li>
                  <li>📈 View detailed analytics and reports</li>
                  <li>🔍 Search and filter your claims</li>
                  <li>📱 Access from any device, anywhere</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${window.location.origin}" class="button">
                    Get Started with Cynclaim
                  </a>
                </div>
                
                <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                
                <div class="footer">
                  <p>Welcome aboard! 🚀</p>
                  <p>© 2024 Cynclaim by Cynco. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        logger.error('Resend welcome email error:', error);
        return { success: false, error: 'Failed to send welcome email' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Resend welcome email error:', error);
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