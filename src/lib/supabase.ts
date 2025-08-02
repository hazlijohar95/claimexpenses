import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhhsmadffhlztiofrvjf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      claims: {
        Row: {
          id: string;
          title: string;
          description: string;
          amount: number;
          status: 'pending' | 'approved' | 'rejected';
          category: string;
          claim_date: string;
          submitted_by: string;
          submitted_date: string;
          approved_by?: string;
          approved_date?: string;
          rejection_reason?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          amount: number;
          status?: 'pending' | 'approved' | 'rejected';
          category: string;
          claim_date: string;
          submitted_by: string;
          submitted_date?: string;
          approved_by?: string;
          approved_date?: string;
          rejection_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          amount?: number;
          status?: 'pending' | 'approved' | 'rejected';
          category?: string;
          claim_date?: string;
          submitted_by?: string;
          submitted_date?: string;
          approved_by?: string;
          approved_date?: string;
          rejection_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_items: {
        Row: {
          id: string;
          claim_id: string;
          description: string;
          amount: number;
          category: string;
          expense_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          description: string;
          amount: number;
          category: string;
          expense_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          claim_id?: string;
          description?: string;
          amount?: number;
          category?: string;
          expense_date?: string;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          claim_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          claim_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'employee' | 'manager' | 'admin';
          department?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'employee' | 'manager' | 'admin';
          department?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'employee' | 'manager' | 'admin';
          department?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 