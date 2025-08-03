import React from 'react';

const EnvironmentTest: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const resendKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const hasSupabaseUrl = !!supabaseUrl;
  const hasSupabaseKey = !!supabaseKey;
  const hasResendKey = !!resendKey;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Environment Status</h3>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span>Supabase URL:</span>
          <span className={hasSupabaseUrl ? 'text-green-600' : 'text-red-600'}>
            {hasSupabaseUrl ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Supabase Key:</span>
          <span className={hasSupabaseKey ? 'text-green-600' : 'text-red-600'}>
            {hasSupabaseKey ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Resend Key:</span>
          <span className={hasResendKey ? 'text-green-600' : 'text-red-600'}>
            {hasResendKey ? '✅' : '❌'}
          </span>
        </div>
      </div>
      {!hasSupabaseUrl || !hasSupabaseKey || !hasResendKey ? (
        <div className="mt-2 text-xs text-red-600">
          Missing environment variables. Check Netlify settings.
        </div>
      ) : (
        <div className="mt-2 text-xs text-green-600">
          All environment variables configured ✅
        </div>
      )}
    </div>
  );
};

export default EnvironmentTest; 