import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'admin';
  department?: string;
}

export class AuthService {
  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      department: profile.department,
    };
  }

  // Sign up new user
  static async signUp(email: string, password: string, fullName: string, role: 'employee' | 'manager' | 'admin' = 'employee', department?: string): Promise<AuthUser> {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user');
    }

    // Create profile
    const profileData: ProfileInsert = {
      id: user.id,
      email,
      full_name: fullName,
      role,
      department,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Failed to create user profile');
    }

    return {
      id: user.id,
      email,
      full_name: fullName,
      role,
      department,
    };
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<AuthUser> {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !user) {
      throw new Error(error?.message || 'Failed to sign in');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to get user profile');
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      department: profile.department,
    };
  }

  // Sign out user
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<ProfileUpdate>): Promise<AuthUser> {
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
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      department: profile.department,
    };
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Update password
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          callback({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            department: profile.department,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }

  // Check if user has permission
  static hasPermission(user: AuthUser | null, requiredRole: 'employee' | 'manager' | 'admin'): boolean {
    if (!user) return false;

    const roleHierarchy = {
      employee: 1,
      manager: 2,
      admin: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }
} 