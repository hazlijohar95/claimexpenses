import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthService } from '../services/authService';
import type { AuthUser } from '../types';
import { logger } from '../lib/supabase';
import { DEMO_MODE, ENV } from '../utils/constants';
import { rateLimiter } from '../utils/security';

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
        // Check if we're in demo mode
        if (DEMO_MODE.isActive) {
          logger.info('🔧 Development Mode: Using demo data (no real Supabase connection). This is expected in development.');
          // In demo mode, we'll show a demo user
          if (ENV.isDevelopment) {
            setUser(DEMO_MODE.demoUser);
          } else {
            setError('Configuration error: Missing Supabase credentials. Please check your environment variables.');
          }
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

  const signIn = useCallback(async (email: string, password: string) => {
    // Rate limiting: max 5 attempts per 15 minutes
    if (!rateLimiter.isAllowed(`signin_${email}`, 5, 15 * 60 * 1000)) {
      const error = 'Too many sign-in attempts. Please try again in 15 minutes.';
      setError(error);
      throw new Error(error);
    }

    try {
      setError(null);
      const result = await AuthService.signIn({ email, password });
      if (result.success && result.data) {
        setUser(result.data);
        // Clear rate limiting on successful login
        rateLimiter.clear(`signin_${email}`);
      } else {
        throw new Error(result.error || 'Sign in failed');
      }
    } catch (error) {
      logger.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: 'employee' | 'manager' | 'admin' = 'employee', department?: string) => {
    // Rate limiting: max 3 sign-up attempts per hour
    if (!rateLimiter.isAllowed(`signup_${email}`, 3, 60 * 60 * 1000)) {
      const error = 'Too many sign-up attempts. Please try again later.';
      setError(error);
      throw new Error(error);
    }

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
        // Clear rate limiting on successful signup
        rateLimiter.clear(`signup_${email}`);
      } else {
        throw new Error(result.error || 'Sign up failed');
      }
    } catch (error) {
      logger.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Sign up failed');
      throw error;
    }
  }, []);

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

  const signInWithMagicLink = async (_userData: any) => {
    try {
      setError(null);
      // Handle auth callback from Supabase
      const result = await AuthService.handleAuthCallback();
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

  const sendMagicLink = async (email: string, _fullName: string, _role: string, _department?: string) => {
    try {
      setError(null);
      // Use Supabase's built-in magic link instead of custom implementation
      const { error } = await AuthService.sendMagicLink(email);
      if (error) {
        throw new Error(error);
      }
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