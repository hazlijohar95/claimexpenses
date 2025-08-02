import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import type { AuthUser } from '../types';
import { logger } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: 'employee' | 'manager' | 'admin', department?: string) => Promise<void>;
  signInWithMagicLink: (userData: any) => Promise<void>;
  sendMagicLink: (email: string, fullName: string, role: string, department?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        // Check if environment variables are available
        const supabaseUrl = process.env['REACT_APP_SUPABASE_URL'];
        const supabaseKey = process.env['REACT_APP_SUPABASE_ANON_KEY'];
        
        if (!supabaseUrl || !supabaseKey) {
          logger.error('Missing Supabase environment variables');
          setError('Configuration error: Missing Supabase credentials');
          setLoading(false);
          return;
        }

        const result = await AuthService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error checking user session:', error);
        setUser(null);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    let subscription: any = null;
    try {
      const { data: { subscription: authSubscription } } = AuthService.onAuthStateChange((user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      });
      subscription = authSubscription;
    } catch (error) {
      logger.error('Error setting up auth state listener:', error);
      setLoading(false);
      setError('Failed to initialize authentication listener');
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const clearError = () => {
    setError(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await AuthService.signIn({ email, password });
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Sign in failed');
      }
    } catch (error) {
      logger.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'employee' | 'manager' | 'admin' = 'employee', department?: string) => {
    try {
      setError(null);
      const result = await AuthService.signUp({ 
        email, 
        password, 
        fullName, 
        role, 
        ...(department && { department }) 
      });
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Sign up failed');
      }
    } catch (error) {
      logger.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Sign up failed');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const result = await AuthService.signOut();
      if (result.success) {
        setUser(null);
      } else {
        throw new Error(result.error || 'Sign out failed');
      }
    } catch (error) {
      logger.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Sign out failed');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setError(null);
      const result = await AuthService.updateProfile(user.id, updates);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error) {
      logger.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Profile update failed');
      throw error;
    }
  };

  const signInWithMagicLink = async (userData: any) => {
    try {
      setError(null);
      const result = await AuthService.createOrGetUserProfile(userData);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Magic link sign in failed');
      }
    } catch (error) {
      logger.error('Magic link sign in error:', error);
      setError(error instanceof Error ? error.message : 'Magic link sign in failed');
      throw error;
    }
  };

  const sendMagicLink = async (email: string, fullName: string, role: string, department?: string) => {
    try {
      setError(null);
      const { ResendService } = await import('../services/resendService');
      await ResendService.sendMagicLinkEmail({
        email,
        fullName,
        role,
        ...(department && { department })
      });
    } catch (error) {
      logger.error('Send magic link error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send magic link');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    signInWithMagicLink,
    sendMagicLink,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 