// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      claims: {
        Row: Claim;
        Insert: ClaimInsert;
        Update: ClaimUpdate;
      };
      expense_items: {
        Row: ExpenseItem;
        Insert: ExpenseItemInsert;
        Update: ExpenseItemUpdate;
      };
      attachments: {
        Row: Attachment;
        Insert: AttachmentInsert;
        Update: AttachmentUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// User and Profile types
export type UserRole = 'employee' | 'manager' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name: string;
  role?: UserRole;
  department?: string;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  department?: string;
  updated_at?: string;
}

// Claim types
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface Claim {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: ClaimStatus;
  category: string;
  priority: string;
  claim_date: string;
  submitted_by: string;
  submitted_date: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimInsert {
  title: string;
  description?: string;
  amount: number;
  status?: ClaimStatus;
  category: string;
  priority?: string;
  claim_date: string;
  submitted_by: string;
  rejection_reason?: string;
}

export interface ClaimUpdate {
  title?: string;
  description?: string;
  amount?: number;
  status?: ClaimStatus;
  category?: string;
  priority?: string;
  claim_date?: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  updated_at?: string;
}

// Expense Item types
export interface ExpenseItem {
  id: string;
  claim_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at: string;
}

export interface ExpenseItemInsert {
  claim_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
}

export interface ExpenseItemUpdate {
  description?: string;
  amount?: number;
  category?: string;
  expense_date?: string;
}

// Attachment types
export interface Attachment {
  id: string;
  claim_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface AttachmentInsert {
  claim_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

export interface AttachmentUpdate {
  file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string;
}

export interface ClaimFormData {
  title: string;
  description: string;
  amount: number;
  category: string;
  claimDate: string;
  expenseItems: ExpenseItemFormData[];
  attachments: File[];
}

export interface ExpenseItemFormData {
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// UI Component types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  className?: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Chart and Dashboard types
export interface DashboardStats {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalAmount: number;
  averageAmount: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Filter and search types
export interface ClaimFilters {
  status?: ClaimStatus;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  submittedBy?: string;
}

export interface SortOptions {
  field: keyof Claim;
  direction: 'asc' | 'desc';
} 