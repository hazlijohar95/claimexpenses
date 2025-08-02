import { supabase, logger } from '../lib/supabase';
import type {
  AuthUser,
  LoginFormData,
  SignUpFormData,
  ProfileUpdate,
  ApiResponse,
} from '../types';
import { validateEmail, validatePassword, storage } from '../utils';

export class AuthService {
  private static readonly STORAGE_KEY = 'auth_user';

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        logger.error('Failed to get current user', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      if (!user) {
        return {
          data: null,
          error: 'No authenticated user found',
          success: false,
        };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Failed to get user profile', profileError);
        return {
          data: null,
          error: 'Failed to get user profile',
          success: false,
        };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      };

      // Cache user data
      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in getCurrentUser', error);
      return {
        data: null,
        error: 'An unexpected error occurred',
        success: false,
      };
    }
  }

  /**
   * Sign up new user with email/password
   */
  static async signUp(formData: SignUpFormData): Promise<ApiResponse<AuthUser>> {
    try {
      // Validate input
      const validation = this.validateSignUpData(formData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
          success: false,
        };
      }

      const { email, password, fullName, role = 'employee', department } = formData;

      // Create user account
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            ...(department && { department }), // Conditionally add department
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error || !user) {
        logger.error('Failed to create user account', error);
        return {
          data: null,
          error: error?.message || 'Failed to create user account',
          success: false,
        };
      }

      // Wait for profile creation trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the created profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // If profile doesn't exist, create it manually
        const profileData = {
          id: user.id,
          email,
          full_name: fullName,
          role,
          ...(department && { department }),
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          logger.error('Failed to create user profile', insertError);
          return {
            data: null,
            error: 'Database error saving new user',
            success: false,
          };
        }

        const authUser: AuthUser = {
          id: user.id,
          email,
          full_name: fullName,
          role,
          ...(department && { department }),
        };

        storage.set(this.STORAGE_KEY, authUser);

        return {
          data: authUser,
          error: null,
          success: true,
        };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      };

      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in signUp', error);
      return {
        data: null,
        error: 'An unexpected error occurred during sign up',
        success: false,
      };
    }
  }

  /**
   * Sign in user with email/password
   */
  static async signIn(formData: LoginFormData): Promise<ApiResponse<AuthUser>> {
    try {
      // Validate input
      const validation = this.validateLoginData(formData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
          success: false,
        };
      }

      const { email, password } = formData;

      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) {
        logger.error('Failed to sign in user', error);
        return {
          data: null,
          error: error?.message || 'Failed to sign in',
          success: false,
        };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Failed to get user profile during sign in', profileError);
        return {
          data: null,
          error: 'Failed to get user profile',
          success: false,
        };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      };

      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in signIn', error);
      return {
        data: null,
        error: 'An unexpected error occurred during sign in',
        success: false,
      };
    }
  }

  /**
   * Send magic link for passwordless authentication
   */
  static async sendMagicLink(email: string): Promise<ApiResponse<void>> {
    try {
      if (!validateEmail(email)) {
        return {
          data: null,
          error: 'Invalid email address',
          success: false,
        };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Failed to send magic link', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in sendMagicLink', error);
      return {
        data: null,
        error: 'An unexpected error occurred while sending magic link',
        success: false,
      };
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  static async signInWithOAuth(provider: 'google' | 'github'): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error(`Failed to sign in with ${provider}`, error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error(`Unexpected error in signInWithOAuth (${provider})`, error);
      return {
        data: null,
        error: `An unexpected error occurred while signing in with ${provider}`,
        success: false,
      };
    }
  }

  /**
   * Handle auth callback (for magic links and OAuth)
   */
  static async handleAuthCallback(): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        logger.error('Failed to get user from auth callback', error);
        return {
          data: null,
          error: 'Authentication failed',
          success: false,
        };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Failed to get user profile from auth callback', profileError);
        return {
          data: null,
          error: 'Failed to get user profile',
          success: false,
        };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      };

      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in handleAuthCallback', error);
      return {
        data: null,
        error: 'An unexpected error occurred during authentication',
        success: false,
      };
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Failed to sign out user', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Clear cached user data
      storage.remove(this.STORAGE_KEY);

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in signOut', error);
      return {
        data: null,
        error: 'An unexpected error occurred during sign out',
        success: false,
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: ProfileUpdate,
  ): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !profile) {
        logger.error('Failed to update profile', error);
        return {
          data: null,
          error: error?.message || 'Failed to update profile',
          success: false,
        };
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
      };

      // Update cached user data
      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in updateProfile', error);
      return {
        data: null,
        error: 'An unexpected error occurred while updating profile',
        success: false,
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      if (!validateEmail(email)) {
        return {
          data: null,
          error: 'Invalid email address',
          success: false,
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logger.error('Failed to send password reset email', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in resetPassword', error);
      return {
        data: null,
        error: 'An unexpected error occurred while resetting password',
        success: false,
      };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          data: null,
          error: passwordValidation.errors.join(', '),
          success: false,
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error('Failed to update password', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in updatePassword', error);
      return {
        data: null,
        error: 'An unexpected error occurred while updating password',
        success: false,
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const authUser: AuthUser = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              department: profile.department,
            };

            storage.set(this.STORAGE_KEY, authUser);
            callback(authUser);
          }
        } else if (event === 'SIGNED_OUT') {
          storage.remove(this.STORAGE_KEY);
          callback(null);
        }
      } catch (error) {
        logger.error('Error in auth state change handler', error);
        callback(null);
      }
    });
  }

  /**
   * Check if user has permission
   */
  static hasPermission(
    user: AuthUser | null,
    requiredRole: 'employee' | 'manager' | 'admin',
  ): boolean {
    if (!user) return false;

    const roleHierarchy = {
      employee: 1,
      manager: 2,
      admin: 3,
    } as const;

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Get cached user data
   */
  static getCachedUser(): AuthUser | null {
    return storage.get<AuthUser>(this.STORAGE_KEY);
  }

  /**
   * Create or get user profile for magic link authentication
   */
  static async createOrGetUserProfile(userData: any): Promise<ApiResponse<AuthUser>> {
    try {
      const { email, fullName, role, department } = userData;

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        // User exists, return profile
        const authUser: AuthUser = {
          id: existingProfile.id,
          email: existingProfile.email,
          full_name: existingProfile.full_name,
          role: existingProfile.role,
          department: existingProfile.department,
        };

        // Cache user data
        storage.set(this.STORAGE_KEY, authUser);

        return {
          data: authUser,
          error: null,
          success: true,
        };
      }

      // Create new user profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          email,
          full_name: fullName,
          role,
          department,
        })
        .select()
        .single();

      if (insertError || !newProfile) {
        logger.error('Failed to create user profile', insertError);
        return {
          data: null,
          error: 'Failed to create user profile',
          success: false,
        };
      }

      const authUser: AuthUser = {
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        role: newProfile.role,
        department: newProfile.department,
      };

      // Cache user data
      storage.set(this.STORAGE_KEY, authUser);

      return {
        data: authUser,
        error: null,
        success: true,
      };
    } catch (error) {
      logger.error('Unexpected error in createOrGetUserProfile', error);
      return {
        data: null,
        error: 'An unexpected error occurred',
        success: false,
      };
    }
  }

  /**
   * Validate sign up data
   */
  private static validateSignUpData(data: SignUpFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!validateEmail(data.email)) {
      errors.push('Invalid email address');
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (!data.fullName.trim()) {
      errors.push('Full name is required');
    }

    if (data.fullName.length > 100) {
      errors.push('Full name must be less than 100 characters');
    }

    if (data.department && data.department.length > 100) {
      errors.push('Department must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate login data
   */
  private static validateLoginData(data: LoginFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!validateEmail(data.email)) {
      errors.push('Invalid email address');
    }

    if (!data.password.trim()) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
} 