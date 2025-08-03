// Application constants
export const APP_CONFIG = {
  NAME: 'Cynclaim',
  COMPANY: 'Cynco',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern expense claim management system',
} as const;

// Environment and build constants
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// API and service constants
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
} as const;

// Demo mode detection
export const DEMO_MODE = {
  isActive: !API_CONFIG.SUPABASE_ANON_KEY || 
           API_CONFIG.SUPABASE_ANON_KEY.includes('placeholder') || 
           API_CONFIG.SUPABASE_ANON_KEY === 'your_supabase_anon_key_here',
  demoUserId: 'demo-user-123',
  demoUser: {
    id: 'demo-user-123',
    email: 'demo@example.com',
    full_name: 'Demo User',
    role: 'employee' as const,
    department: 'IT',
  },
} as const;

// UI constants
export const UI_CONFIG = {
  sidebar: {
    width: 288, // 72 * 4px = 288px (w-72)
    hoverTriggerWidth: 16,
    collapsedWidth: 64,
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  animations: {
    duration: 300,
    easing: 'ease-out',
  },
} as const;

// Validation constants
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  fullName: {
    minLength: 2,
    maxLength: 100,
  },
  department: {
    maxLength: 100,
  },
  claim: {
    title: {
      minLength: 3,
      maxLength: 200,
    },
    description: {
      maxLength: 1000,
    },
    amount: {
      min: 0.01,
      max: 999999.99,
    },
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  forbidden: 'Access denied.',
  notFound: 'Resource not found.',
  serverError: 'Internal server error. Please try again later.',
  validation: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    passwordTooShort: `Password must be at least ${VALIDATION.password.minLength} characters long.`,
    passwordTooLong: `Password must be no more than ${VALIDATION.password.maxLength} characters long.`,
    passwordMissingUppercase: 'Password must contain at least one uppercase letter.',
    passwordMissingLowercase: 'Password must contain at least one lowercase letter.',
    passwordMissingNumbers: 'Password must contain at least one number.',
    fullNameTooShort: `Full name must be at least ${VALIDATION.fullName.minLength} characters long.`,
    fullNameTooLong: `Full name must be no more than ${VALIDATION.fullName.maxLength} characters long.`,
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  auth: {
    signUp: 'Account created successfully! Please check your email for verification.',
    signIn: 'Welcome back!',
    signOut: 'You have been signed out successfully.',
    passwordReset: 'Password reset email sent. Please check your inbox.',
    passwordUpdate: 'Password updated successfully.',
    profileUpdate: 'Profile updated successfully.',
  },
  claims: {
    created: 'Claim submitted successfully.',
    updated: 'Claim updated successfully.',
    approved: 'Claim approved successfully.',
    rejected: 'Claim rejected.',
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  authUser: 'auth_user',
  theme: 'app_theme',
  sidebarCollapsed: 'sidebar_collapsed',
  debugPanel: 'debug_panel_open',
} as const;

// User roles and permissions
export const ROLES = {
  employee: {
    level: 1,
    permissions: ['submit_claims', 'view_own_claims', 'edit_own_claims'] as string[],
  },
  manager: {
    level: 2,
    permissions: ['submit_claims', 'view_own_claims', 'edit_own_claims', 'approve_claims', 'view_team_claims'] as string[],
  },
  admin: {
    level: 3,
    permissions: ['all'] as string[],
  },
} as const;

// Categories and options
export const CLAIM_CATEGORIES = [
  'Travel',
  'Meals',
  'Office Supplies',
  'Software',
  'Training',
  'Equipment',
  'Communication',
  'Transportation',
  'Accommodation',
  'Other',
] as const;

export const CLAIM_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Urgent',
] as const;

export const CLAIM_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

// File upload constants
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'],
} as const;