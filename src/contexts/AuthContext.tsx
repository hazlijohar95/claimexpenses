import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import type { AuthUser } from '../types';
import { logger } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: 'employee' | 'manager' | 'admin', department?: string) => Promise<void>;
  signInWithMagicLink: (userData: any) => Promise<void>;
  sendMagicLink: (email: string, fullName: string, role: string, department?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
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
  const [user, setUser] = useState<AuthUser | null>(null); // Force no user for testing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const result = await AuthService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error checking user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await AuthService.signIn({ email, password });
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Sign in failed');
      }
    } catch (error) {
      logger.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'employee' | 'manager' | 'admin' = 'employee', department?: string) => {
    try {
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
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const result = await AuthService.signOut();
      if (result.success) {
        setUser(null);
      } else {
        throw new Error(result.error || 'Sign out failed');
      }
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const result = await AuthService.updateProfile(user.id, updates);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  };

  const signInWithMagicLink = async (userData: any) => {
    try {
      // Create or get user profile in Supabase
      const result = await AuthService.createOrGetUserProfile(userData);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || 'Magic link authentication failed');
      }
    } catch (error) {
      logger.error('Magic link sign in error:', error);
      throw error;
    }
  };

  const sendMagicLink = async (email: string, fullName: string, role: string, department?: string) => {
    try {
      const { ResendService } = await import('../services/resendService');
      const result = await ResendService.sendMagicLinkEmail({
        email,
        fullName,
        role,
        ...(department && { department }),
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      logger.error('Send magic link error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithMagicLink,
    sendMagicLink,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 